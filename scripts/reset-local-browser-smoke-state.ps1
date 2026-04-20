[CmdletBinding()]
param(
  [string]$ContainerName = "",
  [string]$Database = "",
  [string]$Username = "",
  [string]$Password = ""
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Read-EnvFileValue {
  param(
    [string]$Path,
    [string]$Key
  )

  if (!(Test-Path -LiteralPath $Path)) {
    return $null
  }

  foreach ($line in Get-Content -LiteralPath $Path) {
    if ($line -match "^\s*$Key=(.*)$") {
      return $Matches[1].Trim()
    }
  }

  return $null
}

$workspace = Split-Path -Parent $PSScriptRoot
$sqlPath = Join-Path $PSScriptRoot "reset-local-browser-smoke-state.sql"
$envFile = Join-Path $workspace "infra\local\.env"
$envExampleFile = Join-Path $workspace "infra\local\.env.example"

if (!(Test-Path -LiteralPath $sqlPath)) {
  throw "Reset SQL script not found: $sqlPath"
}

if ([string]::IsNullOrWhiteSpace($ContainerName)) {
  $ContainerName = "dramatv-postgres"
}

if ([string]::IsNullOrWhiteSpace($Database)) {
  $Database = $env:DRAMATV_PG_DB
}
if ([string]::IsNullOrWhiteSpace($Database)) {
  $Database = Read-EnvFileValue -Path $envFile -Key "DRAMATV_PG_DB"
}
if ([string]::IsNullOrWhiteSpace($Database)) {
  $Database = Read-EnvFileValue -Path $envExampleFile -Key "DRAMATV_PG_DB"
}
if ([string]::IsNullOrWhiteSpace($Database)) {
  $Database = "dramatv"
}

if ([string]::IsNullOrWhiteSpace($Username)) {
  $Username = $env:DRAMATV_PG_USER
}
if ([string]::IsNullOrWhiteSpace($Username)) {
  $Username = Read-EnvFileValue -Path $envFile -Key "DRAMATV_PG_USER"
}
if ([string]::IsNullOrWhiteSpace($Username)) {
  $Username = Read-EnvFileValue -Path $envExampleFile -Key "DRAMATV_PG_USER"
}
if ([string]::IsNullOrWhiteSpace($Username)) {
  $Username = "dramatv"
}

if ([string]::IsNullOrWhiteSpace($Password)) {
  $Password = $env:DRAMATV_PG_PASSWORD
}
if ([string]::IsNullOrWhiteSpace($Password)) {
  $Password = Read-EnvFileValue -Path $envFile -Key "DRAMATV_PG_PASSWORD"
}
if ([string]::IsNullOrWhiteSpace($Password)) {
  $Password = Read-EnvFileValue -Path $envExampleFile -Key "DRAMATV_PG_PASSWORD"
}
if ([string]::IsNullOrWhiteSpace($Password)) {
  $Password = "dramatv"
}

$sql = Get-Content -LiteralPath $sqlPath -Raw -Encoding UTF8
if ([string]::IsNullOrWhiteSpace($sql)) {
  throw "Reset SQL script is empty: $sqlPath"
}

$sql | docker exec -e "PGPASSWORD=$Password" -i $ContainerName psql -v ON_ERROR_STOP=1 -U $Username -d $Database

if ($LASTEXITCODE -ne 0) {
  throw "Failed to reset local browser smoke state."
}

Write-Output "Local browser smoke state has been reset."
