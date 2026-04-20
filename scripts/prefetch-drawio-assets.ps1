param(
  [string]$ProxyUrl
)

$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot

if ($ProxyUrl) {
  $env:HTTP_PROXY = $ProxyUrl
  $env:HTTPS_PROXY = $ProxyUrl
}

& "C:\Program Files\nodejs\node.exe" (Join-Path $PSScriptRoot "prefetch-drawio-assets.mjs")
