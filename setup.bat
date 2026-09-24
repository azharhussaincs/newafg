@echo off
echo ======================================================================
echo   Enterprise Civil Registry Data Platform - Windows Setup
echo ======================================================================

REM 1. Check Python
python --version >nul 2>&1
if errorlevel 1 (
    echo [-] Error: Python 3 is required. Please install from python.org.
    exit /b 1
)

REM 2. Check Node
node --version >nul 2>&1
if errorlevel 1 (
    echo [-] Error: Node.js is required. Please install from nodejs.org.
    exit /b 1
)

REM 3. Setup environment
if not exist .env (
    echo [*] Creating .env from .env.example...
    copy .env.example .env
)

REM 4. Install backend requirements
echo [*] Installing Python backend packages...
pip install --quiet --upgrade pip
pip install --quiet fastapi uvicorn pydantic numpy scipy aiosqlite pandas

REM 5. Install frontend requirements
echo [*] Installing Frontend packages...
cd frontend
call npm install --silent
call npm run build
cd ..

REM 6. Check for Database or Raw Dataset
if exist database\data.db (
    echo [+] Ready: Found existing database\data.db! Skipping re-ingestion.
) else if exist data\two.txt (
    echo [*] Running high-speed zero-loss ingestion pipeline...
    python scripts\ingest_fast.py
) else if exist two.txt (
    echo [*] Running high-speed zero-loss ingestion pipeline...
    python scripts\ingest_fast.py
) else (
    echo [!] Warning: Neither database\data.db nor two.txt were found.
    echo [*] Please place data.db into database\ or raw two.txt into data\.
)

echo ======================================================================
echo   Setup Complete! Run start.bat to launch the application.
echo ======================================================================
pause
