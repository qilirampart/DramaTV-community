param(
  [Parameter(Mandatory = $true)][string]$InputPath,
  [Parameter(Mandatory = $true)][string]$OutputDir,
  [int]$TimeoutSec = 45,
  [int]$Retries = 3
)

$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

function Ensure-Dir {
  param([string]$Path)
  if (-not (Test-Path -LiteralPath $Path)) {
    New-Item -ItemType Directory -Path $Path -Force | Out-Null
  }
}

function Get-PageReferer {
  param([object]$Item)

  $locale = if ($Item.locale) { [string]$Item.locale } else { "zh-CN" }
  $campaign = if ($Item.campaign) { [string]$Item.campaign } else { "" }
  $categories = if ($Item.categories) { [string]$Item.categories } else { "" }
  $localePrefix = if ($locale -and $locale -ne "en-US") { "/$locale" } else { "" }
  $path = "$localePrefix/$campaign".TrimEnd("/")
  $builder = [System.UriBuilder]::new("https://youmind.com$path")

  if ($categories) {
    $builder.Query = "categories=$([uri]::EscapeDataString($categories))"
  }

  return $builder.Uri.AbsoluteUri
}

function Get-FileExtension {
  param([string]$Url)

  try {
    $uri = [System.Uri]$Url
    $ext = [System.IO.Path]::GetExtension($uri.AbsolutePath).ToLowerInvariant()
    if ($ext.Length -gt 0 -and $ext.Length -le 5) {
      return $ext
    }
  } catch {
  }

  return ".jpg"
}

function Download-FileWithRetry {
  param(
    [string]$Url,
    [string]$TargetPath,
    [string]$RefererUrl
  )

  $headers = @{
    "User-Agent" = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36"
    "Accept" = "*/*"
    "Referer" = $RefererUrl
  }

  $lastError = $null
  for ($attempt = 1; $attempt -le $Retries; $attempt++) {
    try {
      Invoke-WebRequest -Uri $Url -Headers $headers -TimeoutSec $TimeoutSec -OutFile $TargetPath
      return (Get-Item -LiteralPath $TargetPath).Length
    } catch {
      $lastError = $_
      if (Test-Path -LiteralPath $TargetPath) {
        Remove-Item -LiteralPath $TargetPath -Force -ErrorAction SilentlyContinue
      }
      if ($attempt -lt $Retries) {
        Start-Sleep -Seconds $attempt
      }
    }
  }

  throw $lastError
}

$resolvedInputPath = (Resolve-Path -LiteralPath $InputPath).Path
Ensure-Dir -Path $OutputDir

$items = @((Get-Content -Raw -LiteralPath $resolvedInputPath | ConvertFrom-Json))
$totalItems = $items.Count
$totalMediaCount = 0
foreach ($item in $items) {
  $totalMediaCount += @($item.media).Count
}

$processedItemCount = 0
$processedMediaCount = 0

foreach ($item in $items) {
  $media = @($item.media)
  $processedItemCount++
  $refererUrl = Get-PageReferer -Item $item

  Write-Output ("[item {0}/{1}] rank={2} id={3} media={4} title={5}" -f `
    $processedItemCount, $totalItems, $item.rank, $item.id, $media.Count, ($item.title | ConvertTo-Json -Compress))

  if ($media.Count -eq 0) {
    Write-Output ("[done {0}/{1}] media={2}/{3} downloaded=0 skipped=0 failed=0" -f `
      $processedItemCount, $totalItems, $processedMediaCount, $totalMediaCount)
    continue
  }

  $itemDir = Join-Path $OutputDir ("{0:D6}-{1}" -f [int]$item.rank, [string]$item.id)
  $imagesDir = Join-Path $itemDir "images"
  Ensure-Dir -Path $imagesDir

  $downloaded = 0
  $skipped = 0
  $failed = 0
  $localMediaFiles = @()

  for ($index = 0; $index -lt $media.Count; $index++) {
    $url = [string]$media[$index]
    $ext = Get-FileExtension -Url $url
    $fileName = ("{0:D2}{1}" -f ($index + 1), $ext)
    $targetPath = Join-Path $imagesDir $fileName

    if (Test-Path -LiteralPath $targetPath) {
      $size = (Get-Item -LiteralPath $targetPath).Length
      if ($size -gt 0) {
        $skipped++
        $localMediaFiles += $targetPath
        continue
      }
      Remove-Item -LiteralPath $targetPath -Force -ErrorAction SilentlyContinue
    }

    try {
      $null = Download-FileWithRetry -Url $url -TargetPath $targetPath -RefererUrl $refererUrl
      $downloaded++
      $localMediaFiles += $targetPath
    } catch {
      $failed++
    }
  }

  if ($item.PSObject.Properties["localMediaFiles"]) {
    $item.localMediaFiles = $localMediaFiles
  } else {
    Add-Member -InputObject $item -MemberType NoteProperty -Name "localMediaFiles" -Value $localMediaFiles -Force
  }
  $processedMediaCount += $media.Count

  Write-Output ("[done {0}/{1}] media={2}/{3} downloaded={4} skipped={5} failed={6}" -f `
    $processedItemCount, $totalItems, $processedMediaCount, $totalMediaCount, $downloaded, $skipped, $failed)
}

$json = $items | ConvertTo-Json -Depth 100
Set-Content -LiteralPath $resolvedInputPath -Value $json -Encoding UTF8
