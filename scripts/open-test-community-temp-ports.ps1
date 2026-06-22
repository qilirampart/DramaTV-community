param(
  [string]$ResourceFile = "",
  [int]$FrontendPublicPort = 8086,
  [int]$AdminPublicPort = 8206,
  [int]$WebUpstreamPort = 3106,
  [int]$AdminUpstreamPort = 3206,
  [int]$BackendUpstreamPort = 18080
)

$ErrorActionPreference = "Stop"

$workspace = Split-Path -Parent $PSScriptRoot
$plink = Join-Path $workspace ".tools\putty\plink.exe"
$pscp = Join-Path $workspace ".tools\putty\pscp.exe"
$hostKey = "ssh-ed25519 255 SHA256:YMyByZ4GyGnkXbJVzjvy4hEuvlD0sfSH+dfMBYXdlDk"
$helperPath = Join-Path $PSScriptRoot "lib\test-env-release-common.ps1"
$tempDir = Join-Path $env:TEMP "dramatv-community-temp-ports"

if (!(Test-Path -LiteralPath $helperPath)) {
  throw "release helper not found: $helperPath"
}

. $helperPath

$connection = Get-TestEnvConnectionInfo -Workspace $workspace -ResourceFile $ResourceFile

New-Item -ItemType Directory -Force -Path $tempDir | Out-Null

$localConfigPath = Join-Path $tempDir "dramatv-community-temp-ports.conf"
$remoteConfigPath = "/etc/nginx/conf.d/dramatv-community-temp-ports.conf"
$backupSuffix = Get-Date -Format "yyyyMMdd-HHmmss"

$nginxConfig = @"
map `$http_upgrade `$community_temp_connection_upgrade {
    default upgrade;
    '' close;
}

server {
    listen $FrontendPublicPort;
    listen [::]:$FrontendPublicPort;
    server_name _;

    client_max_body_size 120m;
    proxy_connect_timeout 60s;
    proxy_send_timeout 300s;
    proxy_read_timeout 300s;
    send_timeout 300s;

    location ^~ /api/uploads/ {
        proxy_pass http://127.0.0.1:$WebUpstreamPort;
        proxy_http_version 1.1;
        proxy_set_header Upgrade `$http_upgrade;
        proxy_set_header Connection `$community_temp_connection_upgrade;
        proxy_set_header Host `$host;
        proxy_set_header X-Real-IP `$remote_addr;
        proxy_set_header X-Forwarded-For `$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto `$scheme;
        proxy_set_header X-Forwarded-Host `$host;
        proxy_set_header X-Forwarded-Port `$server_port;
        proxy_buffering off;
    }

    location = /api/me/notifications/recent {
        proxy_pass http://127.0.0.1:$WebUpstreamPort;
        proxy_http_version 1.1;
        proxy_set_header Upgrade `$http_upgrade;
        proxy_set_header Connection `$community_temp_connection_upgrade;
        proxy_set_header Host `$host;
        proxy_set_header X-Real-IP `$remote_addr;
        proxy_set_header X-Forwarded-For `$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto `$scheme;
        proxy_set_header X-Forwarded-Host `$host;
        proxy_set_header X-Forwarded-Port `$server_port;
        proxy_buffering off;
    }

    location = /api/featured-prompts {
        proxy_pass http://127.0.0.1:$WebUpstreamPort;
        proxy_http_version 1.1;
        proxy_set_header Upgrade `$http_upgrade;
        proxy_set_header Connection `$community_temp_connection_upgrade;
        proxy_set_header Host `$host;
        proxy_set_header X-Real-IP `$remote_addr;
        proxy_set_header X-Forwarded-For `$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto `$scheme;
        proxy_set_header X-Forwarded-Host `$host;
        proxy_set_header X-Forwarded-Port `$server_port;
        proxy_buffering off;
    }

    location = /api/public/featured-prompts {
        proxy_pass http://127.0.0.1:$WebUpstreamPort;
        proxy_http_version 1.1;
        proxy_set_header Upgrade `$http_upgrade;
        proxy_set_header Connection `$community_temp_connection_upgrade;
        proxy_set_header Host `$host;
        proxy_set_header X-Real-IP `$remote_addr;
        proxy_set_header X-Forwarded-For `$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto `$scheme;
        proxy_set_header X-Forwarded-Host `$host;
        proxy_set_header X-Forwarded-Port `$server_port;
        proxy_buffering off;
    }

    location = /api/featured-inventory {
        proxy_pass http://127.0.0.1:$WebUpstreamPort;
        proxy_http_version 1.1;
        proxy_set_header Upgrade `$http_upgrade;
        proxy_set_header Connection `$community_temp_connection_upgrade;
        proxy_set_header Host `$host;
        proxy_set_header X-Real-IP `$remote_addr;
        proxy_set_header X-Forwarded-For `$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto `$scheme;
        proxy_set_header X-Forwarded-Host `$host;
        proxy_set_header X-Forwarded-Port `$server_port;
        proxy_buffering off;
    }

    location = /api/public/featured-inventory {
        proxy_pass http://127.0.0.1:$WebUpstreamPort;
        proxy_http_version 1.1;
        proxy_set_header Upgrade `$http_upgrade;
        proxy_set_header Connection `$community_temp_connection_upgrade;
        proxy_set_header Host `$host;
        proxy_set_header X-Real-IP `$remote_addr;
        proxy_set_header X-Forwarded-For `$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto `$scheme;
        proxy_set_header X-Forwarded-Host `$host;
        proxy_set_header X-Forwarded-Port `$server_port;
        proxy_buffering off;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:$BackendUpstreamPort;
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
        proxy_pass http://127.0.0.1:$BackendUpstreamPort;
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

    location = /admin {
        return 302 http://`$host:$AdminPublicPort/admin;
    }

    location ^~ /admin/ {
        return 302 http://`$host:$AdminPublicPort`$request_uri;
    }

    location / {
        proxy_pass http://127.0.0.1:$WebUpstreamPort;
        proxy_http_version 1.1;
        proxy_set_header Upgrade `$http_upgrade;
        proxy_set_header Connection `$community_temp_connection_upgrade;
        proxy_set_header Host `$host;
        proxy_set_header X-Real-IP `$remote_addr;
        proxy_set_header X-Forwarded-For `$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto `$scheme;
        proxy_set_header X-Forwarded-Host `$host;
        proxy_set_header X-Forwarded-Port `$server_port;
        proxy_buffering off;
    }
}

server {
    listen $AdminPublicPort;
    listen [::]:$AdminPublicPort;
    server_name _;

    client_max_body_size 120m;
    proxy_connect_timeout 60s;
    proxy_send_timeout 300s;
    proxy_read_timeout 300s;
    send_timeout 300s;

    location = / {
        return 302 /admin/login;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:$BackendUpstreamPort;
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
        proxy_pass http://127.0.0.1:$BackendUpstreamPort;
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

    location = /admin {
        proxy_pass http://127.0.0.1:$AdminUpstreamPort;
        proxy_http_version 1.1;
        proxy_set_header Upgrade `$http_upgrade;
        proxy_set_header Connection `$community_temp_connection_upgrade;
        proxy_set_header Host `$host;
        proxy_set_header X-Real-IP `$remote_addr;
        proxy_set_header X-Forwarded-For `$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto `$scheme;
        proxy_set_header X-Forwarded-Host `$host;
        proxy_set_header X-Forwarded-Port `$server_port;
        proxy_buffering off;
    }

    location ^~ /admin/ {
        proxy_pass http://127.0.0.1:$AdminUpstreamPort;
        proxy_http_version 1.1;
        proxy_set_header Upgrade `$http_upgrade;
        proxy_set_header Connection `$community_temp_connection_upgrade;
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

Set-Content -LiteralPath $localConfigPath -Value $nginxConfig -Encoding ASCII

& $pscp -batch -hostkey $hostKey -pw $connection.ServerPassword $localConfigPath "root@$($connection.ServerHost):$remoteConfigPath"
if ($LASTEXITCODE -ne 0) {
  throw "Failed to upload temp nginx config."
}

$remoteCommand = @"
set -e
if [ -f "$remoteConfigPath" ]; then
  cp "$remoteConfigPath" "$remoteConfigPath.bak-$backupSuffix" || true
fi
nginx -t
if command -v firewall-cmd >/dev/null 2>&1; then
  firewall-cmd --permanent --zone=public --add-port=$FrontendPublicPort/tcp >/dev/null
  firewall-cmd --permanent --zone=public --add-port=$AdminPublicPort/tcp >/dev/null
  firewall-cmd --reload >/dev/null
fi
systemctl reload nginx
curl -I --max-time 10 http://127.0.0.1:$FrontendPublicPort/login
curl -I --max-time 10 http://127.0.0.1:$AdminPublicPort/admin/login
"@

Invoke-TestEnvRemote -PlinkPath $plink -HostKey $hostKey -ConnectionInfo $connection -Command $remoteCommand

Write-Output "Temporary community ports opened."
Write-Output "Frontend: http://$($connection.ServerHost):$FrontendPublicPort/login"
Write-Output "Admin: http://$($connection.ServerHost):$AdminPublicPort/admin/login"
Write-Output "Remote config: $remoteConfigPath"
