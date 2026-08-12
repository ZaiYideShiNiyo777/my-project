# ============================================================
# Build & deploy portfolio to GitHub Pages
# Usage:
#   powershell -ExecutionPolicy Bypass -File deploy.ps1
#   powershell -ExecutionPolicy Bypass -File deploy.ps1 -UseProxy   (when direct connection fails)
# What it does:
#   1. npm run build (produces dist/)
#   2. commit dist/ on main branch
#   3. sync dist/ content to gh-pages branch (worktree) and push
#   4. push main
# Live URL: https://zaiyideshiniyo777.github.io/my-project/
# ============================================================
param([switch]$UseProxy)

$ErrorActionPreference = 'Continue'
$NODE_DIR = 'd:\AI\tools\node16\node-v16.20.2-win-x64'
$env:Path = "$NODE_DIR;$env:Path"
Set-Location $PSScriptRoot

# git base args: use gh CLI as credential helper (no password prompt)
$GIT = @('-c', 'credential.helper=!C:/Users/16634/gh-cli/bin/gh.exe auth git-credential')
if ($UseProxy) { $GIT += @('-c', 'http.proxy=socks5://127.0.0.1:7890') }

Write-Host '==> 1/4 npm run build'
npm run build
if ($LASTEXITCODE -ne 0) { Write-Host 'BUILD FAILED'; exit 1 }

# copy project assets/ (videos, images) into dist/assets so they ship with the site
if (Test-Path 'assets') {
  Write-Host '==> 1b/4 copy assets -> dist/assets'
  New-Item -ItemType Directory -Force -Path 'dist\assets' | Out-Null
  Copy-Item -Path 'assets\*' -Destination 'dist\assets\' -Recurse -Force
}

Write-Host '==> 2/4 commit dist on main'
git add dist
git commit -m 'build: update dist' 2>$null | Out-Null
if ($LASTEXITCODE -ne 0) { Write-Host '  (no dist changes)' }

Write-Host '==> 3/4 sync dist to gh-pages branch'
& git @GIT fetch origin gh-pages
if ($LASTEXITCODE -ne 0) { Write-Host 'FETCH FAILED - check network or use -UseProxy'; exit 1 }
if (Test-Path '.deploy-tmp') { & git @GIT worktree remove '.deploy-tmp' --force 2>$null }
& git @GIT worktree add '.deploy-tmp' origin/gh-pages
# 先清空 worktree(保留 .git),再整体复制 dist,确保 dist 中已删除的文件不会残留在站点
Get-ChildItem -Path '.deploy-tmp' -Force | Where-Object { $_.Name -ne '.git' } | Remove-Item -Recurse -Force
Copy-Item -Path 'dist\*' -Destination '.deploy-tmp\' -Recurse -Force
& git @GIT -C '.deploy-tmp' add -A
& git @GIT -C '.deploy-tmp' commit -m 'deploy: update site' 2>$null | Out-Null
& git @GIT -C '.deploy-tmp' push origin HEAD:gh-pages
if ($LASTEXITCODE -ne 0) { Write-Host 'GH-PAGES PUSH FAILED - check network or use -UseProxy'; exit 1 }
& git @GIT worktree remove '.deploy-tmp' --force

Write-Host '==> 4/4 push main'
& git @GIT push origin main
if ($LASTEXITCODE -ne 0) { Write-Host 'MAIN PUSH FAILED - check network or use -UseProxy'; exit 1 }

Write-Host ''
Write-Host 'Done! Live at https://zaiyideshiniyo777.github.io/my-project/'
Write-Host '(GitHub Pages takes ~1-3 minutes to refresh)'
