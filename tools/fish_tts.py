#!/usr/bin/env python3
"""Generate every voice line with Fish Audio (https://fish.audio).

Setup
  1. Create an API key at fish.audio and export it:   export FISH_API_KEY=...
     (or put FISH_API_KEY=... in a .env file at the project root; it is git-ignored)
  2. For each character, pick or clone a voice on fish.audio and paste its model id into
     stories/<story>/cast.json  ->  speakers.<id>.fish.reference_id
  3. Run:  python3 tools/fish_tts.py

What it does
  * For each line in script.json, sends "<direction> <text>" (or the line's voice_text) to
    POST https://api.fish.audio/v1/tts with that speaker's reference_id.
  * Writes audio/voice/<speaker>/<line id>.mp3.
  * Remembers what it sent in audio/voice_hashes.json, so later runs only regenerate lines whose
    words, direction, voice or settings changed. New lines are picked up automatically.
  * Refreshes audio/manifest.json and audio/voice_lines.csv at the end (via voice_lines.py).
  Rebuild afterwards with:  python3 tools/build.py

Useful options
  --only owl,pip        only these speakers           --ids 'owl.hint.*'   only matching line ids
  --force               regenerate everything selected --dry-run          show what would be sent
  --limit 5             stop after 5 requests          --model s2.1-pro     Fish model header
  --bitrate 128         mp3 bitrate (64/128/192)       --delay 0.4          seconds between requests
No third-party packages needed (standard library only).
"""
import argparse, fnmatch, hashlib, json, os, subprocess, sys, time, urllib.error, urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
API = 'https://api.fish.audio/v1/tts'

def load_env():
    path = os.path.join(ROOT, '.env')
    if os.path.exists(path):
        for line in open(path):
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                k, v = line.split('=', 1); os.environ.setdefault(k.strip(), v.strip().strip('"\''))

def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--story', default='pips-island')
    ap.add_argument('--only', default='')
    ap.add_argument('--ids', default='')
    ap.add_argument('--force', action='store_true')
    ap.add_argument('--dry-run', action='store_true')
    ap.add_argument('--limit', type=int, default=0)
    ap.add_argument('--model', default='s2.1-pro')
    ap.add_argument('--bitrate', type=int, default=128)
    ap.add_argument('--latency', default='normal', help='"normal" (best quality) or "balanced"')
    ap.add_argument('--delay', type=float, default=0.4)
    a = ap.parse_args()
    load_env()
    key = os.environ.get('FISH_API_KEY', '')
    if not key and not a.dry_run: sys.exit('Set FISH_API_KEY (environment or .env file).')

    sd = os.path.join(ROOT, 'stories', a.story)
    script = json.load(open(os.path.join(sd, 'script.json'), encoding='utf-8'))
    cast = json.load(open(os.path.join(sd, 'cast.json'), encoding='utf-8'))['speakers']
    hash_path = os.path.join(ROOT, 'audio', 'voice_hashes.json')
    hashes = json.load(open(hash_path)) if os.path.exists(hash_path) else {}
    only = set(filter(None, a.only.split(',')))
    missing_voice, made, skipped, failed, sent = set(), 0, 0, 0, 0

    for cid, c in script['conversations'].items():
        for l in c['lines']:
            sp = l.get('speaker', c['speaker'])
            if only and sp not in only: continue
            if a.ids and not fnmatch.fnmatch(l['id'], a.ids): continue
            fish = cast.get(sp, {}).get('fish', {})
            ref = fish.get('reference_id', '')
            if not ref: missing_voice.add(sp); continue
            text = l.get('voice_text') or f"{l.get('direction', '')} {l['text']}".strip()
            body = {'text': text, 'reference_id': ref, 'format': 'mp3', 'mp3_bitrate': a.bitrate, 'latency': a.latency}
            if fish.get('speed', 1.0) != 1.0: body['prosody'] = {'speed': fish['speed']}
            digest = hashlib.sha1(json.dumps([body, a.model], sort_keys=True).encode()).hexdigest()
            out = os.path.join(ROOT, 'audio', 'voice', sp, f"{l['id']}.mp3")
            if os.path.exists(out) and hashes.get(l['id']) == digest and not a.force: skipped += 1; continue
            if a.limit and sent >= a.limit: continue
            sent += 1
            if a.dry_run: print(f"{l['id']:28s} {sp:8s} {text}"); continue
            os.makedirs(os.path.dirname(out), exist_ok=True)
            req = urllib.request.Request(API, data=json.dumps(body).encode(), method='POST', headers={
                'Authorization': f'Bearer {key}', 'Content-Type': 'application/json', 'model': a.model})
            for attempt in range(5):
                try:
                    with urllib.request.urlopen(req, timeout=120) as r: audio = r.read()
                    with open(out, 'wb') as f: f.write(audio)
                    hashes[l['id']] = digest; made += 1; print('ok  ', l['id']); break
                except urllib.error.HTTPError as e:
                    msg = e.read()[:300].decode('utf-8', 'replace')
                    if e.code in (429, 500, 502, 503, 504) and attempt < 4: time.sleep(2 ** attempt * 2); continue
                    failed += 1; print(f"FAIL {l['id']}: HTTP {e.code} {msg}", file=sys.stderr); break
                except Exception as e:
                    if attempt < 4: time.sleep(2 ** attempt * 2); continue
                    failed += 1; print(f"FAIL {l['id']}: {e}", file=sys.stderr); break
            json.dump(hashes, open(hash_path, 'w'), indent=1)
            time.sleep(a.delay)

    if missing_voice: print('No fish.reference_id in cast.json for: ' + ', '.join(sorted(missing_voice)) + ' (skipped)')
    print(f'made {made}, up to date {skipped}, failed {failed}')
    if not a.dry_run:
        subprocess.run([sys.executable, os.path.join(ROOT, 'tools', 'voice_lines.py'), '--story', a.story])

if __name__ == '__main__':
    main()
