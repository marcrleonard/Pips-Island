// Chimes and voice playback.
// ---------- Audio ----------
let actx = null;
function chime(notes=[660,880], dur=0.12){
  try {
    actx = actx || new (window.AudioContext||window.webkitAudioContext)();
    notes.forEach((f,i) => {
      const o = actx.createOscillator(), g = actx.createGain();
      o.type = 'triangle'; o.frequency.value = f;
      const t0 = actx.currentTime + i*dur;
      g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(0.18, t0+0.02); g.gain.exponentialRampToValueAtTime(0.0001, t0+dur*1.8);
      o.connect(g).connect(actx.destination); o.start(t0); o.stop(t0+dur*2);
    });
  } catch(e){}
}
let voiceOn = true;
const voiceBtn = document.getElementById('voice');
voiceBtn.addEventListener('click', e => {
  e.stopPropagation(); voiceOn = !voiceOn;
  voiceBtn.classList.toggle('off', !voiceOn);
  voiceBtn.setAttribute('aria-label', voiceOn ? 'Read aloud on' : 'Read aloud off');
  if (!voiceOn) stopVoice(); else if (S.dialog) voiceLine(S.dialog.lines[S.dialog.i]);
});
// Voice lines. A recorded file is used when audio/manifest.json lists it (tools/voice_lines.py
// writes that list); otherwise the browser's built-in voice reads the line, pitched per speaker.
const AUDIO_FILES = new Set(AUDIO_MANIFEST.files || []);
const AUDIO_EXT = AUDIO_MANIFEST.ext || 'mp3';
const lineAudioPath = l => `audio/voice/${l.speaker}/${l.id}.${AUDIO_EXT}`;
// Recorded lines play through Web Audio, not <audio> elements. iPhones refuse to start an <audio> element
// outside a tap (a friend who starts talking as Pip walks up), which used to fall back to the robotic
// built-in voice; one audio context unlocked by the first tap plays everything after it.
const ac = () => actx = actx || new (window.AudioContext||window.webkitAudioContext)();
try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch(e){}   // play even with the ringer switch off
['pointerdown','touchend','click','keydown'].forEach(ev => addEventListener(ev, () => {
  try { const a = ac(); if (a.state !== 'running') a.resume(); } catch(e){}
}, { capture: true, passive: true }));
const voiceBufs = new Map();
let voiceSrc = null, voiceTok = 0;
const AUDIO_VERSIONS = AUDIO_MANIFEST.versions || {};
function loadVoice(path){
  const url = AUDIO_VERSIONS[path] ? `${path}?v=${AUDIO_VERSIONS[path]}` : path;
  if (!voiceBufs.has(path)) voiceBufs.set(path, fetch(url)
    .then(r => { if (!r.ok) throw new Error(r.status); return r.arrayBuffer(); })
    .then(b => new Promise((ok, no) => ac().decodeAudioData(b, ok, no)))
    .catch(e => { voiceBufs.delete(path); throw e; }));
  return voiceBufs.get(path);
}
function preloadVoices(lines){ for (const l of lines) if (l.id && AUDIO_FILES.has(lineAudioPath(l))) loadVoice(lineAudioPath(l)).catch(() => {}); }
function stopVoice(){
  voiceTok++;
  try { speechSynthesis.cancel(); } catch(e){}
  if (voiceSrc) { try { voiceSrc.stop(); } catch(e){} voiceSrc = null; }
}
function say(text, who){
  if (!voiceOn) return;
  try {
    stopVoice();
    const v = (CAST.speakers[who] || {}).voice || {};
    const u = new SpeechSynthesisUtterance(text);
    u.rate = v.rate || 0.88; u.pitch = v.pitch || 1;
    speechSynthesis.speak(u);
  } catch(e){}
}
function voiceLine(l){
  if (!voiceOn || !l) return;
  stopVoice();
  if (!(l.id && AUDIO_FILES.has(lineAudioPath(l)))) return say(l.text, l.speaker);
  const tok = voiceTok;
  loadVoice(lineAudioPath(l)).then(buf => {
    if (tok !== voiceTok || !voiceOn) return;
    const a = ac(); if (a.state !== 'running') a.resume();
    const src = a.createBufferSource(); src.buffer = buf; src.connect(a.destination); src.start(); voiceSrc = src;
  }).catch(() => { if (tok === voiceTok) say(l.text, l.speaker); });
}
