#!/usr/bin/env bash
set -euo pipefail
chrome="$(command -v google-chrome || command -v chromium || command -v chromium-browser || true)"
test -n "$chrome" || { echo 'Chromium required' >&2;exit 1; }
scratch_dir="$(mktemp -d)"
mkdir -p checks/insights-reliability-screenshots
python3 -m http.server 8796 --bind 127.0.0.1 --directory src >"$scratch_dir/ir-http.log" 2>&1 &
pid=$!
trap 'kill "$pid" 2>/dev/null || true; rm -f src/__ir_probe.html src/__ir_prelude.js src/__ir_probe.js; rm -rf "$scratch_dir"' EXIT
cp checks/insights-reliability-browser-prelude.js src/__ir_prelude.js
cp checks/insights-reliability-browser-probe.js src/__ir_probe.js
python3 - <<'PY'
from pathlib import Path
html=Path('src/index.html').read_text()
html=html.replace('</head>','<script src="/__ir_prelude.js"></script></head>',1)
html=html.replace('</body>','<output id="ir-probe-result">PENDING</output><script src="/__ir_probe.js"></script></body>',1)
Path('src/__ir_probe.html').write_text(html)
PY
for i in {1..35};do curl -fsS http://127.0.0.1:8796/__ir_probe.js >/dev/null 2>&1 && break;sleep .2;done
for id in shenzhen kiel rotterdam;do
 for spec in 'desktop:1440,900' 'mobile:390,844';do
  IFS=: read -r mode viewport <<< "$spec"
  dump="$scratch_dir/ir-$id-$mode.html"
  for attempt in 1 2 3;do
   profile="$(mktemp -d)"
   timeout 75s "$chrome" --headless=new --no-sandbox --disable-dev-shm-usage --disable-gpu --disable-background-networking --user-data-dir="$profile" --window-size="$viewport" --virtual-time-budget=18000 --dump-dom "http://127.0.0.1:8796/__ir_probe.html?case=$id" > "$dump" 2>"$scratch_dir/ir-chrome.log" || { rm -rf "$profile";cat "$scratch_dir/ir-chrome.log" >&2;exit 1; }
   rm -rf "$profile"
   if grep -q 'id="ir-probe-result"[^>]*>PASS:' "$dump";then break;fi
   if ! grep -q 'id="ir-probe-result"[^>]*>PENDING' "$dump";then grep -o 'id="ir-probe-result"[^<]*' "$dump" >&2 || true;exit 1;fi
   if test "$attempt" -lt 3;then echo "Inconclusive insights capture; retrying ($attempt/3)" >&2;fi
  done
  if ! grep -q 'id="ir-probe-result"[^>]*>PASS:' "$dump";then grep -o 'id="ir-probe-result"[^<]*' "$dump" >&2 || true;exit 1;fi
  profile="$(mktemp -d)"
  timeout 75s "$chrome" --headless=new --no-sandbox --disable-dev-shm-usage \
   --disable-gpu --disable-background-networking --user-data-dir="$profile" \
   --window-size="$viewport" --virtual-time-budget=9500 \
   --screenshot="$PWD/checks/insights-reliability-screenshots/$id-$mode.png" \
   "http://127.0.0.1:8796/__ir_probe.html?case=$id" >"$scratch_dir/ir-screenshot.log" 2>&1 ||
   { cat "$scratch_dir/ir-screenshot.log" >&2;exit 1; }
  test -s "checks/insights-reliability-screenshots/$id-$mode.png"
  rm -rf "$profile"
  echo "PASS: $id $mode insights lookup, filter history and copy/export recovery"
 done
done
