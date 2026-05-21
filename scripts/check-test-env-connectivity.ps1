param(
  [string]$ResourceFile = ""
)

$ErrorActionPreference = "Stop"

$workspace = Split-Path -Parent $PSScriptRoot
$plink = Join-Path $workspace ".tools\putty\plink.exe"
$hostKey = "ssh-ed25519 255 SHA256:YMyByZ4GyGnkXbJVzjvy4hEuvlD0sfSH+dfMBYXdlDk"

function Resolve-ResourcePath {
  param([string]$Workspace, [string]$ResourceFileParam)

  if (![string]::IsNullOrWhiteSpace($ResourceFileParam)) {
    if (Test-Path -LiteralPath $ResourceFileParam) {
      return (Resolve-Path -LiteralPath $ResourceFileParam).Path
    }
    return (Resolve-Path -LiteralPath (Join-Path $Workspace $ResourceFileParam)).Path
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

function Get-RequiredMatch {
  param([string]$InputText, [string]$Pattern, [string]$Label)

  $match = [regex]::Match($InputText, $Pattern)
  if (!$match.Success) {
    throw "Could not parse $Label from the resource file"
  }
  return $match.Groups[1].Value.Trim()
}

function Get-NormalizedLines {
  param([string]$InputText)

  return ($InputText -split "\r?\n" | ForEach-Object { $_.Trim() } | Where-Object { $_ -ne "" })
}

function Get-LineValue {
  param([string]$Line)

  $match = [regex]::Match($Line, "^[^:\uFF1A]*[:\uFF1A]\s*(.+?)\s*$")
  if ($match.Success) {
    return $match.Groups[1].Value.Trim()
  }
  return $Line.Trim()
}

function Find-FirstLineIndex {
  param([string[]]$Lines, [string]$Pattern, [int]$StartIndex = 0)

  for ($i = $StartIndex; $i -lt $Lines.Length; $i++) {
    if ($Lines[$i] -match $Pattern) {
      return $i
    }
  }
  return -1
}

function Find-LineIndexByValue {
  param([string[]]$Lines, [string]$ExpectedValue, [int]$StartIndex = 0)

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

$resourcePath = Resolve-ResourcePath -Workspace $workspace -ResourceFileParam $ResourceFile
$resource = Get-Content -LiteralPath $resourcePath -Raw -Encoding UTF8
$lines = Get-NormalizedLines -InputText $resource

$serverHost = Get-RequiredMatch -InputText $resource -Pattern "(?m)^\s*(\d{1,3}(?:\.\d{1,3}){3})\s*$" -Label "server host"
$rootLineIndex = Find-FirstLineIndex -Lines $lines -Pattern "(^|[:\uFF1A])\s*root\s*$"
$serverPassword = Get-NextValueAfterIndex -Lines $lines -StartIndex $rootLineIndex -Label "server password"
$redisHost = Get-RequiredMatch -InputText $resource -Pattern "([A-Za-z0-9.-]+\.redis\.rds\.aliyuncs\.com)" -Label "redis host"
$redisHostIndex = Find-LineIndexByValue -Lines $lines -ExpectedValue $redisHost
$redisPort = Get-NextValueAfterIndex -Lines $lines -StartIndex $redisHostIndex -Label "redis port" -ValuePattern "^\d{2,5}$"
$dbHost = Get-RequiredMatch -InputText $resource -Pattern "([A-Za-z0-9.-]+\.pg\.rds\.aliyuncs\.com)" -Label "database host"
$dbHostIndex = Find-LineIndexByValue -Lines $lines -ExpectedValue $dbHost
$dbPort = Get-NextValueAfterIndex -Lines $lines -StartIndex $dbHostIndex -Label "database port" -ValuePattern "^\d{2,5}$"

$remoteTemplate = @'
python3 - <<'"'"'PY'"'"'
import socket

checks = [
    ('db_declared', '{0}', int('{1}')),
    ('db_5432', '{0}', 5432),
    ('redis', '{2}', int('{3}')),
]

for name, host, port in checks:
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    sock.settimeout(5.0)
    try:
        sock.connect((host, port))
        print('%s: OK %s:%s' % (name, host, port))
    except socket.timeout:
        print('%s: TIMEOUT %s:%s' % (name, host, port))
    except Exception as exc:
        print('%s: FAIL %s:%s (%s: %s)' % (name, host, port, type(exc).__name__, exc))
    finally:
        sock.close()
PY
'@

$remote = [string]::Format($remoteTemplate, $dbHost, $dbPort, $redisHost, $redisPort)

& $plink -ssh -batch -hostkey $hostKey "root@$serverHost" -pw $serverPassword $remote
exit $LASTEXITCODE
