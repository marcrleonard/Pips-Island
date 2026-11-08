#!/usr/bin/env python3
"""Take the README screenshots with headless Chrome.

Usage:  python3 tools/screenshots.py      (needs tools/watch.py running, or any server for dist/ on :8000)
Writes docs/screenshots/<name>.jpg. Each shot sets up a scene in a copy of the built game (dist/shot.html):
the day, where Pip stands, the camera zoom, and optionally a conversation on screen.
"""
import os, subprocess, sys
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CHROME = os.environ.get('CHROME', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome')
OUT = os.path.join(ROOT, 'docs', 'screenshots')

# name: (width, height, setup JS run once the game has started; `d` is the debug hook)
SHOTS = {
  'island':  (1280, 800,  "d.at('island', 1200, 900);"),
  'friends': (1280, 800,  "d.zoom(1.25); d.at('island', 770, 1075); S.player.face = -1; d.speak('hog.ask');"),
  'burrow':  (1280, 800,  "d.day(2); d.zoom(0.62); d.at('cave', 820, 600);"),
  'cove':    (1280, 800,  "d.day(2); S.tideT = 3; d.zoom(0.8); d.at('cove', 980, 760);"),
  'isle':    (1280, 800,  "d.day(3); d.zoom(0.85); d.at('isle', 980, 520); S.boatAt = 'isle';"),
}

HOOK = r"""
window.__shot = (() => {
  const d = {
    // a resize (headless Chrome sends one after load) resets the zoom, so keep re-applying it
    zoom(z){ const set = () => { cam.baseZ = z; cam.z = z; cam.vw = innerWidth/z; cam.vh = innerHeight/z; }; set(); setInterval(() => { set(); cam.snap = true; }, 50); },
    at(scene, x, y){ S.scene = scene; S.player.x = x; S.player.y = y; S.npcs.forEach(n => n.near = true); cam.snap = true; },
    day(n){ if (n >= 3) startDay3(true); else if (n >= 2) startDay2(true); },
    speak(id){ speak(id); },
  };
  return setup => {
    document.getElementById('start').click();
    setTimeout(() => {
      stopVoice(); if (S.dialog) { S.dialog = null; document.getElementById('dialog').hidden = true; }
      voiceOn = false;
      new Function('d', 'S', setup)(d, S);
      for (let i = 0; i < 4; i++) update(1/60);
    }, 900);
  };
})();
const __setup = decodeURIComponent((location.hash.match(/shot=(.*)$/) || [])[1] || '');
if (__setup) addEventListener('load', () => window.__shot(__setup));
"""

def main():
    subprocess.run([sys.executable, os.path.join(ROOT, 'tools', 'build.py')], check=True)
    page = open(os.path.join(ROOT, 'dist', 'pips-island.html'), encoding='utf-8').read()
    marker = 'resize(); init(); requestAnimationFrame(frame);'
    assert marker in page
    open(os.path.join(ROOT, 'dist', 'shot.html'), 'w', encoding='utf-8').write(page.replace(marker, marker + HOOK, 1))
    os.makedirs(OUT, exist_ok=True)
    from urllib.parse import quote
    for name, (w, h, setup) in SHOTS.items():
        out = os.path.join(OUT, name + '.png')
        url = 'http://localhost:8000/shot.html#shot=' + quote(setup)
        subprocess.run([CHROME, '--headless=new', '--hide-scrollbars', '--mute-audio', f'--window-size={w},{h}',
                        '--force-device-scale-factor=1', '--virtual-time-budget=6000', f'--screenshot={out}', url],
                       check=True, capture_output=True)
        # the paper grain makes PNGs heavy; JPEG keeps them small for the README (sips ships with macOS)
        jpg = out[:-4] + '.jpg'
        if subprocess.run(['sips', '-s', 'format', 'jpeg', '-s', 'formatOptions', '82', out, '--out', jpg], capture_output=True).returncode == 0:
            os.remove(out); out = jpg
        print('wrote', os.path.relpath(out, ROOT))
    os.remove(os.path.join(ROOT, 'dist', 'shot.html'))

if __name__ == '__main__':
    main()
