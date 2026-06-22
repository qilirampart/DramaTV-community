param(
  [string]$ResourceFile = "",
  [string]$BackupLabel = ""
)

$ErrorActionPreference = "Stop"

$workspace = Split-Path -Parent $PSScriptRoot
$plink = Join-Path $workspace ".tools\putty\plink.exe"
$pscp = Join-Path $workspace ".tools\putty\pscp.exe"
$helperPath = Join-Path $PSScriptRoot "lib\test-env-release-common.ps1"
$hostKey = "ssh-ed25519 255 SHA256:YMyByZ4GyGnkXbJVzjvy4hEuvlD0sfSH+dfMBYXdlDk"

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

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$safeLabel = if ([string]::IsNullOrWhiteSpace($BackupLabel)) {
  "large-sync-$timestamp"
} else {
  ($BackupLabel.Trim() -replace "[^A-Za-z0-9_.-]", "-")
}

$connection = Get-TestEnvConnectionInfo -Workspace $workspace -ResourceFile $ResourceFile
$localBackupDir = Join-Path $workspace ".codex\backups\test-env-$safeLabel"
$localArchivePath = Join-Path $localBackupDir "remote-backup.tar.gz"
$localManifestPath = Join-Path $localBackupDir "backup-summary.txt"
$remoteBackupDir = "/opt/dramatv-community-backups/$safeLabel"
$remoteArchivePath = "/tmp/dramatv-community-backup-$safeLabel.tar.gz"

New-Item -ItemType Directory -Force -Path $localBackupDir | Out-Null

$remoteScript = @'
#!/usr/bin/env bash
set -euo pipefail

backup_dir="__REMOTE_BACKUP_DIR__"
archive_path="__REMOTE_ARCHIVE_PATH__"
mkdir -p "$backup_dir"/{config,releases,db}

{
  echo "backup_label=__SAFE_LABEL__"
  echo "generated_at=$(date -Is)"
  echo "host=$(hostname)"
} > "$backup_dir/manifest.txt"

capture_release() {
  runtime="$1"
  base_dir="$2"
  current_path="$3"
  resolved="$(readlink -f "$current_path" 2>/dev/null || true)"
  release_name="$(basename "$resolved" 2>/dev/null || true)"
  {
    echo "runtime=$runtime"
    echo "base_dir=$base_dir"
    echo "current=$resolved"
    echo "release=$release_name"
  } > "$backup_dir/releases/$runtime-current.txt"
  if [ -n "$release_name" ] && [ -f "$base_dir/releases/$release_name/release.json" ]; then
    cp -a "$base_dir/releases/$release_name/release.json" "$backup_dir/releases/$runtime-release.json"
  fi
}

capture_release "web" "/opt/dramatv-community-web" "/opt/dramatv-community-web/current"
capture_release "admin" "/opt/dramatv-community-admin" "/opt/dramatv-community-admin/current"
server_jar="$(readlink -f /opt/dramatv-community-server/current/dramatv-community-server.jar 2>/dev/null || true)"
server_release="$(basename "$(dirname "$server_jar")" 2>/dev/null || true)"
{
  echo "runtime=server"
  echo "base_dir=/opt/dramatv-community-server"
  echo "current_jar=$server_jar"
  echo "release=$server_release"
} > "$backup_dir/releases/server-current.txt"
if [ -n "$server_release" ] && [ -f "/opt/dramatv-community-server/releases/$server_release/release.json" ]; then
  cp -a "/opt/dramatv-community-server/releases/$server_release/release.json" "$backup_dir/releases/server-release.json"
fi

copy_if_exists() {
  src="$1"
  dest="$2"
  if [ -e "$src" ]; then
    cp -a "$src" "$dest"
  fi
}

copy_if_exists "/etc/nginx/conf.d/dramatv-community-http.conf" "$backup_dir/config/dramatv-community-http.conf"
copy_if_exists "/etc/systemd/system/dramatv-community-web.service" "$backup_dir/config/dramatv-community-web.service"
copy_if_exists "/etc/systemd/system/dramatv-community-admin.service" "$backup_dir/config/dramatv-community-admin.service"
copy_if_exists "/etc/systemd/system/dramatv-community-server.service" "$backup_dir/config/dramatv-community-server.service"
copy_if_exists "/opt/dramatv-community-web/shared/dramatv-community-web.env" "$backup_dir/config/dramatv-community-web.env"
copy_if_exists "/opt/dramatv-community-admin/shared/dramatv-community-admin.env" "$backup_dir/config/dramatv-community-admin.env"
copy_if_exists "/opt/dramatv-community-server/shared/dramatv-community.env" "$backup_dir/config/dramatv-community.env"

if [ -f "/opt/dramatv-community-server/shared/dramatv-community.env" ]; then
  set -a
  # shellcheck disable=SC1091
  source "/opt/dramatv-community-server/shared/dramatv-community.env"
  set +a
  db_url="${DRAMATV_DB_URL#jdbc:postgresql://}"
  db_host_port="${db_url%%/*}"
  db_name="${db_url#*/}"
  db_host="${db_host_port%%:*}"
  db_port="${db_host_port#*:}"
  if [ "$db_port" = "$db_host_port" ]; then
    db_port="5432"
  fi
  export PGPASSWORD="${DRAMATV_DB_PASSWORD:-}"

  if command -v pg_dump >/dev/null 2>&1; then
    if pg_dump -h "$db_host" -p "$db_port" -U "$DRAMATV_DB_USERNAME" -d "$db_name" \
      --data-only --column-inserts \
      -t public.admin_feed_slot_configs \
      -t public.admin_taxonomy_configs \
      > "$backup_dir/db/admin-config-critical-tables.sql" 2>"$backup_dir/db/pg-dump-critical.err"; then
      echo "critical_table_pg_dump=ok" >> "$backup_dir/manifest.txt"
    else
      echo "critical_table_pg_dump=failed" >> "$backup_dir/manifest.txt"
    fi

    if pg_dump -h "$db_host" -p "$db_port" -U "$DRAMATV_DB_USERNAME" -d "$db_name" \
      -Fc \
      -f "$backup_dir/db/full-db.dump" 2>"$backup_dir/db/pg-dump-full.err"; then
      echo "full_db_pg_dump=ok" >> "$backup_dir/manifest.txt"
    else
      rm -f "$backup_dir/db/full-db.dump"
      echo "full_db_pg_dump=failed" >> "$backup_dir/manifest.txt"
    fi
  else
    echo "pg_dump=missing" >> "$backup_dir/manifest.txt"
  fi

  if command -v psql >/dev/null 2>&1; then
    psql -h "$db_host" -p "$db_port" -U "$DRAMATV_DB_USERNAME" -d "$db_name" \
      -v ON_ERROR_STOP=1 \
      -c 'COPY public.admin_feed_slot_configs TO STDOUT WITH CSV HEADER' \
      > "$backup_dir/db/admin_feed_slot_configs.csv" 2>"$backup_dir/db/psql-feed-slot.err" \
      && echo "admin_feed_slot_configs_csv=ok" >> "$backup_dir/manifest.txt" \
      || echo "admin_feed_slot_configs_csv=failed" >> "$backup_dir/manifest.txt"

    psql -h "$db_host" -p "$db_port" -U "$DRAMATV_DB_USERNAME" -d "$db_name" \
      -v ON_ERROR_STOP=1 \
      -c 'COPY public.admin_taxonomy_configs TO STDOUT WITH CSV HEADER' \
      > "$backup_dir/db/admin_taxonomy_configs.csv" 2>"$backup_dir/db/psql-taxonomy.err" \
      && echo "admin_taxonomy_configs_csv=ok" >> "$backup_dir/manifest.txt" \
      || echo "admin_taxonomy_configs_csv=failed" >> "$backup_dir/manifest.txt"
  else
    echo "psql=missing" >> "$backup_dir/manifest.txt"
  fi
else
  echo "db_backup=skipped_env_missing" >> "$backup_dir/manifest.txt"
fi

tar -czf "$archive_path" -C "$(dirname "$backup_dir")" "$(basename "$backup_dir")"
echo "remote_backup_dir=$backup_dir"
echo "remote_archive=$archive_path"
cat "$backup_dir/manifest.txt"
'@

$remoteScript = $remoteScript.Replace("__REMOTE_BACKUP_DIR__", $remoteBackupDir)
$remoteScript = $remoteScript.Replace("__REMOTE_ARCHIVE_PATH__", $remoteArchivePath)
$remoteScript = $remoteScript.Replace("__SAFE_LABEL__", $safeLabel)
$normalizedRemoteScript = $remoteScript -replace "`r`n", "`n"

$remoteOutput = & $plink -ssh -batch -hostkey $hostKey "root@$($connection.ServerHost)" -pw $connection.ServerPassword $normalizedRemoteScript
if ($LASTEXITCODE -ne 0) {
  throw "Remote backup failed"
}

& $pscp -batch -hostkey $hostKey -pw $connection.ServerPassword "root@$($connection.ServerHost):$remoteArchivePath" $localArchivePath
if ($LASTEXITCODE -ne 0) {
  throw "Failed to download remote backup archive"
}

$remoteOutputText = (($remoteOutput | Out-String).Trim())
Set-Content -LiteralPath $localManifestPath -Value $remoteOutputText -Encoding UTF8

Write-Output "Backup completed."
Write-Output "Server: $($connection.ServerHost)"
Write-Output "Local backup dir: $localBackupDir"
Write-Output "Local archive: $localArchivePath"
Write-Output "Manifest: $localManifestPath"
Write-Output "Remote summary:"
Write-Output $remoteOutputText
