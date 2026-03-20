@echo off
cd /d %~dp0
echo Starting dev server...
start /b npm run dev
echo Waiting for server to start...
timeout /t 4 /nobreak >nul
start http://localhost:5173
echo Server is running. Press Ctrl+C in this window to stop.
pause