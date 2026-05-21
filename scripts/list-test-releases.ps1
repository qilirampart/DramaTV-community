param(
  [string]$ResourceFile = "",
  [ValidateSet("all", "web", "server", "admin")] [string]$Runtime = "all",
  [int]$Tail = 8
)

$ErrorActionPreference = "Stop"

$workspace = Split-Path -Parent $PSScriptRoot
$plink = Join-Path $workspace ".tools\putty\plink.exe"
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
$tailValue = [Math]::Max($Tail, 1)
$normalizedRuntime = $Runtime.Trim().ToLowerInvariant()
$remoteScript = @'
emit_runtime() {
  runtime="$1"
  base_dir="$2"
  current_name="$3"
  if [ ! -d "$base_dir/releases" ]; then
    return
  fi

  ls -1 "$base_dir/releases" 2>/dev/null | tail -n __TAIL__ | while read -r release_name; do
    [ -n "$release_name" ] || continue
    metadata_path="$base_dir/releases/$release_name/release.json"
    has_metadata="no"
    if [ -f "$metadata_path" ]; then
      has_metadata="yes"
    fi

    is_current="no"
    if [ "$release_name" = "$current_name" ]; then
      is_current="yes"
    fi

    printf '%s|%s|%s|%s|||\n' "$runtime" "$release_name" "$is_current" "$has_metadata"
  done
}

web_current_name=$(basename "$(readlink -f /opt/dramatv-community-web/current 2>/dev/null || echo '')")
server_current_name=$(basename "$(dirname "$(readlink -f /opt/dramatv-community-server/current/dramatv-community-server.jar 2>/dev/null || echo '')")")
admin_current_name=$(basename "$(readlink -f /opt/dramatv-community-admin/current 2>/dev/null || echo '')")

if [ "__RUNTIME__" = "all" ] || [ "__RUNTIME__" = "web" ]; then
  emit_runtime "web" "/opt/dramatv-community-web" "$web_current_name"
fi

if [ "__RUNTIME__" = "all" ] || [ "__RUNTIME__" = "server" ]; then
  emit_runtime "server" "/opt/dramatv-community-server" "$server_current_name"
fi

if [ "__RUNTIME__" = "all" ] || [ "__RUNTIME__" = "admin" ]; then
  emit_runtime "admin" "/opt/dramatv-community-admin" "$admin_current_name"
fi
'@

$remoteScript = $remoteScript.Replace("__TAIL__", "$tailValue")
$remoteScript = $remoteScript.Replace("__RUNTIME__", $normalizedRuntime)
$normalizedRemoteScript = $remoteScript -replace "`r`n", "`n"
$rawOutput = & $plink -ssh -batch -hostkey $hostKey "root@$($connection.ServerHost)" -pw $connection.ServerPassword $normalizedRemoteScript
if ($LASTEXITCODE -ne 0) {
  throw "Failed to list test releases"
}

$rows = @()
foreach ($line in ($rawOutput -split "\r?\n")) {
  if ([string]::IsNullOrWhiteSpace($line)) {
    continue
  }

  $parts = $line.Split("|")
  if ($parts.Length -lt 7) {
    continue
  }

  $rows += [pscustomobject]@{
    Runtime     = $parts[0]
    ReleaseName = $parts[1]
    Current     = $parts[2]
    Metadata    = $parts[3]
    Label       = $parts[4]
    Commit      = $parts[5]
    Dirty       = $parts[6]
  }
}

if ($rows.Count -eq 0) {
  Write-Output "No test releases found."
  exit 0
}

$runtimeBaseDirs = @{
  admin = "/opt/dramatv-community-admin"
  server = "/opt/dramatv-community-server"
  web = "/opt/dramatv-community-web"
}

foreach ($row in $rows) {
  if ($row.Metadata -ne "yes") {
    continue
  }

  $baseDir = $runtimeBaseDirs[$row.Runtime]
  if ([string]::IsNullOrWhiteSpace($baseDir)) {
    continue
  }

  $remoteMetadataPath = "$baseDir/releases/$($row.ReleaseName)/release.json"
  $metadataRaw = & $plink -ssh -batch -hostkey $hostKey "root@$($connection.ServerHost)" -pw $connection.ServerPassword "cat $remoteMetadataPath"
  if ($LASTEXITCODE -ne 0) {
    continue
  }

  $normalizedMetadataRaw = (($metadataRaw | Out-String).Trim()) -replace "^\uFEFF", ""
  if ([string]::IsNullOrWhiteSpace($normalizedMetadataRaw)) {
    continue
  }

  try {
    $metadata = $normalizedMetadataRaw | ConvertFrom-Json
    $row.Label = if ($metadata.releaseLabel) { [string]$metadata.releaseLabel } else { "" }
    $row.Commit = if ($metadata.commitShortSha) { [string]$metadata.commitShortSha } else { "" }
    if ($null -eq $metadata.dirtyWorkspace) {
      $row.Dirty = "n/a"
    } else {
      $row.Dirty = ([string]$metadata.dirtyWorkspace).ToLowerInvariant()
    }
  } catch {
    $row.Label = "(parse-failed)"
  }
}

$rows | Sort-Object Runtime, ReleaseName | Format-Table -AutoSize
