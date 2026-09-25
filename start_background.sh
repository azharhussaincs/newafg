#!/usr/bin/env bash

# ==============================================================================
# Enterprise Data Platform - Headless Background Daemon Launcher
# ==============================================================================
# Runs the platform detached in the background without keeping any terminal open.
# Survives terminal closure, shell exits, and monitors services 24/7.
# ==============================================================================

BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$BASE_DIR"

# Stop any existing platform processes first
./stop.sh >/dev/null 2>&1 || true
sleep 1

# Launch supervisor detached in the background with nohup
if command -v setsid &>/dev/null && setsid true 2>/dev/null; then
    setsid nohup bash "$BASE_DIR/supervisor.sh" </dev/null >> "$BASE_DIR/supervisor.log" 2>&1 &
else
    nohup bash "$BASE_DIR/supervisor.sh" </dev/null >> "$BASE_DIR/supervisor.log" 2>&1 &
fi
SUPERVISOR_PID=$!
disown "$SUPERVISOR_PID" 2>/dev/null || true

# Give services a few seconds to start
sleep 4

echo "======================================================================"
echo "  🚀 Platform is running in the background (Headless Daemon Active)!"
echo "======================================================================"
echo "  Supervisor PID: $SUPERVISOR_PID"
echo "  You can safely CLOSE this terminal now - it will NOT stop."
echo "  The platform runs independently 24/7."
echo "======================================================================"
echo "  📊 Dashboard URL:      http://localhost:5173"
echo "  📖 API Documentation:  http://localhost:8001/docs"
echo "  🩺 Health Status:      http://localhost:8001/api/health"
echo "  📜 Logs:               tail -f supervisor.log"
echo "  🛑 To Stop:            ./stop.sh"
echo "======================================================================"
