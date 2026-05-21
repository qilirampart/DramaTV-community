param(
  [string]$ResourceFile = "",
  [string]$StableTag = "test-stable-2026-05-19-community-r1",
  [string]$ReleaseNotes = "Legacy cloud baseline captured before commit-based release flow was enforced."
)

$ErrorActionPreference = "Stop"

$workspace = Split-Path -Parent $PSScriptRoot
$plink = Join-Path $workspace ".tools\putty\plink.exe"
$pscp = Join-Path $workspace ".tools\putty\pscp.exe"
$helperPath = Join-Path $PSScriptRoot "lib\test-env-release-common.ps1"
$hostKey = "ssh-ed25519 255 SHA256:YMyByZ4GyGnkXbJVzjvy4hEuvlD0sfSH+dfMBYXdlDk"
$tempDir = Join-Path $env:TEMP "dramatv-stable-baseline"

function Require-File {
  param([string]$Path, [string]$Label)

  if (!(Test-Path -LiteralPath $Path)) {
    throw "$Label not found: $Path"
  }
}

Require-File -Path $plink -Label "plink"
Require-File -Path $pscp -Label "pscp"
Require-File -Path $helperPath -Label "release helper"
. $helperPath

$connection = Get-TestEnvConnectionInfo -Workspace $workspace -ResourceFile $ResourceFile
New-Item -ItemType Directory -Force -Path $tempDir | Out-Null

$currentProbeScript = @'
web_current=$(basename "$(readlink -f /opt/dramatv-community-web/current 2>/dev/null || echo '')")
server_current=$(basename "$(dirname "$(readlink -f /opt/dramatv-community-server/current/dramatv-community-server.jar 2>/dev/null || echo '')")")
admin_current=$(basename "$(readlink -f /opt/dramatv-community-admin/current 2>/dev/null || echo '')")
printf 'web|%s\n' "$web_current"
printf 'server|%s\n' "$server_current"
printf 'admin|%s\n' "$admin_current"
'@

$currentProbeScript = $currentProbeScript -replace "`r`n", "`n"
$probeOutput = & $plink -ssh -batch -hostkey $hostKey "root@$($connection.ServerHost)" -pw $connection.ServerPassword $currentProbeScript
if ($LASTEXITCODE -ne 0) {
  throw "Failed to inspect current test releases"
}

$releaseMap = @{}
foreach ($line in ($probeOutput -split "\r?\n")) {
  if ([string]::IsNullOrWhiteSpace($line)) {
    continue
  }

  $parts = $line.Split("|")
  if ($parts.Length -ne 2) {
    continue
  }

  $releaseMap[$parts[0]] = $parts[1]
}

if ([string]::IsNullOrWhiteSpace($releaseMap["web"])) {
  throw "Could not determine current web release from the test environment"
}

if ([string]::IsNullOrWhiteSpace($releaseMap["server"])) {
  throw "Could not determine current server release from the test environment"
}

$generatedAt = (Get-Date).ToString("o")
$components = @(
  @{
    Name = "community-web"
    Runtime = "web"
    RemoteBaseDir = "/opt/dramatv-community-web"
  },
  @{
    Name = "community-server"
    Runtime = "server"
    RemoteBaseDir = "/opt/dramatv-community-server"
  }
)

if (![string]::IsNullOrWhiteSpace($releaseMap["admin"])) {
  $components += @{
    Name = "community-admin"
    Runtime = "admin"
    RemoteBaseDir = "/opt/dramatv-community-admin"
  }
}

foreach ($component in $components) {
  $releaseName = $releaseMap[$component.Runtime]
  $metadata = [ordered]@{
    releaseName = $releaseName
    releaseLabel = "$StableTag-$($component.Runtime)-legacy"
    stableTag = $StableTag
    component = $component.Name
    sourceMode = "legacy-cloud-baseline"
    branch = "unknown"
    commitSha = "unknown"
    commitShortSha = "unknown"
    dirtyWorkspace = $null
    workspaceStatus = $null
    deployedBy = @{
      username = "codex-baseline-capture"
      machineName = $env:COMPUTERNAME
    }
    generatedAt = $generatedAt
    verifyBefore = $false
    verifyAfter = $false
    releaseNotes = $ReleaseNotes
  }

  $localMetadataPath = Join-Path $tempDir "$($component.Runtime)-$releaseName-release.json"
  $remoteMetadataPath = "$($component.RemoteBaseDir)/releases/$releaseName/release.json"
  Write-ReleaseMetadataFile -Path $localMetadataPath -Metadata $metadata

  & $pscp -batch -hostkey $hostKey -pw $connection.ServerPassword $localMetadataPath "root@$($connection.ServerHost):$remoteMetadataPath"
  if ($LASTEXITCODE -ne 0) {
    throw "Failed to upload baseline metadata for $($component.Runtime) release $releaseName"
  }
}

Write-Output "Stable baseline metadata stamped."
Write-Output "Stable tag: $StableTag"
Write-Output "Web release: $($releaseMap["web"])"
Write-Output "Server release: $($releaseMap["server"])"
if ([string]::IsNullOrWhiteSpace($releaseMap["admin"])) {
  Write-Output "Admin release: not present on the test environment"
} else {
  Write-Output "Admin release: $($releaseMap["admin"])"
}
