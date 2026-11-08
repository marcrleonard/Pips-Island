#!/usr/bin/env python3
"""List every voice line, and record which ones already have audio.

Writes:
  audio/voice_lines.csv   one row per line: id, speaker, character, direction tag, text, file, has_audio, character notes
  audio/manifest.json     the audio files that exist (the game only plays files listed here)

Usage:  python3 tools/voice_lines.py [--story pips-island] [--ext mp3]
Run it after adding or regenerating audio, then rebuild with tools/build.py.
"""
import argparse, csv, json, os
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ap = argparse.ArgumentParser()
ap.add_argument('--story', default='pips-island')
ap.add_argument('--ext', default='mp3')
a = ap.parse_args()
sd = os.path.join(ROOT, 'stories', a.story)
script = json.load(open(os.path.join(sd, 'script.json'), encoding='utf-8'))
cast = json.load(open(os.path.join(sd, 'cast.json'), encoding='utf-8'))['speakers']
rows, present = [], []
for cid, c in script['conversations'].items():
    for l in c['lines']:
        sp = l.get('speaker', c['speaker'])
        rel = f"audio/voice/{sp}/{l['id']}.{a.ext}"
        has = os.path.exists(os.path.join(ROOT, rel))
        if has: present.append(rel)
        rows.append({'id': l['id'], 'speaker': sp, 'character': cast.get(sp, {}).get('name', sp), 'direction_tag': l.get('direction', ''), 'text': l['text'],
                     'file': rel, 'has_audio': 'yes' if has else 'no', 'character_notes': cast.get(sp, {}).get('description', '')})
os.makedirs(os.path.join(ROOT, 'audio'), exist_ok=True)
with open(os.path.join(ROOT, 'audio', 'voice_lines.csv'), 'w', newline='', encoding='utf-8') as f:
    w = csv.DictWriter(f, fieldnames=list(rows[0].keys())); w.writeheader(); w.writerows(rows)
json.dump({'ext': a.ext, 'files': sorted(present)}, open(os.path.join(ROOT, 'audio', 'manifest.json'), 'w'), indent=1)
by = {}
for r in rows: by.setdefault(r['speaker'], [0, 0]); by[r['speaker']][0] += 1; by[r['speaker']][1] += r['has_audio'] == 'yes'
print(f"{len(rows)} lines, {len(present)} recorded")
for sp, (n, done) in sorted(by.items()): print(f"  {sp:9s} {done:3d}/{n:<3d} {cast.get(sp, {}).get('name', '')}")
