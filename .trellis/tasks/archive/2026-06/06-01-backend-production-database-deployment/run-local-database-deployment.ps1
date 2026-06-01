param(
  [string]$LogPath = ".trellis/tasks/06-01-backend-production-database-deployment/deployment-run.log"
)

$ErrorActionPreference = "Stop"
$script:DatabaseUrl = ""
$script:AuthSecret = ""

function ConvertFrom-SecureInput([securestring]$secureValue) {
  $bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureValue)
  try {
    [Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr)
  } finally {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)
  }
}

function Redact-Output([string]$text) {
  $redacted = $text

  if ($script:DatabaseUrl) {
    $redacted = $redacted.Replace($script:DatabaseUrl, "[REDACTED_DATABASE_URL]")
  }

  if ($script:AuthSecret) {
    $redacted = $redacted.Replace($script:AuthSecret, "[REDACTED_AUTH_SECRET]")
  }

  $redacted = [regex]::Replace(
    $redacted,
    'postgres(?:ql)?://[^\s''"]+',
    "[REDACTED_DATABASE_URL]"
  )
  $redacted = [regex]::Replace(
    $redacted,
    'PostgreSQL database "[^"]+", schema "[^"]+" at "[^"]+"',
    'PostgreSQL database "[REDACTED_DATABASE]", schema "[REDACTED_SCHEMA]" at "[REDACTED_DATABASE_ENDPOINT]"'
  )

  return $redacted
}

function Write-StepLog([string]$message) {
  $line = "$(Get-Date -Format o) $message"
  Add-Content -Path $LogPath -Value $line -Encoding UTF8
  Write-Host $message
}

function Invoke-LoggedStep([string]$name, [scriptblock]$action) {
  Write-StepLog "START $name"
  $global:LASTEXITCODE = 0
  $previousErrorActionPreference = $ErrorActionPreference

  try {
    $ErrorActionPreference = "Continue"
    $output = & $action 2>&1
    $exitCode = $global:LASTEXITCODE
  } finally {
    $ErrorActionPreference = $previousErrorActionPreference
  }

  foreach ($line in $output) {
    Write-StepLog (Redact-Output ([string]$line))
  }

  if ($exitCode -ne 0) {
    throw "$name failed with exit code $exitCode"
  }

  Write-StepLog "PASS $name"
}

try {
  $logDirectory = Split-Path -Parent $LogPath
  if ($logDirectory) {
    New-Item -ItemType Directory -Force -Path $logDirectory | Out-Null
  }

  Set-Content -Path $LogPath -Value "Database deployment run started $(Get-Date -Format o)" -Encoding UTF8

  Write-Host "Enter DATABASE_URL (input hidden):"
  $script:DatabaseUrl = ConvertFrom-SecureInput (Read-Host -AsSecureString)
  if ([string]::IsNullOrWhiteSpace($script:DatabaseUrl)) {
    throw "DATABASE_URL is required."
  }

  Write-Host "Enter AUTH_SECRET (input hidden):"
  $script:AuthSecret = ConvertFrom-SecureInput (Read-Host -AsSecureString)
  if ([string]::IsNullOrWhiteSpace($script:AuthSecret)) {
    throw "AUTH_SECRET is required."
  }

  $env:DATABASE_URL = $script:DatabaseUrl
  $env:AUTH_SECRET = $script:AuthSecret
  $env:SKILLS_REPO_ENABLE_INTERNAL_AUTH = "true"

  Invoke-LoggedStep "Prisma generate" { npm.cmd run prisma:generate }
  Invoke-LoggedStep "Prisma migrate deploy" { npm.cmd run prisma:deploy }

  Invoke-LoggedStep "Pre-seed row counts" { npx.cmd tsx prisma/counts.ts --label "Before seed counts" }

  Write-Host ""
  Write-Host "Seed will replace demo/business verification tables."
  Write-Host "Type SEED to continue, or anything else to abort:"
  $seedConfirmation = Read-Host
  if ($seedConfirmation -ne "SEED") {
    throw "Seed step aborted by user."
  }

  Invoke-LoggedStep "Prisma db seed" { npx.cmd prisma db seed }
  Invoke-LoggedStep "Database smoke" { npm.cmd run prisma:smoke }
  Write-StepLog "PASS Database deployment verification completed"
} catch {
  Write-StepLog ("FAIL " + (Redact-Output ([string]$_.Exception.Message)))
  exit 1
} finally {
  Remove-Item Env:\DATABASE_URL -ErrorAction SilentlyContinue
  Remove-Item Env:\AUTH_SECRET -ErrorAction SilentlyContinue
  Remove-Item Env:\SKILLS_REPO_ENABLE_INTERNAL_AUTH -ErrorAction SilentlyContinue
  $script:DatabaseUrl = ""
  $script:AuthSecret = ""
  Write-Host ""
  Write-Host "Press Enter to close this window."
  Read-Host | Out-Null
}
