// Dialog box.
// ---------- Dialog ----------
const dlg = document.getElementById('dialog'), whoEl = document.getElementById('who'), lineEl = document.getElementById('line');
const itemEl = document.getElementById('item'), moreText = document.getElementById('moreText');
let shownItem = null;
function showLine(){
  const D = S.dialog, L = D.lines[D.i];
  lineEl.textContent = L.text;
  const key = L.item ? L.item.k + ':' + (L.item.n||'') : null;
  if (key !== shownItem) {
    shownItem = key;
    itemEl.hidden = !L.item;
    if (L.item) itemEl.innerHTML = ITEM_ART[L.item.k] + (L.item.n ? `<span class="count">×${L.item.n}</span>` : '');
  }
  const last = D.i === D.lines.length - 1;
  dlg.classList.toggle('last', last);
  moreText.textContent = last ? 'Tap to close' : 'Tap to continue';
  whoEl.textContent = speakerName(L.speaker);
  voiceLine(L);
}
const speakerName = id => (CAST.speakers[id] || {}).name ?? id;
// Lines are { id, speaker, text, item } objects from the story script.
function openDialog(lines, after){
  if (!lines.length) { after && after(); return; }
  S.dialog = { id: lines[0].speaker, lines, i:0, after };
  clearGoal(); shownItem = undefined; preloadVoices(lines);
  dlg.hidden = false; chime([520,700],0.08); showLine();
}
function advance(){
  const D = S.dialog; if (!D) return;
  D.i++;
  if (D.i >= D.lines.length){ dlg.hidden = true; S.dialog = null; stopVoice(); D.after && D.after(); renderQuests(); return; }
  showLine();
}
// speak('hog.ask') or speak(['owl.again.next', 'owl.hint.berry']) plays conversations from script.json.
function convo(id){
  const c = SCRIPT.conversations[id];
  if (!c) { console.warn('Missing conversation in script.json:', id); return []; }
  return c.lines.map(l => ({ ...l, speaker: l.speaker || c.speaker }));
}
function speak(ids, after){ openDialog([].concat(ids).filter(Boolean).flatMap(convo), after); }
dlg.addEventListener('pointerdown', e => { e.stopPropagation(); advance(); });

