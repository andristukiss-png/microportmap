#!/usr/bin/env bash
set -euo pipefail
chrome="$(command -v google-chrome || command -v chromium || command -v chromium-browser || true)"
test -n "$chrome" || { echo "Chromium required" >&2; exit 1; }
mkdir -p checks/passport-reading-screenshots
python3 -m http.server 8780 --bind 127.0.0.1 --directory src >/tmp/mprc-http.log 2>&1 &
pid=$!
trap 'kill "$pid" 2>/dev/null || true; for id in shenzhen kiel rotterdam; do test ! -f "/tmp/mprc-original-$id.html" || cp "/tmp/mprc-original-$id.html" "src/projects/$id/index.html"; done; rm -f src/__mprc_probe.js' EXIT
cp checks/passport-reading-browser-probe.js src/__mprc_probe.js
for i in {1..35}; do curl -fsS http://127.0.0.1:8780/passport-reading-controls.js >/dev/null 2>&1 && break; sleep .2; done
for id in shenzhen kiel rotterdam; do
 cp "src/projects/$id/index.html" "/tmp/mprc-original-$id.html"
 python3 - "$id" <<'PY'
from pathlib import Path
import sys
p=Path("src/projects")/sys.argv[1]/"index.html"
html=p.read_text()
assert "</head>" in html and "</body>" in html
# Temporary local fixture only, to show the genuine loaded reading controls near the screenshot top.
style='<style>main>.hero,main>.columns,main>#mpq-navigation,main>#mpp-toolkit,main>#mpr-workspace,main>#mpf-inspector,main>#mpd-compare,main>#mpl-location,main>#mp-connect,main>.mpx-passport-explore{display:none!important}main{margin-top:10px!important}</style>'
html=html.replace("</head>",style+"</head>",1)
html=html.replace("</body>",'<output id="mprc-probe">PENDING</output><script src="/__mprc_probe.js"></script></body>',1)
p.write_text(html)
PY
 for spec in 'desktop:1440,900' 'mobile:390,844'; do
  IFS=: read -r mode viewport <<< "$spec"
  profile="$(mktemp -d)"
  dump="/tmp/mprc-$id-$mode.html"
  image="checks/passport-reading-screenshots/$id-$mode.png"
  timeout 75s "$chrome" --headless=new --no-sandbox --disable-dev-shm-usage \
   --disable-gpu --disable-background-networking --user-data-dir="$profile" \
   --window-size="$viewport" --virtual-time-budget=9500 --dump-dom \
   "http://127.0.0.1:8780/projects/$id/" > "$dump" 2>/tmp/mprc-chrome.log ||
   { cat /tmp/mprc-chrome.log >&2; exit 1; }
  grep -q 'id="mprc-probe">PASS:' "$dump" ||
   { grep -o 'id="mprc-probe"[^<]*' "$dump" >&2 || true; exit 1; }
  rm -rf "$profile";profile="$(mktemp -d)"
  timeout 75s "$chrome" --headless=new --no-sandbox --disable-dev-shm-usage \
   --disable-gpu --disable-background-networking --user-data-dir="$profile" \
   --window-size="$viewport" --virtual-time-budget=4500 \
   --screenshot="$PWD/$image" \
   "http://127.0.0.1:8780/projects/$id/?snapshot=1" > /tmp/mprc-screenshot.log 2>&1 ||
   { cat /tmp/mprc-screenshot.log >&2; exit 1; }
  test -s "$image"
  if [ "$(stat -c %s "$image")" -lt 12000 ]; then echo "Possibly blank screenshot: $image" >&2; exit 1; fi
  rm -rf "$profile"
  echo "PASS: $id $mode readability controls, no markup or data change"
 done
 cp "/tmp/mprc-original-$id.html" "src/projects/$id/index.html"
done
echo "PASS: 3 original research passports × desktop/mobile browser checks"
