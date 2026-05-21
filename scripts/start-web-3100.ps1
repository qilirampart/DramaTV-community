param(
  [ValidateSet('start', 'dev')]
  [string]$Mode = 'start',
  [string]$BindHost = '127.0.0.1',
  [int]$Port = 3100,
  [string]$ApiBaseUrl = 'http://127.0.0.1:18080',
  [string]$DistDirName = '.next',
  [int]$StartupTimeoutSec = 60,
  [switch]$SkipReadinessCheck
)

$repoRoot = Split-Path -Parent $PSScriptRoot
$workspace = Join-Path $repoRoot 'apps\web'
$readinessScript = Join-Path $repoRoot 'scripts\check-local-runtime-readiness.mjs'
$out = Join-Path $repoRoot "web-$Port.out.log"
$err = Join-Path $repoRoot "web-$Port.err.log"
$resolvedDistDirName = if ([string]::IsNullOrWhiteSpace($DistDirName)) { '.next' } else { $DistDirName.Trim() }
$distDirPath = Join-Path $workspace $resolvedDistDirName
$buildId = Join-Path $distDirPath 'BUILD_ID'
$buildManifest = Join-Path $distDirPath 'build-manifest.json'
$buildEnvStamp = Join-Path $distDirPath 'dramatv-build-env.json'
$apiBaseUrl = $ApiBaseUrl.TrimEnd('/')

function Get-ListeningProcessId {
  param([int]$TargetPort)

  $connection = Get-NetTCPConnection -State Listen -LocalPort $TargetPort -ErrorAction SilentlyContinue |
    Select-Object -First 1

  if ($null -eq $connection) {
    return $null
  }

  return $connection.OwningProcess
}

function Get-LogExcerpt {
  param([string]$Path)

  if (!(Test-Path $Path)) {
    return $null
  }

  $lines = Get-Content -LiteralPath $Path -Tail 20 -ErrorAction SilentlyContinue |
    Where-Object { $_ -and $_.Trim().Length -gt 0 }

  if ($null -eq $lines -or $lines.Count -eq 0) {
    return $null
  }

  return ($lines -join [Environment]::NewLine)
}

function Test-HttpReady {
  param([string]$Url)

  try {
    $response = Invoke-WebRequest -UseBasicParsing $Url -TimeoutSec 3
    return $response.StatusCode -ge 200 -and $response.StatusCode -lt 400
  } catch {
    return $false
  }
}

function Get-LatestSourceWriteTimeUtc {
  param([string]$WorkspacePath)

  $entries = New-Object System.Collections.Generic.List[System.IO.FileSystemInfo]
  $fileCandidates = @(
    (Join-Path $WorkspacePath 'package.json'),
    (Join-Path $WorkspacePath 'package-lock.json'),
    (Join-Path $WorkspacePath 'next.config.ts'),
    (Join-Path $WorkspacePath 'tsconfig.json'),
    (Join-Path $WorkspacePath '.env.local')
  )
  $directoryCandidates = @(
    (Join-Path $WorkspacePath 'src'),
    (Join-Path $WorkspacePath 'public')
  )

  foreach ($candidate in $fileCandidates) {
    if (Test-Path $candidate) {
      $entries.Add((Get-Item -LiteralPath $candidate))
    }
  }

  foreach ($candidate in $directoryCandidates) {
    if (Test-Path $candidate) {
      $children = Get-ChildItem -LiteralPath $candidate -Recurse -File -ErrorAction SilentlyContinue
      foreach ($child in $children) {
        $entries.Add($child)
      }
    }
  }

  if ($entries.Count -eq 0) {
    return $null
  }

  return ($entries | Sort-Object LastWriteTimeUtc -Descending | Select-Object -First 1).LastWriteTimeUtc
}

function Get-BuildRefreshReason {
  param(
    [string]$WorkspacePath,
    [string]$BuildIdPath,
    [string]$BuildManifestPath,
    [string]$BuildEnvStampPath,
    [string]$ExpectedApiBaseUrl
  )

  if (!(Test-Path $BuildIdPath) -and !(Test-Path $BuildManifestPath)) {
    return 'Production build not found.'
  }

  if (!(Test-Path $BuildEnvStampPath)) {
    return 'Build env stamp not found.'
  }

  try {
    $stamp = Get-Content -LiteralPath $BuildEnvStampPath -Raw | ConvertFrom-Json
    if ($stamp.nextPublicApiBaseUrl -ne $ExpectedApiBaseUrl) {
      return "Build API base changed: $($stamp.nextPublicApiBaseUrl) -> $ExpectedApiBaseUrl"
    }
  } catch {
    return 'Build env stamp is unreadable.'
  }

  $buildArtifacts = New-Object System.Collections.Generic.List[System.IO.FileInfo]
  foreach ($artifactPath in @($BuildIdPath, $BuildManifestPath, $BuildEnvStampPath)) {
    if (Test-Path $artifactPath) {
      $buildArtifacts.Add((Get-Item -LiteralPath $artifactPath))
    }
  }

  $latestSourceWriteTimeUtc = Get-LatestSourceWriteTimeUtc -WorkspacePath $WorkspacePath
  if ($null -ne $latestSourceWriteTimeUtc -and $buildArtifacts.Count -gt 0) {
    $latestBuildWriteTimeUtc = ($buildArtifacts | Sort-Object LastWriteTimeUtc -Descending | Select-Object -First 1).LastWriteTimeUtc
    if ($latestSourceWriteTimeUtc -gt $latestBuildWriteTimeUtc) {
      return 'Source files changed since last build.'
    }
  }

  return $null
}

function Write-BuildEnvStamp {
  param(
    [string]$BuildEnvStampPath,
    [string]$ApiBaseUrl
  )

  $payload = @{
    nextPublicApiBaseUrl = $ApiBaseUrl
    updatedAt = (Get-Date).ToString('o')
  } | ConvertTo-Json

  Set-Content -LiteralPath $BuildEnvStampPath -Value $payload -Encoding UTF8
}

function Test-IsLocalApiBaseUrl {
  param([string]$Url)

  try {
    $uri = [System.Uri]$Url
    return $uri.Host -in @('127.0.0.1', 'localhost')
  } catch {
    return $false
  }
}

if (!(Test-Path $workspace)) {
  throw "Web workspace not found: $workspace"
}

if (!(Test-Path $readinessScript)) {
  throw "Readiness script not found: $readinessScript"
}

$npm = (Get-Command 'npm.cmd' -ErrorAction Stop).Source

$existing = Get-ListeningProcessId -TargetPort $Port
if ($null -ne $existing) {
  Write-Output "Port $Port is already in use by PID $existing"
  exit 0
}

$env:DRAMATV_DATA_MODE = 'real'
$env:DRAMATV_API_BASE_URL = $apiBaseUrl
$env:NEXT_PUBLIC_DRAMATV_API_BASE_URL = $apiBaseUrl
$env:DRAMATV_NEXT_DIST_DIR = $resolvedDistDirName

$readinessScope = if (Test-IsLocalApiBaseUrl -Url $apiBaseUrl) { 'all' } else { 'frontend' }

if ($Mode -eq 'start') {
  $buildRefreshReason = Get-BuildRefreshReason `
    -WorkspacePath $workspace `
    -BuildIdPath $buildId `
    -BuildManifestPath $buildManifest `
    -BuildEnvStampPath $buildEnvStamp `
    -ExpectedApiBaseUrl $apiBaseUrl

  if ($null -ne $buildRefreshReason) {
    Write-Output "$buildRefreshReason Running npm run build first..."
  Push-Location $workspace
  try {
    & $npm 'run' 'build'
    if ($LASTEXITCODE -ne 0) {
      throw "Failed to build the Next.js app."
    }

      if (!(Test-Path $distDirPath)) {
        throw "Expected dist dir was not generated: $distDirPath"
      }

      Write-BuildEnvStamp -BuildEnvStampPath $buildEnvStamp -ApiBaseUrl $apiBaseUrl
  } finally {
    Pop-Location
  }
  }
}

foreach ($logFile in @($out, $err)) {
  if (Test-Path $logFile) {
    try {
      Remove-Item -LiteralPath $logFile -Force -ErrorAction Stop
    } catch {
      Write-Warning "Could not remove log file: $logFile"
    }
  }
}

$process = Start-Process -FilePath $npm `
  -ArgumentList @(
    'run',
    $Mode,
    '--',
    '--hostname',
    $BindHost,
    '--port',
    "$Port"
  ) `
  -WorkingDirectory $workspace `
  -RedirectStandardOutput $out `
  -RedirectStandardError $err `
  -PassThru

$deadline = (Get-Date).AddSeconds($StartupTimeoutSec)
$appUrl = "http://${BindHost}:$Port/"

while ((Get-Date) -lt $deadline) {
  if (Test-HttpReady -Url $appUrl) {
    $started = Get-ListeningProcessId -TargetPort $Port
    $listeningPidLabel = if ($null -ne $started) { $started } else { 'unknown' }

    if (!$SkipReadinessCheck) {
      $readinessOutput = Join-Path $repoRoot "artifacts\runtime-readiness\latest\web-start-$Port.json"
      & node $readinessScript `
        --scope $readinessScope `
        --frontend-base-url $appUrl.TrimEnd('/') `
        --backend-base-url $apiBaseUrl `
        --output $readinessOutput
      if ($LASTEXITCODE -ne 0) {
        throw "Web started on port $Port but readiness check failed. See $readinessOutput"
      }
      Write-Output "Readiness: $readinessOutput"
    }

    Write-Output "DramaTV web ($Mode) started on http://${BindHost}:$Port (listening PID $listeningPidLabel, launcher PID $($process.Id))"
    Write-Output "App: $appUrl"
    Write-Output "Logs: $out"
    Write-Output "Logs: $err"
    exit 0
  }

  $process.Refresh()
  if ($process.HasExited) {
    $excerpt = Get-LogExcerpt -Path $err
    if ([string]::IsNullOrWhiteSpace($excerpt)) {
      $excerpt = Get-LogExcerpt -Path $out
    }

    if ([string]::IsNullOrWhiteSpace($excerpt)) {
      throw "Web process exited before binding port $Port. Check $out and $err"
    }

    throw "Web process exited before binding port $Port.`n$excerpt"
  }

  Start-Sleep -Milliseconds 500
}

try {
  $process.Refresh()
  if (!$process.HasExited) {
    Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
  }
} catch {
}

throw "Web did not start on port $Port within $StartupTimeoutSec seconds. Check $out and $err"
