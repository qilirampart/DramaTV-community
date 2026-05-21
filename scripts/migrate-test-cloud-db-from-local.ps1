param(
  [string]$ResourceFile = "",
  [string]$LocalContainer = "dramatv-postgres",
  [string]$LocalDatabase = "dramatv",
  [string]$LocalUser = "dramatv",
  [int]$TunnelPort = 15432,
  [switch]$SkipTunnel,
  [switch]$ForceOverwrite
)

$ErrorActionPreference = "Stop"

$workspace = Split-Path -Parent $PSScriptRoot
$plink = Join-Path $workspace ".tools\putty\plink.exe"
$tempDir = Join-Path $env:TEMP "dramatv-cloud-migration"
$hostKey = "ssh-ed25519 255 SHA256:YMyByZ4GyGnkXbJVzjvy4hEuvlD0sfSH+dfMBYXdlDk"

$migrationTables = @(
  "discussion_channels",
  "users",
  "creator_profiles",
  "media_assets",
  "workflows",
  "videos",
  "prompt_entries",
  "prompt_example_links",
  "feed_items",
  "discussion_threads",
  "comments",
  "interaction_actions",
  "follow_relations",
  "publish_drafts",
  "audit_records",
  "report_tickets",
  "canvas_bindings",
  "canvas_workflow_runtimes",
  "canvas_runtime_assets",
  "canvas_copy_tasks",
  "async_task_records",
  "task_callback_logs"
)

function Require-File {
  param([string]$Path, [string]$Label)

  if (!(Test-Path -LiteralPath $Path)) {
    throw "$Label not found: $Path"
  }
}

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
      "(?im)^bucket(?:\:|\uFF1A)\s*dz-ailab-community\s*$"
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

  $match = [regex]::Match($Line, "^(?:[^:]|[^\uFF1A])*?(?:\:|\uFF1A)\s*(.+?)\s*$")
  if ($match.Success) {
    return $match.Groups[1].Value.Trim()
  }
  return $Line.Trim()
}

function Find-FirstLineIndex {
  param([string[]]$Lines, [string]$Pattern)

  for ($i = 0; $i -lt $Lines.Length; $i++) {
    if ($Lines[$i] -match $Pattern) {
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

function Get-NextValueRecordAfterIndex {
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
      return @{
        Index = $i
        Value = $value
      }
    }
  }

  throw "Could not parse $Label from the resource file"
}

function Write-Utf8NoBom {
  param([string]$Path, [string]$Content)

  $encoding = New-Object System.Text.UTF8Encoding($false)
  [System.IO.File]::WriteAllText($Path, $Content, $encoding)
}

function Start-DbTunnel {
  param(
    [string]$PlinkPath,
    [int]$LocalPort,
    [string]$DbHost,
    [int]$DbPort,
    [string]$ServerHost,
    [string]$ServerPassword,
    [string]$TempDir
  )

  $stdout = Join-Path $TempDir "plink-tunnel.out.log"
  $stderr = Join-Path $TempDir "plink-tunnel.err.log"
  Remove-Item -LiteralPath $stdout, $stderr -ErrorAction SilentlyContinue

  $argString = "-ssh -N -batch -hostkey `"${hostKey}`" -L ${LocalPort}:${DbHost}:${DbPort} root@${ServerHost} -pw ${ServerPassword}"
  $process = Start-Process -FilePath $PlinkPath -ArgumentList $argString -PassThru -WindowStyle Hidden -RedirectStandardOutput $stdout -RedirectStandardError $stderr
  Start-Sleep -Seconds 2

  if ($process.HasExited) {
    $stderrText = if (Test-Path -LiteralPath $stderr) { Get-Content -LiteralPath $stderr -Raw -Encoding UTF8 } else { "" }
    throw "Failed to start SSH tunnel. $stderrText"
  }

  return @{
    Process = $process
    Stdout = $stdout
    Stderr = $stderr
  }
}

function Invoke-CloudPsql {
  param(
    [string]$Container,
    [string]$DbPassword,
    [int]$LocalPort,
    [string]$DbUser,
    [string]$DbName,
    [string]$Sql
  )

  $output = & docker exec -e "PGPASSWORD=$DbPassword" $Container psql `
    -h host.docker.internal `
    -p $LocalPort `
    -U $DbUser `
    -d $DbName `
    -P pager=off `
    -At `
    -c $Sql

  if ($LASTEXITCODE -ne 0) {
    throw "Cloud psql command failed"
  }

  return $output
}

function Get-TableCountsSql {
  return @"
select table_name || '|' ||
       coalesce(
         (xpath(
            '/row/cnt/text()',
            query_to_xml(
              format('select count(*) as cnt from %I.%I', table_schema, table_name),
              false,
              true,
              ''
            )
          ))[1]::text::bigint,
         0
       ) as line
from information_schema.tables
where table_schema = 'public'
  and table_type = 'BASE TABLE'
order by table_name;
"@
}

function Convert-LinesToCountMap {
  param([object[]]$Lines)

  $map = @{}
  foreach ($line in $Lines) {
    if ($null -eq $line) {
      continue
    }
    $text = $line.ToString().Trim()
    if ([string]::IsNullOrWhiteSpace($text)) {
      continue
    }
    $parts = $text -split '\|', 2
    if ($parts.Length -ne 2) {
      continue
    }
    $map[$parts[0]] = [int64]$parts[1]
  }
  return $map
}

function Format-CountSummary {
  param(
    [hashtable]$Counts,
    [string[]]$Tables
  )

  return ($Tables | ForEach-Object { "$_=$($Counts[$_])" }) -join ", "
}

function Get-LocalTableInsertLines {
  param(
    [string]$Container,
    [string]$DbUser,
    [string]$DbName,
    [string]$Table
  )

  $dumpArgs = @(
    "exec",
    $Container,
    "pg_dump",
    "-U", $DbUser,
    "-d", $DbName,
    "--data-only",
    "--no-owner",
    "--no-privileges",
    "--inserts",
    "--column-inserts",
    "--table=public.$Table"
  )

  $dumpOutput = & docker @dumpArgs
  if ($LASTEXITCODE -ne 0) {
    throw "pg_dump failed for local table export: $Table"
  }

  $rawDump = if ($dumpOutput -is [System.Array]) { $dumpOutput -join "`n" } else { [string]$dumpOutput }
  $statements = Split-SqlStatements -InputText $rawDump
  $lines = @()
  foreach ($statement in $statements) {
    if ([string]::IsNullOrWhiteSpace($statement)) {
      continue
    }
    $text = $statement.Trim()
    $anchor = "INSERT INTO public.$Table "
    $insertIndex = $text.IndexOf($anchor)
    if ($insertIndex -ge 0) {
      $lines += $text.Substring($insertIndex).Trim()
    }
  }

  return $lines
}

function Split-SqlStatements {
  param([string]$InputText)

  $statements = New-Object System.Collections.Generic.List[string]
  $builder = New-Object System.Text.StringBuilder
  $inString = $false

  for ($i = 0; $i -lt $InputText.Length; $i++) {
    $char = $InputText[$i]
    [void]$builder.Append($char)

    if ($char -eq "'") {
      if ($inString -and $i + 1 -lt $InputText.Length -and $InputText[$i + 1] -eq "'") {
        $i++
        [void]$builder.Append($InputText[$i])
        continue
      }
      $inString = -not $inString
      continue
    }

    if (!$inString -and $char -eq ";") {
      $statements.Add($builder.ToString())
      [void]$builder.Clear()
    }
  }

  if ($builder.Length -gt 0) {
    $tail = $builder.ToString().Trim()
    if ($tail.Length -gt 0) {
      $statements.Add($tail)
    }
  }

  return $statements.ToArray()
}

function Split-SqlInsertValues {
  param([string]$InputText)

  $values = New-Object System.Collections.Generic.List[string]
  $builder = New-Object System.Text.StringBuilder
  $inString = $false

  for ($i = 0; $i -lt $InputText.Length; $i++) {
    $char = $InputText[$i]

    if ($char -eq "'") {
      [void]$builder.Append($char)
      if ($inString -and $i + 1 -lt $InputText.Length -and $InputText[$i + 1] -eq "'") {
        $i++
        [void]$builder.Append($InputText[$i])
        continue
      }
      $inString = -not $inString
      continue
    }

    if (!$inString -and $char -eq ",") {
      $values.Add($builder.ToString().Trim())
      [void]$builder.Clear()
      continue
    }

    [void]$builder.Append($char)
  }

  if ($builder.Length -gt 0) {
    $values.Add($builder.ToString().Trim())
  }

  return $values.ToArray()
}

function Get-InsertRecordFromLine {
  param([string]$Line)

  $match = [regex]::Match($Line.Trim(), "(?s)^INSERT INTO public\.(?<table>[A-Za-z0-9_]+) \((?<columns>.+?)\) VALUES \((?<values>.+)\);$")
  if (!$match.Success) {
    throw "Unsupported insert statement format: $Line"
  }

  $columns = $match.Groups["columns"].Value -split ", "
  $values = Split-SqlInsertValues -InputText $match.Groups["values"].Value

  if ($columns.Length -ne $values.Length) {
    throw "Column/value count mismatch for table $($match.Groups['table'].Value)"
  }

  return @{
    Table = $match.Groups["table"].Value
    Columns = $columns
    Values = $values
  }
}

function Build-InsertLine {
  param(
    [string]$Table,
    [string[]]$Columns,
    [string[]]$Values
  )

  return "INSERT INTO public.$Table (" + ($Columns -join ", ") + ") VALUES (" + ($Values -join ", ") + ");"
}

function Get-InsertValueMap {
  param([hashtable]$InsertRecord)

  $map = @{}
  for ($i = 0; $i -lt $InsertRecord.Columns.Length; $i++) {
    $map[$InsertRecord.Columns[$i]] = $InsertRecord.Values[$i]
  }
  return $map
}

$resourcePath = Resolve-ResourcePath -Workspace $workspace -ResourceFileParam $ResourceFile
Require-File -Path $resourcePath -Label "resource file"
Require-File -Path $plink -Label "plink"

New-Item -ItemType Directory -Force -Path $tempDir | Out-Null

$resource = Get-Content -LiteralPath $resourcePath -Raw -Encoding UTF8
$lines = Get-NormalizedLines -InputText $resource

$serverHost = Get-RequiredMatch -InputText $resource -Pattern "(?m)^\s*(\d{1,3}(?:\.\d{1,3}){3})\s*$" -Label "server host"
$rootLineIndex = Find-FirstLineIndex -Lines $lines -Pattern "(^|[:\uFF1A])\s*root\s*$"
$serverPassword = Get-NextValueAfterIndex -Lines $lines -StartIndex $rootLineIndex -Label "server password"
$dbHost = Get-RequiredMatch -InputText $resource -Pattern "([A-Za-z0-9.-]+\.pg\.rds\.aliyuncs\.com)" -Label "database host"
$dbHostIndex = Find-FirstLineIndex -Lines $lines -Pattern ([regex]::Escape($dbHost))
$dbPortRecord = Get-NextValueRecordAfterIndex -Lines $lines -StartIndex $dbHostIndex -Label "database port" -ValuePattern "^\d{2,5}$"
$dbNameRecord = Get-NextValueRecordAfterIndex -Lines $lines -StartIndex $dbPortRecord.Index -Label "database name" -ValuePattern "^[A-Za-z0-9_.-]+$"
$dbUserRecord = Get-NextValueRecordAfterIndex -Lines $lines -StartIndex $dbNameRecord.Index -Label "database user" -ValuePattern "^[A-Za-z0-9_.-]+$"
$dbPasswordRecord = Get-NextValueRecordAfterIndex -Lines $lines -StartIndex $dbUserRecord.Index -Label "database password"

$dbPort = [int]$dbPortRecord.Value
$dbName = $dbNameRecord.Value
$dbUser = $dbUserRecord.Value
$dbPassword = $dbPasswordRecord.Value

$tunnelProcess = $null
try {
  if (!$SkipTunnel) {
    Write-Output "Starting SSH tunnel on 127.0.0.1:$TunnelPort -> $($dbHost):$dbPort"
    $tunnel = Start-DbTunnel -PlinkPath $plink -LocalPort $TunnelPort -DbHost $dbHost -DbPort $dbPort -ServerHost $serverHost -ServerPassword $serverPassword -TempDir $tempDir
    $tunnelProcess = $tunnel.Process
  }

  $sanityOutput = Invoke-CloudPsql -Container $LocalContainer -DbPassword $dbPassword -LocalPort $TunnelPort -DbUser $dbUser -DbName $dbName -Sql "select current_database() || '|' || current_user;"
  Write-Output "Connected to cloud database: $($sanityOutput -join '')"

  $localCountsSql = Get-TableCountsSql
  $localCountsLines = & docker exec $LocalContainer psql -U $LocalUser -d $LocalDatabase -P pager=off -At -c $localCountsSql
  if ($LASTEXITCODE -ne 0) {
    throw "Local psql count query failed"
  }
  $localCounts = Convert-LinesToCountMap -Lines $localCountsLines

  $cloudCounts = Convert-LinesToCountMap -Lines (Invoke-CloudPsql -Container $LocalContainer -DbPassword $dbPassword -LocalPort $TunnelPort -DbUser $dbUser -DbName $dbName -Sql $localCountsSql)

  $nonEmptyCloudTables = @()
  foreach ($table in $migrationTables) {
    $count = if ($cloudCounts.ContainsKey($table)) { $cloudCounts[$table] } else { 0 }
    if ($table -eq "discussion_channels") {
      continue
    }
    if ($count -gt 0) {
      $nonEmptyCloudTables += "$table=$count"
    }
  }

  if ($nonEmptyCloudTables.Count -gt 0 -and !$ForceOverwrite) {
    throw "Cloud database is not empty enough for the initial overwrite sync. Non-empty tables: $($nonEmptyCloudTables -join ', ')"
  }

  if ($nonEmptyCloudTables.Count -gt 0) {
    Write-Output "Cloud tables already contain data and will be reset: $($nonEmptyCloudTables -join ', ')"
  }

  Write-Output "Local counts: $(Format-CountSummary -Counts $localCounts -Tables $migrationTables)"
  Write-Output "Cloud counts before import: $(Format-CountSummary -Counts $cloudCounts -Tables $migrationTables)"

  $truncateSqlPath = Join-Path $tempDir "cloud-truncate.sql"
  $importSqlPath = Join-Path $tempDir "cloud-import.sql"
  $updateSqlPath = Join-Path $tempDir "cloud-post-import-updates.sql"
  $quotedTables = ($migrationTables | ForEach-Object { "public.$_" }) -join ", "
  $truncateSql = "truncate table $quotedTables restart identity cascade;"
  Write-Utf8NoBom -Path $truncateSqlPath -Content $truncateSql

  $importLines = New-Object System.Collections.Generic.List[string]
  $updateLines = New-Object System.Collections.Generic.List[string]
  $importLines.Add("begin;")
  $updateLines.Add("begin;")

  foreach ($table in $migrationTables) {
    $tableInsertLines = Get-LocalTableInsertLines -Container $LocalContainer -DbUser $LocalUser -DbName $LocalDatabase -Table $table

    switch ($table) {
      "users" {
        foreach ($line in $tableInsertLines) {
          $record = Get-InsertRecordFromLine -Line $line
          $valueMap = Get-InsertValueMap -InsertRecord $record
          $columns = New-Object System.Collections.Generic.List[string]
          $values = New-Object System.Collections.Generic.List[string]

          for ($i = 0; $i -lt $record.Columns.Length; $i++) {
            if ($record.Columns[$i] -eq "avatar_asset_id") {
              continue
            }
            $columns.Add($record.Columns[$i])
            $values.Add($record.Values[$i])
          }

          $importLines.Add((Build-InsertLine -Table $table -Columns $columns.ToArray() -Values $values.ToArray()))

          if ($valueMap["avatar_asset_id"] -ne "NULL") {
            $updateLines.Add("update public.users set avatar_asset_id = $($valueMap['avatar_asset_id']) where id = $($valueMap['id']);")
          }
        }
      }
      "comments" {
        foreach ($line in $tableInsertLines) {
          $record = Get-InsertRecordFromLine -Line $line
          $valueMap = Get-InsertValueMap -InsertRecord $record
          $columns = New-Object System.Collections.Generic.List[string]
          $values = New-Object System.Collections.Generic.List[string]

          for ($i = 0; $i -lt $record.Columns.Length; $i++) {
            if ($record.Columns[$i] -in @("parent_id", "root_id")) {
              continue
            }
            $columns.Add($record.Columns[$i])
            $values.Add($record.Values[$i])
          }

          $importLines.Add((Build-InsertLine -Table $table -Columns $columns.ToArray() -Values $values.ToArray()))

          if ($valueMap["parent_id"] -ne "NULL" -or $valueMap["root_id"] -ne "NULL") {
            $updateLines.Add("update public.comments set parent_id = $($valueMap['parent_id']), root_id = $($valueMap['root_id']) where id = $($valueMap['id']);")
          }
        }
      }
      default {
        foreach ($line in $tableInsertLines) {
          $importLines.Add($line)
        }
      }
    }
  }

  $importLines.Add("commit;")
  $updateLines.Add("commit;")

  Write-Utf8NoBom -Path $importSqlPath -Content ($importLines -join [Environment]::NewLine)
  Write-Utf8NoBom -Path $updateSqlPath -Content ($updateLines -join [Environment]::NewLine)

  & docker cp $truncateSqlPath "${LocalContainer}:/tmp/cloud-truncate.sql"
  if ($LASTEXITCODE -ne 0) {
    throw "Failed to copy truncate SQL into the local Postgres container"
  }

  & docker cp $importSqlPath "${LocalContainer}:/tmp/cloud-import.sql"
  if ($LASTEXITCODE -ne 0) {
    throw "Failed to copy import SQL into the local Postgres container"
  }

  & docker cp $updateSqlPath "${LocalContainer}:/tmp/cloud-post-import-updates.sql"
  if ($LASTEXITCODE -ne 0) {
    throw "Failed to copy post-import update SQL into the local Postgres container"
  }

  & docker exec -e "PGPASSWORD=$dbPassword" $LocalContainer psql `
    -v ON_ERROR_STOP=1 `
    -h host.docker.internal `
    -p $TunnelPort `
    -U $dbUser `
    -d $dbName `
    -f /tmp/cloud-truncate.sql
  if ($LASTEXITCODE -ne 0) {
    throw "Cloud truncate step failed"
  }

  & docker exec -e "PGPASSWORD=$dbPassword" $LocalContainer psql `
    -v ON_ERROR_STOP=1 `
    -h host.docker.internal `
    -p $TunnelPort `
    -U $dbUser `
    -d $dbName `
    -f /tmp/cloud-import.sql
  if ($LASTEXITCODE -ne 0) {
    throw "Cloud import step failed"
  }

  & docker exec -e "PGPASSWORD=$dbPassword" $LocalContainer psql `
    -v ON_ERROR_STOP=1 `
    -h host.docker.internal `
    -p $TunnelPort `
    -U $dbUser `
    -d $dbName `
    -f /tmp/cloud-post-import-updates.sql
  if ($LASTEXITCODE -ne 0) {
    throw "Cloud post-import update step failed"
  }

  $cloudCountsAfter = Convert-LinesToCountMap -Lines (Invoke-CloudPsql -Container $LocalContainer -DbPassword $dbPassword -LocalPort $TunnelPort -DbUser $dbUser -DbName $dbName -Sql $localCountsSql)
  Write-Output "Cloud counts after import: $(Format-CountSummary -Counts $cloudCountsAfter -Tables $migrationTables)"
  Write-Output "Cloud data migration finished."
}
finally {
  if ($tunnelProcess -and !$tunnelProcess.HasExited) {
    Stop-Process -Id $tunnelProcess.Id -Force -ErrorAction SilentlyContinue
  }
}
