#!/usr/bin/env python3
"""Bundle the game into one self-contained HTML file.

Source files are concatenated in the order listed in tools/order.txt inside a single
function scope, so files share names without leaking globals. JSON data files in the story
folder are embedded as constants (STORY, SCRIPT, CAST, AUDIO_MANIFEST).

Usage:  python3 tools/build.py [output.html]
"""
import json, os, sys
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
def read(p): return open(os.path.join(ROOT, p), encoding='utf-8').read()
def jsonc(p, default):
    full = os.path.join(ROOT, p)
    return json.dumps(json.load(open(full, encoding='utf-8')) if os.path.exists(full) else default, ensure_ascii=False)
story_dir = 'stories/pips-island'
data = '\n'.join([
    f"const STORY = {jsonc(story_dir + '/story.json', {})};",
    f"const SCRIPT = {jsonc(story_dir + '/script.json', {})};",
    f"const CAST = {jsonc(story_dir + '/cast.json', {})};",
    f"const AUDIO_MANIFEST = {jsonc('audio/manifest.json', {'files': []})};",
])
files = [l.strip() for l in read('tools/order.txt').splitlines() if l.strip() and not l.startswith('#')]
body = '\n'.join(f'// ===== {f} =====\n' + read(f) for f in files)
html = read('src/shell.html').replace('<!--SCRIPTS-->', '<script>\n(() => {\n' + data + '\n' + body + '\n})();\n</script>')
out = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, 'dist', 'pips-island.html')
os.makedirs(os.path.dirname(out), exist_ok=True)
open(out, 'w', encoding='utf-8').write(html)
print(f'built {out} ({len(html)//1024} KB, {len(files)} source files)')
