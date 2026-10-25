#!/usr/bin/env bash
set -euo pipefail
# Local, dependency-free headless Chrome capture of the actual static site.
# Screenshots are CI artifacts, not independently reviewed physical-device QA.
chrome="$(command -v google-chrome || command -v chromium || command -v chromium-browser || true)"
if [[ -z "$chrome" ]]; then echo "Chrome/Chromium not installed on this runner" >&2; exit 1; fi
mkdir -p checks/visual-50-screenshots
python3 -m http.server 8765 --bind 127.0.0.1 --directory src >/tmp/microportmap-visual-50-http.log 2>&1 &
server_pid=$!
trap 'kill "$server_pid" 2>/dev/null || true' EXIT
for i in {1..25}; do
  if curl --fail --silent --output /dev/null http://127.0.0.1:8765/; then break; fi
  sleep .2
done
curl --fail --silent --output /dev/null http://127.0.0.1:8765/site-navigation.css
for target in "homepage:/" "directory:/directory/" "passport:/projects/kiel/" "evidence:/data-quality/"; do
  name="${target%%:*}"
  route="${target#*:}"
  for spec in "desktop:1440,900" "mobile:390,844"; do
    mode="${spec%%:*}"
    pixels="${spec#*:}"
    width="${pixels%%,*}"
    height="${pixels#*,}"
    out="checks/visual-50-screenshots/${name}-${mode}.png"
    profile="$(mktemp -d)"
    timeout 40s "$chrome" --headless=new --no-sandbox --disable-dev-shm-usage \
      --disable-gpu --disable-background-networking --hide-scrollbars \
      --user-data-dir="$profile" --force-device-scale-factor=1 \
      --window-size="$width,$height" --virtual-time-budget=2200 \
      --screenshot="$PWD/$out" "http://127.0.0.1:8765$route" \
      >/tmp/microportmap-visual-chrome.log 2>&1 || { cat /tmp/microportmap-visual-chrome.log >&2; exit 1; }
    test -s "$out"
    echo "Captured $out"
    rm -rf "$profile"
  done
done
echo "PASS: 8 headless Chromium captures (desktop/mobile across homepage, directory, passport and evidence). Review screenshots before claiming human visual QA."
