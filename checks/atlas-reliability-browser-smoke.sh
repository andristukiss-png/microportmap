#!/usr/bin/env bash
set -euo pipefail
chrome="$(command -v google-chrome || command -v chromium || command -v chromium-browser || true)"
test -n "$chrome" || { echo 'Chromium required' >&2;exit 1; }
mkdir -p checks/atlas-reliability-screenshots
python3 -m http.server 8794 --bind 127.0.0.1 --directory src >/tmp/ar-http.log 2>&1 &
pid=$!
trap 'kill "$pid" 2>/dev/null || true; rm -f src/__ar_probe.html src/__ar_prelude.js src/__ar_probe.js' EXIT
cp checks/atlas-reliability-browser-prelude.js src/__ar_prelude.js
cp checks/atlas-reliability-browser-probe.js src/__ar_probe.js
python3 - <<'PY'
from pathlib import Path
html=Path('src/index.html').read_text()
html=html.replace('</head>','<script src="/__ar_prelude.js"></script></head>',1)
html=html.replace('</body>','<output id="ar-probe-result">PENDING</output><script src="/__ar_probe.js"></script></body>',1)
Path('src/__ar_probe.html').write_text(html)
PY
for i in {1..35};do curl -fsS http://127.0.0.1:8794/__ar_probe.js >/dev/null 2>&1 && break;sleep .2;done
for id in shenzhen kiel rotterdam;do
 for spec in 'desktop:1440,900' 'mobile:390,844';do
  IFS=: read -r mode viewport <<< "$spec"
  profile="$(mktemp -d)"
  dump="/tmp/ar-$id-$mode.html"
  timeout 75s "$chrome" --headless=new --no-sandbox --disable-dev-shm-usage \
   --disable-gpu --disable-background-networking --user-data-dir="$profile" \
   --window-size="$viewport" --virtual-time-budget=9500 --dump-dom \
   "http://127.0.0.1:8794/__ar_probe.html?project=$id" > "$dump" 2>/tmp/ar-chrome.log ||
   { cat /tmp/ar-chrome.log >&2;exit 1; }
  if ! grep -q 'id="ar-probe-result">PASS:' "$dump";then
   grep -o 'id="ar-probe-result"[^<]*' "$dump" >&2 || true;exit 1
  fi
  rm -rf "$profile";profile="$(mktemp -d)"
  timeout 75s "$chrome" --headless=new --no-sandbox --disable-dev-shm-usage \
   --disable-gpu --disable-background-networking --user-data-dir="$profile" \
   --window-size="$viewport" --virtual-time-budget=9500 \
   --screenshot="$PWD/checks/atlas-reliability-screenshots/$id-$mode.png" \
   "http://127.0.0.1:8794/__ar_probe.html?project=$id" >/tmp/ar-screenshot.log 2>&1 ||
   { cat /tmp/ar-screenshot.log >&2;exit 1; }
  test -s "checks/atlas-reliability-screenshots/$id-$mode.png"
  rm -rf "$profile"
  echo "PASS: $id $mode atlas deadline, retry and modal restoration"
 done
done
