$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$outLog = Join-Path $projectRoot "drawio-mcp.out.log"
$errLog = Join-Path $projectRoot "drawio-mcp.err.log"
$assetPath = Join-Path $projectRoot ".drawio-assets"
$httpPort = 3000
$nodePath = "C:\Program Files\nodejs\node.exe"
$entryPath = "C:\Users\psk13\AppData\Local\npm-cache\_npx\a34dfef1e92abe10\node_modules\drawio-mcp-server\build\index.js"

$listening = Get-NetTCPConnection -LocalPort $httpPort -State Listen -ErrorAction SilentlyContinue

if ($listening) {
  $pids = ($listening | Select-Object -ExpandProperty OwningProcess | Sort-Object -Unique) -join ","
  Write-Output "Port $httpPort is already listening. PID: $pids"
  Write-Output "Editor: http://127.0.0.1:$httpPort/"
  Write-Output "MCP: http://127.0.0.1:$httpPort/mcp"
  Write-Output "Assets: $assetPath"
  exit 0
}

$process = Start-Process `
  -FilePath $nodePath `
  -ArgumentList @($entryPath, "--transport", "http", "--editor", "--http-port", "$httpPort", "--asset-path", "$assetPath") `
  -WorkingDirectory $projectRoot `
  -RedirectStandardOutput $outLog `
  -RedirectStandardError $errLog `
  -WindowStyle Hidden `
  -PassThru

Start-Sleep -Seconds 3

Write-Output "Started drawio-mcp-server. PID: $($process.Id)"
Write-Output "Editor: http://127.0.0.1:$httpPort/"
Write-Output "MCP: http://127.0.0.1:$httpPort/mcp"
Write-Output "Assets: $assetPath"
