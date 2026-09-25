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
Environment=PATH=/home/$CURRENT_USER/snap/antigravity-cli/common/local/bin:$BASE_DIR/.venv/bin:/home/$CURRENT_USER/.local/bin:/usr/local/bin:/usr/bin:/bin
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

INSTALLED_SYSTEMD=false

if [ "$(id -u)" -eq 0 ]; then
    echo "[*] Installing systemd service as root..."
    cp "$BASE_DIR/dashboard.service" /etc/systemd/system/dashboard.service
    systemctl daemon-reload
    systemctl enable dashboard.service
    echo "[+] Systemd service enabled to automatically boot on system restart!"
    echo "[*] Starting dashboard service now..."
    systemctl restart dashboard.service
    INSTALLED_SYSTEMD=true
elif command -v sudo &>/dev/null; then
    echo "[*] Attempting systemd service installation with sudo..."
    if sudo cp "$BASE_DIR/dashboard.service" /etc/systemd/system/dashboard.service 2>/dev/null; then
        sudo systemctl daemon-reload
        sudo systemctl enable dashboard.service
        echo "[+] Systemd service enabled to automatically boot on system restart!"
        echo "[*] Starting dashboard service now..."
        sudo systemctl restart dashboard.service
        INSTALLED_SYSTEMD=true
    fi
fi

# Configure desktop autostart as complement/fallback
if [ -d "$HOME/.config" ]; then
    mkdir -p "$HOME/.config/autostart" 2>/dev/null || true
    if cp "$BASE_DIR/dashboard-autostart.desktop" "$HOME/.config/autostart/" 2>/dev/null; then
        echo "[+] Desktop autostart configured at ~/.config/autostart/dashboard-autostart.desktop"
    fi
fi

# Configure cron @reboot if available
if command -v crontab &>/dev/null; then
    (crontab -l 2>/dev/null | grep -F -v "supervisor.sh" ; echo "@reboot $BASE_DIR/supervisor.sh >/dev/null 2>&1") | crontab - 2>/dev/null && echo "[+] Cron @reboot entry configured." || true
fi

echo "======================================================================"
if [ "$INSTALLED_SYSTEMD" = true ]; then
    echo "  Setup Complete! Systemd service 'dashboard.service' is ACTIVE and ENABLED."
    echo "  The platform will automatically start on every reboot / system boot."
else
    echo "  Systemd service file prepared at: $BASE_DIR/dashboard.service"
    echo "  To enable 24/7 boot daemon with root privileges, simply run:"
    echo "    sudo ./install_autostart.sh"
    echo "    (or: sudo cp dashboard.service /etc/systemd/system/ && sudo systemctl enable --now dashboard.service)"
fi
echo "  Singleton protection is active to prevent any duplicate instances."
echo "======================================================================"
