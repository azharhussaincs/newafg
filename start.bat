@echo off
setlocal enabledelayedexpansion

REM ==============================================================================
REM Enterprise Civil Registry Data Platform - Windows Automated Launcher
REM ==============================================================================
REM Auto-detects runtime, installs missing packages, builds assets & launches app.
REM ==============================================================================

cd /d "%~dp0"
title Enterprise Civil Registry Data Platform

echo ======================================================================
echo   Starting Enterprise Civil Registry Data Platform
echo ======================================================================

REM 1. Check Python
python --version >nul 2>&1
if errorlevel 1 (
    py -3 --version >nul 2>&1
    if errorlevel 1 (
        echo [-] Error: Python 3 is required. Please install Python from https://python.org
        echo [*] Make sure to check "Add Python to PATH" during installation.
        pause
        exit /b 1
    ) else (
        set "PY_CMD=py -3"
    )
) else (
    set "PY_CMD=python"
)

REM 2. Environment file
if not exist .env (
    if exist .env.example (
        echo [*] Creating .env from template...
        copy .env.example .env >nul
    ) else (
        echo DATABASE_FILE=./database/data.db > .env
        echo HOST=0.0.0.0 >> .env
        echo BACKEND_PORT=8001 >> .env
        echo FRONTEND_PORT=5173 >> .env
    )
)

REM 3. Check Python backend dependencies
%PY_CMD% -c "import fastapi, uvicorn, pydantic, reportlab, openpyxl, arabic_reshaper, bidi" >nul 2>&1
if errorlevel 1 (
    echo [*] Installing required Python backend packages...
    %PY_CMD% -m pip install --quiet --upgrade pip
    %PY_CMD% -m pip install --quiet -r requirements.txt
)

REM 4. Check Database
if not exist database\data.db (
    if exist database\data.db.backup (
        echo [!] Restoring database from backup...
        copy database\data.db.backup database\data.db
    ) else if exist data\two.txt (
        echo [*] Ingesting database from raw dataset two.txt...
        %PY_CMD% scripts\ingest_fast.py
    ) else (
        echo [!] Warning: database\data.db not found. Place data.db into database\
    )
)

REM 5. Check Node.js and Frontend
set "USE_VITE=0"
node --version >nul 2>&1
if not errorlevel 1 (
    cd frontend
    if not exist node_modules (
        echo [*] Installing frontend dependencies (one-time setup)...
        call npm install --silent
        call npm run build
    ) else if not exist dist (
        echo [*] Building frontend assets...
        call npm run build
    )
    cd ..
    set "USE_VITE=1"
) else (
    echo [i] Node.js not detected. Serving compiled frontend directly via FastAPI.
)

REM 6. Launch Backend on Port 8001
echo [*] Starting FastAPI Backend on http://localhost:8001...
start "FastAPI Backend" /b %PY_CMD% -m uvicorn backend.main:app --host 0.0.0.0 --port 8001

REM 7. Launch Frontend on Port 5173 if Node is present
if "!USE_VITE!"=="1" (
    echo [*] Starting Vite React Frontend on http://localhost:5173...
    cd frontend
    start "Vite Frontend" /b npm run dev -- --host 0.0.0.0 --port 5173
    cd ..
    set "MAIN_URL=http://localhost:5173"
) else (
    set "MAIN_URL=http://localhost:8001"
)

set "NETWORK_IP=127.0.0.1"
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4 Address"') do (
    set "RAW_IP=%%a"
    set "NETWORK_IP=!RAW_IP: =!"
    goto :found_ip
)
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4"') do (
    set "RAW_IP=%%a"
    set "NETWORK_IP=!RAW_IP: =!"
    goto :found_ip
)
:found_ip

REM 8. Grace period and open browser
timeout /t 3 /nobreak >nul
start !MAIN_URL!

echo.
echo ======================================================================
echo   🚀 Enterprise Platform is RUNNING!
echo ======================================================================
echo   📊 Localhost URL:      !MAIN_URL!
if "!USE_VITE!"=="1" (
    echo   🌐 Network Access:     http://!NETWORK_IP!:5173  ^(Any device on LAN/Wi-Fi^)
) else (
    echo   🌐 Network Access:     http://!NETWORK_IP!:8001  ^(Any device on LAN/Wi-Fi^)
)
echo   📖 API Documentation:  http://localhost:8001/docs
echo   🩺 Health Status:      http://localhost:8001/api/health
echo ======================================================================
echo   To stop the platform, close this console window.
echo.
pause
