#!/usr/bin/env bash
set -euo pipefail
APP_DIR=/home/devbox/apps/wangshiyun-edu
RUN_DIR="$APP_DIR/run"
stop_pid_file() {
  local file="$1"
  if [ -f "$file" ]; then
    local pid
    pid=$(cat "$file" 2>/dev/null || true)
    if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then
      kill "$pid" 2>/dev/null || true
    fi
    rm -f "$file"
  fi
}
stop_port() {
  local port="$1"
  local pids
  pids=$(ss -ltnp 2>/dev/null | awk -v port=":$port" '$4 ~ port {print $0}' | sed -n 's/.*pid=\([0-9][0-9]*\).*/\1/p' | sort -u || true)
  for pid in $pids; do
    if [ -n "$pid" ]; then
      kill "$pid" 2>/dev/null || true
    fi
  done
}
stop_pid_file "$RUN_DIR/backend.pid"
stop_pid_file "$RUN_DIR/frontend.pid"
stop_port 3003
stop_port 8088
sleep 2
for port in 3003 8088; do
  pids=$(ss -ltnp 2>/dev/null | awk -v port=":$port" '$4 ~ port {print $0}' | sed -n 's/.*pid=\([0-9][0-9]*\).*/\1/p' | sort -u || true)
  for pid in $pids; do
    kill -9 "$pid" 2>/dev/null || true
  done
done
echo 'wangshiyun stopped on ports 3003/8088'
