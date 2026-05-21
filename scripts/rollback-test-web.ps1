param(
  [Parameter(Mandatory = $true)] [string]$ReleaseName,
  [string]$ResourceFile = "",
  [string]$RemoteBaseDir = "/opt/dramatv-community-web",
  [string]$ServiceName = "dramatv-community-web",
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
$skipStartFlag = if ($SkipStart) { "1" } else { "0" }

$remoteScript = @'
set -euo pipefail

release_dir="__REMOTE_RELEASE_DIR__"
current_dir="__REMOTE_BASE_DIR__/current"

if [ ! -d "$release_dir" ]; then
  echo "Release directory not found: $release_dir" >&2
  exit 1
fi

ln -sfn "$release_dir" "$current_dir"
nginx -t
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
  $verifyOutput = Join-Path $workspace "artifacts\runtime-readiness\test\web-rollback-$ReleaseName-summary.json"
  $verifyScript = Join-Path $workspace "scripts\check-test-runtime-readiness.mjs"
  & $node $verifyScript --public-base-url $normalizedPublicBaseUrl --output $verifyOutput
  if ($LASTEXITCODE -ne 0) {
    throw "Rollback readiness verification failed with exit code $LASTEXITCODE"
  }
}

Write-Output "Web rollback finished."
Write-Output "Server: $($connection.ServerHost)"
Write-Output "Release: $remoteReleaseDir"
if ($VerifyAfterRollback) {
  Write-Output "Post-rollback readiness artifact: artifacts/runtime-readiness/test/web-rollback-$ReleaseName-summary.json"
}
