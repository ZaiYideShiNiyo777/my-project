# 一键生产构建脚本（微信云托管 + 腾讯云静态托管）
# 用法（PowerShell）：
#   .\build-prod.ps1 -ApiBase "https://你的云托管后端域名"
# 产物：dist-web.zip（上传到腾讯云静态网站托管）
param(
    [Parameter(Mandatory = $true)]
    [string]$ApiBase
)

$ErrorActionPreference = 'Stop'

# 便携版 Node 环境（与开发环境一致）
$nodeDir = 'D:\AI\tools\node-v22.23.2-win-x64'
if (Test-Path "$nodeDir\node.exe") {
    $env:Path = "$nodeDir;" + $env:Path
    $nodeExe = "$nodeDir\node.exe"
} else {
    $nodeExe = 'node'
}

Set-Location $PSScriptRoot

# 1) 注入后端公网域名 -> .env.production
#    注意：必须用 .NET WriteAllText + UTF8Encoding($false)（无 BOM），
#    PowerShell Set-Content -Encoding UTF8 会写 BOM 导致 vite 读不到 VITE_API_BASE
[System.IO.File]::WriteAllText(
    (Join-Path $PSScriptRoot '.env.production'),
    "VITE_API_BASE=$ApiBase`n",
    (New-Object System.Text.UTF8Encoding($false))
)
Write-Host "VITE_API_BASE=$ApiBase"

# 2) 清理并构建（直接调 vite，避免 npm.cmd 执行策略/沙箱问题）
if (Test-Path dist) { Remove-Item dist -Recurse -Force }
& $nodeExe node_modules\vite\bin\vite.js build
if ($LASTEXITCODE -ne 0) { Write-Host '构建失败'; exit $LASTEXITCODE }

# 3) 打包 zip（上传静态托管用）
$zip = Join-Path $PSScriptRoot '..\dist-web.zip'
if (Test-Path $zip) { Remove-Item $zip -Force }
Compress-Archive -Path dist\* -DestinationPath $zip -Force

Write-Host ""
Write-Host "==== 构建完成 ===="
Write-Host "dist 目录: $PSScriptRoot\dist"
Write-Host "上传包:   $zip"
Write-Host "下一步：登录腾讯云静态网站托管控制台 -> 上传 dist-web.zip"
