#!/usr/bin/env bash
# Universal launcher alias pointing to start.sh
BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec bash "$BASE_DIR/start.sh" "$@"
