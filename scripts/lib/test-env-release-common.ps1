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
