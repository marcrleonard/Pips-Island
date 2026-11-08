#!/usr/bin/env python3
"""Rebuild whenever a source file changes, and serve the game at http://localhost:8000.

Usage: python3 tools/watch.py   then open http://localhost:8000/pips-island.html
Reload the page after a change (or use a live-reload browser extension).
"""
import http.server, os, subprocess, sys, threading, time
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
WATCH = ['src', 'stories', 'audio/manifest.json', 'tools/order.txt']
def snapshot():
    out = {}
    for w in WATCH:
        p = os.path.join(ROOT, w)
        if os.path.isfile(p): out[p] = os.path.getmtime(p)
        for d, _, fs in os.walk(p):
            for f in fs: out[os.path.join(d, f)] = os.path.getmtime(os.path.join(d, f))
    return out
def build(): subprocess.run([sys.executable, os.path.join(ROOT, 'tools', 'build.py')])
def serve():
    os.chdir(os.path.join(ROOT, 'dist'))
    # audio files live outside dist; link them in so recorded voices play locally
    if not os.path.exists('audio') and os.path.isdir(os.path.join(ROOT, 'audio')): os.symlink(os.path.join(ROOT, 'audio'), 'audio')
    class NoCache(http.server.SimpleHTTPRequestHandler):
        # always re-check files, so a phone never keeps an old build or an old recording
        def end_headers(self): self.send_header('Cache-Control', 'no-cache'); super().end_headers()
    http.server.ThreadingHTTPServer(('', 8000), NoCache).serve_forever()
build(); threading.Thread(target=serve, daemon=True).start()
print('Serving http://localhost:8000/pips-island.html  (Ctrl+C to stop)')
seen = snapshot()
while True:
    time.sleep(0.5); now = snapshot()
    if now != seen: seen = now; build()
