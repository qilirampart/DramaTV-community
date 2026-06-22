function Resolve-TestEnvResourcePath {
  param(
    [string]$Workspace,
    [string]$ResourceFile = ""
  )

  if (![string]::IsNullOrWhiteSpace($ResourceFile)) {
    if (Test-Path -LiteralPath $ResourceFile) {
      return (Resolve-Path -LiteralPath $ResourceFile).Path
    }
    return (Resolve-Path -LiteralPath (Join-Path $Workspace $ResourceFile)).Path
  }

  $codexDir = Join-Path $Workspace ".codex"
  $candidates = Get-ChildItem -Path $codexDir -Filter *.md -File -ErrorAction Stop
  $bestCandidate = $null
  $bestScore = -1

  foreach ($candidate in $candidates) {
    $content = Get-Content -LiteralPath $candidate.FullName -Raw -Encoding UTF8
    $score = 0
    $patterns = @(
      "(?m)^\d{1,3}(?:\.\d{1,3}){3}$",
      "\.redis\.rds\.aliyuncs\.com",
      "\.pg\.rds\.aliyuncs\.com",
      "oss-cn-beijing-internal\.aliyuncs\.com",
      "(?im)^bucket[:\uFF1A]\s*dz-ailab-community\s*$"
    )

    foreach ($pattern in $patterns) {
      if ($content -match $pattern) {
        $score++
      }
    }

    if ($score -gt $bestScore) {
      $bestScore = $score
      $bestCandidate = $candidate.FullName
    }
  }

  if ($bestScore -ge 4 -and $bestCandidate) {
    return $bestCandidate
  }

  throw "Could not auto-discover the test environment resource file under .codex"
}

function Get-RequiredRegexMatch {
  param(
    [string]$InputText,
    [string]$Pattern,
    [string]$Label
  )

  $match = [regex]::Match($InputText, $Pattern)
  if (!$match.Success) {
    throw "Could not parse $Label from the resource file"
  }
  return $match.Groups[1].Value.Trim()
}

function Get-NormalizedNonEmptyLines {
  param([string]$InputText)

  return ($InputText -split "\r?\n" | ForEach-Object { $_.Trim() } | Where-Object { $_ -ne "" })
}

function Get-LineValue {
  param([string]$Line)

  $match = [regex]::Match($Line, "^(?:[^:]|[^\uFF1A])*?(?:\:|\uFF1A)\s*(.+?)\s*$")
  if ($match.Success) {
    return $match.Groups[1].Value.Trim()
  }
  return $Line.Trim()
}

function Find-FirstLineIndex {
  param(
    [string[]]$Lines,
    [string]$Pattern,
    [int]$StartIndex = 0
  )

  for ($i = $StartIndex; $i -lt $Lines.Length; $i++) {
    if ($Lines[$i] -match $Pattern) {
      return $i
    }
  }

  return -1
}

function Find-LineIndexByValue {
  param(
    [string[]]$Lines,
    [string]$ExpectedValue,
    [int]$StartIndex = 0
  )

  for ($i = $StartIndex; $i -lt $Lines.Length; $i++) {
    if ((Get-LineValue -Line $Lines[$i]) -eq $ExpectedValue) {
      return $i
    }
  }

  return -1
}

function Get-NextValueAfterIndex {
  param(
    [string[]]$Lines,
    [int]$StartIndex,
    [string]$Label,
    [string]$ValuePattern = ".+"
  )

  if ($StartIndex -lt 0) {
    throw "Could not locate the anchor for $Label in the resource file"
  }

  for ($i = $StartIndex + 1; $i -lt $Lines.Length; $i++) {
    $value = Get-LineValue -Line $Lines[$i]
    if (![string]::IsNullOrWhiteSpace($value) -and $value -match $ValuePattern) {
      return $value
    }
  }

  throw "Could not parse $Label from the resource file"
}

function Get-TestEnvConnectionInfo {
  param(
    [string]$Workspace,
    [string]$ResourceFile = ""
  )

  $resourcePath = Resolve-TestEnvResourcePath -Workspace $Workspace -ResourceFile $ResourceFile
  $resource = Get-Content -LiteralPath $resourcePath -Raw -Encoding UTF8
  $lines = Get-NormalizedNonEmptyLines -InputText $resource

  $serverHost = Get-RequiredRegexMatch -InputText $resource -Pattern "(?m)^\s*(\d{1,3}(?:\.\d{1,3}){3})\s*$" -Label "server host"
  $rootLineIndex = Find-FirstLineIndex -Lines $lines -Pattern "(^|[:\uFF1A])\s*root\s*$"
  $serverPassword = Get-NextValueAfterIndex -Lines $lines -StartIndex $rootLineIndex -Label "server password"

  return [pscustomobject]@{
    ResourcePath    = $resourcePath
    ResourceContent = $resource
    Lines           = $lines
    ServerHost      = $serverHost
    ServerPassword  = $serverPassword
  }
}

function Invoke-TestEnvRemote {
  param(
    [string]$PlinkPath,
    [string]$HostKey,
    [pscustomobject]$ConnectionInfo,
    [string]$Command
  )

  & $PlinkPath -ssh -batch -hostkey $HostKey "root@$($ConnectionInfo.ServerHost)" -pw $ConnectionInfo.ServerPassword $Command
  if ($LASTEXITCODE -ne 0) {
    throw "Remote command failed with exit code $LASTEXITCODE"
  }
}

function Invoke-GitCapture {
  param(
    [string]$Workspace,
    [string[]]$Arguments
  )

  $gitCommand = Get-Command "git.exe" -ErrorAction SilentlyContinue
  if (!$gitCommand) {
    $gitCommand = Get-Command "git" -ErrorAction SilentlyContinue
  }
  if (!$gitCommand) {
    return $null
  }

  Push-Location $Workspace
  try {
    $output = & $gitCommand.Source @Arguments 2>$null
    if ($LASTEXITCODE -ne 0) {
      return $null
    }
    return (($output | Out-String).Trim())
  } finally {
    Pop-Location
  }
}

function Get-WorkspaceGitReleaseMetadata {
  param(
    [string]$Workspace,
    [string]$Component,
    [string]$ReleaseName,
    [string]$ReleaseLabel = "",
    [string]$ReleaseNotes = "",
    [bool]$VerifyBeforeDeploy = $false,
    [bool]$VerifyAfterDeploy = $false,
    [string]$SourceMode = "workspace-package"
  )

  $branch = Invoke-GitCapture -Workspace $Workspace -Arguments @("branch", "--show-current")
  $commitSha = Invoke-GitCapture -Workspace $Workspace -Arguments @("rev-parse", "HEAD")
  $shortSha = Invoke-GitCapture -Workspace $Workspace -Arguments @("rev-parse", "--short", "HEAD")
  $statusOutput = Invoke-GitCapture -Workspace $Workspace -Arguments @("status", "--short")
  $statusLines = @()
  if ($statusOutput) {
    $statusLines = $statusOutput -split "\r?\n" | Where-Object { $_.Trim() -ne "" }
  }

  $untrackedCount = ($statusLines | Where-Object { $_ -like "?? *" }).Count
  $trackedChangeCount = $statusLines.Count - $untrackedCount
  $dirtyWorkspace = $statusLines.Count -gt 0

  $releaseLabelValue = if ([string]::IsNullOrWhiteSpace($ReleaseLabel)) { $ReleaseName } else { $ReleaseLabel.Trim() }
  $releaseNotesValue = if ([string]::IsNullOrWhiteSpace($ReleaseNotes)) { "" } else { $ReleaseNotes.Trim() }

  return [ordered]@{
    releaseName     = $ReleaseName
    releaseLabel    = $releaseLabelValue
    component       = $Component
    sourceMode      = $SourceMode
    branch          = if ($branch) { $branch } else { "unknown" }
    commitSha       = if ($commitSha) { $commitSha } else { "unknown" }
    commitShortSha  = if ($shortSha) { $shortSha } else { "unknown" }
    dirtyWorkspace  = $dirtyWorkspace
    workspaceStatus = @{
      totalChanges       = $statusLines.Count
      trackedChangeCount = $trackedChangeCount
      untrackedCount     = $untrackedCount
    }
    deployedBy      = @{
      username    = $env:USERNAME
      machineName = $env:COMPUTERNAME
    }
    generatedAt     = (Get-Date).ToString("o")
    verifyBefore    = $VerifyBeforeDeploy
    verifyAfter     = $VerifyAfterDeploy
    releaseNotes    = $releaseNotesValue
  }
}

function Write-ReleaseMetadataFile {
  param(
    [string]$Path,
    [hashtable]$Metadata
  )

  $json = $Metadata | ConvertTo-Json -Depth 8 -Compress
  Set-Content -LiteralPath $Path -Value $json -Encoding UTF8
}

function Get-DefaultCommunityTestHost {
  return "community.8.141.20.130.nip.io"
}

function Get-DefaultCommunityPublicBaseUrl {
  return "http://$(Get-DefaultCommunityTestHost)"
}

function Get-DefaultAdminPublicBaseUrl {
  param([string]$AdminBasePath = "/admin")

  $normalizedAdminBasePath = Normalize-AdminBasePath -AdminBasePath $AdminBasePath
  return "$(Get-DefaultCommunityPublicBaseUrl)$normalizedAdminBasePath"
}

function Normalize-AdminBasePath {
  param([string]$AdminBasePath = "/admin")

  if ([string]::IsNullOrWhiteSpace($AdminBasePath)) {
    return "/admin"
  }

  $trimmed = $AdminBasePath.Trim()
  if (!$trimmed.StartsWith("/")) {
    $trimmed = "/$trimmed"
  }

  if ($trimmed.Length -gt 1) {
    $trimmed = $trimmed.TrimEnd("/")
  }

  return $trimmed
}

function Test-IsIpLiteralHost {
  param([string]$HostName)

  if ([string]::IsNullOrWhiteSpace($HostName)) {
    return $false
  }

  $parsedAddress = $null
  return [System.Net.IPAddress]::TryParse($HostName.Trim(), [ref]$parsedAddress)
}

function Get-ValidatedAbsoluteUrl {
  param(
    [string]$Url,
    [string]$Label
  )

  if ([string]::IsNullOrWhiteSpace($Url)) {
    throw "$Label cannot be empty."
  }

  $normalizedUrl = $Url.Trim().TrimEnd("/")
  try {
    $uri = [System.Uri]$normalizedUrl
  } catch {
    throw "$Label must be an absolute http(s) URL: $Url"
  }

  if (!$uri.IsAbsoluteUri) {
    throw "$Label must be an absolute http(s) URL: $Url"
  }

  if ($uri.Scheme -notin @("http", "https")) {
    throw "$Label must use http or https: $normalizedUrl"
  }

  return $normalizedUrl
}

function Assert-DedicatedPublicBaseUrl {
  param(
    [string]$Url,
    [string]$Label
  )

  $normalizedUrl = Get-ValidatedAbsoluteUrl -Url $Url -Label $Label
  $uri = [System.Uri]$normalizedUrl
  $publicHostName = $uri.Host.Trim().ToLowerInvariant()

  if ([string]::IsNullOrWhiteSpace($publicHostName)) {
    throw "$Label must include a hostname: $normalizedUrl"
  }

  if ($publicHostName -in @("localhost", "127.0.0.1", "::1")) {
    throw "$Label must use a dedicated public hostname instead of localhost: $normalizedUrl"
  }

  if (Test-IsIpLiteralHost -HostName $publicHostName) {
    throw "$Label must use a dedicated hostname instead of a bare IP: $normalizedUrl"
  }

  return $normalizedUrl
}

function Assert-RootPublicBaseUrl {
  param(
    [string]$Url,
    [string]$Label
  )

  $normalizedUrl = Assert-DedicatedPublicBaseUrl -Url $Url -Label $Label
  $uri = [System.Uri]$normalizedUrl
  $path = $uri.AbsolutePath.Trim()

  if (![string]::IsNullOrWhiteSpace($path) -and $path -ne "/") {
    throw "$Label must not include a path segment: $normalizedUrl"
  }

  return $normalizedUrl
}

function Get-ValidatedServerNameList {
  param([string]$ServerNames)

  if ([string]::IsNullOrWhiteSpace($ServerNames)) {
    throw "ServerNames cannot be empty."
  }

  $tokens = @(
    $ServerNames.Split([char[]]" `t`r`n", [System.StringSplitOptions]::RemoveEmptyEntries) |
      ForEach-Object { $_.Trim() } |
      Where-Object { $_ -ne "" }
  )

  if ($tokens.Count -eq 0) {
    throw "ServerNames cannot be empty."
  }

  foreach ($token in $tokens) {
    $normalizedToken = $token.ToLowerInvariant()
    if ($normalizedToken -eq "_" -or $normalizedToken -eq "default_server") {
      throw "ServerNames cannot use catch-all values like '_' or 'default_server'."
    }
    if ($normalizedToken.Contains("*")) {
      throw "ServerNames cannot use wildcard host patterns: $token"
    }
    if ($normalizedToken -in @("localhost", "127.0.0.1", "::1")) {
      throw "ServerNames must use dedicated public hostnames instead of localhost: $token"
    }
    if (Test-IsIpLiteralHost -HostName $normalizedToken) {
      throw "ServerNames must use dedicated hostnames instead of bare IPs: $token"
    }
  }

  return $tokens
}

function Assert-ServerNamesMatchPublicBaseUrl {
  param(
    [string]$ServerNames,
    [string]$PublicBaseUrl
  )

  $normalizedPublicBaseUrl = Assert-RootPublicBaseUrl -Url $PublicBaseUrl -Label "PublicBaseUrl"
  $publicHost = ([System.Uri]$normalizedPublicBaseUrl).Host.ToLowerInvariant()
  $tokens = Get-ValidatedServerNameList -ServerNames $ServerNames

  $matchesPublicHost = $false
  foreach ($token in $tokens) {
    if ($token.ToLowerInvariant() -eq $publicHost) {
      $matchesPublicHost = $true
      break
    }
  }

  if (!$matchesPublicHost) {
    throw "ServerNames must include the PublicBaseUrl host '$publicHost'."
  }

  return ($tokens -join " ")
}

function Assert-AdminPublicBaseUrls {
  param(
    [string]$CommunityPublicBaseUrl,
    [string]$AdminPublicBaseUrl,
    [string]$AdminBasePath = "/admin"
  )

  $normalizedCommunityPublicBaseUrl = Assert-RootPublicBaseUrl -Url $CommunityPublicBaseUrl -Label "CommunityPublicBaseUrl"
  $normalizedAdminPublicBaseUrl = Assert-DedicatedPublicBaseUrl -Url $AdminPublicBaseUrl -Label "AdminPublicBaseUrl"
  $communityUri = [System.Uri]$normalizedCommunityPublicBaseUrl
  $adminUri = [System.Uri]$normalizedAdminPublicBaseUrl
  $normalizedAdminBasePath = Normalize-AdminBasePath -AdminBasePath $AdminBasePath
  $adminPath = $adminUri.AbsolutePath.Trim()

  if ($communityUri.Scheme -ne $adminUri.Scheme -or $communityUri.Host -ne $adminUri.Host -or $communityUri.Port -ne $adminUri.Port) {
    throw "AdminPublicBaseUrl must use the same scheme, host, and port as CommunityPublicBaseUrl."
  }

  if ($adminPath -ne $normalizedAdminBasePath) {
    throw "AdminPublicBaseUrl path must exactly match AdminBasePath '$normalizedAdminBasePath'."
  }

  return [pscustomobject]@{
    CommunityPublicBaseUrl = $normalizedCommunityPublicBaseUrl
    AdminPublicBaseUrl     = $normalizedAdminPublicBaseUrl
    AdminBasePath          = $normalizedAdminBasePath
  }
}
