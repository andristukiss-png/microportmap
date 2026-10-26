#!/usr/bin/env bash
set -euo pipefail
chrome="$(command -v google-chrome || command -v chromium || command -v chromium-browser || true)"
test -n "$chrome" || { echo "Chrome missing" >&2; exit 1; }
mkdir -p checks/research-insights-50-screenshots
cp checks/research-insights-50-probe.html src/__insights_probe.html
python3 - <<'PY'
from pathlib import Path
page=Path('src/index.html').read_text()
# Browser screenshot fixture brings the genuine JS-generated dashboard into the viewport.
# It is temporary and never published to GitHub/Vercel.
css='<style>body .topbar,body .hero,body .stats,body #mpx-research-hub{display:none!important}body .mpi-insights{margin-top:14px}</style>'
assert '</head>' in page
Path('src/__insights_visual.html').write_text(page.replace('</head>',css+'</head>',1))
PY
python3 -m http.server 8768 --bind 127.0.0.1 --directory src >/tmp/mp-insights-http.log 2>&1 &
server=$!
trap 'kill "$server" 2>/dev/null || true; rm -f src/__insights_probe.html src/__insights_visual.html' EXIT
for i in {1..35}; do curl -fsS http://127.0.0.1:8768/research-insights.js >/dev/null 2>&1 && break; sleep .2; done
profile="$(mktemp -d)"
timeout 70s "$chrome" --headless=new --no-sandbox --disable-dev-shm-usage \
 --disable-gpu --disable-background-networking --user-data-dir="$profile" \
 --virtual-time-budget=8500 --dump-dom 'http://127.0.0.1:8768/__insights_probe.html' \
 >/tmp/mp-insights-proof.html 2>/tmp/mp-insights-chrome.log ||
 { cat /tmp/mp-insights-chrome.log >&2; exit 1; }
grep -q 'id="mpi-probe-result">PASS:' /tmp/mp-insights-proof.html ||
 { grep -o 'id="mpi-probe-result"[^<]*' /tmp/mp-insights-proof.html >&2||true; exit 1; }
echo 'PASS: functional insights charts, filters, URL, paging and links'
rm -rf "$profile"
for item in "insights:/__insights_visual.html" "homepage:/" "directory:/directory/"; do
 IFS=: read -r name route <<< "$item"
 for spec in "desktop:1440,900" "mobile:390,844"; do
  IFS=: read -r mode viewport <<< "$spec"
  profile="$(mktemp -d)"
  out="checks/research-insights-50-screenshots/$name-$mode.png"
  html="/tmp/mp-insights-$name-$mode.html"
  timeout 55s "$chrome" --headless=new --no-sandbox --disable-dev-shm-usage \
   --disable-gpu --disable-background-networking --user-data-dir="$profile" \
   --window-size="$viewport" --virtual-time-budget=4000 --dump-dom \
   "http://127.0.0.1:8768$route" > "$html" 2>/tmp/mp-insights-chrome.log ||
   { cat /tmp/mp-insights-chrome.log >&2; exit 1; }
  grep -q 'src="/research-insights.js"' "$html" || { echo "Missing script on $name" >&2; exit 1; }
  if [ "$name" != "directory" ]; then
   grep -q 'data-mp-insights-loaded="1"' "$html" || { echo "Dashboard failed on $name" >&2; exit 1; }
  else grep -q 'data-mpi-link' "$html" || { echo "Directory link absent" >&2; exit 1; }
  fi
  timeout 55s "$chrome" --headless=new --no-sandbox --disable-dev-shm-usage \
   --disable-gpu --disable-background-networking --user-data-dir="$profile" \
   --window-size="$viewport" --virtual-time-budget=4000 \
   --screenshot="$PWD/$out" "http://127.0.0.1:8768$route" \
   >/tmp/mp-insights-chrome.log 2>&1 ||
   { cat /tmp/mp-insights-chrome.log >&2; exit 1; }
  test -s "$out"
  rm -rf "$profile"
  echo "PASS: $name $mode rendered and captured"
 done
done
echo 'PASS: six responsive screenshots and interaction test'
