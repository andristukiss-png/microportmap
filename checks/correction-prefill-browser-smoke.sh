#!/usr/bin/env bash
set -euo pipefail
chrome="$(command -v google-chrome || command -v chromium || command -v chromium-browser || true)"
test -n "$chrome" || { echo 'Chromium required' >&2;exit 1; }
mkdir -p checks/correction-prefill-screenshots
python3 -m http.server 8790 --bind 127.0.0.1 --directory src >/tmp/cp-http.log 2>&1 &
pid=$!
trap 'kill "$pid" 2>/dev/null || true; rm -f src/submit/__cp_probe.html src/__cp_prelude.js src/__cp_probe.js' EXIT
cp checks/correction-prefill-browser-prelude.js src/__cp_prelude.js
cp checks/correction-prefill-browser-probe.js src/__cp_probe.js
python3 - <<'PY'
from pathlib import Path
html=Path('src/submit/index.html').read_text()
html=html.replace('</head>','<script src="/__cp_prelude.js"></script></head>',1)
html=html.replace('</body>','<output id="cp-probe-result">PENDING</output><script src="/__cp_probe.js"></script></body>',1)
Path('src/submit/__cp_probe.html').write_text(html)
PY
for i in {1..35};do curl -fsS http://127.0.0.1:8790/__cp_probe.js >/dev/null 2>&1 && break;sleep .2;done
for id in shenzhen kiel rotterdam;do
 for spec in 'desktop:1440,900' 'mobile:390,844';do
  IFS=: read -r mode viewport <<< "$spec"
  profile="$(mktemp -d)"
  dump="/tmp/cp-$id-$mode.html"
  timeout 75s "$chrome" --headless=new --no-sandbox --disable-dev-shm-usage \
   --disable-gpu --disable-background-networking --user-data-dir="$profile" \
   --window-size="$viewport" --virtual-time-budget=9500 --dump-dom \
   "http://127.0.0.1:8790/submit/__cp_probe.html?project=$id" > "$dump" 2>/tmp/cp-chrome.log ||
   { cat /tmp/cp-chrome.log >&2;exit 1; }
  if ! grep -q 'id="cp-probe-result">PASS:' "$dump";then
   grep -o 'id="cp-probe-result"[^<]*' "$dump" >&2 || true;exit 1
  fi
  rm -rf "$profile";profile="$(mktemp -d)"
  timeout 75s "$chrome" --headless=new --no-sandbox --disable-dev-shm-usage \
   --disable-gpu --disable-background-networking --user-data-dir="$profile" \
   --window-size="$viewport" --virtual-time-budget=9500 \
   --screenshot="$PWD/checks/correction-prefill-screenshots/$id-$mode.png" \
   "http://127.0.0.1:8790/submit/__cp_probe.html?project=$id" >/tmp/cp-screenshot.log 2>&1 ||
   { cat /tmp/cp-screenshot.log >&2;exit 1; }
  test -s "checks/correction-prefill-screenshots/$id-$mode.png"
  rm -rf "$profile"
  echo "PASS: $id $mode correction edits, identity, retry and local report"
 done
done
