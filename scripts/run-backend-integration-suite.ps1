[CmdletBinding()]
param(
  [ValidateSet("core", "read", "admin", "logging", "full")]
  [string]$Suite = "core"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$workspace = Split-Path -Parent $PSScriptRoot
$powershellExe = Join-Path $env:SystemRoot "System32\WindowsPowerShell\v1.0\powershell.exe"
$mavenRunner = Join-Path $workspace "scripts\use-local-java17-maven.ps1"
$pomPath = "apps/server/pom.xml"

$suiteMap = @{
  core = @(
    "ActionRateLimitIntegrationTest",
    "ApiErrorEnvelopeIntegrationTest",
    "AuthMeApiIntegrationTest",
    "DraftApiIntegrationTest",
    "InteractionApiIntegrationTest",
    "CommentApiIntegrationTest",
    "PublishBootstrapApiIntegrationTest",
    "PublishPipelineIntegrationTest",
    "UploadValidationIntegrationTest"
  )
  read = @(
    "FeedReadApiIntegrationTest",
    "DiscussionReadApiIntegrationTest",
    "VideoReadApiIntegrationTest",
    "WorkflowReadApiIntegrationTest",
    "PromptReadApiIntegrationTest",
    "CreatorReadApiIntegrationTest",
    "MeReadApiIntegrationTest",
    "CanvasReadApiIntegrationTest"
  )
  admin = @(
    "AdminAccessBoundaryApiIntegrationTest",
    "AdminUserGovernanceApiIntegrationTest",
    "AdminCommentApiIntegrationTest",
    "AdminModerationApiIntegrationTest",
    "AdminReportApiIntegrationTest",
    "AdminTaxonomyApiIntegrationTest",
    "AdminFeedOpsHomeApiIntegrationTest",
    "AdminFeedOpsFeaturedApiIntegrationTest",
    "AdminFeedOpsDiscussionsApiIntegrationTest",
    "AdminMediaTaskApiIntegrationTest",
    "AdminDashboardOverviewApiIntegrationTest",
    "AdminAuditLogApiIntegrationTest"
  )
  logging = @(
    "CommunitySessionLoggingIntegrationTest",
    "InteractionLoggingIntegrationTest",
    "CanvasCopyLoggingIntegrationTest",
    "UploadLoggingIntegrationTest",
    "InternalCallbackLoggingIntegrationTest",
    "MediaTaskRetryLoggingIntegrationTest",
    "AdminAuthLoggingIntegrationTest",
    "AdminCommentLoggingIntegrationTest",
    "AdminFeedOpsLoggingIntegrationTest",
    "AdminModerationLoggingIntegrationTest",
    "AdminTaxonomyLoggingIntegrationTest",
    "AdminUserGovernanceLoggingIntegrationTest"
  )
}

if ($Suite -eq "full") {
  & $powershellExe `
    -NoProfile `
    -ExecutionPolicy Bypass `
    -File $mavenRunner `
    -f $pomPath `
    test
  exit $LASTEXITCODE
}

$tests = $suiteMap[$Suite]
if (!$tests -or $tests.Count -eq 0) {
  throw "No tests configured for suite: $Suite"
}

$selection = ($tests -join ",")

& $powershellExe `
  -NoProfile `
  -ExecutionPolicy Bypass `
  -File $mavenRunner `
  -f $pomPath `
  "-Dtest=$selection" `
  test
exit $LASTEXITCODE
