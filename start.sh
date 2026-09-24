#!/usr/bin/env bash

# ==============================================================================
# Enterprise Data Platform - Automated Zero-Friction Launcher
# ==============================================================================
# This script runs automatically out-of-the-box on any Linux or macOS system.
# When someone unzips this folder and runs `./start.sh` or `bash start.sh`:
#  1. Auto-configures permissions and .env settings
#  2. Auto-detects / repairs Python environment & installs missing dependencies
#  3. Auto-detects / builds Node.js Vite frontend (or uses FastAPI built-in server)
#  4. Frees ports and launches both Backend & Frontend
#  5. Auto-opens the browser and monitors services with clean Ctrl+C shutdown
# ==============================================================================

set -e

BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$BASE_DIR"

# 1. Ensure scripts are executable
chmod +x "$BASE_DIR"/*.sh "$BASE_DIR"/scripts/*.py 2>/dev/null || true

# 2. Check if supervisor daemon is already actively managing the platform
if [ -f "$BASE_DIR/.supervisor.lock" ]; then
    SUP_PID=$(cat "$BASE_DIR/.supervisor.lock" 2>/dev/null || true)
    if [ -n "$SUP_PID" ] && kill -0 "$SUP_PID" 2>/dev/null; then
        echo "======================================================================"
        echo "  Enterprise Civil Registry Platform is ALREADY RUNNING (PID $SUP_PID)"
        echo "======================================================================"
        echo "  📊 Dashboard URL:      http://localhost:5173"
        echo "  🌐 Network URL:        http://$(hostname -I 2>/dev/null | awk '{print $1}'):5173"
        echo "  📖 API Documentation:  http://localhost:8001/docs"
        echo "  🩺 Health Status:      http://localhost:8001/api/health"
        echo "======================================================================"
        echo "  Managed 24/7 by supervisor daemon. To stop, run: ./stop.sh"
        exit 0
    fi
fi

echo "======================================================================"
echo "  🚀 Starting Enterprise Civil Registry Data Platform"
echo "======================================================================"

# 3. Environment configuration auto-generation
if [ ! -f "$BASE_DIR/.env" ]; then
    if [ -f "$BASE_DIR/.env.example" ]; then
        echo "[*] Initializing .env configuration from template..."
        cp "$BASE_DIR/.env.example" "$BASE_DIR/.env"
    else
        cat <<EOF > "$BASE_DIR/.env"
DATA_FILE=./data/two.txt
DATABASE_FILE=./database/data.db
HOST=0.0.0.0
BACKEND_PORT=8001
FRONTEND_PORT=5173
EOF
    fi
fi

# 4. Port freeing helper (robust cross-platform)
free_port() {
    local port=$1
    fuser -k "${port}/tcp" 2>/dev/null || true
    if command -v lsof &>/dev/null; then
        lsof -ti:"${port}" 2>/dev/null | xargs kill -9 2>/dev/null || true
    fi
}
free_port 8001
free_port 5173
free_port 8000

# 5. Detect & Validate Python Runtime
if command -v python3 &>/dev/null; then
    SYS_PYTHON="python3"
elif command -v python &>/dev/null; then
    SYS_PYTHON="python"
else
    echo "[-] Error: Python 3 is required but not installed."
    echo "    Please install Python 3 (e.g., sudo apt install python3 python3-pip python3-venv)"
    exit 1
fi

VENV_DIR="$BASE_DIR/.venv"
# If .venv exists, verify it belongs to this current path (not moved from another computer)
if [ -d "$VENV_DIR" ]; then
    if ! "$VENV_DIR/bin/python3" -c "import sys; exit(0)" 2>/dev/null; then
        echo "[!] Detected relocation in existing virtual environment. Refreshing..."
        rm -rf "$VENV_DIR"
    fi
fi

# Check if required backend packages are available in system python
HAVE_PACKAGES=true
if ! $SYS_PYTHON -c "import fastapi, uvicorn, pydantic, reportlab, openpyxl, arabic_reshaper, bidi" 2>/dev/null; then
    HAVE_PACKAGES=false
fi

if [ "$HAVE_PACKAGES" = true ]; then
    PYTHON_BIN="$SYS_PYTHON"
else
    # Need virtual environment or package installation
    if [ ! -d "$VENV_DIR" ]; then
        echo "[*] Setting up isolated Python virtual environment in .venv..."
        $SYS_PYTHON -m venv "$VENV_DIR" 2>/dev/null || true
    fi
    if [ -f "$VENV_DIR/bin/activate" ]; then
        source "$VENV_DIR/bin/activate"
        PYTHON_BIN="$VENV_DIR/bin/python3"
        PIP_BIN="$VENV_DIR/bin/pip"
    else
        PYTHON_BIN="$SYS_PYTHON"
        PIP_BIN="$SYS_PYTHON -m pip"
    fi

    if ! $PYTHON_BIN -c "import fastapi, uvicorn, pydantic, reportlab, openpyxl, arabic_reshaper, bidi" 2>/dev/null; then
        echo "[*] Installing required backend packages (FastAPI, Uvicorn, ReportLab, etc.)..."
        $PIP_BIN install --quiet -r "$BASE_DIR/requirements.txt" || $PIP_BIN install -r "$BASE_DIR/requirements.txt"
    fi
fi

# 6. Verify Database
if [ ! -f "$BASE_DIR/database/data.db" ]; then
    if [ -f "$BASE_DIR/database/data.db.backup" ]; then
        echo "[!] Primary database/data.db missing. Restoring from verified backup..."
        cp "$BASE_DIR/database/data.db.backup" "$BASE_DIR/database/data.db"
    elif [ -f "$BASE_DIR/data/two.txt" ] || [ -f "$BASE_DIR/two.txt" ]; then
        echo "[*] Ingesting database from raw dataset two.txt..."
        $PYTHON_BIN "$BASE_DIR/scripts/ingest_fast.py"
    else
        echo "[!] Warning: database/data.db not found. Please place your database file in ./database/data.db"
    fi
fi

# 7. Setup & Configure Frontend
USE_VITE=false
if command -v node &>/dev/null && command -v npm &>/dev/null; then
    NODE_BIN="$(command -v node)"
    cd "$BASE_DIR/frontend"

    # Check if node_modules needs installation
    if [ ! -d "node_modules" ] || [ ! -f "node_modules/vite/bin/vite.js" ]; then
        echo "[*] Installing frontend dependencies (one-time initialization)..."
        npm install --silent
        echo "[*] Building production assets..."
        npm run build
    elif [ ! -d "dist" ]; then
        echo "[*] Building frontend distribution assets..."
        npm run build
    fi

    USE_VITE=true
    cd "$BASE_DIR"
else
    echo "[i] Node.js not detected on system. Running in zero-dependency unified mode."
    if [ -d "$BASE_DIR/frontend/dist" ]; then
        echo "[+] Compiled React dashboard will be served directly by FastAPI on port 8001."
    else
        echo "[!] Note: Install Node.js (v18+) for full Vite development server capabilities."
    fi
fi

# 8. Start Backend Service on Port 8001
echo "[*] Starting FastAPI Backend on http://0.0.0.0:8001..."
$PYTHON_BIN -m uvicorn backend.main:app --host 0.0.0.0 --port 8001 > "$BASE_DIR/backend.log" 2>&1 &
BACKEND_PID=$!

# 9. Start Frontend Service on Port 5173 (if Vite is available)
FRONTEND_PID=""
if [ "$USE_VITE" = true ]; then
    echo "[*] Starting Vite React Cyber-HUD Frontend on http://0.0.0.0:5173..."
    cd "$BASE_DIR/frontend"
    if [ -f "node_modules/vite/bin/vite.js" ]; then
        $NODE_BIN node_modules/vite/bin/vite.js --host 0.0.0.0 --port 5173 > "$BASE_DIR/frontend.log" 2>&1 &
    else
        npm run dev -- --host 0.0.0.0 --port 5173 > "$BASE_DIR/frontend.log" 2>&1 &
    fi
    FRONTEND_PID=$!
    cd "$BASE_DIR"
fi

# 10. Wait for Backend Health Check
echo -n "[*] Initializing services"
for i in {1..15}; do
    if curl -s -f -m 2 "http://127.0.0.1:8001/api/health" >/dev/null 2>&1; then
        echo " [READY]"
        break
    fi
    echo -n "."
    sleep 1
done

LOCAL_IP=$(hostname -I 2>/dev/null | awk '{print $1}')
[ -z "$LOCAL_IP" ] && LOCAL_IP=$(ip route get 1.1.1.1 2>/dev/null | awk '{print $7}')
[ -z "$LOCAL_IP" ] && LOCAL_IP="127.0.0.1"

MAIN_URL="http://localhost:5173"
NETWORK_URL="http://${LOCAL_IP}:5173"
if [ "$USE_VITE" != true ]; then
    MAIN_URL="http://localhost:8001"
    NETWORK_URL="http://${LOCAL_IP}:8001"
fi

echo ""
echo "======================================================================"
echo "  🚀 Enterprise Platform is RUNNING and READY!"
echo "======================================================================"
echo "  📊 Localhost URL:      $MAIN_URL"
echo "  🌐 Network Sharing:    $NETWORK_URL  (Any phone, laptop, or PC on Wi-Fi/LAN)"
echo "  📖 API Documentation:  http://localhost:8001/docs"
echo "  🩺 Health Status:      http://localhost:8001/api/health"
echo "======================================================================"
echo "  Press Ctrl+C to stop all services cleanly."
echo ""

# 11. Auto-open default browser
if [ -n "$DISPLAY" ] || [ -n "$WAYLAND_DISPLAY" ]; then
    if command -v xdg-open &>/dev/null; then
        xdg-open "$MAIN_URL" >/dev/null 2>&1 &
    elif command -v sensible-browser &>/dev/null; then
        sensible-browser "$MAIN_URL" >/dev/null 2>&1 &
    elif command -v open &>/dev/null; then
        open "$MAIN_URL" >/dev/null 2>&1 &
    fi
fi

# 12. Graceful Shutdown Signal Handler
cleanup() {
    echo ""
    echo "[*] Gracefully stopping services..."
    if [ -n "$BACKEND_PID" ]; then
        kill "$BACKEND_PID" 2>/dev/null || true
    fi
    if [ -n "$FRONTEND_PID" ]; then
        kill "$FRONTEND_PID" 2>/dev/null || true
    fi
    free_port 8001
    free_port 5173
    echo "[+] Platform stopped cleanly."
    exit 0
}

trap cleanup SIGINT SIGTERM

wait
