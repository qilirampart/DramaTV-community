param(
  [Parameter(ValueFromRemainingArguments = $true)]
  [string[]]$CommandArgs
)

$workspace = Split-Path -Parent $PSScriptRoot
$runner = Join-Path $workspace 'scripts\use-local-java17-maven.ps1'
$envFiles = @(
  (Join-Path $workspace 'apps/server/.env.example'),
  (Join-Path $workspace 'apps/server/.env')
)

foreach ($envFile in $envFiles) {
  if (!(Test-Path $envFile)) {
    continue
  }

  Get-Content $envFile | ForEach-Object {
    $line = $_.Trim()

    if ($line.Length -eq 0 -or $line.StartsWith('#')) {
      return
    }

    $parts = $line -split '=', 2
    if ($parts.Count -ne 2) {
      return
    }

    $name = $parts[0].Trim()
    $value = $parts[1].Trim()

    if ($name.Length -eq 0) {
      return
    }

    Set-Item -Path "Env:$name" -Value $value
  }
}

$runArgs = @(
  '-f',
  'apps/server/pom.xml',
  'spring-boot:run',
  '-Dspring-boot.run.profiles=local-db'
)

if ($CommandArgs.Count -gt 0) {
  $runArgs += $CommandArgs
}

& $runner @runArgs
exit $LASTEXITCODE
