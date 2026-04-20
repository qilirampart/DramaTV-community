$ErrorActionPreference = "Stop"

$listeners = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue

if (-not $listeners) {
  Write-Output "No drawio-mcp-server process is running."
  exit 0
}

$pids = $listeners | Select-Object -ExpandProperty OwningProcess -Unique
Stop-Process -Id $pids -Force

Write-Output ("Stopped drawio-mcp-server. PID: " + ($pids -join ","))
