#!/usr/bin/env bash

# ==============================================================================
# Enterprise Data Platform - 24/7 Production Supervisor Daemon
# ==============================================================================

BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$BASE_DIR"

LOCK_FILE="$BASE_DIR/.supervisor.lock"

# Singleton protection: only ONE supervisor may run at any time
exec 200>"$LOCK_FILE"
if ! flock -n 200; then
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Another supervisor instance is already active. Exiting duplicate."
    exit 0
fi
echo "$$" > "$LOCK_FILE"

# Clean up duplicate desktop autostart to avoid conflict
rm -f "$HOME/.config/autostart/dashboard-autostart.desktop" 2>/dev/null || true

# Extend PATH to prioritize virtual environment and standard binary paths
export PATH="$BASE_DIR/.venv/bin:$HOME/.local/bin:/usr/local/bin:/usr/bin:/bin:$PATH"

BACKEND_PID=""
FRONTEND_PID=""
BACKEND_FAIL_COUNT=0
FRONTEND_FAIL_COUNT=0

cleanup() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Supervisor received stop signal. Terminating platform..."
    if [ -n "$BACKEND_PID" ]; then
        kill -TERM "$BACKEND_PID" 2>/dev/null || true
    fi
    if [ -n "$FRONTEND_PID" ]; then
        kill -TERM "$FRONTEND_PID" 2>/dev/null || true
    fi
    sleep 2
    fuser -k 8001/tcp 5173/tcp 2>/dev/null || true
    pkill -f "uvicorn backend.main:app" 2>/dev/null || true
    pkill -f "node.*vite" 2>/dev/null || true
    rm -f "$LOCK_FILE"
    exit 0
}

trap cleanup SIGINT SIGTERM EXIT

start_backend() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Starting FastAPI Backend on 0.0.0.0:8001..."
    fuser -k 8001/tcp 2>/dev/null || true
    sleep 1

    if [ -x "$BASE_DIR/.venv/bin/python3" ]; then
        PYTHON_BIN="$BASE_DIR/.venv/bin/python3"
    elif [ -x "$BASE_DIR/.venv/bin/python" ]; then
        PYTHON_BIN="$BASE_DIR/.venv/bin/python"
    else
        PYTHON_BIN="python3"
    fi

    # Run without --reload for 24/7 background stability
    $PYTHON_BIN -m uvicorn backend.main:app --host 0.0.0.0 --port 8001 >> "$BASE_DIR/backend.log" 2>&1 &
    BACKEND_PID=$!
    BACKEND_FAIL_COUNT=0
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Backend launched (PID: $BACKEND_PID)"
}

start_frontend() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Starting Vite Frontend on 0.0.0.0:5173..."
    fuser -k 5173/tcp 2>/dev/null || true
    sleep 1

    cd "$BASE_DIR/frontend"

    # Find node executable
    if [ -x "$BASE_DIR/.venv/bin/node" ]; then
        NODE_BIN="$BASE_DIR/.venv/bin/node"
    elif [ -x "$HOME/snap/antigravity-cli/common/local/bin/node" ]; then
        NODE_BIN="$HOME/snap/antigravity-cli/common/local/bin/node"
    else
        NODE_BIN="$(command -v node || echo node)"
    fi

    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Using Node: $NODE_BIN ($($NODE_BIN -v 2>&1))" >> "$BASE_DIR/frontend.log"

    if [ -f "node_modules/vite/bin/vite.js" ]; then
        $NODE_BIN node_modules/vite/bin/vite.js --host 0.0.0.0 --port 5173 >> "$BASE_DIR/frontend.log" 2>&1 &
    else
        npx vite --host 0.0.0.0 --port 5173 >> "$BASE_DIR/frontend.log" 2>&1 &
    fi
    FRONTEND_PID=$!
    FRONTEND_FAIL_COUNT=0
    cd "$BASE_DIR"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Frontend launched (PID: $FRONTEND_PID)"
}

is_backend_healthy() {
    if [ -z "$BACKEND_PID" ] || ! kill -0 "$BACKEND_PID" 2>/dev/null; then
        return 1
    fi
    if curl -s -f -m 5 "http://127.0.0.1:8001/api/health" >/dev/null 2>&1; then
        return 0
    fi
    return 1
}

is_frontend_healthy() {
    if [ -z "$FRONTEND_PID" ] || ! kill -0 "$FRONTEND_PID" 2>/dev/null; then
        return 1
    fi
    if curl -s -f -m 5 "http://127.0.0.1:5173" >/dev/null 2>&1; then
        return 0
    fi
    return 1
}

echo "======================================================================"
echo "  Enterprise Data Platform - High Availability Supervisor Active"
echo "======================================================================"

# Initial start
start_backend
start_frontend

# Startup grace period (10 seconds)
echo "[*] Services initiated. Entering 10-second stabilization grace period..."
sleep 10

# Watchdog loop
while true; do
    sleep 10

    if is_backend_healthy; then
        BACKEND_FAIL_COUNT=0
    else
        BACKEND_FAIL_COUNT=$((BACKEND_FAIL_COUNT + 1))
        echo "[!] [$(date '+%Y-%m-%d %H:%M:%S')] Backend health check failed ($BACKEND_FAIL_COUNT/3)"
        if [ "$BACKEND_FAIL_COUNT" -ge 3 ]; then
            echo "[!] [$(date '+%Y-%m-%d %H:%M:%S')] Backend failed 3 consecutive checks. Restarting..."
            start_backend
            sleep 5
        fi
    fi

    if is_frontend_healthy; then
        FRONTEND_FAIL_COUNT=0
    else
        FRONTEND_FAIL_COUNT=$((FRONTEND_FAIL_COUNT + 1))
        echo "[!] [$(date '+%Y-%m-%d %H:%M:%S')] Frontend health check failed ($FRONTEND_FAIL_COUNT/3)"
        if [ "$FRONTEND_FAIL_COUNT" -ge 3 ]; then
            echo "[!] [$(date '+%Y-%m-%d %H:%M:%S')] Frontend failed 3 consecutive checks. Restarting..."
            start_frontend
            sleep 5
        fi
    fi
done
