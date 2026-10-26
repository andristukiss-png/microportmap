#!/usr/bin/env bash
set -euo pipefail
chrome="$(command -v google-chrome || command -v chromium || command -v chromium-browser || true)"
test -n "$chrome" || { echo "Chrome/Chromium missing" >&2; exit 1; }
mkdir -p checks/country-explorer-50-screenshots
original="$(mktemp)"
cp src/countries/index.html "$original"
python3 -m http.server 8769 --bind 127.0.0.1 --directory src >/tmp/mpc-country-http.log 2>&1 &
server=$!
trap 'cp "$original" src/countries/index.html; rm -f "$original"; kill "$server" 2>/dev/null || true' EXIT
for i in {1..35}; do curl -fsS http://127.0.0.1:8769/country-explorer.js >/dev/null 2>&1 && break; sleep .2; done
python3 - <<'PY'
from pathlib import Path
page=Path('src/countries/index.html')
script=Path('checks/country-explorer-50-probe.js').read_text()
html=page.read_text()
assert '</body>' in html
page.write_text(html.replace('</body>','<p id="mpc-probe-result">PENDING</p><script>'+script+'</script></body>',1))
PY
profile="$(mktemp -d)"
timeout 80s "$chrome" --headless=new --no-sandbox --disable-dev-shm-usage \
 --disable-gpu --disable-background-networking --user-data-dir="$profile" \
 --virtual-time-budget=9500 --dump-dom \
 'http://127.0.0.1:8769/countries/' \
 >/tmp/mpc-country-probe.html 2>/tmp/mpc-country-browser.log ||
 { cat /tmp/mpc-country-browser.log >&2; exit 1; }
if ! grep -q 'id="mpc-probe-result">PASS:' /tmp/mpc-country-probe.html; then
 grep -o 'id="mpc-probe-result"[^<]*' /tmp/mpc-country-probe.html >&2 || true
 exit 1
fi
echo 'PASS: browser interaction country, region, details, compare, bookmarks, sorting, URL'
cp "$original" src/countries/index.html
rm -rf "$profile"
for item in 'countries:/countries/' 'germany:/countries/?country=Germany' 'coverage:/coverage/'; do
 IFS=: read -r name route <<< "$item"
 for viewport in 'desktop:1440,900' 'mobile:390,844'; do
  IFS=: read -r mode size <<< "$viewport"
  profile="$(mktemp -d)"
  html="/tmp/mpc-country-$name-$mode.html"
  file="checks/country-explorer-50-screenshots/$name-$mode.png"
  timeout 60s "$chrome" --headless=new --no-sandbox --disable-dev-shm-usage \
   --disable-gpu --disable-background-networking --user-data-dir="$profile" \
   --window-size="$size" --virtual-time-budget=5000 --dump-dom \
   "http://127.0.0.1:8769$route" > "$html" 2>/tmp/mpc-country-browser.log ||
   { cat /tmp/mpc-country-browser.log >&2; exit 1; }
  if [ "$name" != 'coverage' ]; then
   grep -q 'data-mpc-loaded="1"' "$html" || { echo "Country explorer not ready: $name $mode" >&2; exit 1; }
  else grep -q 'mpc-coverage-cta' "$html" || { echo "Coverage explorer CTA missing" >&2; exit 1; }
  fi
  timeout 60s "$chrome" --headless=new --no-sandbox --disable-dev-shm-usage \
   --disable-gpu --disable-background-networking --user-data-dir="$profile" \
   --window-size="$size" --virtual-time-budget=5000 \
   --screenshot="$PWD/$file" "http://127.0.0.1:8769$route" \
   >/tmp/mpc-country-browser.log 2>&1 ||
   { cat /tmp/mpc-country-browser.log >&2; exit 1; }
  test -s "$file"
  rm -rf "$profile"
  echo "PASS: $name $mode dynamic DOM and screenshot"
 done
done
echo 'PASS: six responsive visual captures and interactive behavior test'
