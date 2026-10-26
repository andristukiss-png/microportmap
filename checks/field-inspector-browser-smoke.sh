#!/usr/bin/env bash
set -euo pipefail
chrome="$(command -v google-chrome || command -v chromium || command -v chromium-browser || true)"
test -n "$chrome" || { echo "Chromium browser is required" >&2; exit 1; }
mkdir -p checks/field-inspector-screenshots
python3 -m http.server 8776 --bind 127.0.0.1 --directory src >/tmp/mpf-http.log 2>&1 &
server=$!
trap 'kill "$server" 2>/dev/null || true; for id in shenzhen kiel rotterdam; do test ! -f "/tmp/mpf-original-$id.html" || cp "/tmp/mpf-original-$id.html" "src/projects/$id/index.html"; done; rm -f src/__mpf_probe.js' EXIT
cp checks/field-inspector-browser-probe.js src/__mpf_probe.js
for i in {1..35}; do curl -fsS http://127.0.0.1:8776/passport-field-inspector.js >/dev/null 2>&1 && break; sleep .2; done
for id in shenzhen kiel rotterdam; do
 cp "src/projects/$id/index.html" "/tmp/mpf-original-$id.html"
 python3 - "$id" <<'PY'
from pathlib import Path
import sys
f=Path("src/projects")/sys.argv[1]/"index.html"
original=f.read_text()
assert "</head>" in original and "</body>" in original
css='<style>main>.hero,main>.columns,main>#mpp-toolkit,main>#mpr-workspace,main>#mp-connect,main>.mpx-passport-explore{display:none!important}main{margin-top:12px!important}</style>'
original=original.replace("</head>",css+"</head>",1)
original=original.replace("</body>",'<output id="mpf-probe">PENDING</output><script src="/__mpf_probe.js"></script></body>',1)
f.write_text(original)
PY
 for spec in "desktop:1440,900" "mobile:390,844"; do
  IFS=: read -r mode size <<< "$spec"
  profile="$(mktemp -d)"
  dump="/tmp/mpf-$id-$mode.html"
  preview="checks/field-inspector-screenshots/$id-$mode.png"
  timeout 70s "$chrome" --headless=new --no-sandbox --disable-dev-shm-usage \
   --disable-gpu --disable-background-networking --user-data-dir="$profile" \
   --window-size="$size" --virtual-time-budget=8500 --dump-dom \
   "http://127.0.0.1:8776/projects/$id/" > "$dump" 2>/tmp/mpf-chrome.log ||
   { cat /tmp/mpf-chrome.log >&2; exit 1; }
  grep -q 'id="mpf-probe">PASS:' "$dump" ||
   { grep -o 'id="mpf-probe"[^<]*' "$dump" >&2 || true; exit 1; }
  timeout 70s "$chrome" --headless=new --no-sandbox --disable-dev-shm-usage \
   --disable-gpu --disable-background-networking --user-data-dir="$profile" \
   --window-size="$size" --virtual-time-budget=4000 --screenshot="$PWD/$preview" \
   "http://127.0.0.1:8776/projects/$id/" > /tmp/mpf-capture.log 2>&1 ||
   { cat /tmp/mpf-capture.log >&2; exit 1; }
  test -s "$preview"
  rm -rf "$profile"
  echo "PASS: $id $mode — ten source-qualified field actions, no extra page clutter"
 done
 cp "/tmp/mpf-original-$id.html" "src/projects/$id/index.html"
done
echo 'PASS: three genuine passports in both desktop and mobile Chromium'
