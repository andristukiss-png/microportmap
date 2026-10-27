#!/usr/bin/env bash
set -euo pipefail
chrome="$(command -v google-chrome || command -v chromium || command -v chromium-browser || true)"
test -n "$chrome" || { echo 'Chromium required' >&2;exit 1; }
mkdir -p checks/equipment-recovery-screenshots
python3 checks/equipment-recovery-browser-server.py >/tmp/er-http.log 2>&1 &
pid=$!
trap 'kill "$pid" 2>/dev/null || true' EXIT
for i in {1..35};do curl -fsS http://127.0.0.1:8799/__er_probe.js >/dev/null 2>&1 && break;sleep .2;done
for id in shenzhen kiel rotterdam;do
 for spec in 'desktop:1440,900' 'mobile:390,844';do
  IFS=: read -r mode viewport <<< "$spec"
  profile="$(mktemp -d)";dump="/tmp/er-$id-$mode.html"
  timeout 75s "$chrome" --headless=new --no-sandbox --disable-dev-shm-usage --disable-gpu --disable-background-networking --user-data-dir="$profile" --window-size="$viewport" --virtual-time-budget=9500 --dump-dom "http://127.0.0.1:8799/technologies/?case=$id" > "$dump" 2>/tmp/er-chrome.log || { cat /tmp/er-chrome.log >&2;exit 1; }
  if ! grep -q 'id="er-probe-result"[^>]*>PASS:' "$dump";then grep -o 'id="er-probe-result"[^<]*' "$dump" >&2 || true;exit 1;fi
  rm -rf "$profile";profile="$(mktemp -d)"
  timeout 75s "$chrome" --headless=new --no-sandbox --disable-dev-shm-usage --disable-gpu --disable-background-networking --user-data-dir="$profile" --window-size="$viewport" --virtual-time-budget=9500 --screenshot="$PWD/checks/equipment-recovery-screenshots/$id-$mode.png" "http://127.0.0.1:8799/technologies/?case=$id" >/tmp/er-screenshot.log 2>&1 || { cat /tmp/er-screenshot.log >&2;exit 1; }
  test -s "checks/equipment-recovery-screenshots/$id-$mode.png";rm -rf "$profile"
  echo "PASS: $id $mode equipment lookup recovery, history and copy/export"
 done
done
