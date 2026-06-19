#!/usr/bin/env bash
set -euo pipefail
APP_DIR=/home/devbox/apps/wangshiyun-edu
echo '--- pid files ---'
for file in "$APP_DIR"/run/*.pid; do
  [ -e "$file" ] || continue
  pid=$(cat "$file" 2>/dev/null || true)
  if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then
    echo "$(basename "$file"): $pid running"
  else
    echo "$(basename "$file"): stale or stopped"
  fi
done
echo '--- ports ---'
(ss -ltnp 2>/dev/null || netstat -ltnp 2>/dev/null || true) | grep -E ':3003|:8088' || true
echo '--- health ---'
curl -fsS http://127.0.0.1:3003/health || true
echo
