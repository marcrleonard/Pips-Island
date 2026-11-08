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
let voiceAudio = null;
function stopVoice(){ try { speechSynthesis.cancel(); } catch(e){} if (voiceAudio) { try { voiceAudio.pause(); } catch(e){} voiceAudio = null; } }
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
  if (l.id && AUDIO_FILES.has(lineAudioPath(l))) {
    try { voiceAudio = new Audio(lineAudioPath(l)); voiceAudio.play().catch(() => say(l.text, l.speaker)); return; } catch(e){}
  }
  say(l.text, l.speaker);
}

