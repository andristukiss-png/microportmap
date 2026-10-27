#!/usr/bin/env bash
set -euo pipefail
chrome="$(command -v google-chrome || command -v chromium || command -v chromium-browser || true)"
test -n "$chrome" || { echo 'Chromium required' >&2;exit 1; }
mkdir -p checks/passport-recovery-screenshots
python3 -m http.server 8795 --bind 127.0.0.1 --directory src >/tmp/pr-http.log 2>&1 &
pid=$!
trap 'kill "$pid" 2>/dev/null || true; rm -f src/projects/{shenzhen,kiel,rotterdam}/__pr_probe.html src/__pr_prelude.js src/__pr_probe.js' EXIT
cp checks/passport-recovery-browser-prelude.js src/__pr_prelude.js
cp checks/passport-recovery-browser-probe.js src/__pr_probe.js
python3 - <<'PY'
from pathlib import Path
for id in ['shenzhen','kiel','rotterdam']:
 html=Path('src/projects/'+id+'/index.html').read_text()
 html=html.replace('</head>','<script src="/__pr_prelude.js"></script></head>',1)
 html=html.replace('</body>','<output id="pr-probe-result">PENDING</output><script src="/__pr_probe.js"></script></body>',1)
 Path('src/projects/'+id+'/__pr_probe.html').write_text(html)
PY
for i in {1..35};do curl -fsS http://127.0.0.1:8795/__pr_probe.js >/dev/null 2>&1 && break;sleep .2;done
for id in shenzhen kiel rotterdam;do
 for spec in 'desktop:1440,900' 'mobile:390,844';do
  IFS=: read -r mode viewport <<< "$spec"
  profile="$(mktemp -d)";dump="/tmp/pr-$id-$mode.html"
  timeout 75s "$chrome" --headless=new --no-sandbox --disable-dev-shm-usage --disable-gpu --disable-background-networking --user-data-dir="$profile" --window-size="$viewport" --virtual-time-budget=9500 --dump-dom "http://127.0.0.1:8795/projects/$id/__pr_probe.html" > "$dump" 2>/tmp/pr-chrome.log || { cat /tmp/pr-chrome.log >&2;exit 1; }
  if ! grep -q 'id="pr-probe-result">PASS:' "$dump";then grep -o 'id="pr-probe-result"[^<]*' "$dump" >&2 || true;exit 1;fi
  rm -rf "$profile";profile="$(mktemp -d)"
  timeout 75s "$chrome" --headless=new --no-sandbox --disable-dev-shm-usage --disable-gpu --disable-background-networking --user-data-dir="$profile" --window-size="$viewport" --virtual-time-budget=9500 --screenshot="$PWD/checks/passport-recovery-screenshots/$id-$mode.png" "http://127.0.0.1:8795/projects/$id/__pr_probe.html" >/tmp/pr-screenshot.log 2>&1 || { cat /tmp/pr-screenshot.log >&2;exit 1; }
  test -s "checks/passport-recovery-screenshots/$id-$mode.png";rm -rf "$profile"
  echo "PASS: $id $mode passport lookup recovery, copy and export"
 done
done
