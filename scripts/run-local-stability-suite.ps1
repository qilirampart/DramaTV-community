[CmdletBinding()]
param(
  [string]$FrontendBaseUrl = "http://127.0.0.1:3106",
  [string]$BackendBaseUrl = "http://127.0.0.1:18080",
  [string]$ArtifactsDir = "artifacts/stability-suite",
  [switch]$SkipFrontendChecks,
  [switch]$SkipFrontendBuild,
  [switch]$SkipBackendIntegration,
  [switch]$SkipApiSmoke,
  [switch]$SkipAuthSessionSmoke,
  [switch]$SkipBrowserSmoke,
  [switch]$HeadedBrowser,
  [int]$BrowserSlowMoMs = 250,
  [switch]$ResetBrowserSmokeState,
  [switch]$ResetInteractionBaseline
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$workspace = Split-Path -Parent $PSScriptRoot
$powershellExe = Join-Path $env:SystemRoot "System32\WindowsPowerShell\v1.0\powershell.exe"
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$artifactsRoot = Join-Path $workspace $ArtifactsDir
$runDir = Join-Path $artifactsRoot $timestamp
$latestDir = Join-Path $artifactsRoot "latest"
$stepResults = New-Object System.Collections.Generic.List[object]

New-Item -ItemType Directory -Force -Path $runDir | Out-Null

function Resolve-NormalizedPath {
  param([string]$Path)

  return [System.IO.Path]::GetFullPath($Path)
}

function Clear-LatestArtifacts {
  param(
    [string]$WorkspacePath,
    [string]$LatestArtifactsPath
  )

  if (!(Test-Path -LiteralPath $LatestArtifactsPath)) {
    return
  }

  $workspacePath = Resolve-NormalizedPath $WorkspacePath
  $latestArtifactsPath = Resolve-NormalizedPath $LatestArtifactsPath
  if (!$latestArtifactsPath.StartsWith($workspacePath, [System.StringComparison]::OrdinalIgnoreCase)) {
    throw "Refusing to clear artifacts outside workspace: $latestArtifactsPath"
  }

  Get-ChildItem -LiteralPath $LatestArtifactsPath -Force | Remove-Item -Recurse -Force
}

function Add-StepResult {
  param(
    [string]$Name,
    [bool]$Passed,
    [string]$Detail,
    [double]$DurationSeconds,
    [string]$LogPath = "",
    [string]$ArtifactPath = "",
    [string]$CommandLine = ""
  )

  $stepResults.Add([pscustomobject]@{
      name = $Name
      passed = $Passed
      detail = $Detail
      durationSeconds = [math]::Round($DurationSeconds, 2)
      logPath = $LogPath
      artifactPath = $ArtifactPath
      commandLine = $CommandLine
    })
}

function Invoke-HttpProbe {
  param(
    [string]$Name,
    [string]$Url,
    [string]$ExpectedText = ""
  )

  $start = Get-Date
  $logPath = Join-Path $runDir ($Name.Replace(".", "-") + ".log")
  $passed = $false
  $detail = ""

  try {
    $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 20
    $responseText = if ($response.Content.Length -gt 200) { $response.Content.Substring(0, 200) } else { $response.Content }
    Set-Content -LiteralPath $logPath -Encoding UTF8 -Value $responseText

    if (![string]::IsNullOrWhiteSpace($ExpectedText) -and !$response.Content.Contains($ExpectedText)) {
      throw "response missing expected text: $ExpectedText"
    }

    $passed = $true
    $detail = "status=$($response.StatusCode)"
  } catch {
    $detail = $_.Exception.Message
    Set-Content -LiteralPath $logPath -Encoding UTF8 -Value $detail
  }

  $durationSeconds = ((Get-Date) - $start).TotalSeconds
  Add-StepResult -Name $Name -Passed $passed -Detail $detail -DurationSeconds $durationSeconds -LogPath $logPath -CommandLine "GET $Url"
  return $passed
}

function Invoke-LoggedStep {
  param(
    [string]$Name,
    [string]$Executable,
    [string[]]$Arguments,
    [string]$ArtifactPath = "",
    [switch]$NoCapture
  )

  $start = Get-Date
  $logPath = Join-Path $runDir ($Name.Replace(".", "-") + ".log")
  $passed = $false
  $detail = ""
  $commandLine = ($Executable + " " + (($Arguments | ForEach-Object {
            if ($_ -match "\s") { '"' + $_ + '"' } else { $_ }
          }) -join " ")).Trim()
  $previousErrorActionPreference = $ErrorActionPreference

  try {
    $ErrorActionPreference = "Continue"
    if ($NoCapture) {
      & $Executable @Arguments
      Set-Content -LiteralPath $logPath -Encoding UTF8 -Value "output capture disabled for this command"
    } else {
      & $Executable @Arguments *> $logPath
    }

    $exitCode = if ($null -eq $LASTEXITCODE) { 0 } else { [int]$LASTEXITCODE }
    if ($exitCode -ne 0) {
      $logText = if (Test-Path -LiteralPath $logPath) {
        Get-Content -LiteralPath $logPath -Raw -Encoding UTF8
      } else {
        ""
      }
      $errorTail = if (![string]::IsNullOrWhiteSpace($logText)) {
        ($logText.Trim().Split("`n") | Select-Object -Last 1).Trim()
      } else {
        ""
      }

      if ([string]::IsNullOrWhiteSpace($errorTail)) {
        throw "exit code $exitCode"
      }
      throw ("exit code {0}: {1}" -f $exitCode, $errorTail)
    }

    $passed = $true
    $detail = "ok"
  } catch {
    $detail = $_.Exception.Message
    if (!(Test-Path -LiteralPath $logPath)) {
      Set-Content -LiteralPath $logPath -Encoding UTF8 -Value $detail
    } else {
      Add-Content -LiteralPath $logPath -Encoding UTF8 -Value "`r`nERROR: $detail"
    }
  } finally {
    $ErrorActionPreference = $previousErrorActionPreference
  }

  $durationSeconds = ((Get-Date) - $start).TotalSeconds
  Add-StepResult -Name $Name -Passed $passed -Detail $detail -DurationSeconds $durationSeconds -LogPath $logPath -ArtifactPath $ArtifactPath -CommandLine $commandLine
  return $passed
}

Invoke-HttpProbe -Name "probe.backend-health" -Url "$BackendBaseUrl/actuator/health" | Out-Null
Invoke-HttpProbe -Name "probe.frontend-root" -Url "$FrontendBaseUrl/" -ExpectedText "Drama TV" | Out-Null

if ($ResetInteractionBaseline) {
  Invoke-LoggedStep `
    -Name "reset.interaction-baseline" `
    -Executable $powershellExe `
    -Arguments @(
      "-NoProfile",
      "-ExecutionPolicy",
      "Bypass",
      "-File",
      (Join-Path $workspace "scripts\reset-local-interaction-baseline.ps1")
    ) | Out-Null
}

if ($ResetBrowserSmokeState) {
  Invoke-LoggedStep `
    -Name "reset.browser-smoke-state" `
    -Executable $powershellExe `
    -Arguments @(
      "-NoProfile",
      "-ExecutionPolicy",
      "Bypass",
      "-File",
      (Join-Path $workspace "scripts\reset-local-browser-smoke-state.ps1")
    ) | Out-Null
}

if (!$SkipFrontendChecks) {
  Invoke-LoggedStep `
    -Name "frontend.typecheck" `
    -Executable "npm.cmd" `
    -Arguments @("--prefix", "apps/web", "run", "typecheck") | Out-Null

  if (!$SkipFrontendBuild) {
    Invoke-LoggedStep `
      -Name "frontend.build" `
      -Executable "npm.cmd" `
      -Arguments @("run", "build:web") `
      -NoCapture | Out-Null
  }
}

if (!$SkipBackendIntegration) {
  Invoke-LoggedStep `
    -Name "backend.integration-tests" `
    -Executable $powershellExe `
    -Arguments @(
      "-NoProfile",
      "-ExecutionPolicy",
      "Bypass",
      "-File",
      (Join-Path $workspace "scripts\run-backend-integration-suite.ps1"),
      "-Suite",
      "core"
    ) | Out-Null
}

$apiSummaryPath = Join-Path $runDir "api-smoke-summary.json"
if (!$SkipApiSmoke) {
  Invoke-LoggedStep `
    -Name "smoke.api" `
    -Executable "node" `
    -Arguments @(
      "scripts/run-local-community-api-smoke.mjs",
      "--backend-base-url",
      $BackendBaseUrl,
      "--output",
      $apiSummaryPath
    ) `
    -ArtifactPath $apiSummaryPath | Out-Null
}

$authSessionSummaryPath = Join-Path $runDir "auth-session-smoke-summary.json"
if (!$SkipAuthSessionSmoke) {
  Invoke-LoggedStep `
    -Name "smoke.auth-session" `
    -Executable "node" `
    -Arguments @(
      "scripts/run-local-auth-session-regression.mjs",
      "--frontend-base-url",
      $FrontendBaseUrl,
      "--backend-base-url",
      $BackendBaseUrl,
      "--output",
      $authSessionSummaryPath
    ) `
    -ArtifactPath $authSessionSummaryPath | Out-Null
}

$browserSummaryPath = Join-Path $runDir "browser-smoke-summary.json"
if (!$SkipBrowserSmoke) {
  $browserArguments = @(
    "scripts/run-local-community-browser-smoke.py",
    "--frontend-base-url",
    $FrontendBaseUrl,
    "--backend-base-url",
    $BackendBaseUrl,
    "--artifacts-dir",
    (Join-Path $runDir "browser-smoke"),
    "--output",
    $browserSummaryPath
  )

  if ($HeadedBrowser) {
    $browserArguments += @("--headed", "--slow-mo-ms", $BrowserSlowMoMs.ToString())
  }

  Invoke-LoggedStep `
    -Name "smoke.browser" `
    -Executable "python" `
    -Arguments $browserArguments `
    -ArtifactPath $browserSummaryPath | Out-Null
}

$summaryPath = Join-Path $runDir "summary.json"
$summary = [pscustomobject]@{
  generatedAt = (Get-Date).ToString("s")
  frontendBaseUrl = $FrontendBaseUrl
  backendBaseUrl = $BackendBaseUrl
  runDir = $runDir
  latestDir = $latestDir
  backendIntegrationSelection = $backendTestSelection
  options = [pscustomobject]@{
    skipFrontendChecks = [bool]$SkipFrontendChecks
    skipFrontendBuild = [bool]$SkipFrontendBuild
    skipBackendIntegration = [bool]$SkipBackendIntegration
    skipApiSmoke = [bool]$SkipApiSmoke
    skipAuthSessionSmoke = [bool]$SkipAuthSessionSmoke
    skipBrowserSmoke = [bool]$SkipBrowserSmoke
    headedBrowser = [bool]$HeadedBrowser
    browserSlowMoMs = $BrowserSlowMoMs
    resetBrowserSmokeState = [bool]$ResetBrowserSmokeState
    resetInteractionBaseline = [bool]$ResetInteractionBaseline
  }
  passed = @($stepResults | Where-Object { $_.passed }).Count
  failed = @($stepResults | Where-Object { -not $_.passed }).Count
  results = $stepResults
}

$summary | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $summaryPath -Encoding UTF8

New-Item -ItemType Directory -Force -Path $latestDir | Out-Null
Clear-LatestArtifacts -WorkspacePath $workspace -LatestArtifactsPath $latestDir
Copy-Item -Path (Join-Path $runDir "*") -Destination $latestDir -Recurse -Force

Get-Content -LiteralPath $summaryPath -Encoding UTF8

if (@($stepResults | Where-Object { -not $_.passed }).Count -gt 0) {
  exit 1
}

exit 0
