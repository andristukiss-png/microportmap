#!/usr/bin/env bash
set -euo pipefail
chrome="$(command -v google-chrome || command -v chromium || command -v chromium-browser || true)"
test -n "$chrome"
mkdir -p checks/finder-modal-screenshots
python3 -m http.server 8802 --bind 127.0.0.1 --directory src >/tmp/finder-http.log 2>&1 &
pid=$!
trap 'kill "$pid" 2>/dev/null || true; rm -f src/projects/{shenzhen,kiel,rotterdam}/__finder.html src/__finder_probe.js' EXIT
cp checks/finder-modal-browser-probe.js src/__finder_probe.js
python3 - <<'PY'
from pathlib import Path
for name in ['shenzhen','kiel','rotterdam']:
 p=Path('src/projects')/name
 s=(p/'index.html').read_text().replace('</body>','<output id="finder-probe-result">PENDING</output><script src="/__finder_probe.js"></script></body>',1)
 (p/'__finder.html').write_text(s)
PY
for i in {1..35};do curl -fsS http://127.0.0.1:8802/__finder_probe.js >/dev/null 2>&1 && break;sleep .2;done
for id in shenzhen kiel rotterdam;do
 for spec in 'desktop:1440,900' 'mobile:390,844';do
  IFS=: read -r mode viewport <<< "$spec"
  profile="$(mktemp -d)";dump="/tmp/finder-$id-$mode.html"
  timeout 75s "$chrome" --headless=new --no-sandbox --disable-dev-shm-usage --disable-gpu --disable-background-networking --user-data-dir="$profile" --window-size="$viewport" --virtual-time-budget=10000 --dump-dom "http://127.0.0.1:8802/projects/$id/__finder.html" > "$dump" 2>/tmp/finder-chrome.log || { cat /tmp/finder-chrome.log >&2;exit 1; }
  if ! grep -q 'id="finder-probe-result"[^>]*>PASS:' "$dump";then grep -o 'id="finder-probe-result"[^<]*' "$dump" >&2 || true;exit 1;fi
  rm -rf "$profile";profile="$(mktemp -d)"
  timeout 75s "$chrome" --headless=new --no-sandbox --disable-dev-shm-usage --disable-gpu --disable-background-networking --user-data-dir="$profile" --window-size="$viewport" --virtual-time-budget=10000 --screenshot="$PWD/checks/finder-modal-screenshots/$id-$mode.png" "http://127.0.0.1:8802/projects/$id/__finder.html" >/tmp/finder-screenshot.log 2>&1 || { cat /tmp/finder-screenshot.log >&2;exit 1; }
  test -s "checks/finder-modal-screenshots/$id-$mode.png";rm -rf "$profile"
  echo "PASS: $id $mode finder modal"
 done
done
