param(
  [int]$Port = 18080,
  [int]$StartupTimeoutSec = 45
)

$workspace = Split-Path -Parent $PSScriptRoot
$java = Join-Path $workspace '.tools\jdk-17\bin\java.exe'
$jar = Join-Path $workspace 'apps\server\target\dramatv-community-server-0.1.0-SNAPSHOT.jar'
$runner = Join-Path $workspace 'scripts\use-local-java17-maven.ps1'
$pom = Join-Path $workspace 'apps\server\pom.xml'
$serverEnvExample = Join-Path $workspace 'apps\server\.env.example'
$serverEnvFile = Join-Path $workspace 'apps\server\.env'
$out = Join-Path $workspace "server-$Port.out.log"
$err = Join-Path $workspace "server-$Port.err.log"

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

function Test-SpringBootExecutableJar {
  param([string]$JarPath)

  if (!(Test-Path $JarPath)) {
    return $false
  }

  Add-Type -AssemblyName System.IO.Compression.FileSystem
  $archive = [System.IO.Compression.ZipFile]::OpenRead($JarPath)

  try {
    return $null -ne ($archive.Entries | Where-Object { $_.FullName -like 'BOOT-INF/*' } | Select-Object -First 1)
  } finally {
    $archive.Dispose()
  }
}

function Import-EnvFile {
  param([string]$Path)

  if (!(Test-Path $Path)) {
    return
  }

  Get-Content -LiteralPath $Path | ForEach-Object {
    $line = $_.Trim()

    if ($line.Length -eq 0 -or $line.StartsWith('#')) {
      return
    }

    $parts = $line -split '=', 2
    if ($parts.Count -ne 2) {
      return
    }

    $name = $parts[0].Trim()
    $value = $parts[1].Trim()

    if ($name.Length -eq 0) {
      return
    }

    Set-Item -Path "Env:$name" -Value $value
  }
}

function Get-LatestSourceWriteTimeUtc {
  param([string]$WorkspacePath)

  $entries = New-Object System.Collections.Generic.List[System.IO.FileSystemInfo]
  $fileCandidates = @(
    (Join-Path $WorkspacePath 'pom.xml'),
    (Join-Path $WorkspacePath 'src\main\resources\application.yml'),
    (Join-Path $WorkspacePath 'src\main\resources\application-local-db.yml'),
    (Join-Path $WorkspacePath 'src\main\resources\db\migration')
  )
  $directoryCandidates = @(
    (Join-Path $WorkspacePath 'src\main\java'),
    (Join-Path $WorkspacePath 'src\main\resources'),
    (Join-Path $WorkspacePath 'src\test\java')
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

function Get-JarRefreshReason {
  param(
    [string]$WorkspacePath,
    [string]$JarPath
  )

  if (!(Test-SpringBootExecutableJar -JarPath $JarPath)) {
    return 'Executable server jar is missing or invalid.'
  }

  $latestSourceWriteTimeUtc = Get-LatestSourceWriteTimeUtc -WorkspacePath $WorkspacePath
  if ($null -eq $latestSourceWriteTimeUtc) {
    return $null
  }

  $jarWriteTimeUtc = (Get-Item -LiteralPath $JarPath).LastWriteTimeUtc
  if ($latestSourceWriteTimeUtc -gt $jarWriteTimeUtc) {
    return 'Server source files changed since the last jar build.'
  }

  return $null
}

if (!(Test-Path $java)) {
  throw "Java executable not found: $java"
}

foreach ($envFile in @($serverEnvExample, $serverEnvFile)) {
  Import-EnvFile -Path $envFile
}

if ($true) {
  $jarRefreshReason = Get-JarRefreshReason -WorkspacePath (Join-Path $workspace 'apps\server') -JarPath $jar

  if ($null -ne $jarRefreshReason) {
  if (!(Test-Path $runner) -or !(Test-Path $pom)) {
    throw "Executable server jar is missing or invalid, and rebuild inputs were not found."
  }

    Write-Output "$jarRefreshReason Rebuilding with Maven..."
    & $runner -f $pom -DskipTests package

    if ($LASTEXITCODE -ne 0) {
      throw "Failed to rebuild the Spring Boot jar."
    }

    if (!(Test-SpringBootExecutableJar -JarPath $jar)) {
      throw "Server jar still is not executable after rebuild: $jar"
    }
  }
}

$existing = Get-ListeningProcessId -TargetPort $Port
if ($null -ne $existing) {
  Write-Output "Port $Port is already in use by PID $existing"
  exit 0
}

foreach ($logFile in @($out, $err)) {
  if (Test-Path $logFile) {
    Remove-Item -LiteralPath $logFile -Force
  }
}

$process = Start-Process -FilePath $java `
  -ArgumentList @(
    '-Dspring.profiles.active=local-db',
    "-Dserver.port=$Port",
    '-jar',
    $jar
  ) `
  -WorkingDirectory $workspace `
  -RedirectStandardOutput $out `
  -RedirectStandardError $err `
  -WindowStyle Hidden `
  -PassThru

$deadline = (Get-Date).AddSeconds($StartupTimeoutSec)
$healthUrl = "http://127.0.0.1:$Port/actuator/health"

while ((Get-Date) -lt $deadline) {
  if (Test-HttpReady -Url $healthUrl) {
    $started = Get-ListeningProcessId -TargetPort $Port
    $listeningPidLabel = if ($null -ne $started) { $started } else { 'unknown' }
    Write-Output "DramaTV server started on http://127.0.0.1:$Port (listening PID $listeningPidLabel, launcher PID $($process.Id))"
    Write-Output "Health: $healthUrl"
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
      throw "Server process exited before binding port $Port. Check $out and $err"
    }

    throw "Server process exited before binding port $Port.`n$excerpt"
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

throw "Server did not start on port $Port within $StartupTimeoutSec seconds. Check $out and $err"
