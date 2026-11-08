// Island minimap.
// ---------- Minimap ----------
const mapEl = document.getElementById('map'), mctx = mapEl.getContext('2d');
const toggleMap = e => { e.stopPropagation(); mapEl.classList.toggle('big'); mapEl.setAttribute('aria-label', mapEl.classList.contains('big') ? 'Island map, tap to make smaller' : 'Island map, tap to make bigger'); };
mapEl.addEventListener('pointerdown', toggleMap);
mapEl.addEventListener('keydown', e => { if (e.key==='Enter'||e.key===' ') { e.preventDefault(); toggleMap(e); } });
const NPC_DOT = { owl:'#a58467', duck:'#fffdf6', hog:'#8f6b50', crab:'#e07355' };
function drawMap(t){
  const w = mapEl.clientWidth, h = mapEl.clientHeight; if (!w) return;
  if (mapEl.width !== Math.round(w*DPR)) { mapEl.width = Math.round(w*DPR); mapEl.height = Math.round(h*DPR); }
  if (S.scene==='cave') return drawCaveMap(t, w);
  if (S.scene==='cove') return drawCoveMap(t, w);
  if (S.scene==='isle') return drawIsleMap(t, w);
  const k = w / W;
  mctx.setTransform(DPR*k,0,0,DPR*k,0,0);
  mctx.fillStyle = C.sea; mctx.fillRect(0,0,W,H);
  const c = (x,y,r,f) => { mctx.beginPath(); mctx.arc(x,y,r,0,Math.PI*2); mctx.fillStyle=f; mctx.fill(); };
  const poly = (pts, f) => { mctx.beginPath(); pts.forEach(([x,y],i) => i ? mctx.lineTo(x,y) : mctx.moveTo(x,y)); mctx.closePath(); mctx.fillStyle = f; mctx.fill(); };
  poly(offsetPoly(ISLAND, 46), C.sand); poly(ISLAND, C.grass);
  mctx.beginPath(); mctx.ellipse(pond.x,pond.y,pond.r,pond.r*0.6,0,0,Math.PI*2); mctx.fillStyle=C.pond; mctx.fill();
  mctx.strokeStyle='#e3d3a6'; mctx.lineWidth=34; mctx.lineCap='round';
  for (const [a,cc,b] of PATHS){ mctx.beginPath(); mctx.moveTo(a[0],a[1]); mctx.quadraticCurveTo(cc[0],cc[1],b[0],b[1]); mctx.stroke(); }
  trees.forEach(tr => c(tr.x, tr.y-30, 34, tr.kind==='birch' ? '#a7c96f' : '#7aa75c'));
  c(bigTree.x, bigTree.y-90, 110, '#5f9150');
  c(house.x, house.y-30, 50, '#9a7556');
  // friends
  const u = 1/k, R = (w > 200 ? 5.5 : 4.5)*u;
  c(burrow.x, burrow.y, 60, '#8fbf68'); c(burrow.x, burrow.y+40, 26, '#3a2a22');
  S.npcs.forEach(n => {
    if (n.scene!=='island') return;
    const ny = n.id==='owl' ? bigTree.y-60 : n.y;
    const m = npcMarker(n);
    if (m) { mctx.lineWidth = 2*u; mctx.strokeStyle = m==='ready' ? '#6f9e55' : '#e0904a'; mctx.beginPath(); mctx.arc(n.x, ny, R+(2.5+Math.sin(t*4)*0.8)*u, 0, Math.PI*2); mctx.stroke(); }
    c(n.x, ny, R, NPC_DOT[n.id]);
    mctx.lineWidth = 1.2*u; mctx.strokeStyle = C.ink; mctx.beginPath(); mctx.arc(n.x, ny, R, 0, Math.PI*2); mctx.stroke();
  });
  S.ducklings.forEach(d => { if (d.state!=='hidden') c(d.x, d.y, R*0.55, '#f6d55c'); });
  // camera view and Pip
  mctx.lineWidth = 1.5*u; mctx.strokeStyle = 'rgba(255,250,240,.9)';
  mctx.strokeRect(cam.x, cam.y, Math.min(cam.vw,W), Math.min(cam.vh,H));
  const P = S.player;
  c(P.x, P.y, R*1.6 + Math.sin(t*5)*u, 'rgba(244,184,90,.5)');
  c(P.x, P.y, R*1.05, '#f4b85a');
  mctx.lineWidth = 1.2*u; mctx.strokeStyle = C.ink; mctx.beginPath(); mctx.arc(P.x, P.y, R*1.05, 0, Math.PI*2); mctx.stroke();
}

