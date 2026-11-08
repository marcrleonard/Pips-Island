// Tap, drag, keys, camera size.
// ---------- Input ----------
const keys = {};
addEventListener('keydown', e => {
  if (S.dialog && (e.key===' '||e.key==='Enter')) { advance(); e.preventDefault(); return; }
  keys[e.key.toLowerCase()] = true;
});
addEventListener('keyup', e => { keys[e.key.toLowerCase()] = false; });
let dragging = false;
function toWorld(e){ const r = cvs.getBoundingClientRect(); return { x: cam.x + (e.clientX - r.left)/cam.z, y: cam.y + (e.clientY - r.top)/cam.z }; }
cvs.addEventListener('pointerdown', e => {
  if (S.dialog) { advance(); return; }
  if (S.ending) return;
  dragging = true; const p = toWorld(e);
  for (const n of S.npcs) if (n.scene===S.scene && d2(p.x,p.y,n.x,n.y) < 50) { n.near = false; n.tapped = true; }
  setGoal(p.x, p.y); lastRepath = performance.now();
});
let lastRepath = 0;
cvs.addEventListener('pointermove', e => {
  if (!dragging || S.dialog || S.ending) return;
  const now = performance.now(); if (now - lastRepath < 120) return;
  lastRepath = now; const p = toWorld(e); setGoal(p.x, p.y);
});
addEventListener('pointerup', () => dragging = false);

// ---------- Camera ----------
const cam = { x:0, y:0, z:1, vw:0, vh:0, snap:true };
let DPR = 1;
function resize(){
  DPR = Math.min(window.devicePixelRatio||1, 2);
  cvs.width = innerWidth*DPR; cvs.height = innerHeight*DPR;
  cam.baseZ = Math.max(0.62, Math.min(1.35, Math.min(innerWidth, innerHeight)/640));
  if (!(typeof S !== 'undefined' && S && S.show)) cam.z = cam.baseZ;
  cam.vw = innerWidth/cam.z; cam.vh = innerHeight/cam.z;
}
addEventListener('resize', resize);

