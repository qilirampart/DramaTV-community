param(
    [Parameter(Mandatory = $true)]
    [ValidateSet("video", "workflow")]
    [string]$TargetType,

    [Parameter(Mandatory = $true)]
    [string]$TargetId,

    [ValidateSet("approved", "published", "rejected", "taken_down", "pending_review")]
    [string]$StatusCode = "approved",

    [string]$BackendBaseUrl = "http://127.0.0.1:18080",

    [string]$TaskId,

    [string[]]$RiskTags = @()
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

if ([string]::IsNullOrWhiteSpace($TaskId)) {
    $TaskId = "local-audit-$TargetType-$([guid]::NewGuid().ToString())"
}

$normalizedBaseUrl = $BackendBaseUrl.TrimEnd("/")
$requestUri = "$normalizedBaseUrl/api/internal/audit-callback"

$body = @{
    taskId = $TaskId
    targetType = $TargetType
    targetId = $TargetId
    statusCode = $StatusCode
    riskTags = @($RiskTags | Where-Object { -not [string]::IsNullOrWhiteSpace($_) })
}

Write-Host "POST $requestUri"
Write-Host ("Payload: " + ($body | ConvertTo-Json -Depth 4 -Compress))

$response = Invoke-RestMethod `
    -Method Post `
    -Uri $requestUri `
    -ContentType "application/json" `
    -Body ($body | ConvertTo-Json -Depth 4)

$response | ConvertTo-Json -Depth 6
