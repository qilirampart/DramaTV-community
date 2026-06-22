param(
  [string]$ResourceFile = "",
  [string]$RemoteBaseDir = "/opt/dramatv-community-admin",
  [string]$ServiceName = "dramatv-community-admin",
  [int]$AdminPort = 3206,
  [string]$BackendBaseUrl = "http://127.0.0.1:18080",
  [string]$CommunityPublicBaseUrl = "http://community.8.141.20.130.nip.io",
  [string]$AdminPublicBaseUrl = "http://community.8.141.20.130.nip.io/admin",
  [string]$NodeVersion = "24.11.0",
  [string]$DistDirName = ".next-admin",
  [string]$AdminBasePath = "/admin",
  [string]$ReleaseLabel = "",
  [string]$ReleaseNotes = "",
  [switch]$VerifyBeforeDeploy,
  [switch]$VerifyAfterDeploy,
  [switch]$RequireCleanWorkspace,
  [switch]$SkipStart
)

$ErrorActionPreference = "Stop"

$workspace = Split-Path -Parent $PSScriptRoot
$plink = Join-Path $workspace ".tools\putty\plink.exe"
$pscp = Join-Path $workspace ".tools\putty\pscp.exe"
$adminWorkspace = Join-Path $workspace "apps\admin"
$hostKey = "ssh-ed25519 255 SHA256:YMyByZ4GyGnkXbJVzjvy4hEuvlD0sfSH+dfMBYXdlDk"
$tempDir = Join-Path $env:TEMP "dramatv-admin-deploy"
$tar = (Get-Command "tar.exe" -ErrorAction Stop).Source
$helperPath = Join-Path $PSScriptRoot "lib\test-env-release-common.ps1"
$nodeCommand = Get-Command "node.exe" -ErrorAction SilentlyContinue
if ($nodeCommand) {
  $node = $nodeCommand.Source
} else {
  $node = (Get-Command "node" -ErrorAction Stop).Source
}
$npm = (Get-Command "npm.cmd" -ErrorAction Stop).Source

function Require-File {
  param([string]$Path, [string]$Label)

  if (!(Test-Path -LiteralPath $Path)) {
    throw "$Label not found: $Path"
  }
}

function Invoke-LocalCommand {
  param(
    [string]$Executable,
    [string[]]$Arguments,
    [string]$Label
  )

  Write-Output "[$Label] $Executable $($Arguments -join ' ')"
  & $Executable @Arguments
  if ($LASTEXITCODE -ne 0) {
    throw "$Label failed with exit code $LASTEXITCODE"
  }
}

Require-File -Path $plink -Label "plink"
Require-File -Path $pscp -Label "pscp"
Require-File -Path $adminWorkspace -Label "admin workspace"
Require-File -Path $helperPath -Label "release helper"
. $helperPath

$connection = Get-TestEnvConnectionInfo -Workspace $workspace -ResourceFile $ResourceFile
$normalizedBackendBaseUrl = Get-ValidatedAbsoluteUrl -Url $BackendBaseUrl -Label "BackendBaseUrl"
$validatedPublicBaseUrls = Assert-AdminPublicBaseUrls `
  -CommunityPublicBaseUrl $CommunityPublicBaseUrl `
  -AdminPublicBaseUrl $AdminPublicBaseUrl `
  -AdminBasePath $AdminBasePath
$normalizedCommunityPublicBaseUrl = $validatedPublicBaseUrls.CommunityPublicBaseUrl
$normalizedAdminPublicBaseUrl = $validatedPublicBaseUrls.AdminPublicBaseUrl
$normalizedAdminBasePath = $validatedPublicBaseUrls.AdminBasePath
$deployTimestamp = Get-Date -Format "yyyyMMdd-HHmmss"

if ($VerifyBeforeDeploy) {
  Invoke-LocalCommand -Executable $npm -Arguments @("run", "deploy:verify:pre") -Label "deploy:verify:pre"
}

New-Item -ItemType Directory -Force -Path $tempDir | Out-Null

$archivePath = Join-Path $tempDir "dramatv-admin-src-$deployTimestamp.tar.gz"
$envFile = Join-Path $tempDir "dramatv-community-admin.env"
$serviceFile = Join-Path $tempDir "$ServiceName.service"
$remoteScript = Join-Path $tempDir "deploy-admin-remote.sh"
$releaseMetadataFile = Join-Path $tempDir "dramatv-community-admin-release-$deployTimestamp.json"

if (Test-Path -LiteralPath $archivePath) {
  Remove-Item -LiteralPath $archivePath -Force
}

Push-Location $adminWorkspace
try {
  & $tar `
    --exclude=node_modules `
    --exclude=.next `
    --exclude=.next-* `
    --exclude=.env.local `
    --exclude=*.out.log `
    --exclude=*.err.log `
    -czf $archivePath `
    .
  if ($LASTEXITCODE -ne 0) {
    throw "Failed to package the admin source bundle."
  }
} finally {
  Pop-Location
}

$envContent = @"
NODE_ENV=production
HOSTNAME=0.0.0.0
PORT=$AdminPort
DRAMATV_ADMIN_API_BASE_URL=$normalizedBackendBaseUrl
DRAMATV_WEB_BASE_URL=http://127.0.0.1:3106
NEXT_PUBLIC_DRAMATV_ADMIN_API_BASE_URL=$normalizedCommunityPublicBaseUrl
NEXT_PUBLIC_DRAMATV_WEB_BASE_URL=$normalizedCommunityPublicBaseUrl
NEXT_PUBLIC_DRAMATV_ADMIN_BASE_PATH=$normalizedAdminBasePath
DRAMATV_ADMIN_BASE_PATH=$normalizedAdminBasePath
DRAMATV_ADMIN_NEXT_DIST_DIR=$DistDirName
NEXT_TELEMETRY_DISABLED=1
"@

$serviceContent = @"
[Unit]
Description=DramaTV Community Admin
After=network-online.target dramatv-community-server.service
Wants=network-online.target

[Service]
Type=simple
User=root
WorkingDirectory=$RemoteBaseDir/current
EnvironmentFile=$RemoteBaseDir/shared/dramatv-community-admin.env
ExecStart=/usr/local/bin/npm run start -- --hostname 0.0.0.0 --port $AdminPort
Restart=always
RestartSec=5
SuccessExitStatus=143

[Install]
WantedBy=multi-user.target
"@

$remoteArchivePath = "/tmp/dramatv-admin-src-$deployTimestamp.tar.gz"
$remoteEnvPath = "$RemoteBaseDir/shared/dramatv-community-admin.env"
$remoteServicePath = "/etc/systemd/system/$ServiceName.service"
$releaseDir = "$RemoteBaseDir/releases/$deployTimestamp"
$remoteReleaseMetadataPath = "$releaseDir/release.json"
$remoteScriptPath = "/tmp/deploy-admin-$deployTimestamp.sh"
$remoteSmokeScriptPath = "/tmp/smoke-admin-routes-$deployTimestamp.mjs"
$remoteSmokeOutputPath = "/tmp/admin-smoke-$deployTimestamp.json"
$skipStartFlag = if ($SkipStart) { "1" } else { "0" }
$releaseMetadata = Get-WorkspaceGitReleaseMetadata `
  -Workspace $workspace `
  -Component "community-admin" `
  -ReleaseName $deployTimestamp `
  -ReleaseLabel $ReleaseLabel `
  -ReleaseNotes $ReleaseNotes `
  -VerifyBeforeDeploy:$VerifyBeforeDeploy `
  -VerifyAfterDeploy:$VerifyAfterDeploy `
  -SourceMode "workspace-source-bundle-remote-build"

if ($RequireCleanWorkspace -and $releaseMetadata.dirtyWorkspace) {
  throw "Refusing to deploy from a dirty workspace. Commit or stash the current changes, or rerun without -RequireCleanWorkspace."
}

if ($releaseMetadata.dirtyWorkspace) {
  Write-Warning ("Deploying admin from a dirty workspace: total={0}, tracked={1}, untracked={2}" -f `
    $releaseMetadata.workspaceStatus.totalChanges, `
    $releaseMetadata.workspaceStatus.trackedChangeCount, `
    $releaseMetadata.workspaceStatus.untrackedCount)
}

$remoteScriptContent = @'
#!/usr/bin/env bash
set -euo pipefail

ensure_package() {
  local package_name="$1"
  if command -v dnf >/dev/null 2>&1; then
    dnf install -y "$package_name"
  elif command -v yum >/dev/null 2>&1; then
    yum install -y "$package_name"
  elif command -v apt-get >/dev/null 2>&1; then
    apt-get update
    apt-get install -y "$package_name"
  else
    echo "No supported package manager found for $package_name" >&2
    exit 1
  fi
}

if ! command -v curl >/dev/null 2>&1; then
  ensure_package curl
fi

NODE_VERSION="__NODE_VERSION__"
NODE_ARCH="linux-x64"
NODE_ROOT="/opt/dramatv-tools/node-v${NODE_VERSION}-${NODE_ARCH}"
NODE_ARCHIVE="/tmp/node-v${NODE_VERSION}-${NODE_ARCH}.tar.xz"

if [ ! -x "$NODE_ROOT/bin/node" ]; then
  mkdir -p /opt/dramatv-tools
  curl -fsSL "https://nodejs.org/dist/v${NODE_VERSION}/node-v${NODE_VERSION}-${NODE_ARCH}.tar.xz" -o "$NODE_ARCHIVE"
  rm -rf "$NODE_ROOT"
  tar -xJf "$NODE_ARCHIVE" -C /opt/dramatv-tools
fi

ln -sfn "$NODE_ROOT/bin/node" /usr/local/bin/node
if [ -x "$NODE_ROOT/bin/npm" ]; then
  ln -sfn "$NODE_ROOT/bin/npm" /usr/local/bin/npm
fi
if [ -x "$NODE_ROOT/bin/npx" ]; then
  ln -sfn "$NODE_ROOT/bin/npx" /usr/local/bin/npx
fi

mkdir -p "__REMOTE_BASE_DIR__/releases" "__REMOTE_BASE_DIR__/shared" "__RELEASE_DIR__"
rm -rf "__RELEASE_DIR__"/*
tar -xzf "__REMOTE_ARCHIVE_PATH__" -C "__RELEASE_DIR__"

cd "__RELEASE_DIR__"
npm ci --include=dev
set -a
source "__REMOTE_BASE_DIR__/shared/dramatv-community-admin.env"
set +a
npm run build

ln -sfn "__RELEASE_DIR__" "__REMOTE_BASE_DIR__/current"

systemctl daemon-reload
systemctl enable __SERVICE_NAME__

if [ "__SKIP_START_FLAG__" = "0" ]; then
  systemctl restart __SERVICE_NAME__
  sleep 3
  curl -I --max-time 10 "http://127.0.0.1:__ADMIN_PORT__/login" || true
  systemctl --no-pager --full status __SERVICE_NAME__ || journalctl -u __SERVICE_NAME__ -n 120 --no-pager
else
  echo "Admin uploaded and built without starting the service."
fi
'@
$remoteScriptContent = $remoteScriptContent.Replace("__NODE_VERSION__", $NodeVersion)
$remoteScriptContent = $remoteScriptContent.Replace("__REMOTE_BASE_DIR__", $RemoteBaseDir)
$remoteScriptContent = $remoteScriptContent.Replace("__RELEASE_DIR__", $releaseDir)
$remoteScriptContent = $remoteScriptContent.Replace("__REMOTE_ARCHIVE_PATH__", $remoteArchivePath)
$remoteScriptContent = $remoteScriptContent.Replace("__SERVICE_NAME__", $ServiceName)
$remoteScriptContent = $remoteScriptContent.Replace("__SKIP_START_FLAG__", $skipStartFlag)
$remoteScriptContent = $remoteScriptContent.Replace("__ADMIN_PORT__", "$AdminPort")

Set-Content -LiteralPath $envFile -Value $envContent -Encoding ASCII
Set-Content -LiteralPath $serviceFile -Value $serviceContent -Encoding ASCII
Write-ReleaseMetadataFile -Path $releaseMetadataFile -Metadata $releaseMetadata
[System.IO.File]::WriteAllText(
  $remoteScript,
  ($remoteScriptContent -replace "`r`n", "`n"),
  [System.Text.ASCIIEncoding]::new()
)

Invoke-TestEnvRemote -PlinkPath $plink -HostKey $hostKey -ConnectionInfo $connection -Command "mkdir -p $RemoteBaseDir/releases $RemoteBaseDir/shared"

& $pscp -batch -hostkey $hostKey -pw $connection.ServerPassword $archivePath "root@$($connection.ServerHost):$remoteArchivePath"
if ($LASTEXITCODE -ne 0) {
  throw "Failed to upload admin source archive."
}

& $pscp -batch -hostkey $hostKey -pw $connection.ServerPassword $envFile "root@$($connection.ServerHost):$remoteEnvPath"
if ($LASTEXITCODE -ne 0) {
  throw "Failed to upload admin env file."
}

& $pscp -batch -hostkey $hostKey -pw $connection.ServerPassword $serviceFile "root@$($connection.ServerHost):$remoteServicePath"
if ($LASTEXITCODE -ne 0) {
  throw "Failed to upload admin systemd service."
}

& $pscp -batch -hostkey $hostKey -pw $connection.ServerPassword $remoteScript "root@$($connection.ServerHost):$remoteScriptPath"
if ($LASTEXITCODE -ne 0) {
  throw "Failed to upload admin remote deployment script."
}

Invoke-TestEnvRemote -PlinkPath $plink -HostKey $hostKey -ConnectionInfo $connection -Command "chmod +x $remoteScriptPath && bash $remoteScriptPath"

& $pscp -batch -hostkey $hostKey -pw $connection.ServerPassword $releaseMetadataFile "root@$($connection.ServerHost):$remoteReleaseMetadataPath"
if ($LASTEXITCODE -ne 0) {
  throw "Failed to upload admin release metadata."
}

if ($VerifyAfterDeploy) {
  $verifyScript = Join-Path $workspace "scripts\smoke-admin-routes.mjs"
  $verifyPublicOutput = Join-Path $workspace "artifacts\runtime-readiness\test\admin-deploy-$deployTimestamp-public-summary.json"
  $verifyInternalOutput = Join-Path $workspace "artifacts\runtime-readiness\test\admin-deploy-$deployTimestamp-internal-summary.json"
  New-Item -ItemType Directory -Force -Path (Split-Path -Parent $verifyPublicOutput) | Out-Null

  Invoke-LocalCommand `
    -Executable $node `
    -Arguments @(
    $verifyScript,
    "--base-url",
    $normalizedAdminPublicBaseUrl,
    "--base-path",
    $normalizedAdminBasePath,
    "--mode",
    "public",
    "--output",
      $verifyPublicOutput
    ) `
    -Label "deploy:verify:post:test:admin:public"

  & $pscp -batch -hostkey $hostKey -pw $connection.ServerPassword $verifyScript "root@$($connection.ServerHost):$remoteSmokeScriptPath"
  if ($LASTEXITCODE -ne 0) {
    throw "Failed to upload admin smoke script."
  }

  Invoke-TestEnvRemote `
    -PlinkPath $plink `
    -HostKey $hostKey `
    -ConnectionInfo $connection `
    -Command "node $remoteSmokeScriptPath --base-url http://127.0.0.1:$AdminPort --base-path $normalizedAdminBasePath --backend-base-url $normalizedBackendBaseUrl --mode full --output $remoteSmokeOutputPath"

  & $pscp -batch -hostkey $hostKey -pw $connection.ServerPassword "root@$($connection.ServerHost):$remoteSmokeOutputPath" $verifyInternalOutput
  if ($LASTEXITCODE -ne 0) {
    throw "Failed to download admin internal smoke summary."
  }
}

Write-Output "Admin deploy finished."
Write-Output "Server: $($connection.ServerHost)"
Write-Output "Admin public base URL: $normalizedAdminPublicBaseUrl"
Write-Output "Community public base URL: $normalizedCommunityPublicBaseUrl"
Write-Output "Release: $releaseDir"
Write-Output "Release label: $($releaseMetadata.releaseLabel)"
Write-Output "Release metadata: $remoteReleaseMetadataPath"
Write-Output "Admin port: $AdminPort"
if ($VerifyAfterDeploy) {
  Write-Output "Post-deploy admin public smoke artifact: artifacts/runtime-readiness/test/admin-deploy-$deployTimestamp-public-summary.json"
  Write-Output "Post-deploy admin internal smoke artifact: artifacts/runtime-readiness/test/admin-deploy-$deployTimestamp-internal-summary.json"
}
