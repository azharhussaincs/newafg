#!/usr/bin/env bash
# ==============================================================================
# Enterprise Data Platform Process Termination Script
# ==============================================================================

BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$BASE_DIR"

echo "[*] Stopping Data Analytics Platform services..."

# 1. Stop supervisor daemon so it doesn't automatically revive services
if [ -f "$BASE_DIR/.supervisor.lock" ]; then
    SUPERVISOR_PID=$(cat "$BASE_DIR/.supervisor.lock" 2>/dev/null || true)
    if [ -n "$SUPERVISOR_PID" ]; then
        kill "$SUPERVISOR_PID" 2>/dev/null || true
    fi
    rm -f "$BASE_DIR/.supervisor.lock"
fi
pkill -f "supervisor.sh" 2>/dev/null || true

# 2. Free ports and kill backend / frontend processes
fuser -k 8001/tcp 2>/dev/null || true
fuser -k 8000/tcp 2>/dev/null || true
fuser -k 5173/tcp 2>/dev/null || true
pkill -f "uvicorn backend.main:app" 2>/dev/null || true
pkill -f "node.*vite" 2>/dev/null || true

echo "[+] All Platform services stopped cleanly."
