# ============================================================
# Sync backend-exported data into src/data/resume.js
# Usage:
#   powershell -ExecutionPolicy Bypass -File sync-data.ps1 <exported.json|exported.zip>
#   (JSON / ZIP 均由后台「导出数据」按钮下载;
#    ZIP 内含大文件素材,本脚本自动解压:素材落到项目 assets/,数据写入 resume.js)
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

$dataFile = $JsonFile
if ($JsonFile -like '*.zip') {
  Write-Host '==> 检测到 zip 包,自动解压并同步素材'
  $tmp = Join-Path $PSScriptRoot '_sync_tmp'
  if (Test-Path $tmp) { Remove-Item $tmp -Recurse -Force }
  Expand-Archive -Path $JsonFile -DestinationPath $tmp -Force

  # zip 内的素材(assets/ 目录)复制到项目 assets/,随部署自动上传 GitHub
  if (Test-Path (Join-Path $tmp 'assets')) {
    New-Item -ItemType Directory -Force -Path 'assets' | Out-Null
    Copy-Item -Path (Join-Path $tmp 'assets\*') -Destination 'assets\' -Recurse -Force
    Write-Host '==> 素材已复制到项目 assets/(视频/图片将随部署上传 GitHub)'
  }

  $json = Get-ChildItem -Path $tmp -Filter *.json -File | Select-Object -First 1
  if (-not $json) {
    Write-Host 'ERROR: zip 中未找到 JSON 数据文件(请使用后台「导出数据」下载的 zip)'
    exit 1
  }
  $dataFile = $json.FullName
}

node tools/sync-data.js $dataFile
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

if ($JsonFile -like '*.zip') {
  Remove-Item (Join-Path $PSScriptRoot '_sync_tmp') -Recurse -Force
}

Write-Host ''
Write-Host 'Done! Now run:  powershell -ExecutionPolicy Bypass -File deploy.ps1'
