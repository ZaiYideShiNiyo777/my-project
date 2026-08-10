@echo off
chcp 65001 >nul
title 我的作品集 - 启动器
rem ============================================
rem  个人作品集网页 一键启动脚本
rem  双击此文件即可启动网站并自动打开浏览器
rem ============================================

rem 检查端口 3001 是否已有服务在运行（避免重复启动）
netstat -ano | findstr ":3001 .*LISTENING" >nul
if not errorlevel 1 goto open

rem 启动开发服务器（最小化窗口后台运行）
cd /d "D:\AI\AI_Porject\Resume\portfolio"
rem 将便携版 Node.js 加入 PATH（未安装全局 node 时也能运行）
if exist "D:\AI\tools\node16\node-v16.20.2-win-x64\node.exe" (
  set "PATH=D:\AI\tools\node16\node-v16.20.2-win-x64;%PATH%"
)
start /min cmd /c "npx webpack-dev-server --mode development --port 3001"

rem 等待服务器就绪（每隔 2 秒检测一次端口）
:wait
timeout /t 2 /nobreak >nul
netstat -ano | findstr ":3001 .*LISTENING" >nul
if errorlevel 1 goto wait

:open
start "" http://localhost:3001
