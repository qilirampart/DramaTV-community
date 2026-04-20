param(
  [Parameter(ValueFromRemainingArguments = $true)]
  [string[]]$CommandArgs
)

$workspace = Split-Path -Parent $PSScriptRoot
$javaHome = Join-Path $workspace '.tools\jdk-17'
$mavenHome = Join-Path $workspace '.tools\apache-maven-3.9.14'
$mavenRepo = Join-Path $workspace '.tools\m2\repository'

if (!(Test-Path $javaHome)) {
  throw "Local Java 17 toolchain not found: $javaHome"
}

if (!(Test-Path $mavenHome)) {
  throw "Local Maven toolchain not found: $mavenHome"
}

New-Item -ItemType Directory -Force -Path $mavenRepo | Out-Null

$env:JAVA_HOME = $javaHome
$env:M2_HOME = $mavenHome
$env:PATH = "$javaHome\bin;$mavenHome\bin;$env:PATH"

if ($CommandArgs.Count -eq 0) {
  Write-Output "JAVA_HOME=$env:JAVA_HOME"
  Write-Output "M2_HOME=$env:M2_HOME"
  Write-Output "MAVEN_REPO=$mavenRepo"
  & "$mavenHome\bin\mvn.cmd" "-Dmaven.repo.local=$mavenRepo" -version
  exit $LASTEXITCODE
}

$mavenArgs = @(
  "-Dmaven.repo.local=$mavenRepo"
) + $CommandArgs

& "$mavenHome\bin\mvn.cmd" @mavenArgs
exit $LASTEXITCODE
