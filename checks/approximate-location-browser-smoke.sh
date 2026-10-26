#!/usr/bin/env bash
set -euo pipefail
chrome="$(command -v google-chrome || command -v chromium || command -v chromium-browser || true)"
test -n "$chrome" || { echo "Chromium required for location test" >&2; exit 1; }
mkdir -p checks/approximate-location-screenshots
python3 -m http.server 8778 --bind 127.0.0.1 --directory src >/tmp/mpl-browser-http.log 2>&1 &
pid=$!
trap 'kill "$pid" 2>/dev/null || true; for id in shenzhen kiel rotterdam; do test ! -f "/tmp/mpl-original-$id.html" || cp "/tmp/mpl-original-$id.html" "src/projects/$id/index.html"; done; rm -f src/__mpl_browser_probe.js' EXIT
cp checks/approximate-location-browser-probe.js src/__mpl_browser_probe.js
for i in {1..40}; do curl -fsS http://127.0.0.1:8778/approximate-location-tools.js >/dev/null 2>&1 && break; sleep .2; done
for id in shenzhen kiel rotterdam; do
 cp "src/projects/$id/index.html" "/tmp/mpl-original-$id.html"
 python3 - "$id" <<'PY'
from pathlib import Path
import sys
f=Path("src/projects")/sys.argv[1]/"index.html"
source=f.read_text()
css='<style>main>.hero,main>.columns,main>#mpp-toolkit,main>#mpr-workspace,main>#mpf-inspector,main>#mpd-compare,main>#mp-connect,main>.mpx-passport-explore{display:none!important}main{margin-top:14px!important}</style>'
assert '</head>' in source and '</body>' in source
source=source.replace('</head>',css+'</head>',1)
source=source.replace('</body>','<output id="mpl-test">PENDING</output><script src="/__mpl_browser_probe.js"></script></body>',1)
f.write_text(source)
PY
 for screen in 'desktop:1440,900' 'mobile:390,844'; do
  IFS=: read -r mode size <<< "$screen"
  profile="$(mktemp -d)"
  dump="/tmp/mpl-$id-$mode.html"
  image="checks/approximate-location-screenshots/$id-$mode.png"
  timeout 75s "$chrome" --headless=new --no-sandbox --disable-dev-shm-usage \
   --disable-gpu --disable-background-networking --user-data-dir="$profile" \
   --window-size="$size" --virtual-time-budget=8500 --dump-dom \
   "http://127.0.0.1:8778/projects/$id/" > "$dump" 2>/tmp/mpl-browser.log ||
   { cat /tmp/mpl-browser.log >&2; exit 1; }
  grep -q 'id="mpl-test">PASS:' "$dump" ||
   { grep -o 'id="mpl-test"[^<]*' "$dump" >&2 || true; exit 1; }
  rm -rf "$profile";profile="$(mktemp -d)"
  timeout 75s "$chrome" --headless=new --no-sandbox --disable-dev-shm-usage \
   --disable-gpu --disable-background-networking --user-data-dir="$profile" \
   --window-size="$size" --virtual-time-budget=4300 \
   --screenshot="$PWD/$image" \
   "http://127.0.0.1:8778/projects/$id/?snapshot=1" >/tmp/mpl-browser.log 2>&1 ||
   { cat /tmp/mpl-browser.log >&2; exit 1; }
  test -s "$image"
  if [ "$(stat -c %s "$image")" -lt 12000 ]; then echo "Possibly blank screenshot: $image" >&2; exit 1; fi
  rm -rf "$profile"
  echo "PASS: $id $mode — location tools, safe map exports, no precise-site claim"
 done
 cp "/tmp/mpl-original-$id.html" "src/projects/$id/index.html"
done
echo "PASS: location actions and six meaningful responsive Chromium captures"
