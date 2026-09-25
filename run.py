#!/usr/bin/env python3
"""
Enterprise Civil Registry Data Platform - Cross-Platform Universal Launcher
=============================================================================
Works out-of-the-box on Linux, Windows, macOS, and WSL.
Run with:
    python3 run.py   (Linux / macOS)
    python run.py    (Windows)

Automatically:
  - Verifies Python runtime
  - Generates .env configuration if missing
  - Installs missing Python backend dependencies from requirements.txt
  - Detects / installs Node.js frontend dependencies (or uses FastAPI static mode)
  - Manages ports and runs Backend + Frontend
  - Automatically opens your default web browser
  - Handles Ctrl+C graceful shutdown cleanly
=============================================================================
"""

import os
import sys
import time
import signal
import shutil
import subprocess
import socket
import webbrowser
from pathlib import Path
import urllib.request

BASE_DIR = Path(__file__).resolve().parent
os.chdir(str(BASE_DIR))

def get_local_ip():
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "127.0.0.1"

def print_banner():
    print("=" * 70)
    print("  🚀 Enterprise Civil Registry Data Platform - Universal Runner")
    print("=" * 70)

def check_env():
    env_file = BASE_DIR / ".env"
    example_file = BASE_DIR / ".env.example"
    if not env_file.exists():
        if example_file.exists():
            print("[*] Creating .env configuration from template...")
            shutil.copy(str(example_file), str(env_file))
        else:
            print("[*] Writing default .env configuration...")
            with open(env_file, "w", encoding="utf-8") as f:
                f.write("DATABASE_FILE=./database/data.db\n")
                f.write("HOST=0.0.0.0\n")
                f.write("BACKEND_PORT=8001\n")
                f.write("FRONTEND_PORT=5173\n")

def check_python_packages():
    required = ["fastapi", "uvicorn", "pydantic", "reportlab", "openpyxl", "arabic_reshaper", "bidi"]
    missing = []
    for pkg in required:
        try:
            __import__(pkg)
        except ImportError:
            missing.append(pkg)
    
    if missing:
        print(f"[*] Missing Python packages: {', '.join(missing)}")
        print("[*] Installing requirements from requirements.txt...")
        req_file = BASE_DIR / "requirements.txt"
        cmd = [sys.executable, "-m", "pip", "install", "--quiet", "-r", str(req_file)]
        res = subprocess.run(cmd)
        if res.returncode != 0:
            print("[!] Warning: Pip install returned non-zero code. Retrying with verbose output...")
            subprocess.run([sys.executable, "-m", "pip", "install", "-r", str(req_file)])

def check_database():
    db_file = BASE_DIR / "database" / "data.db"
    backup_file = BASE_DIR / "database" / "data.db.backup"
    two_file = BASE_DIR / "data" / "two.txt"
    if not db_file.exists():
        if backup_file.exists():
            print("[!] Primary data.db missing. Restoring from verified backup...")
            shutil.copy(str(backup_file), str(db_file))
        elif two_file.exists():
            print("[*] Ingesting database from raw two.txt dataset...")
            subprocess.run([sys.executable, str(BASE_DIR / "scripts" / "ingest_fast.py")])
        else:
            print("[!] Warning: database/data.db not found. Please place data.db in ./database/")

def setup_frontend():
    node_bin = shutil.which("node")
    npm_bin = shutil.which("npm")
    frontend_dir = BASE_DIR / "frontend"
    
    if node_bin and npm_bin and frontend_dir.exists():
        node_modules = frontend_dir / "node_modules"
        dist_dir = frontend_dir / "dist"
        
        if not node_modules.exists():
            print("[*] Installing frontend dependencies (npm install)...")
            subprocess.run([npm_bin, "install", "--silent"], cwd=str(frontend_dir), shell=(os.name == 'nt'))
            print("[*] Building frontend assets (npm run build)...")
            subprocess.run([npm_bin, "run", "build"], cwd=str(frontend_dir), shell=(os.name == 'nt'))
        elif not dist_dir.exists():
            print("[*] Building frontend distribution assets...")
            subprocess.run([npm_bin, "run", "build"], cwd=str(frontend_dir), shell=(os.name == 'nt'))
            
        return True
    else:
        print("[i] Node.js/npm not detected. Using zero-dependency FastAPI unified static mode.")
        return False

def main():
    print_banner()
    check_env()
    check_python_packages()
    check_database()
    has_node = setup_frontend()
    
    # Terminate stale processes on port 8001 / 5173 if on Unix
    if os.name != 'nt':
        for port in [8001, 5173]:
            subprocess.run(f"fuser -k {port}/tcp 2>/dev/null || true", shell=True)
            subprocess.run(f"lsof -ti:{port} 2>/dev/null | xargs kill -9 2>/dev/null || true", shell=True)

    processes = []
    
    # 1. Start Backend
    print("[*] Starting FastAPI Backend on http://0.0.0.0:8001...")
    backend_proc = subprocess.Popen(
        [sys.executable, "-m", "uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8001"],
        cwd=str(BASE_DIR)
    )
    processes.append(backend_proc)

    # 2. Start Frontend if Node is available
    frontend_proc = None
    if has_node:
        print("[*] Starting Vite React Frontend on http://0.0.0.0:5173...")
        npm_bin = shutil.which("npm")
        frontend_proc = subprocess.Popen(
            [npm_bin, "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"],
            cwd=str(BASE_DIR / "frontend"),
            shell=(os.name == 'nt')
        )
        processes.append(frontend_proc)

    # 3. Wait for backend ready
    print("[*] Initializing application services...", end="", flush=True)
    ready = False
    for _ in range(15):
        try:
            req = urllib.request.Request("http://127.0.0.1:8001/api/health")
            with urllib.request.urlopen(req, timeout=2) as response:
                if response.status == 200:
                    ready = True
                    break
        except Exception:
            pass
        print(".", end="", flush=True)
        time.sleep(1)
    print(" [READY]" if ready else " [STARTING]")

    local_ip = get_local_ip()
    port = 5173 if has_node else 8001
    local_url = f"http://localhost:{port}"
    network_url = f"http://{local_ip}:{port}"
    
    print("\n" + "=" * 70)
    print("  🚀 Enterprise Platform is RUNNING and READY!")
    print("======================================================================")
    print(f"  📊 Localhost URL:      {local_url}")
    print(f"  🌐 Network Access:     {network_url}  (Any phone, laptop, or PC)")
    print(f"  📖 API Documentation:  http://localhost:8001/docs")
    print(f"  🩺 Health Status:      http://localhost:8001/api/health")
    print("=" * 70)
    print("  Press Ctrl+C to terminate services cleanly.\n")

    # Auto-open browser
    try:
        webbrowser.open(local_url)
    except Exception:
        pass

    def shutdown(signum=None, frame=None):
        print("\n[*] Gracefully stopping platform services...")
        for p in processes:
            try:
                p.terminate()
                p.wait(timeout=3)
            except Exception:
                try:
                    p.kill()
                except Exception:
                    pass
        print("[+] Platform stopped cleanly.")
        sys.exit(0)

    signal.signal(signal.SIGINT, shutdown)
    signal.signal(signal.SIGTERM, shutdown)

    # Wait for processes
    try:
        backend_proc.wait()
    except KeyboardInterrupt:
        shutdown()

if __name__ == "__main__":
    main()
