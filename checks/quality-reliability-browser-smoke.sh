#!/usr/bin/env bash
set -euo pipefail
chrome="$(command -v google-chrome || command -v chromium || command -v chromium-browser || true)"
test -n "$chrome" || { echo 'Chromium required' >&2;exit 1; }
mkdir -p checks/quality-reliability-screenshots checks/quality-reliability-diagnostics
python3 -m http.server 8792 --bind 127.0.0.1 --directory src >/tmp/qr-http.log 2>&1 &
pid=$!
trap 'kill "$pid" 2>/dev/null || true; rm -f src/data-quality/__qr_probe.html src/__qr_prelude.js src/__qr_probe.js' EXIT
cp checks/quality-reliability-browser-prelude.js src/__qr_prelude.js
cp checks/quality-reliability-browser-probe.js src/__qr_probe.js
python3 - <<'PY'
from pathlib import Path
html=Path('src/data-quality/index.html').read_text()
html=html.replace('</head>','<script src="/__qr_prelude.js"></script></head>',1)
html=html.replace('</body>','<output id="qr-probe-result">PENDING</output><script src="/__qr_probe.js"></script></body>',1)
Path('src/data-quality/__qr_probe.html').write_text(html)
PY
for i in {1..35};do curl -fsS http://127.0.0.1:8792/__qr_probe.js >/dev/null 2>&1 && break;sleep .2;done
for id in shenzhen kiel rotterdam;do
 for spec in 'desktop:1440,900' 'mobile:390,844';do
  IFS=: read -r mode viewport <<< "$spec"
  dump="/tmp/qr-$id-$mode.html"
  for attempt in 1 2 3;do
   profile="$(mktemp -d)"
   timeout 75s "$chrome" --headless=new --no-sandbox --disable-dev-shm-usage \
    --disable-gpu --disable-background-networking --user-data-dir="$profile" \
    --window-size="$viewport" --virtual-time-budget=18000 --dump-dom \
    "http://127.0.0.1:8792/data-quality/__qr_probe.html?project=$id" > "$dump" 2>/tmp/qr-chrome.log || { cat /tmp/qr-chrome.log >&2;exit 1; }
   rm -rf "$profile"
   if grep -q 'id="qr-probe-result"[^>]*>PASS:' "$dump";then break;fi
   if ! grep -q 'id="qr-probe-result"[^>]*>PENDING' "$dump";then break;fi
   echo "Inconclusive metadata capture; retrying ($attempt/3)" >&2
  done
  if ! grep -q 'id="qr-probe-result"[^>]*>PASS:' "$dump";then
   cp "$dump" "checks/quality-reliability-diagnostics/$id-$mode.html";cp /tmp/qr-chrome.log checks/quality-reliability-diagnostics/chrome.log;cp /tmp/qr-http.log checks/quality-reliability-diagnostics/http.log
   grep -o 'id="qr-probe-result"[^<]*' "$dump" >&2 || true;exit 1
  fi
  profile="$(mktemp -d)"
  timeout 75s "$chrome" --headless=new --no-sandbox --disable-dev-shm-usage \
   --disable-gpu --disable-background-networking --user-data-dir="$profile" \
   --window-size="$viewport" --virtual-time-budget=18000 \
   --screenshot="$PWD/checks/quality-reliability-screenshots/$id-$mode.png" \
   "http://127.0.0.1:8792/data-quality/__qr_probe.html?project=$id" >/tmp/qr-screenshot.log 2>&1 ||
   { cat /tmp/qr-screenshot.log >&2;exit 1; }
  test -s "checks/quality-reliability-screenshots/$id-$mode.png"
  rm -rf "$profile"
  echo "PASS: $id $mode metadata timeout, recovery and audit export"
 done
done
