#!/usr/bin/env bash

# ==============================================================================
# Enterprise Data Platform - Clean Distribution Packager
# ==============================================================================
# Packages the entire application for sharing with another person.
# Excludes temporary logs, pre-migration backups, and git history to minimize size.
# ==============================================================================

set -e

BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$BASE_DIR"

PARENT_DIR="$(dirname "$BASE_DIR")"
FOLDER_NAME="$(basename "$BASE_DIR")"
OUTPUT_ZIP="$PARENT_DIR/${FOLDER_NAME}_ReadyToShare.zip"

echo "======================================================================"
echo "  📦 Packaging Enterprise Data Dashboard for Clean Sharing"
echo "======================================================================"
echo "  Source Folder: $BASE_DIR"
echo "  Target Zip:    $OUTPUT_ZIP"
echo "======================================================================"

cd "$PARENT_DIR"

# Pre-build frontend distribution before zipping to guarantee offline static serving
if [ -d "$FOLDER_NAME/frontend" ]; then
    echo "[*] Ensuring frontend distribution bundle is compiled..."
    (cd "$FOLDER_NAME/frontend" && npm run build 2>/dev/null || true)
fi

echo "[*] Compressing files (excluding backup files and temporary caches)..."

zip -r "$OUTPUT_ZIP" "$FOLDER_NAME" \
    -x "$FOLDER_NAME/database/data.db.backup" \
    -x "$FOLDER_NAME/database/test.db" \
    -x "$FOLDER_NAME/database/analytics.db" \
    -x "$FOLDER_NAME/.git/*" \
    -x "$FOLDER_NAME/.venv/*" \
    -x "$FOLDER_NAME/*.log" \
    -x "$FOLDER_NAME/.supervisor.lock" \
    -x "*/__pycache__/*" \
    -x "*.pyc" \
    -x "$FOLDER_NAME/frontend/node_modules/.cache/*"

echo ""
echo "======================================================================"
echo "  ✅ Package Created Successfully!"
echo "======================================================================"
echo "  File: $OUTPUT_ZIP"
echo "  Size: $(du -h "$OUTPUT_ZIP" | awk '{print $1}')"
echo "======================================================================"
echo "  Instructions for the recipient:"
echo "    1. Unzip the file"
echo "    2. Run: ./start.sh  (Linux/macOS)  OR  start.bat  (Windows)"
echo "    3. The application will auto-configure and open in the browser!"
echo "======================================================================"
