#!/usr/bin/env bash
set -euo pipefail
chrome="$(command -v google-chrome || command -v chromium || command -v chromium-browser || true)"
if [[ -z "$chrome" ]]; then echo "Chromium is required for DOM smoke verification" >&2; exit 1; fi
python3 -m http.server 8766 --bind 127.0.0.1 --directory src >/tmp/microportmap-experience-http.log 2>&1 &
server=$!
trap 'kill "$server" 2>/dev/null || true' EXIT
for attempt in {1..30}; do
  if curl --fail --silent --output /dev/null http://127.0.0.1:8766/experience-tools.js; then break; fi
  sleep .2
done
mkdir -p checks/experience-50-screenshots
for item in "home:/:mpx-research-hub" "directory:/directory/:mpx-directory-tools" "passport:/projects/kiel/:mpx-passport-explore" "quality:/data-quality/:mpx-quality-guide"; do
  IFS=: read -r name route expected <<< "$item"
  for viewport in "desktop:1440,900" "mobile:390,844"; do
    IFS=: read -r mode dims <<< "$viewport"
    profile="$(mktemp -d)"
    output="checks/experience-50-screenshots/$name-$mode.png"
    html="/tmp/microportmap-experience-$name-$mode.html"
    timeout 60s "$chrome" --headless=new --no-sandbox --disable-dev-shm-usage \
      --disable-gpu --disable-background-networking --hide-scrollbars \
      --user-data-dir="$profile" --window-size="$dims" \
      --virtual-time-budget=4500 --dump-dom \
      "http://127.0.0.1:8766$route" > "$html" 2>/tmp/microportmap-experience-chrome.log ||
        { cat /tmp/microportmap-experience-chrome.log >&2; exit 1; }
    if ! grep -q "id=\"$expected\"" "$html"; then
      echo "Missing dynamic $expected on $route ($mode)" >&2
      grep -o 'data-mpx-passport-diagnostic="[^"]*"' "$html" >&2 || true
      tail -c 900 "$html" >&2
      exit 1
    fi
    if ! grep -q 'id="mpx-search-dialog"' "$html"; then
      echo "Global project finder was not mounted" >&2
      exit 1
    fi
    timeout 60s "$chrome" --headless=new --no-sandbox --disable-dev-shm-usage \
      --disable-gpu --disable-background-networking --hide-scrollbars \
      --user-data-dir="$profile" --window-size="$dims" \
      --virtual-time-budget=4500 \
      --screenshot="$PWD/$output" "http://127.0.0.1:8766$route" \
      >/tmp/microportmap-experience-capture.log 2>&1 ||
        { cat /tmp/microportmap-experience-capture.log >&2; exit 1; }
    test -s "$output"
    rm -rf "$profile"
    echo "PASS: $name $mode dynamic DOM and screenshot"
  done
done
echo "PASS: 8 headless DOM and visual captures; physical device and external map tiles remain unverified"
