param(
  [string]$ResourceFile = "",
  [string]$RemoteBaseDir = "/opt/dramatv-community-web",
  [string]$ServiceName = "dramatv-community-web",
  [int]$FrontendPort = 3106,
  [string]$BackendBaseUrl = "http://127.0.0.1:18080",
  [string]$PublicBaseUrl = "http://8.141.20.130",
  [string]$ServerNames = "_",
  [string]$NodeVersion = "24.11.0",
  [string]$DistDirName = ".next-public",
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
$webWorkspace = Join-Path $workspace "apps\web"
$hostKey = "ssh-ed25519 255 SHA256:YMyByZ4GyGnkXbJVzjvy4hEuvlD0sfSH+dfMBYXdlDk"
$tempDir = Join-Path $env:TEMP "dramatv-web-deploy"
$tar = (Get-Command "tar.exe" -ErrorAction Stop).Source
$releaseHelperPath = Join-Path $PSScriptRoot "lib\test-env-release-common.ps1"
$nodeCommand = Get-Command "node.exe" -ErrorAction SilentlyContinue
if ($nodeCommand) {
  $node = $nodeCommand.Source
} else {
  $node = (Get-Command "node" -ErrorAction Stop).Source
}
$npm = (Get-Command "npm.cmd" -ErrorAction Stop).Source

if (!(Test-Path -LiteralPath $releaseHelperPath)) {
  throw "release helper not found: $releaseHelperPath"
}
. $releaseHelperPath

function Require-File {
  param([string]$Path, [string]$Label)

  if (!(Test-Path -LiteralPath $Path)) {
    throw "$Label not found: $Path"
  }
}

function Resolve-ResourcePath {
  param([string]$Workspace, [string]$ResourceFileParam)

  if (![string]::IsNullOrWhiteSpace($ResourceFileParam)) {
    if (Test-Path -LiteralPath $ResourceFileParam) {
      return (Resolve-Path -LiteralPath $ResourceFileParam).Path
    }
    return (Resolve-Path -LiteralPath (Join-Path $Workspace $ResourceFileParam)).Path
  }

  $codexDir = Join-Path $Workspace ".codex"
  $candidates = Get-ChildItem -Path $codexDir -Filter *.md -File -ErrorAction Stop
  $bestCandidate = $null
  $bestScore = -1

  foreach ($candidate in $candidates) {
    $content = Get-Content -LiteralPath $candidate.FullName -Raw -Encoding UTF8
    $score = 0
    $patterns = @(
      "(?m)^\d{1,3}(?:\.\d{1,3}){3}$",
      "\.redis\.rds\.aliyuncs\.com",
      "\.pg\.rds\.aliyuncs\.com",
      "oss-cn-beijing-internal\.aliyuncs\.com",
      "(?im)^bucket[:\uFF1A]\s*dz-ailab-community\s*$"
    )
    foreach ($pattern in $patterns) {
      if ($content -match $pattern) {
        $score++
      }
    }

    if ($score -gt $bestScore) {
      $bestScore = $score
      $bestCandidate = $candidate.FullName
    }
  }

  if ($bestScore -ge 4 -and $bestCandidate) {
    return $bestCandidate
  }

  throw "Could not auto-discover the test environment resource file under .codex"
}

function Get-RequiredMatch {
  param([string]$InputText, [string]$Pattern, [string]$Label)

  $match = [regex]::Match($InputText, $Pattern)
  if (!$match.Success) {
    throw "Could not parse $Label from the resource file"
  }
  return $match.Groups[1].Value.Trim()
}

function Get-NormalizedLines {
  param([string]$InputText)

  return ($InputText -split "\r?\n" | ForEach-Object { $_.Trim() } | Where-Object { $_ -ne "" })
}

function Get-LineValue {
  param([string]$Line)

  $match = [regex]::Match($Line, "^(?:[^:]|[^\uFF1A])*?(?:\:|\uFF1A)\s*(.+?)\s*$")
  if ($match.Success) {
    return $match.Groups[1].Value.Trim()
  }
  return $Line.Trim()
}

function Find-FirstLineIndex {
  param([string[]]$Lines, [string]$Pattern, [int]$StartIndex = 0)

  for ($i = $StartIndex; $i -lt $Lines.Length; $i++) {
    if ($Lines[$i] -match $Pattern) {
      return $i
    }
  }
  return -1
}

function Get-NextValueAfterIndex {
  param(
    [string[]]$Lines,
    [int]$StartIndex,
    [string]$Label,
    [string]$ValuePattern = ".+"
  )

  if ($StartIndex -lt 0) {
    throw "Could not locate the anchor for $Label in the resource file"
  }

  for ($i = $StartIndex + 1; $i -lt $Lines.Length; $i++) {
    $value = Get-LineValue -Line $Lines[$i]
    if (![string]::IsNullOrWhiteSpace($value) -and $value -match $ValuePattern) {
      return $value
    }
  }

  throw "Could not parse $Label from the resource file"
}

function Invoke-Remote {
  param([string]$Command)

  & $plink -ssh -batch -hostkey $hostKey "root@$script:ServerHost" -pw $script:ServerPassword $Command
  if ($LASTEXITCODE -ne 0) {
    throw "Remote command failed with exit code $LASTEXITCODE"
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
Require-File -Path $webWorkspace -Label "web workspace"

$resourcePath = Resolve-ResourcePath -Workspace $workspace -ResourceFileParam $ResourceFile
$resource = Get-Content -LiteralPath $resourcePath -Raw -Encoding UTF8
$lines = Get-NormalizedLines -InputText $resource

$script:ServerHost = Get-RequiredMatch -InputText $resource -Pattern "(?m)^\s*(\d{1,3}(?:\.\d{1,3}){3})\s*$" -Label "server host"
$rootLineIndex = Find-FirstLineIndex -Lines $lines -Pattern "(^|[:\uFF1A])\s*root\s*$"
$script:ServerPassword = Get-NextValueAfterIndex -Lines $lines -StartIndex $rootLineIndex -Label "server password"

$normalizedBackendBaseUrl = $BackendBaseUrl.TrimEnd("/")
$normalizedPublicBaseUrl = $PublicBaseUrl.TrimEnd("/")
$normalizedServerNames = if ([string]::IsNullOrWhiteSpace($ServerNames)) { "_" } else { $ServerNames.Trim() }
$deployTimestamp = Get-Date -Format "yyyyMMdd-HHmmss"

if ($VerifyBeforeDeploy) {
  Invoke-LocalCommand -Executable $npm -Arguments @("run", "deploy:verify:pre") -Label "deploy:verify:pre"
}

New-Item -ItemType Directory -Force -Path $tempDir | Out-Null

$archivePath = Join-Path $tempDir "dramatv-web-src-$deployTimestamp.tar.gz"
$envFile = Join-Path $tempDir "dramatv-community-web.env"
$serviceFile = Join-Path $tempDir "$ServiceName.service"
$nginxFile = Join-Path $tempDir "dramatv-community-http.conf"
$remoteScript = Join-Path $tempDir "deploy-web-remote.sh"
$releaseMetadataFile = Join-Path $tempDir "dramatv-community-web-release-$deployTimestamp.json"

if (Test-Path -LiteralPath $archivePath) {
  Remove-Item -LiteralPath $archivePath -Force
}

Push-Location $webWorkspace
try {
  & $tar `
    --exclude=node_modules `
    --exclude=.next `
    --exclude=.next-cloud-3107 `
    --exclude=.next-deploy-public `
    --exclude=.env.local `
    --exclude=dramatv-visual-dev.err.log `
    --exclude=dramatv-visual-dev.out.log `
    -czf $archivePath `
    .
  if ($LASTEXITCODE -ne 0) {
    throw "Failed to package the frontend source bundle."
  }
} finally {
  Pop-Location
}

$envContent = @"
NODE_ENV=production
HOSTNAME=127.0.0.1
PORT=$FrontendPort
DRAMATV_API_BASE_URL=$normalizedBackendBaseUrl
NEXT_PUBLIC_DRAMATV_API_BASE_URL=$normalizedPublicBaseUrl
DRAMATV_NEXT_DIST_DIR=$DistDirName
NEXT_TELEMETRY_DISABLED=1
"@

$serviceContent = @"
[Unit]
Description=DramaTV Community Web
After=network-online.target dramatv-community-server.service
Wants=network-online.target

[Service]
Type=simple
User=root
WorkingDirectory=$RemoteBaseDir/current
EnvironmentFile=$RemoteBaseDir/shared/dramatv-community-web.env
ExecStart=/usr/local/bin/npm run start -- --hostname 127.0.0.1 --port $FrontendPort
Restart=always
RestartSec=5
SuccessExitStatus=143

[Install]
WantedBy=multi-user.target
"@

$nginxContent = @"
map `$http_upgrade `$connection_upgrade {
    default upgrade;
    '' close;
}

server {
    listen 80;
    listen [::]:80;
    server_name $normalizedServerNames;

    client_max_body_size 120m;
    proxy_connect_timeout 60s;
    proxy_send_timeout 300s;
    proxy_read_timeout 300s;
    send_timeout 300s;

    location ^~ /api/uploads/ {
        proxy_pass http://127.0.0.1:$FrontendPort;
        proxy_http_version 1.1;

        proxy_set_header Upgrade `$http_upgrade;
        proxy_set_header Connection `$connection_upgrade;
        proxy_set_header Host `$host;
        proxy_set_header X-Real-IP `$remote_addr;
        proxy_set_header X-Forwarded-For `$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto `$scheme;
        proxy_set_header X-Forwarded-Host `$host;
        proxy_set_header X-Forwarded-Port `$server_port;

        proxy_buffering off;
    }

    location = /api/me/notifications/recent {
        proxy_pass http://127.0.0.1:$FrontendPort;
        proxy_http_version 1.1;

        proxy_set_header Upgrade `$http_upgrade;
        proxy_set_header Connection `$connection_upgrade;
        proxy_set_header Host `$host;
        proxy_set_header X-Real-IP `$remote_addr;
        proxy_set_header X-Forwarded-For `$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto `$scheme;
        proxy_set_header X-Forwarded-Host `$host;
        proxy_set_header X-Forwarded-Port `$server_port;

        proxy_buffering off;
    }

    location = /api/public/featured-prompts {
        proxy_pass http://127.0.0.1:$FrontendPort;
        proxy_http_version 1.1;

        proxy_set_header Upgrade `$http_upgrade;
        proxy_set_header Connection `$connection_upgrade;
        proxy_set_header Host `$host;
        proxy_set_header X-Real-IP `$remote_addr;
        proxy_set_header X-Forwarded-For `$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto `$scheme;
        proxy_set_header X-Forwarded-Host `$host;
        proxy_set_header X-Forwarded-Port `$server_port;

        proxy_buffering off;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:18080;
        proxy_http_version 1.1;

        proxy_set_header Host `$host;
        proxy_set_header X-Real-IP `$remote_addr;
        proxy_set_header X-Forwarded-For `$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto `$scheme;
        proxy_set_header X-Forwarded-Host `$host;
        proxy_set_header X-Forwarded-Port `$server_port;

        proxy_buffering off;
    }

    location /media/ {
        proxy_pass http://127.0.0.1:18080;
        proxy_http_version 1.1;

        proxy_set_header Host `$host;
        proxy_set_header X-Real-IP `$remote_addr;
        proxy_set_header X-Forwarded-For `$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto `$scheme;
        proxy_set_header X-Forwarded-Host `$host;
        proxy_set_header X-Forwarded-Port `$server_port;
        proxy_set_header Range `$http_range;
        proxy_set_header If-Range `$http_if_range;

        proxy_buffering off;
    }

    location / {
        proxy_pass http://127.0.0.1:$FrontendPort;
        proxy_http_version 1.1;

        proxy_set_header Upgrade `$http_upgrade;
        proxy_set_header Connection `$connection_upgrade;
        proxy_set_header Host `$host;
        proxy_set_header X-Real-IP `$remote_addr;
        proxy_set_header X-Forwarded-For `$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto `$scheme;
        proxy_set_header X-Forwarded-Host `$host;
        proxy_set_header X-Forwarded-Port `$server_port;

        proxy_buffering off;
    }
}
"@

$remoteArchivePath = "/tmp/dramatv-web-src-$deployTimestamp.tar.gz"
$remoteServicePath = "/etc/systemd/system/$ServiceName.service"
$remoteEnvPath = "$RemoteBaseDir/shared/dramatv-community-web.env"
$remoteNginxPath = "/etc/nginx/conf.d/dramatv-community-http.conf"
$releaseDir = "$RemoteBaseDir/releases/$deployTimestamp"
$remoteReleaseMetadataPath = "$releaseDir/release.json"
$remoteScriptPath = "/tmp/deploy-web-$deployTimestamp.sh"
$skipStartFlag = if ($SkipStart) { "1" } else { "0" }
$releaseMetadata = Get-WorkspaceGitReleaseMetadata `
  -Workspace $workspace `
  -Component "community-web" `
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
  Write-Warning ("Deploying web from a dirty workspace: total={0}, tracked={1}, untracked={2}" -f `
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

if ! command -v nginx >/dev/null 2>&1; then
  ensure_package nginx
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
source "__REMOTE_BASE_DIR__/shared/dramatv-community-web.env"
set +a
npm run build

ln -sfn "__RELEASE_DIR__" "__REMOTE_BASE_DIR__/current"

nginx -t
systemctl daemon-reload
systemctl enable __SERVICE_NAME__
systemctl enable nginx
systemctl reload nginx

if [ "__SKIP_START_FLAG__" = "0" ]; then
  systemctl restart __SERVICE_NAME__
  sleep 3
  curl -I --max-time 10 "http://127.0.0.1:__FRONTEND_PORT__" || true
  curl -I --max-time 10 "http://127.0.0.1/" || true
  systemctl --no-pager --full status __SERVICE_NAME__ || journalctl -u __SERVICE_NAME__ -n 120 --no-pager
else
  echo "Frontend uploaded and built without starting the service."
fi
'@
$remoteScriptContent = $remoteScriptContent.Replace("__NODE_VERSION__", $NodeVersion)
$remoteScriptContent = $remoteScriptContent.Replace("__REMOTE_BASE_DIR__", $RemoteBaseDir)
$remoteScriptContent = $remoteScriptContent.Replace("__RELEASE_DIR__", $releaseDir)
$remoteScriptContent = $remoteScriptContent.Replace("__REMOTE_ARCHIVE_PATH__", $remoteArchivePath)
$remoteScriptContent = $remoteScriptContent.Replace("__SERVICE_NAME__", $ServiceName)
$remoteScriptContent = $remoteScriptContent.Replace("__SKIP_START_FLAG__", $skipStartFlag)
$remoteScriptContent = $remoteScriptContent.Replace("__FRONTEND_PORT__", "$FrontendPort")

Set-Content -LiteralPath $envFile -Value $envContent -Encoding ASCII
Set-Content -LiteralPath $serviceFile -Value $serviceContent -Encoding ASCII
Set-Content -LiteralPath $nginxFile -Value $nginxContent -Encoding ASCII
Write-ReleaseMetadataFile -Path $releaseMetadataFile -Metadata $releaseMetadata
[System.IO.File]::WriteAllText(
  $remoteScript,
  ($remoteScriptContent -replace "`r`n", "`n"),
  [System.Text.ASCIIEncoding]::new()
)

Invoke-Remote "mkdir -p $RemoteBaseDir/releases $RemoteBaseDir/shared"

& $pscp -batch -hostkey $hostKey -pw $script:ServerPassword $archivePath "root@$($script:ServerHost):$remoteArchivePath"
if ($LASTEXITCODE -ne 0) {
  throw "Failed to upload frontend source archive."
}

& $pscp -batch -hostkey $hostKey -pw $script:ServerPassword $envFile "root@$($script:ServerHost):$remoteEnvPath"
if ($LASTEXITCODE -ne 0) {
  throw "Failed to upload frontend env file."
}

& $pscp -batch -hostkey $hostKey -pw $script:ServerPassword $serviceFile "root@$($script:ServerHost):$remoteServicePath"
if ($LASTEXITCODE -ne 0) {
  throw "Failed to upload frontend systemd service."
}

& $pscp -batch -hostkey $hostKey -pw $script:ServerPassword $nginxFile "root@$($script:ServerHost):$remoteNginxPath"
if ($LASTEXITCODE -ne 0) {
  throw "Failed to upload Nginx config."
}

& $pscp -batch -hostkey $hostKey -pw $script:ServerPassword $remoteScript "root@$($script:ServerHost):$remoteScriptPath"
if ($LASTEXITCODE -ne 0) {
  throw "Failed to upload remote deployment script."
}

Invoke-Remote "chmod +x $remoteScriptPath && bash $remoteScriptPath"

& $pscp -batch -hostkey $hostKey -pw $script:ServerPassword $releaseMetadataFile "root@$($script:ServerHost):$remoteReleaseMetadataPath"
if ($LASTEXITCODE -ne 0) {
  throw "Failed to upload web release metadata."
}

if ($VerifyAfterDeploy) {
  $verifyOutput = Join-Path $workspace "artifacts\runtime-readiness\test\web-deploy-$deployTimestamp-summary.json"
  $verifyScript = Join-Path $workspace "scripts\check-test-runtime-readiness.mjs"
  Invoke-LocalCommand `
    -Executable $node `
    -Arguments @($verifyScript, "--public-base-url", $normalizedPublicBaseUrl, "--output", $verifyOutput) `
    -Label "deploy:verify:post:test"
}

Write-Output "Frontend deploy finished."
Write-Output "Server: $($script:ServerHost)"
Write-Output "Public base URL: $normalizedPublicBaseUrl"
Write-Output "Server names: $normalizedServerNames"
Write-Output "Release: $releaseDir"
Write-Output "Release label: $($releaseMetadata.releaseLabel)"
Write-Output "Release metadata: $remoteReleaseMetadataPath"
Write-Output "Frontend port: $FrontendPort"
if ($VerifyAfterDeploy) {
  Write-Output "Post-deploy readiness artifact: artifacts/runtime-readiness/test/web-deploy-$deployTimestamp-summary.json"
}
