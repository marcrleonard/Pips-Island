// Save and load. The engine stores one JSON document per story in localStorage; the story decides what goes in it
// (saveSnapshot / restoreSave in stories/<story>/save.js). Document shape:
//   { format:'story-save', version, story, savedAt, day, progress }
// 'progress' is null at the start of a day, otherwise the story's own mid-day state.
// The format is plain JSON on purpose, so another engine (or a server, later) can read the same file.
// ---------- Save ----------
const SAVE_FORMAT = 'story-save', SAVE_VERSION = 1;
const SAVE_KEY = `${STORY.id || 'story'}:save`;
let saveClock = 0, lastSaved = '';

function readSave(){
  try {
    const d = JSON.parse(localStorage.getItem(SAVE_KEY));
    // Older versions would be upgraded here before the check, e.g. if (d.version === 1) d = upgradeV1(d).
    if (d && d.format === SAVE_FORMAT && d.version === SAVE_VERSION && d.story === STORY.id) return d;
  } catch (e) {}
  return null;
}
function clearSave(){ try { localStorage.removeItem(SAVE_KEY); } catch (e) {} lastSaved = ''; }
function saveNow(){
  const snap = saveSnapshot();          // the story returns null when it is mid-animation and shouldn't be saved
  if (!snap) return;
  const body = JSON.stringify(snap);
  if (body === lastSaved) return;
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify({ format: SAVE_FORMAT, version: SAVE_VERSION, story: STORY.id, savedAt: new Date().toISOString(), ...snap }));
    lastSaved = body;
  } catch (e) {}
}
function autosave(dt){ saveClock += dt; if (saveClock >= 2) { saveClock = 0; saveNow(); } }
addEventListener('visibilitychange', () => { if (document.hidden && running) saveNow(); });
addEventListener('pagehide', () => { if (running) saveNow(); });
