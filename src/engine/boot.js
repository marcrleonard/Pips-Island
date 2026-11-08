// Main loop and start buttons.
// ---------- Loop ----------
let last = performance.now(), running = false;
function frame(now){
  const dt = Math.min(0.05, (now-last)/1000); last = now;
  if (running) update(dt);
  draw();
  requestAnimationFrame(frame);
}

document.getElementById('start').addEventListener('click', () => {
  document.getElementById('title').hidden = true; running = true; chime([523,659,784],0.1);
  // Testing shortcut: open the game with #day2 at the end of the link to start on Day 2
  if (location.hash === '#day2') { startDay2(); return; }
  setTimeout(() => speak('pip.start'), 400);
});
document.getElementById('wake').addEventListener('click', () => startDay2());
document.getElementById('again').addEventListener('click', () => {
  document.getElementById('end').hidden = true; init(); running = true;
  setTimeout(() => speak('pip.again'), 300);
});

resize(); init(); requestAnimationFrame(frame);
