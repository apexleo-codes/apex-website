#!/bin/bash
# Serve the APEX website on this Mac and open it in the browser.
#   ./serve.sh          -> http://localhost:8080
#   ./serve.sh 9000     -> http://localhost:9000
# Everything (fonts, GSAP, Lenis, images) is local, so it works offline. Ctrl+C stops it.
cd "$(dirname "$0")" || exit 1
PORT="${1:-8080}"
echo "APEX website → http://localhost:$PORT   (Ctrl+C to stop)"
( sleep 1; open "http://localhost:$PORT" ) >/dev/null 2>&1 &
exec python3 -m http.server "$PORT" --bind 127.0.0.1
