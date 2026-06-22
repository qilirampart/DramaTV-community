param(
  [ValidateSet('start', 'dev')]
  [string]$Mode = 'start',
  [string]$BindHost = 'localhost',
  [int]$Port = 3107,
  [string]$CloudBackendBaseUrl = 'http://community.8.141.20.130.nip.io',
  [string]$DistDirName = '.next-cloud-3107',
  [int]$StartupTimeoutSec = 60,
  [switch]$SkipReadinessCheck
)

$repoRoot = Split-Path -Parent $PSScriptRoot
$starter = Join-Path $repoRoot 'scripts\start-web-3100.ps1'

if (!(Test-Path $starter)) {
  throw "Base web starter not found: $starter"
}

$arguments = @(
  '-NoProfile',
  '-ExecutionPolicy',
  'Bypass',
  '-File',
  $starter,
  '-Mode',
  $Mode,
  '-BindHost',
  $BindHost,
  '-Port',
  "$Port",
  '-ApiBaseUrl',
  $CloudBackendBaseUrl,
  '-DistDirName',
  $DistDirName,
  '-StartupTimeoutSec',
  "$StartupTimeoutSec"
)

if ($SkipReadinessCheck) {
  $arguments += '-SkipReadinessCheck'
}

& powershell.exe @arguments
exit $LASTEXITCODE
