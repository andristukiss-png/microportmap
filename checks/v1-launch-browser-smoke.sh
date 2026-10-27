#!/usr/bin/env bash
set -euo pipefail
chrome="$(command -v google-chrome || command -v chromium || command -v chromium-browser || true)"
test -n "$chrome" || { echo 'Chromium required' >&2;exit 1; }
mkdir -p checks/v1-launch-screenshots
python3 checks/v1-launch-browser-server.py >/tmp/v1-http.log 2>&1 &
pid=$!
trap 'kill "$pid" 2>/dev/null || true' EXIT
for i in {1..35};do curl -fsS http://127.0.0.1:8798/__v1_probe.js >/dev/null 2>&1 && break;sleep .2;done
for spec in 'atlas:/' 'directory:/directory/' 'passport:/projects/kiel/' 'quality:/data-quality/' 'correction:/submit/?project=kiel' 'privacy:/privacy/' 'cookies:/cookies/';do
 IFS=: read -r name route <<< "$spec"
 for size in 'desktop:1440,900' 'mobile:390,844';do
  IFS=: read -r mode viewport <<< "$size"
  profile="$(mktemp -d)";dump="/tmp/v1-$name-$mode.html"
  timeout 75s "$chrome" --headless=new --no-sandbox --disable-dev-shm-usage --disable-gpu --disable-background-networking --host-resolver-rules='MAP unpkg.com ~NOTFOUND' --user-data-dir="$profile" --window-size="$viewport" --virtual-time-budget=9500 --dump-dom "http://127.0.0.1:8798$route" > "$dump" 2>/tmp/v1-chrome.log || { cat /tmp/v1-chrome.log >&2;exit 1; }
  if ! grep -q 'id="v1-browser-result"[^>]*>PASS:' "$dump";then grep -o 'id="v1-browser-result"[^<]*' "$dump" >&2 || true;exit 1;fi
  rm -rf "$profile";profile="$(mktemp -d)"
  timeout 75s "$chrome" --headless=new --no-sandbox --disable-dev-shm-usage --disable-gpu --disable-background-networking --host-resolver-rules='MAP unpkg.com ~NOTFOUND' --user-data-dir="$profile" --window-size="$viewport" --virtual-time-budget=9500 --screenshot="$PWD/checks/v1-launch-screenshots/$name-$mode.png" "http://127.0.0.1:8798$route" >/tmp/v1-screenshot.log 2>&1 || { cat /tmp/v1-screenshot.log >&2;exit 1; }
  test -s "checks/v1-launch-screenshots/$name-$mode.png";rm -rf "$profile"
  echo "PASS: $name $mode V1 route, layout, labels and scope disclosures"
 done
done
