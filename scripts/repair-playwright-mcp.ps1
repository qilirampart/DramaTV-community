param(
  [switch]$CheckOnly
)

$ErrorActionPreference = "Stop"

$configPath = Join-Path $env:USERPROFILE ".codex\config.toml"
$playwrightRoot = Join-Path $env:LOCALAPPDATA "ms-playwright"
$profilePattern = "mcp-chrome*"
$matchPattern = "@playwright/mcp|playwright-mcp(\s|$)|@playwright\\mcp\\cli\.js|\\ms-playwright\\mcp-chrome"

function Write-Section($title) {
  Write-Output ""
  Write-Output "=== $title ==="
}

function Get-PlaywrightMcpProcesses {
  try {
    return Get-CimInstance Win32_Process |
      Where-Object { $_.CommandLine -match $matchPattern } |
      Sort-Object CreationDate
  } catch {
    Write-Warning "Cannot read Win32_Process. Run this script as administrator for precise Playwright MCP cleanup."
    return @()
  }
}

function Get-PlaywrightLockFiles {
  if (-not (Test-Path $playwrightRoot)) {
    return @()
  }

  return Get-ChildItem $playwrightRoot -Directory -Filter $profilePattern -Force -ErrorAction SilentlyContinue |
    ForEach-Object {
      Get-ChildItem $_.FullName -Force -ErrorAction SilentlyContinue |
        Where-Object { $_.Name -in @("SingletonLock", "SingletonCookie", "DevToolsActivePort") } |
        Select-Object @{
          Name = "Profile"
          Expression = { $_.Directory.Name }
        }, Name, FullName, LastWriteTime
    }
}

Write-Section "Playwright MCP Config"
if (Test-Path $configPath) {
  $configText = Get-Content $configPath -Raw
  $isolatedEnabled =
    ($configText -match "@playwright/mcp@latest', '--isolated'") -or
    ($configText -match '@playwright/mcp@latest", "--isolated"')

  Write-Output "Config: $configPath"
  if ($isolatedEnabled) {
    Write-Output "Isolated mode: enabled"
  } else {
    Write-Output "Isolated mode: missing"
    Write-Warning "Recommend enabling --isolated for Playwright MCP to avoid reusing a broken browser profile directory."
  }
} else {
  Write-Warning "Codex config file not found: $configPath"
}

$processes = @(Get-PlaywrightMcpProcesses)

Write-Section "Process Chains"
if ($processes.Count -eq 0) {
  Write-Output "No Playwright MCP process chain found."
} else {
  $processes |
    Select-Object ProcessId, ParentProcessId, Name, CreationDate, CommandLine |
    Format-List
}

Write-Section "Profile Locks"
$lockFiles = @(Get-PlaywrightLockFiles)
if ($lockFiles.Count -eq 0) {
  Write-Output "No mcp-chrome lock files found."
} else {
  $lockFiles | Format-Table -AutoSize
}

if (-not $CheckOnly -and $processes.Count -gt 0) {
  Write-Section "Repair"
  $pids = @(
    $processes |
      Where-Object { $_.Name -in @("cmd.exe", "node.exe") } |
      Select-Object -ExpandProperty ProcessId -Unique
  )

  if ($pids.Count -gt 0) {
    Stop-Process -Id $pids -Force
    Write-Output ("Stopped Playwright MCP PIDs: " + ($pids -join ", "))
  } else {
    Write-Output "No cmd/node Playwright MCP process needed to be stopped."
  }
}

Write-Section "Next Step"
Write-Output "If browser MCP still reports 'Transport closed' in the current Codex chat, reopen or resume Codex once."
Write-Output "Reason: the current chat's MCP stdio transport is already broken and cannot be reattached from inside the same session."
