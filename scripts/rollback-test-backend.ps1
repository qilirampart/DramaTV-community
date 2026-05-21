param(
  [Parameter(Mandatory = $true)] [string]$ReleaseName,
  [string]$ResourceFile = "",
  [string]$RemoteBaseDir = "/opt/dramatv-community-server",
  [string]$ServiceName = "dramatv-community-server",
  [int]$ServerPort = 18080,
  [string]$PublicBaseUrl = "http://8.141.20.130",
  [switch]$VerifyAfterRollback,
  [switch]$SkipStart
)

$ErrorActionPreference = "Stop"

$workspace = Split-Path -Parent $PSScriptRoot
$plink = Join-Path $workspace ".tools\putty\plink.exe"
$nodeCommand = Get-Command "node.exe" -ErrorAction SilentlyContinue
if ($nodeCommand) {
  $node = $nodeCommand.Source
} else {
  $node = (Get-Command "node" -ErrorAction Stop).Source
}
$hostKey = "ssh-ed25519 255 SHA256:YMyByZ4GyGnkXbJVzjvy4hEuvlD0sfSH+dfMBYXdlDk"
$helperPath = Join-Path $PSScriptRoot "lib\test-env-release-common.ps1"

function Require-File {
  param([string]$Path, [string]$Label)

  if (!(Test-Path -LiteralPath $Path)) {
    throw "$Label not found: $Path"
  }
}

Require-File -Path $plink -Label "plink"
Require-File -Path $helperPath -Label "release helper"
. $helperPath

$connection = Get-TestEnvConnectionInfo -Workspace $workspace -ResourceFile $ResourceFile
$normalizedPublicBaseUrl = $PublicBaseUrl.TrimEnd("/")
$remoteReleaseDir = "$RemoteBaseDir/releases/$ReleaseName"
$remoteJarPath = "$remoteReleaseDir/dramatv-community-server.jar"
$skipStartFlag = if ($SkipStart) { "1" } else { "0" }

$remoteScript = @'
set -euo pipefail

release_dir="__REMOTE_RELEASE_DIR__"
jar_path="$release_dir/dramatv-community-server.jar"
current_jar="__REMOTE_BASE_DIR__/current/dramatv-community-server.jar"

if [ ! -f "$jar_path" ]; then
  echo "Release jar not found: $jar_path" >&2
  exit 1
fi

ln -sfn "$jar_path" "$current_jar"
systemctl daemon-reload

if [ "__SKIP_START__" != "1" ]; then
  systemctl restart "__SERVICE_NAME__"
  sleep 5
  systemctl --no-pager --full status "__SERVICE_NAME__" || journalctl -u "__SERVICE_NAME__" -n 80 --no-pager
else
  echo "Rolled back symlink without restarting the service."
fi
'@

$remoteScript = $remoteScript.Replace("__REMOTE_RELEASE_DIR__", $remoteReleaseDir)
$remoteScript = $remoteScript.Replace("__REMOTE_BASE_DIR__", $RemoteBaseDir)
$remoteScript = $remoteScript.Replace("__SERVICE_NAME__", $ServiceName)
$remoteScript = $remoteScript.Replace("__SKIP_START__", $skipStartFlag)

Invoke-TestEnvRemote -PlinkPath $plink -HostKey $hostKey -ConnectionInfo $connection -Command $remoteScript

if ($VerifyAfterRollback) {
  $healthCommand = "if command -v curl >/dev/null 2>&1; then curl -fsS http://127.0.0.1:$ServerPort/actuator/health; elif command -v wget >/dev/null 2>&1; then wget -qO- http://127.0.0.1:$ServerPort/actuator/health; else exit 1; fi"
  Invoke-TestEnvRemote -PlinkPath $plink -HostKey $hostKey -ConnectionInfo $connection -Command $healthCommand

  $verifyOutput = Join-Path $workspace "artifacts\runtime-readiness\test\backend-rollback-$ReleaseName-summary.json"
  $verifyScript = Join-Path $workspace "scripts\check-test-runtime-readiness.mjs"
  & $node $verifyScript --public-base-url $normalizedPublicBaseUrl --output $verifyOutput
  if ($LASTEXITCODE -ne 0) {
    throw "Rollback readiness verification failed with exit code $LASTEXITCODE"
  }
}

Write-Output "Backend rollback finished."
Write-Output "Server: $($connection.ServerHost)"
Write-Output "Release: $remoteReleaseDir"
if ($VerifyAfterRollback) {
  Write-Output "Post-rollback readiness artifact: artifacts/runtime-readiness/test/backend-rollback-$ReleaseName-summary.json"
}
