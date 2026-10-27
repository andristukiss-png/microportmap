#!/usr/bin/env bash
set -euo pipefail
chrome="$(command -v google-chrome || command -v chromium || command -v chromium-browser || true)"
test -n "$chrome" || { echo 'Chromium required' >&2;exit 1; }
mkdir -p checks/operator-reliability-screenshots
python3 checks/operator-reliability-browser-server.py >/tmp/or-http.log 2>&1 &
pid=$!
trap 'kill "$pid" 2>/dev/null || true' EXIT
for i in {1..35};do curl -fsS http://127.0.0.1:8797/__or_probe.js >/dev/null 2>&1 && break;sleep .2;done
for id in shenzhen kiel rotterdam;do
 for spec in 'desktop:1440,900' 'mobile:390,844';do
  IFS=: read -r mode viewport <<< "$spec"
  dump="/tmp/or-$id-$mode.html"
  for attempt in 1 2 3;do
   profile="$(mktemp -d)"
   timeout 75s "$chrome" --headless=new --no-sandbox --disable-dev-shm-usage --disable-gpu --disable-background-networking --user-data-dir="$profile" --window-size="$viewport" --virtual-time-budget=18000 --dump-dom "http://127.0.0.1:8797/operators/?case=$id" > "$dump" 2>/tmp/or-chrome.log || { cat /tmp/or-chrome.log >&2;exit 1; }
   rm -rf "$profile"
   if grep -q 'id="or-probe-result"[^>]*>PASS:' "$dump";then break;fi
   if ! grep -q 'id="or-probe-result"[^>]*>PENDING' "$dump";then grep -o 'id="or-probe-result"[^<]*' "$dump" >&2 || true;exit 1;fi
   echo "Inconclusive operator capture; retrying ($attempt/3)" >&2
  done
  if ! grep -q 'id="or-probe-result"[^>]*>PASS:' "$dump";then grep -o 'id="or-probe-result"[^<]*' "$dump" >&2 || true;exit 1;fi
  profile="$(mktemp -d)"
  timeout 75s "$chrome" --headless=new --no-sandbox --disable-dev-shm-usage --disable-gpu --disable-background-networking --user-data-dir="$profile" --window-size="$viewport" --virtual-time-budget=9500 --screenshot="$PWD/checks/operator-reliability-screenshots/$id-$mode.png" "http://127.0.0.1:8797/operators/?case=$id" >/tmp/or-screenshot.log 2>&1 || { cat /tmp/or-screenshot.log >&2;exit 1; }
  test -s "checks/operator-reliability-screenshots/$id-$mode.png";rm -rf "$profile"
  echo "PASS: $id $mode operator lookup recovery, history and copy/export"
 done
done
