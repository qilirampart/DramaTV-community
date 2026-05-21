param(
  [int]$Port = 18080,
  [int]$StartupTimeoutSec = 60,
  [switch]$SkipReadinessCheck
)

$workspace = Split-Path -Parent $PSScriptRoot
$runner = Join-Path $workspace 'scripts\run-server-local-db.ps1'
$readinessScript = Join-Path $workspace 'scripts\check-local-runtime-readiness.mjs'
$out = Join-Path $workspace "server-dev-$Port.out.log"
$err = Join-Path $workspace "server-dev-$Port.err.log"

function Get-ListeningProcessId {
  param([int]$TargetPort)

  $connection = Get-NetTCPConnection -State Listen -LocalPort $TargetPort -ErrorAction SilentlyContinue |
    Select-Object -First 1

  if ($null -eq $connection) {
    return $null
  }

  return $connection.OwningProcess
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

function Get-LogExcerpt {
  param([string]$Path)

  if (!(Test-Path $Path)) {
    return $null
  }

  $lines = Get-Content -LiteralPath $Path -Tail 30 -ErrorAction SilentlyContinue |
    Where-Object { $_ -and $_.Trim().Length -gt 0 }

  if ($null -eq $lines -or $lines.Count -eq 0) {
    return $null
  }

  return ($lines -join [Environment]::NewLine)
}

if (!(Test-Path $runner)) {
  throw "Development runner not found: $runner"
}

if (!(Test-Path $readinessScript)) {
  throw "Readiness script not found: $readinessScript"
}

$existing = Get-ListeningProcessId -TargetPort $Port
if ($null -ne $existing) {
  Write-Output "Stopping existing process on port $Port (PID $existing)..."
  Stop-Process -Id $existing -Force
  Start-Sleep -Seconds 1
}

foreach ($logFile in @($out, $err)) {
  if (Test-Path $logFile) {
    try {
      Remove-Item -LiteralPath $logFile -Force -ErrorAction Stop
    } catch [System.IO.IOException] {
      Write-Output "Log file is in use, append mode will be used: $logFile"
    }
  }
}

$arguments = @(
  '-NoProfile',
  '-ExecutionPolicy',
  'Bypass',
  '-File',
  $runner,
  "-Dspring-boot.run.arguments=--server.port=$Port"
)

$process = Start-Process -FilePath 'powershell.exe' `
  -ArgumentList $arguments `
  -WorkingDirectory $workspace `
  -RedirectStandardOutput $out `
  -RedirectStandardError $err `
  -PassThru

$deadline = (Get-Date).AddSeconds($StartupTimeoutSec)
$healthUrl = "http://127.0.0.1:$Port/actuator/health"

while ((Get-Date) -lt $deadline) {
  if (Test-HttpReady -Url $healthUrl) {
    $started = Get-ListeningProcessId -TargetPort $Port
    $listeningPidLabel = if ($null -ne $started) { $started } else { 'unknown' }

    if (!$SkipReadinessCheck) {
      $readinessOutput = Join-Path $workspace "artifacts\runtime-readiness\latest\backend-start-$Port.json"
      & node $readinessScript `
        --scope backend `
        --backend-base-url "http://127.0.0.1:$Port" `
        --output $readinessOutput
      if ($LASTEXITCODE -ne 0) {
        throw "Backend started on port $Port but readiness check failed. See $readinessOutput"
      }
      Write-Output "Readiness: $readinessOutput"
    }

    Write-Output "DramaTV dev server started on http://127.0.0.1:$Port (listening PID $listeningPidLabel, launcher PID $($process.Id))"
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
      throw "Dev server process exited before binding port $Port. Check $out and $err"
    }

    throw "Dev server process exited before binding port $Port.`n$excerpt"
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

throw "Dev server did not start on port $Port within $StartupTimeoutSec seconds. Check $out and $err"
