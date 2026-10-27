#!/usr/bin/env bash
set -euo pipefail
chrome="$(command -v google-chrome || command -v chromium || command -v chromium-browser || true)"
test -n "$chrome" || { echo 'Chromium required' >&2;exit 1; }
mkdir -p checks/country-recovery-screenshots
python3 checks/country-recovery-browser-server.py >/tmp/cr-http.log 2>&1 &
pid=$!
trap 'kill "$pid" 2>/dev/null || true' EXIT
ready=0
for i in {1..35};do if curl -fsS http://127.0.0.1:8800/__cr_probe.js >/dev/null 2>&1;then ready=1;break;fi;sleep .2;done
test "$ready" = 1 || { cat /tmp/cr-http.log >&2;exit 1; }
for id in shenzhen kiel rotterdam;do
 for spec in 'desktop:1440,900' 'mobile:390,844';do
  IFS=: read -r mode viewport <<< "$spec"
  profile="$(mktemp -d)";dump="/tmp/cr-$id-$mode.html"
  timeout 75s "$chrome" --headless=new --no-sandbox --disable-dev-shm-usage --disable-gpu --disable-background-networking --user-data-dir="$profile" --window-size="$viewport" --virtual-time-budget=9500 --dump-dom "http://127.0.0.1:8800/countries/?case=$id" > "$dump" 2>/tmp/cr-chrome.log || { cat /tmp/cr-chrome.log >&2;exit 1; }
  if ! grep -q 'id="cr-probe-result"[^>]*>PASS:' "$dump";then grep -o 'id="cr-probe-result"[^<]*' "$dump" >&2 || true;exit 1;fi
  rm -rf "$profile";profile="$(mktemp -d)"
  timeout 75s "$chrome" --headless=new --no-sandbox --disable-dev-shm-usage --disable-gpu --disable-background-networking --user-data-dir="$profile" --window-size="$viewport" --virtual-time-budget=9500 --screenshot="$PWD/checks/country-recovery-screenshots/$id-$mode.png" "http://127.0.0.1:8800/countries/?case=$id" >/tmp/cr-screenshot.log 2>&1 || { cat /tmp/cr-screenshot.log >&2;exit 1; }
  test -s "checks/country-recovery-screenshots/$id-$mode.png";rm -rf "$profile"
  echo "PASS: $id $mode country lookup recovery, selection, bookmarks and copy/export"
 done
done
