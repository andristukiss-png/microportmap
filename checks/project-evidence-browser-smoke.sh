#!/usr/bin/env bash
set -euo pipefail
chrome="$(command -v google-chrome || command -v chromium || command -v chromium-browser || true)"
test -n "$chrome" || { echo 'Chrome missing' >&2; exit 1; }
mkdir -p checks/project-evidence-screenshots
python3 -m http.server 8777 --bind 127.0.0.1 --directory src >/tmp/mpd-server.log 2>&1 &
pid=$!
trap 'kill "$pid" 2>/dev/null || true; for id in shenzhen kiel rotterdam; do test ! -f "/tmp/mpd-original-$id.html" || cp "/tmp/mpd-original-$id.html" "src/projects/$id/index.html"; done; rm -f src/__mpd_browser_probe.js' EXIT
cp checks/project-evidence-browser-probe.js src/__mpd_browser_probe.js
for i in {1..35}; do curl -fsS http://127.0.0.1:8777/project-evidence-compare.js >/dev/null 2>&1 && break; sleep .2; done
for id in shenzhen kiel rotterdam; do
 cp "src/projects/$id/index.html" "/tmp/mpd-original-$id.html"
 python3 - "$id" <<'PY'
from pathlib import Path
import sys
path=Path("src/projects")/sys.argv[1]/"index.html"
page=path.read_text()
css='<style>main>.hero,main>.columns,main>#mpp-toolkit,main>#mpr-workspace,main>#mpf-inspector,main>#mp-connect,main>.mpx-passport-explore{display:none!important}main{margin-top:10px!important}</style>'
assert '</head>' in page and '</body>' in page
page=page.replace('</head>',css+'</head>',1)
page=page.replace('</body>','<output id="mpd-probe">PENDING</output><script src="/__mpd_browser_probe.js"></script></body>',1)
path.write_text(page)
PY
 for viewport in 'desktop:1440,900' 'mobile:390,844'; do
  IFS=: read -r mode size <<< "$viewport"
  profile="$(mktemp -d)"
  dump="/tmp/mpd-$id-$mode.html"
  file="checks/project-evidence-screenshots/$id-$mode.png"
  timeout 75s "$chrome" --headless=new --no-sandbox --disable-dev-shm-usage \
   --disable-gpu --disable-background-networking --user-data-dir="$profile" \
   --window-size="$size" --virtual-time-budget=9000 --dump-dom \
   "http://127.0.0.1:8777/projects/$id/" > "$dump" 2>/tmp/mpd-chrome.log ||
   { cat /tmp/mpd-chrome.log >&2; exit 1; }
  grep -q 'id="mpd-probe">PASS:' "$dump" ||
   { grep -o 'id="mpd-probe"[^<]*' "$dump" >&2 || true; exit 1; }
  # Use a fresh Chrome profile for screenshots. Reusing a dump-dom profile can produce blank captures.
  rm -rf "$profile"
  profile="$(mktemp -d)"
  timeout 75s "$chrome" --headless=new --no-sandbox --disable-dev-shm-usage \
   --disable-gpu --disable-background-networking --user-data-dir="$profile" \
   --window-size="$size" --virtual-time-budget=4200 \
   --screenshot="$PWD/$file" "http://127.0.0.1:8777/projects/$id/" >/tmp/mpd-chrome.log 2>&1 ||
   { cat /tmp/mpd-chrome.log >&2; exit 1; }
  test -s "$file"
  if [ "$(stat -c %s "$file")" -lt 15000 ]; then
    echo "Screenshot may be blank: $file ($(stat -c %s "$file") bytes)" >&2
    exit 1
  fi
  rm -rf "$profile"
  echo "PASS: $id $mode — ten source-qualified field comparisons and copy"
 done
 cp "/tmp/mpd-original-$id.html" "src/projects/$id/index.html"
done
echo "PASS: 3 original passports x 2 viewport sizes, interactive Chromium render and screenshots"
