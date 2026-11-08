#!/usr/bin/env python3
"""Generate missing voice lines with any text-to-speech tool.

For every line in script.json without an audio file, runs a shell command you supply. The
command gets the line through placeholders, and must write the file at {out}:
  {text}     the line, shell-quoted          {out}      output path (directories are created)
  {speaker}  speaker id, e.g. owl            {voice}    cast.json speakers.<id>.tts.voice (if set)
  {id}       line id, e.g. owl.hint.duck     {pitch} {rate}  cast.json speakers.<id>.voice

Examples
  macOS built-in voices (writes AIFF, then converts with ffmpeg):
    python3 tools/tts_batch.py --ext mp3 --cmd 'say -v "{voice}" -o /tmp/l.aiff {text} && ffmpeg -loglevel error -y -i /tmp/l.aiff {out}'
  Piper (local, free):
    python3 tools/tts_batch.py --cmd 'echo {text} | piper --model "{voice}" --output_file /tmp/l.wav && ffmpeg -loglevel error -y -i /tmp/l.wav {out}'
  Any HTTP TTS: put a small script of your own behind --cmd that takes the same placeholders.

Options: --only owl,pip (speakers)  --force (redo existing files)  --dry-run
Afterwards run tools/voice_lines.py to refresh the manifest, then tools/build.py.
"""
import argparse, json, os, shlex, subprocess, sys
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ap = argparse.ArgumentParser()
ap.add_argument('--story', default='pips-island')
ap.add_argument('--cmd', required=True)
ap.add_argument('--ext', default='mp3')
ap.add_argument('--only', default='')
ap.add_argument('--force', action='store_true')
ap.add_argument('--dry-run', action='store_true')
a = ap.parse_args()
sd = os.path.join(ROOT, 'stories', a.story)
script = json.load(open(os.path.join(sd, 'script.json'), encoding='utf-8'))
cast = json.load(open(os.path.join(sd, 'cast.json'), encoding='utf-8'))['speakers']
only = set(filter(None, a.only.split(',')))
made = skipped = failed = 0
for cid, c in script['conversations'].items():
    for l in c['lines']:
        sp = l.get('speaker', c['speaker'])
        if only and sp not in only: continue
        out = os.path.join(ROOT, 'audio', 'voice', sp, f"{l['id']}.{a.ext}")
        if os.path.exists(out) and not a.force: skipped += 1; continue
        info = cast.get(sp, {})
        cmd = a.cmd.format(text=shlex.quote(l['text']), out=shlex.quote(out), speaker=sp, id=l['id'],
                           voice=info.get('tts', {}).get('voice', ''), pitch=info.get('voice', {}).get('pitch', 1), rate=info.get('voice', {}).get('rate', 1))
        if a.dry_run: print(cmd); continue
        os.makedirs(os.path.dirname(out), exist_ok=True)
        r = subprocess.run(cmd, shell=True)
        if r.returncode == 0 and os.path.exists(out): made += 1; print('ok  ', l['id'])
        else: failed += 1; print('FAIL', l['id'], file=sys.stderr)
print(f'made {made}, already had {skipped}, failed {failed}')
