// Main loop and start buttons.
// ---------- Loop ----------
let last = performance.now(), running = false;
function frame(now){
  const dt = Math.min(0.05, (now-last)/1000); last = now;
  if (running) { update(dt); autosave(dt); }
  draw();
  requestAnimationFrame(frame);
}

function begin(){ document.getElementById('title').hidden = true; running = true; chime([523,659,784],0.1); preloadAllVoices(); }
const saved = readSave();
if (saved) {
  document.getElementById('start').textContent = 'Keep playing';
  document.getElementById('newgame').hidden = false;
}
document.getElementById('start').addEventListener('click', () => {
  begin();
  // Testing shortcut: open the game with #day2 at the end of the link to start on Day 2
  if (location.hash === '#day2') { startDay2(); return; }
  if (location.hash === '#day3') { startDay3(); return; }
  if (saved) {
    restoreSave(saved);
    if (saved.progress) setTimeout(() => speak('pip.welcome'), 400);
    else if (saved.day >= 2) setTimeout(() => speak(`pip.day${saved.day}.start`), 400);
    else setTimeout(() => speak('pip.start'), 400);
    return;
  }
  setTimeout(() => speak('pip.start'), 400);
});
document.getElementById('newgame').addEventListener('click', () => {
  clearSave(); init(); begin();
  setTimeout(() => speak('pip.start'), 400);
});
document.getElementById('wake').addEventListener('click', () => startDay(S.day + 1));
document.getElementById('again').addEventListener('click', () => {
  document.getElementById('end').hidden = true; clearSave(); init(); running = true;
  setTimeout(() => speak('pip.again'), 300);
});

resize(); init(); requestAnimationFrame(frame);
