#!/usr/bin/env bash
set -euo pipefail
chrome="$(command -v google-chrome || command -v chromium || command -v chromium-browser || true)"
test -n "$chrome" || { echo 'Chrome/Chromium is required' >&2; exit 1; }
mkdir -p checks/contrasting-research-screenshots
python3 -m http.server 8781 --bind 127.0.0.1 --directory src >/tmp/mpcr-http.log 2>&1 &
pid=$!
trap 'kill "$pid" 2>/dev/null || true; for id in shenzhen kiel rotterdam; do test ! -f "/tmp/mpcr-original-$id.html" || cp "/tmp/mpcr-original-$id.html" "src/projects/$id/index.html"; done; rm -f src/__mpcr_probe.js' EXIT
cp checks/contrasting-research-browser-probe.js src/__mpcr_probe.js
for i in {1..35}; do curl -fsS http://127.0.0.1:8781/contrasting-research-paths.js >/dev/null 2>&1 && break; sleep .2; done
for id in shenzhen kiel rotterdam; do
 cp "src/projects/$id/index.html" "/tmp/mpcr-original-$id.html"
 python3 - "$id" <<'PY'
from pathlib import Path
import sys
p=Path("src/projects")/sys.argv[1]/"index.html"
html=p.read_text()
assert "</head>" in html and "</body>" in html
# Temporary browser fixture hides unrelated enhancements for a meaningful screenshot.
css='<style>main>.hero,main>.columns,main>#mpq-navigation,main>#mprc-controls,main>#mpp-toolkit,main>#mpr-workspace,main>#mpf-inspector,main>#mpd-compare,main>#mpl-location,main>#mp-connect,main>.mpx-passport-explore{display:none!important}main{margin-top:10px!important}</style>'
html=html.replace("</head>",css+"</head>",1)
html=html.replace("</body>",'<output id="mpcr-probe">PENDING</output><script src="/__mpcr_probe.js"></script></body>',1)
p.write_text(html)
PY
 for spec in 'desktop:1440,900' 'mobile:390,844'; do
  IFS=: read -r mode viewport <<< "$spec"
  profile="$(mktemp -d)"
  dump="/tmp/mpcr-$id-$mode.html"
  capture="checks/contrasting-research-screenshots/$id-$mode.png"
  timeout 75s "$chrome" --headless=new --no-sandbox --disable-dev-shm-usage \
    --disable-gpu --disable-background-networking --user-data-dir="$profile" \
    --window-size="$viewport" --virtual-time-budget=7500 --dump-dom \
    "http://127.0.0.1:8781/projects/$id/" > "$dump" 2>/tmp/mpcr-chrome.log ||
    { cat /tmp/mpcr-chrome.log >&2; exit 1; }
  grep -q 'id="mpcr-probe">PASS:' "$dump" ||
    { grep -o 'id="mpcr-probe"[^<]*' "$dump" >&2 || true;exit 1; }
  rm -rf "$profile"; profile="$(mktemp -d)"
  timeout 75s "$chrome" --headless=new --no-sandbox --disable-dev-shm-usage \
    --disable-gpu --disable-background-networking --user-data-dir="$profile" \
    --window-size="$viewport" --virtual-time-budget=4000 \
    --screenshot="$PWD/$capture" \
    "http://127.0.0.1:8781/projects/$id/?snapshot=1" >/tmp/mpcr-screenshot.log 2>&1 ||
    { cat /tmp/mpcr-screenshot.log >&2; exit 1; }
  test -s "$capture"
  if [ "$(stat -c %s "$capture")" -lt 12000 ];then echo "Blank screenshot suspected: $capture" >&2;exit 1;fi
  rm -rf "$profile"
  echo "PASS: $id $mode, ten complementary projects with source-backed differences"
 done
 cp "/tmp/mpcr-original-$id.html" "src/projects/$id/index.html"
done
echo 'PASS: all 6 original source-passport/browser-view combinations and screenshots'
