param(
  [string]$ResourceFile = "",
  [string]$RemoteBaseDir = "/opt/dramatv-community-server",
  [string]$ServiceName = "dramatv-community-server",
  [int]$ServerPort = 18080,
  [string]$PublicBaseUrl = "http://8.141.20.130",
  [string]$DbPortOverride = "",
  [string]$ReleaseLabel = "",
  [string]$ReleaseNotes = "",
  [switch]$VerifyBeforeDeploy,
  [switch]$VerifyAfterDeploy,
  [switch]$RequireCleanWorkspace,
  [switch]$SkipBuild,
  [switch]$SkipStart
)

$ErrorActionPreference = "Stop"

$workspace = Split-Path -Parent $PSScriptRoot
$plink = Join-Path $workspace ".tools\putty\plink.exe"
$pscp = Join-Path $workspace ".tools\putty\pscp.exe"
$jarPath = Join-Path $workspace "apps\server\target\dramatv-community-server-0.1.0-SNAPSHOT.jar"
$mavenRunner = Join-Path $workspace "scripts\use-local-java17-maven.ps1"
$pomPath = Join-Path $workspace "apps\server\pom.xml"
$tempDir = Join-Path $env:TEMP "dramatv-community-deploy"
$hostKey = "ssh-ed25519 255 SHA256:YMyByZ4GyGnkXbJVzjvy4hEuvlD0sfSH+dfMBYXdlDk"
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

function Find-LineIndexByValue {
  param([string[]]$Lines, [string]$ExpectedValue, [int]$StartIndex = 0)

  for ($i = $StartIndex; $i -lt $Lines.Length; $i++) {
    if ((Get-LineValue -Line $Lines[$i]) -eq $ExpectedValue) {
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

$resourcePath = Resolve-ResourcePath -Workspace $workspace -ResourceFileParam $ResourceFile

Require-File -Path $resourcePath -Label "resource file"
Require-File -Path $plink -Label "plink"
Require-File -Path $pscp -Label "pscp"
Require-File -Path $mavenRunner -Label "local Maven runner"
Require-File -Path $pomPath -Label "server pom"

$resource = Get-Content -LiteralPath $resourcePath -Raw -Encoding UTF8
$lines = Get-NormalizedLines -InputText $resource

$script:ServerHost = Get-RequiredMatch -InputText $resource -Pattern "(?m)^\s*(\d{1,3}(?:\.\d{1,3}){3})\s*$" -Label "server host"
$rootLineIndex = Find-FirstLineIndex -Lines $lines -Pattern "(^|[:\uFF1A])\s*root\s*$"
$script:ServerPassword = Get-NextValueAfterIndex -Lines $lines -StartIndex $rootLineIndex -Label "server password"

$redisHost = Get-RequiredMatch -InputText $resource -Pattern "([A-Za-z0-9.-]+\.redis\.rds\.aliyuncs\.com)" -Label "redis host"
$redisHostIndex = Find-LineIndexByValue -Lines $lines -ExpectedValue $redisHost
$redisPort = Get-NextValueAfterIndex -Lines $lines -StartIndex $redisHostIndex -Label "redis port" -ValuePattern "^\d{2,5}$"
$redisPortIndex = Find-LineIndexByValue -Lines $lines -ExpectedValue $redisPort -StartIndex ($redisHostIndex + 1)
$redisPassword = Get-NextValueAfterIndex -Lines $lines -StartIndex $redisPortIndex -Label "redis password"

$dbHost = Get-RequiredMatch -InputText $resource -Pattern "([A-Za-z0-9.-]+\.pg\.rds\.aliyuncs\.com)" -Label "database host"
$dbHostIndex = Find-LineIndexByValue -Lines $lines -ExpectedValue $dbHost
$dbPort = if ([string]::IsNullOrWhiteSpace($DbPortOverride)) {
  Get-NextValueAfterIndex -Lines $lines -StartIndex $dbHostIndex -Label "database port" -ValuePattern "^\d{2,5}$"
} else {
  $DbPortOverride.Trim()
}
$dbPortIndex = Find-LineIndexByValue -Lines $lines -ExpectedValue $dbPort -StartIndex ($dbHostIndex + 1)
$dbName = Get-NextValueAfterIndex -Lines $lines -StartIndex $dbPortIndex -Label "database name"
$dbNameIndex = Find-LineIndexByValue -Lines $lines -ExpectedValue $dbName -StartIndex ($dbPortIndex + 1)
$dbUser = Get-NextValueAfterIndex -Lines $lines -StartIndex $dbNameIndex -Label "database user"
$dbUserIndex = Find-LineIndexByValue -Lines $lines -ExpectedValue $dbUser -StartIndex ($dbNameIndex + 1)
$dbPassword = Get-NextValueAfterIndex -Lines $lines -StartIndex $dbUserIndex -Label "database password"
$bucketLineIndex = Find-FirstLineIndex -Lines $lines -Pattern "(?i)^bucket(?:\:|\uFF1A)"
if ($bucketLineIndex -lt 0) {
  throw "Could not parse bucket name from the resource file"
}
$bucketName = Get-LineValue -Line $lines[$bucketLineIndex]
$bucketDomain = Get-RequiredMatch -InputText $resource -Pattern "([A-Za-z0-9.-]+\.oss-cn-beijing-internal\.aliyuncs\.com)" -Label "bucket domain"
$normalizedPublicBaseUrl = $PublicBaseUrl.TrimEnd("/")

if ($VerifyBeforeDeploy) {
  Invoke-LocalCommand -Executable $npm -Arguments @("run", "deploy:verify:pre") -Label "deploy:verify:pre"
}

if (!$SkipBuild) {
  & $mavenRunner -f $pomPath -DskipTests package
  if ($LASTEXITCODE -ne 0) {
    throw "Maven package failed"
  }
}

Require-File -Path $jarPath -Label "server jar"

New-Item -ItemType Directory -Force -Path $tempDir | Out-Null

$deployTimestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$releaseDir = "$RemoteBaseDir/releases/$deployTimestamp"
$sharedDir = "$RemoteBaseDir/shared"
$currentDir = "$RemoteBaseDir/current"
$remoteJarPath = "$releaseDir/dramatv-community-server.jar"
$remoteEnvPath = "$sharedDir/dramatv-community.env"
$remoteServicePath = "/etc/systemd/system/$ServiceName.service"
$logDir = "$sharedDir/logs/server"
$archiveDir = "$logDir/archive"

$envFile = Join-Path $tempDir "dramatv-community.env"
$serviceFile = Join-Path $tempDir "$ServiceName.service"
$stagedJarPath = Join-Path $tempDir "dramatv-community-server.jar"
$releaseMetadataFile = Join-Path $tempDir "dramatv-community-server-release-$deployTimestamp.json"
$remoteReleaseMetadataPath = "$releaseDir/release.json"
$releaseMetadata = Get-WorkspaceGitReleaseMetadata `
  -Workspace $workspace `
  -Component "community-server" `
  -ReleaseName $deployTimestamp `
  -ReleaseLabel $ReleaseLabel `
  -ReleaseNotes $ReleaseNotes `
  -VerifyBeforeDeploy:$VerifyBeforeDeploy `
  -VerifyAfterDeploy:$VerifyAfterDeploy `
  -SourceMode "workspace-jar-upload"

if ($RequireCleanWorkspace -and $releaseMetadata.dirtyWorkspace) {
  throw "Refusing to deploy from a dirty workspace. Commit or stash the current changes, or rerun without -RequireCleanWorkspace."
}

if ($releaseMetadata.dirtyWorkspace) {
  Write-Warning ("Deploying backend from a dirty workspace: total={0}, tracked={1}, untracked={2}" -f `
    $releaseMetadata.workspaceStatus.totalChanges, `
    $releaseMetadata.workspaceStatus.trackedChangeCount, `
    $releaseMetadata.workspaceStatus.untrackedCount)
}

$envContent = @"
DRAMATV_SERVER_PORT=$ServerPort
DRAMATV_DB_URL=jdbc:postgresql://${dbHost}:$dbPort/$dbName
DRAMATV_DB_USERNAME=$dbUser
DRAMATV_DB_PASSWORD=$dbPassword
DRAMATV_REDIS_HOST=$redisHost
DRAMATV_REDIS_PORT=$redisPort
DRAMATV_REDIS_PASSWORD=$redisPassword
DRAMATV_LOG_DIR=$logDir
DRAMATV_MEDIA_LOCAL_DIR=$sharedDir/media
DRAMATV_MEDIA_SERVE_LOCALLY=false
DRAMATV_MEDIA_STORAGE_PROVIDER=oss
DRAMATV_MEDIA_BUCKET_NAME=$bucketName
DRAMATV_MEDIA_KEY_PREFIX=community/test
DRAMATV_MEDIA_PUBLIC_BASE_URL=
DRAMATV_MEDIA_PUBLIC_BASE_PATH=/media
DRAMATV_MEDIA_UPLOAD_MAX_VIDEO_SIZE_BYTES=314572800
DRAMATV_MEDIA_UPLOAD_MAX_IMAGE_SIZE_BYTES=20971520
DRAMATV_MEDIA_OSS_ENDPOINT=oss-cn-beijing-internal.aliyuncs.com
DRAMATV_MEDIA_OSS_REGION=cn-beijing
DRAMATV_MEDIA_OSS_AUTH_MODE=ecs_ram_role
DRAMATV_MEDIA_OSS_ROLE_NAME=ailab-community
DRAMATV_MEDIA_OSS_ROLE_DISCOVERY_URL=http://100.100.100.200/latest/meta-data/ram/security-credentials/
"@

$serviceContent = @"
[Unit]
Description=DramaTV Community Server
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=root
WorkingDirectory=$currentDir
EnvironmentFile=$remoteEnvPath
ExecStart=/usr/bin/env java -jar $currentDir/dramatv-community-server.jar
Restart=always
RestartSec=5
SuccessExitStatus=143

[Install]
WantedBy=multi-user.target
"@

Set-Content -LiteralPath $envFile -Value $envContent -Encoding ASCII
Set-Content -LiteralPath $serviceFile -Value $serviceContent -Encoding ASCII
Copy-Item -LiteralPath $jarPath -Destination $stagedJarPath -Force
Write-ReleaseMetadataFile -Path $releaseMetadataFile -Metadata $releaseMetadata

Invoke-Remote "mkdir -p $releaseDir $sharedDir $currentDir $archiveDir $sharedDir/media"

& $pscp -batch -hostkey $hostKey -pw $script:ServerPassword $stagedJarPath "root@$($script:ServerHost):$remoteJarPath"
if ($LASTEXITCODE -ne 0) {
  throw "Failed to upload server jar"
}

& $pscp -batch -hostkey $hostKey -pw $script:ServerPassword $envFile "root@$($script:ServerHost):$remoteEnvPath"
if ($LASTEXITCODE -ne 0) {
  throw "Failed to upload env file"
}

& $pscp -batch -hostkey $hostKey -pw $script:ServerPassword $serviceFile "root@$($script:ServerHost):$remoteServicePath"
if ($LASTEXITCODE -ne 0) {
  throw "Failed to upload systemd service file"
}

& $pscp -batch -hostkey $hostKey -pw $script:ServerPassword $releaseMetadataFile "root@$($script:ServerHost):$remoteReleaseMetadataPath"
if ($LASTEXITCODE -ne 0) {
  throw "Failed to upload release metadata"
}

Invoke-Remote "ln -sfn $remoteJarPath $currentDir/dramatv-community-server.jar && systemctl daemon-reload && systemctl enable $ServiceName"

if (!$SkipStart) {
  Invoke-Remote "systemctl restart $ServiceName"
  Start-Sleep -Seconds 5
  Invoke-Remote "systemctl --no-pager --full status $ServiceName || journalctl -u $ServiceName -n 80 --no-pager"
} else {
  Write-Output "Uploaded release without starting service."
}

if ($VerifyAfterDeploy) {
  Invoke-Remote "if command -v curl >/dev/null 2>&1; then curl -fsS http://127.0.0.1:$ServerPort/actuator/health; elif command -v wget >/dev/null 2>&1; then wget -qO- http://127.0.0.1:$ServerPort/actuator/health; else exit 1; fi"
  $verifyOutput = Join-Path $workspace "artifacts\runtime-readiness\test\backend-deploy-$deployTimestamp-summary.json"
  $verifyScript = Join-Path $workspace "scripts\check-test-runtime-readiness.mjs"
  Invoke-LocalCommand `
    -Executable $node `
    -Arguments @($verifyScript, "--public-base-url", $normalizedPublicBaseUrl, "--output", $verifyOutput) `
    -Label "deploy:verify:post:test"
}

Write-Output "Deploy finished."
Write-Output "Server: $ServerHost"
Write-Output "Service: $ServiceName"
Write-Output "Release: $releaseDir"
Write-Output "Release label: $($releaseMetadata.releaseLabel)"
Write-Output "Release metadata: $remoteReleaseMetadataPath"
Write-Output "Remote env: $remoteEnvPath"
Write-Output "Bucket domain recorded from resource file: $bucketDomain"
if ($VerifyAfterDeploy) {
  Write-Output "Post-deploy readiness artifact: artifacts/runtime-readiness/test/backend-deploy-$deployTimestamp-summary.json"
}
