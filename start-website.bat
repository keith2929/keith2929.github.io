@echo off
cd /d %~dp0
echo Starting API server...
start /b node server.js
echo Starting Vite dev server...
start /b npm run dev
echo Waiting for servers to start...
timeout /t 4 /nobreak >nul
start http://localhost:5173
echo Both servers are running.
echo Close this window to stop everything.
pause
