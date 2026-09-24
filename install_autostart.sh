#!/usr/bin/env bash

# ==============================================================================
# Enterprise Data Platform - Enable System Autostart & Always-On Daemon
# ==============================================================================

set -e
BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "======================================================================"
echo "  Configuring Platform Autostart on Reboot (24/7 Always-On)"
echo "======================================================================"

# 1. Ensure scripts are executable
chmod +x "$BASE_DIR/supervisor.sh" "$BASE_DIR/start.sh" "$BASE_DIR/stop.sh"

# 2. Configure systemd service (preferred, robust background daemon)
CURRENT_USER="${SUDO_USER:-$(id -un)}"
cat <<EOF > "$BASE_DIR/dashboard.service"
[Unit]
Description=Civil Registry Enterprise Data Platform (FastAPI & Vite React)
After=network.target network-online.target
Wants=network-online.target

[Service]
Type=simple
User=$CURRENT_USER
WorkingDirectory=$BASE_DIR
ExecStart=$BASE_DIR/supervisor.sh
ExecStop=$BASE_DIR/stop.sh
Restart=always
RestartSec=5s
Environment=PATH=$BASE_DIR/.venv/bin:/usr/local/bin:/usr/bin:/bin
StandardOutput=append:$BASE_DIR/supervisor.log
StandardError=append:$BASE_DIR/supervisor.log

[Install]
WantedBy=multi-user.target
EOF

cat <<EOF > "$BASE_DIR/dashboard-autostart.desktop"
[Desktop Entry]
Type=Application
Exec=$BASE_DIR/supervisor.sh
Hidden=false
NoDisplay=false
X-GNOME-Autostart-enabled=true
Name=Civil Registry Dashboard
Comment=Enterprise Civil Registry Platform Supervisor
Icon=applications-system
EOF

if command -v systemctl &> /dev/null && [ "$(id -u)" -eq 0 -o -n "$SUDO_USER" ] || sudo -n true 2>/dev/null; then
    echo "[*] Installing systemd service..."
    sudo cp "$BASE_DIR/dashboard.service" /etc/systemd/system/dashboard.service
    sudo systemctl daemon-reload
    sudo systemctl enable dashboard.service
    # Remove desktop autostart to avoid duplicate launch
    rm -f "$HOME/.config/autostart/dashboard-autostart.desktop" 2>/dev/null || true
    echo "[+] Systemd service enabled to automatically boot on system restart!"
    echo "[*] Starting dashboard service now..."
    sudo systemctl restart dashboard.service
else
    # Fallback to desktop autostart only if systemd / sudo is not configured
    echo "[*] Configuring Desktop Autostart as fallback..."
    mkdir -p "$HOME/.config/autostart"
    cp "$BASE_DIR/dashboard-autostart.desktop" "$HOME/.config/autostart/"
    echo "[+] Desktop autostart configured at ~/.config/autostart/dashboard-autostart.desktop"
fi

echo "======================================================================"
echo "  Setup Complete! The platform will automatically start on every reboot"
echo "  with singleton protection to prevent duplicate instances."
echo "======================================================================"
