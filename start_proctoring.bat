@echo off
title Sentinel AI - Online Exam Proctoring System Launcher
color 0b

echo =====================================================================
echo          SENTINEL AI - AUTONOMOUS ONLINE EXAM PROCTORING
echo =====================================================================
echo.
echo [*] Starting Local AI Proctoring Server...
echo [*] Opening your browser at http://localhost:5173/
echo.

cd /d "%~dp0"

:: Check if Node is installed
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [!] Node.js not detected in PATH.
    echo [*] Checking for Python fallback server...
    where python >nul 2>&1
    if %errorlevel% equ 0 (
        echo [*] Starting Python server on dist folder...
        cd dist
        start http://localhost:8000
        python -m http.server 8000
        pause
        exit /b
    ) else (
        echo [!] Neither Node.js nor Python detected. Please install Node.js (v18+) to run the server.
        pause
        exit /b
    )
)

:: If node is present, start dev server
start http://localhost:5173/
call npm.cmd run dev -- --host --port 5173
if %errorlevel% neq 0 (
    call npm run dev -- --host --port 5173
)

pause
