#!/usr/bin/env bash
set -euo pipefail
chrome="$(command -v google-chrome || command -v chromium || command -v chromium-browser || true)"
if [[ -z "$chrome" ]];then echo "Chrome required" >&2;exit 1;fi
mkdir -p checks/research-trail-50-screenshots
python3 -m http.server 8767 --bind 127.0.0.1 --directory src >/tmp/microportmap-trail-http.log 2>&1 &
pid=$!
trap 'kill "$pid" 2>/dev/null||true; rm -f src/directory/__research_trail_probe.html' EXIT
cp checks/research-trail-50-probe.html src/directory/__research_trail_probe.html
for i in {1..30};do if curl -fsS http://127.0.0.1:8767/research-trail.js >/dev/null;then break;fi;sleep .2;done
for viewport in "desktop:1440,900" "mobile:390,844";do
 IFS=: read -r mode size <<< "$viewport"
 profile="$(mktemp -d)"
timeout 60s "$chrome" --headless=new --no-sandbox --disable-dev-shm-usage \
  --disable-gpu --disable-background-networking --user-data-dir="$profile" \
  --window-size="$size" --virtual-time-budget=9500 --dump-dom \
  'http://127.0.0.1:8767/directory/__research_trail_probe.html?trail=shenzhen,rotterdam' \
  >/tmp/microportmap-trail-probe.html 2>/tmp/microportmap-trail-chrome.log ||
  { cat /tmp/microportmap-trail-chrome.log >&2;exit 1;}
grep -q 'id="trail-probe-result">PASS:' /tmp/microportmap-trail-probe.html ||
  { grep -o 'id="trail-probe-result"[^<]*' /tmp/microportmap-trail-probe.html >&2||true;exit 1;}
echo "PASS: $mode functional modal, import, share and storage checks"
rm -rf "$profile"
done
for item in "home:/" "directory:/directory/" "passport:/projects/kiel/" "quality:/data-quality/";do
 IFS=: read -r name route <<< "$item"
 for spec in "desktop:1440,900" "mobile:390,844";do
  IFS=: read -r mode size <<< "$spec"
  profile="$(mktemp -d)"
  out="checks/research-trail-50-screenshots/$name-$mode.png"
  dump="/tmp/microportmap-trail-$name-$mode.html"
  timeout 50s "$chrome" --headless=new --no-sandbox --disable-dev-shm-usage \
    --disable-gpu --disable-background-networking --user-data-dir="$profile" \
    --window-size="$size" --virtual-time-budget=2500 --dump-dom \
    "http://127.0.0.1:8767$route" > "$dump" 2>/tmp/microportmap-trail-chrome.log ||
    { cat /tmp/microportmap-trail-chrome.log >&2;exit 1;}
  grep -q 'id="mpt-open"' "$dump" || { echo "Trail missing on $route" >&2;exit 1;}
  timeout 50s "$chrome" --headless=new --no-sandbox --disable-dev-shm-usage \
    --disable-gpu --disable-background-networking --user-data-dir="$profile" \
    --window-size="$size" --virtual-time-budget=2500 \
    --screenshot="$PWD/$out" "http://127.0.0.1:8767$route" \
    >/tmp/microportmap-trail-chrome.log 2>&1 ||
    { cat /tmp/microportmap-trail-chrome.log >&2;exit 1;}
  test -s "$out"
  rm -rf "$profile"
  echo "PASS: trail visible on $name $mode"
 done
done
echo 'PASS: eight screenshots and an interactive functional DOM sequence'
