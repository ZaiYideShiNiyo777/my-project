# ============================================================
# Sync backend-exported data into src/data/resume.js
# Usage:
#   powershell -ExecutionPolicy Bypass -File sync-data.ps1 <exported.json>
#   (the JSON file is downloaded via Admin panel "Export Data" button)
# After this, run deploy.ps1 to build & publish.
# ============================================================
param([Parameter(Mandatory = $true)][string]$JsonFile)

$ErrorActionPreference = 'Stop'
$NODE_DIR = 'd:\AI\tools\node16\node-v16.20.2-win-x64'
$env:Path = "$NODE_DIR;$env:Path"
Set-Location $PSScriptRoot

if (-not (Test-Path $JsonFile)) {
  Write-Host "ERROR: file not found: $JsonFile"
  exit 1
}

node tools/sync-data.js $JsonFile
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host ''
Write-Host 'Done! Now run:  powershell -ExecutionPolicy Bypass -File deploy.ps1'
