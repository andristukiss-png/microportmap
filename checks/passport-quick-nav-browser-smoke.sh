#!/usr/bin/env bash
set -euo pipefail
chrome="$(command -v google-chrome || command -v chromium || command -v chromium-browser || true)"
test -n "$chrome" || { echo "Chromium is required" >&2; exit 1; }
mkdir -p checks/passport-quick-nav-screenshots
python3 -m http.server 8779 --bind 127.0.0.1 --directory src >/tmp/mpq-server.log 2>&1 &
server=$!
trap 'kill "$server" 2>/dev/null || true; for id in shenzhen kiel rotterdam; do test ! -f "/tmp/mpq-original-$id.html" || cp "/tmp/mpq-original-$id.html" "src/projects/$id/index.html"; done; rm -f src/__mpq_probe.js' EXIT
cp checks/passport-quick-nav-browser-probe.js src/__mpq_probe.js
for i in {1..35}; do curl -fsS http://127.0.0.1:8779/passport-quick-navigation.js >/dev/null 2>&1 && break; sleep .2; done
for id in shenzhen kiel rotterdam; do
 cp "src/projects/$id/index.html" "/tmp/mpq-original-$id.html"
 python3 - "$id" <<'PY'
from pathlib import Path
import sys
path=Path("src/projects")/sys.argv[1]/"index.html"
source=path.read_text()
assert "</body>" in source and "</head>" in source
css='<style>main>.hero,main>.columns,main>#mpp-toolkit,main>#mpr-workspace,main>#mpf-inspector,main>#mpd-compare,main>#mpl-location,main>#mp-connect,main>.mpx-passport-explore{display:none!important}main{margin-top:12px!important}</style>'
source=source.replace("</head>",css+"</head>",1)
source=source.replace("</body>",'<output id="mpq-test-result">PENDING</output><script src="/__mpq_probe.js"></script></body>',1)
path.write_text(source)
PY
 for spec in "desktop:1440,900" "mobile:390,844"; do
  IFS=: read -r mode size <<< "$spec"
  profile="$(mktemp -d)"
  dump="/tmp/mpq-$id-$mode.html"
  picture="checks/passport-quick-nav-screenshots/$id-$mode.png"
  timeout 75s "$chrome" --headless=new --no-sandbox --disable-dev-shm-usage \
   --disable-gpu --disable-background-networking --user-data-dir="$profile" \
   --window-size="$size" --virtual-time-budget=8500 --dump-dom \
   "http://127.0.0.1:8779/projects/$id/" > "$dump" 2>/tmp/mpq-browser.log ||
   { cat /tmp/mpq-browser.log >&2; exit 1; }
  grep -q 'id="mpq-test-result">PASS:' "$dump" ||
   { grep -o 'id="mpq-test-result"[^<]*' "$dump" >&2 || true; exit 1; }
  rm -rf "$profile";profile="$(mktemp -d)"
  timeout 75s "$chrome" --headless=new --no-sandbox --disable-dev-shm-usage \
   --disable-gpu --disable-background-networking --user-data-dir="$profile" \
   --window-size="$size" --virtual-time-budget=4200 \
   --screenshot="$PWD/$picture" \
   "http://127.0.0.1:8779/projects/$id/?snapshot=1" > /tmp/mpq-picture.log 2>&1 ||
   { cat /tmp/mpq-picture.log >&2; exit 1; }
  test -s "$picture"
  if [ "$(stat -c %s "$picture")" -lt 12000 ]; then echo "Possibly empty screenshot: $picture" >&2;exit 1;fi
  rm -rf "$profile"
  echo "PASS: $id $mode compact passport nav, ten actions"
 done
 cp "/tmp/mpq-original-$id.html" "src/projects/$id/index.html"
done
echo "PASS: three original passport pages x desktop/mobile interactive smoke and visual QA"
