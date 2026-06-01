param(
  [int]$Port = 3001,
  [string]$LogPath = ".trellis/tasks/06-01-backend-production-database-deployment/dev-server-run.log"
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

function Write-StepLog([string]$message) {
  $line = "$(Get-Date -Format o) $message"
  Add-Content -Path $LogPath -Value $line -Encoding UTF8
  Write-Host $message
}

try {
  $logDirectory = Split-Path -Parent $LogPath
  if ($logDirectory) {
    New-Item -ItemType Directory -Force -Path $logDirectory | Out-Null
  }

  Set-Content -Path $LogPath -Value "Local dev server run started $(Get-Date -Format o)" -Encoding UTF8

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

  Write-StepLog "Starting Next.js dev server on http://localhost:$Port"
  Write-StepLog "Close this PowerShell window to stop the dev server."
  Start-Process `
    -FilePath "node.exe" `
    -ArgumentList @(".\node_modules\next\dist\bin\next", "dev", "--port", "$Port") `
    -WorkingDirectory (Get-Location).Path `
    -NoNewWindow `
    -Wait
} catch {
  Write-StepLog ("FAIL " + [string]$_.Exception.Message)
  Write-Host ""
  Write-Host "Press Enter to close this window."
  Read-Host | Out-Null
  exit 1
} finally {
  Remove-Item Env:\DATABASE_URL -ErrorAction SilentlyContinue
  Remove-Item Env:\AUTH_SECRET -ErrorAction SilentlyContinue
  Remove-Item Env:\SKILLS_REPO_ENABLE_INTERNAL_AUTH -ErrorAction SilentlyContinue
  $script:DatabaseUrl = ""
  $script:AuthSecret = ""
}
