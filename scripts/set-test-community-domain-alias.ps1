param(
  [Parameter(Mandatory = $true)]
  [string]$Domain,
  [string]$ResourceFile = "",
  [string]$RemoteConfigPath = "/etc/nginx/conf.d/dramatv-community-http.conf",
  [switch]$Remove,
  [switch]$SkipPublicProbe
)

$ErrorActionPreference = "Stop"

$workspace = Split-Path -Parent $PSScriptRoot
$plink = Join-Path $workspace ".tools\putty\plink.exe"
$pscp = Join-Path $workspace ".tools\putty\pscp.exe"
$hostKey = "ssh-ed25519 255 SHA256:YMyByZ4GyGnkXbJVzjvy4hEuvlD0sfSH+dfMBYXdlDk"
$helperPath = Join-Path $PSScriptRoot "lib\test-env-release-common.ps1"
$tempDir = Join-Path $env:TEMP "dramatv-community-domain-alias"

if (!(Test-Path -LiteralPath $helperPath)) {
  throw "release helper not found: $helperPath"
}

. $helperPath

if (!(Test-Path -LiteralPath $plink)) {
  throw "plink not found: $plink"
}
if (!(Test-Path -LiteralPath $pscp)) {
  throw "pscp not found: $pscp"
}

$normalizedPublicBaseUrl = Assert-RootPublicBaseUrl -Url "http://$Domain" -Label "Domain"
$validatedDomain = ([System.Uri]$normalizedPublicBaseUrl).Host.ToLowerInvariant()
$validatedAdminPublicBaseUrls = Assert-AdminPublicBaseUrls `
  -CommunityPublicBaseUrl $normalizedPublicBaseUrl `
  -AdminPublicBaseUrl "$normalizedPublicBaseUrl/admin" `
  -AdminBasePath "/admin"

$connection = Get-TestEnvConnectionInfo -Workspace $workspace -ResourceFile $ResourceFile
$backupSuffix = Get-Date -Format "yyyyMMdd-HHmmss"
$modeLabel = if ($Remove) { "remove" } else { "add" }
New-Item -ItemType Directory -Force -Path $tempDir | Out-Null

$pythonScript = @'
from pathlib import Path
import sys

config_path = Path(sys.argv[1])
domain = sys.argv[2].strip().lower()
remove_mode = sys.argv[3].strip() == "1"

text = config_path.read_text(encoding="utf-8")
lines = text.splitlines()
updated = False

for index, line in enumerate(lines):
    stripped = line.strip()
    if not stripped.startswith("server_name "):
        continue
    if not stripped.endswith(";"):
        continue

    prefix = line[: len(line) - len(line.lstrip())]
    raw_names = stripped[len("server_name ") : -1].strip()
    names = [token for token in raw_names.split() if token]

    if remove_mode:
        new_names = [token for token in names if token.lower() != domain]
    else:
        new_names = list(names)
        if all(token.lower() != domain for token in new_names):
            new_names.append(domain)

    if new_names != names:
        if not new_names:
            raise RuntimeError("Refusing to remove the last server_name entry from community config.")
        lines[index] = f"{prefix}server_name {' '.join(new_names)};"
        updated = True
    break
else:
    raise RuntimeError("No server_name directive found in the target Nginx config.")

config_path.write_text("\n".join(lines) + "\n", encoding="utf-8")
print("updated" if updated else "unchanged")
'@

$removeFlag = if ($Remove) { "1" } else { "0" }
$localPythonPath = Join-Path $tempDir "set-community-domain-alias.py"
$remotePythonPath = "/tmp/set-community-domain-alias-$backupSuffix.py"
Set-Content -LiteralPath $localPythonPath -Value $pythonScript -Encoding UTF8

& $pscp -batch -hostkey $hostKey -pw $connection.ServerPassword $localPythonPath "root@$($connection.ServerHost):$remotePythonPath"
if ($LASTEXITCODE -ne 0) {
  throw "Failed to upload remote domain alias helper."
}

$remoteCommandLines = @(
  "set -e",
  "cp `"$RemoteConfigPath`" `"$RemoteConfigPath.bak-$backupSuffix`"",
  "python3 `"$remotePythonPath`" `"$RemoteConfigPath`" `"$validatedDomain`" `"$removeFlag`"",
  "nginx -t",
  "systemctl reload nginx",
  "curl -I --max-time 10 -H `"Host: $validatedDomain`" http://127.0.0.1/login",
  "curl -I --max-time 10 -H `"Host: $validatedDomain`" http://127.0.0.1/admin/login",
  "rm -f `"$remotePythonPath`""
)
$remoteCommand = $remoteCommandLines -join "`n"

Invoke-TestEnvRemote -PlinkPath $plink -HostKey $hostKey -ConnectionInfo $connection -Command $remoteCommand

$publicProbeResults = @()
if (-not $SkipPublicProbe) {
  $previousNativePreference = $PSNativeCommandUseErrorActionPreference
  $PSNativeCommandUseErrorActionPreference = $false
  foreach ($probePath in @("/login", "/admin/login")) {
    $probeUrl = "http://$validatedDomain$probePath"
    $resolveEntry = "{0}:80:{1}" -f $validatedDomain, $connection.ServerHost
    $curlArgs = @(
      "-I",
      "--max-time", "15",
      "--resolve", $resolveEntry,
      $probeUrl
    )

    $output = & curl.exe @curlArgs 2>&1
    $exitCode = $LASTEXITCODE
    $publicProbeResults += [pscustomobject]@{
      path = $probePath
      url = $probeUrl
      resolveEntry = $resolveEntry
      exitCode = $exitCode
      output = (($output | Out-String).Trim())
    }
  }
  $PSNativeCommandUseErrorActionPreference = $previousNativePreference
}

Write-Output "Community domain alias $modeLabel finished."
Write-Output "Domain: $validatedDomain"
Write-Output "Server: $($connection.ServerHost)"
Write-Output "Community URL: $($validatedAdminPublicBaseUrls.CommunityPublicBaseUrl)"
Write-Output "Admin URL: $($validatedAdminPublicBaseUrls.AdminPublicBaseUrl)"
Write-Output "Remote config: $RemoteConfigPath"
Write-Output "Rollback backup suffix: $backupSuffix"

if ($publicProbeResults.Count -gt 0) {
  Write-Output "Public edge probe summary:"
  foreach ($probe in $publicProbeResults) {
    Write-Output ("- {0} -> exit={1}" -f $probe.url, $probe.exitCode)
    Write-Output $probe.output
  }
}
