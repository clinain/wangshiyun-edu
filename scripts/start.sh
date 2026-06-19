#!/usr/bin/env bash
set -euo pipefail
APP_DIR=/home/devbox/apps/wangshiyun-edu
RUN_DIR="$APP_DIR/run"
mkdir -p "$RUN_DIR" "$APP_DIR/backend/logs"
cd "$APP_DIR/backend"
nohup npm start > /home/devbox/wangshiyun_backend.log 2>&1 &
echo $! > "$RUN_DIR/backend.pid"
cd "$APP_DIR"
nohup python3 serve-wangshiyun.py > /home/devbox/wangshiyun_frontend.log 2>&1 &
echo $! > "$RUN_DIR/frontend.pid"
echo "wangshiyun started: backend pid $(cat "$RUN_DIR/backend.pid"), frontend pid $(cat "$RUN_DIR/frontend.pid")"
