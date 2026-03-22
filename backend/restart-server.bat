@echo off
echo 正在停止后端服务...
taskkill /F /IM practice-system.exe 2>nul
taskkill /F /FI "WINDOWTITLE eq go*" 2>nul
timeout /t 2 /nobreak >nul

echo 正在启动后端服务...
cd /d "%~dp0"
start "practice-system" practice-system.exe

echo 后端服务已启动！
pause
