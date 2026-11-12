// Days, Digby's tunnel, Seagrass Cove.
// ---------- Days ----------
// Each quest belongs to a day. Day 1: the island and the burrow. Day 2: Digby's new tunnel and Seagrass Cove.
const QUEST_DAY = Object.fromEntries(STORY.quests.map(q => [q.id, q.day]));
const dayQuests = () => Object.entries(S.quests).filter(([k]) => QUEST_DAY[k] === S.day).map(([,v]) => v);
const sceneDims = sc => sc==='cave' ? [CW,CH] : sc==='cove' ? [VW,VH] : sc==='isle' ? [IW,IH] : sc==='highland' ? [HW,HH] : [W,H];

// Pip notices something before anyone has asked: she wonders aloud, and whoever it belongs to gets a "!".
function earlyFind(qid, friendId, convoId){
  const q = S.quests[qid];
  if (!q || q.state !== 'new' || S.early[qid]) return false;
  S.early[qid] = true; S.hinted.add(friendId);
  setTimeout(() => { if (!S.dialog) speak(convoId); }, 650);
  return true;
}

// ---------- Digby's new tunnel ----------
const NEW_TUNNEL = { a:{ x:800, y:320 }, b:{ x:1180, y:150 } };
const NEW_ROOM = { x:1180, y:150, r:84 };
const CAVE_LADDER2 = { x:1212, y:104 };
// 0: not started, 1: Digby is digging (Day 1, after the lanterns), 2: finished (Day 2)
function digStage(){ return S.day >= 2 ? 2 : (S.quests.glow.state==='done' && !S.show ? 1 : 0); }
function stubEnd(){ const t = 0.66; return { x: NEW_TUNNEL.a.x + (NEW_TUNNEL.b.x-NEW_TUNNEL.a.x)*t, y: NEW_TUNNEL.a.y + (NEW_TUNNEL.b.y-NEW_TUNNEL.a.y)*t }; }
function newTunnelWalk(x,y){
  const st = digStage(); if (!st) return false;
  const e = st===2 ? NEW_TUNNEL.b : stubEnd();
  if (segD(x,y,NEW_TUNNEL.a.x,NEW_TUNNEL.a.y,e.x,e.y) < TW-10) return true;
  return st===2 && d2(x,y,NEW_ROOM.x,NEW_ROOM.y) < NEW_ROOM.r-14;
}
function drawNewTunnel(t){
  const st = digStage(); if (!st) return;
  const e = st===2 ? NEW_TUNNEL.b : stubEnd();
  if (st===1) {
    // fresh dirt where Digby is digging
    const dx = e.x + 26, dy = e.y - 12;
    ell(dx, dy, 34, 22, '#7a5f4b'); ell(dx-6, dy-6, 20, 12, '#8d705a');
    for (let i=0;i<6;i++) circ(dx - 30 + i*11, dy + 14 + (i%2)*5, 3, '#5e4636');
  } else {
    // daylight from the sea cave above, and a ladder up
    const L = CAVE_LADDER2;
    ell(L.x, L.y+8, 40, 16, 'rgba(255,240,190,.3)');
    ctx.strokeStyle='#a07c58'; ctx.lineWidth=5;
    ctx.beginPath(); ctx.moveTo(L.x-16,L.y+10); ctx.lineTo(L.x-16,L.y-60); ctx.moveTo(L.x+16,L.y+10); ctx.lineTo(L.x+16,L.y-60); ctx.stroke();
    ctx.lineWidth=4; for (let yy=L.y-50; yy<L.y+10; yy+=14){ ctx.beginPath(); ctx.moveTo(L.x-16,yy); ctx.lineTo(L.x+16,yy); ctx.stroke(); }
    ctx.strokeStyle='rgba(180,230,240,.5)'; ctx.lineWidth=2;
    for (let i=0;i<3;i++){ const k = (t*0.4 + i/3) % 1; ctx.globalAlpha = 1-k; ctx.beginPath(); ctx.arc(L.x, L.y-20, 10+k*20, Math.PI*1.1, Math.PI*1.9); ctx.stroke(); }
    ctx.globalAlpha = 1;
  }
}
function newTunnelLights(lights){
  const st = digStage(); if (!st) return;
  if (st===2) { lights.push({x:CAVE_LADDER2.x, y:CAVE_LADDER2.y-10, r:190, c:'255,240,190', g:0.25}); lights.push({x:(NEW_TUNNEL.a.x+NEW_TUNNEL.b.x)/2, y:(NEW_TUNNEL.a.y+NEW_TUNNEL.b.y)/2, r:150, c:'255,206,120', g:0.15}); }
  else { const e = stubEnd(); lights.push({x:e.x, y:e.y-10, r:120, c:'255,206,120', g:0.18}); }
}

// ---------- Seagrass Cove ----------
const VW = 1800, VH = 1200;
// One smooth beach from the sea cave (left) to the dock (right); the cliff covers its top edge.
const BEACH = smoothPts([[92,600],[88,380],[150,298],[300,292],[392,372],[470,474],[760,472],[1060,476],[1360,470],[1580,486],[1700,530],[1716,606],[1640,686],[1460,772],[1180,852],[880,858],[600,804],[380,724],[200,660]]);
// The cave mouth in the cliff, and the low rock shelf in front of the beach (pools are cut into it).
const CAVE_ARCH = smoothPts([[50,640],[44,400],[96,262],[230,214],[372,252],[440,370],[468,500],[470,640]]);
const SHELF = smoothPts([[600,770],[800,800],[1000,812],[1200,800],[1380,752],[1500,700],[1606,716],[1618,812],[1530,884],[1380,944],[1150,990],[900,994],[690,962],[584,894]]);
const POOLS = [
  { x:690,  y:880, k:'star',    name:'a sea star' },
  { x:975,  y:925, k:'anemone', name:'a wiggly anemone' },
  { x:1255, y:900, k:'hermit',  name:'a little hermit crab' },
  { x:1495, y:812, k:'fishy',   name:'a tiny stripy fish' },
];
const COVE_LADDER = { x:200, y:356 };
const DOCK = { x0:1680, x1:1800, y0:572, y1:626 };
const WOOD_SPOTS = [[560,742],[860,800],[1150,812],[1400,744]];
const LIGHTHOUSE = { x:1600, y:600 };   // on Puffin Isle's eastern point
const FAR_ISLE = { x:1600, y:1130 };   // Puffin Isle, out at sea: Captain Puff's boat goes there on Day 3
const tideH = () => 0.5 - 0.5*Math.cos(2*Math.PI*S.tideT/36);
const onShelf = (x,y) => insidePoly(SHELF, x, y, 8);
const onSandCove = (x,y) => insidePoly(BEACH, x, y, 10);
const inPool = (x,y) => POOLS.some(p => ((x-p.x)/40)**2 + ((y-p.y)/24)**2 < 1);
function coveWalkable(x,y){
  if (x > DOCK.x0 && x < DOCK.x1-6 && y > DOCK.y0+4 && y < DOCK.y1-4) return true;
  if (S.day >= 3 && d2(x,y,PUFF_ROCK.x,PUFF_ROCK.y+4) < 34) return false;
  if (onSandCove(x,y)) return true;
  return onShelf(x,y) && !inPool(x,y);
}
// How deep Pip is: 0 on dry ground, rising to 1 a little way into the water. He wades first, then swims.
function swimDepth(x,y){
  if (S.scene==='cove') { if (x > DOCK.x0 && y > DOCK.y0 && y < DOCK.y1) return 0; return Math.max(0, Math.min(1, (y - waterline(x) + 4) / 40)); }
  if (S.scene==='isle') return isleDepth(x,y);
  return 0;
}
const isSwimming = (x,y) => swimDepth(x,y) > 0.6;

function updateCove(dt){
  const P = S.player, q = S.quests;
  const prevH = tideH();
  S.tideT += dt;
  const h = tideH();
  const dl = d2(P.x,P.y,COVE_LADDER.x,COVE_LADDER.y);
  if (dl > 60) S.coveLadderArmed = true;
  if (S.coveLadderArmed && dl < 28 && !S.dialog) goTo('cave');
  updateBoatStop(BOAT_COVE, 'isle');
  // tide pools: only visible when the water is low
  for (const p of S.pools) {
    const d = d2(P.x,P.y,p.x,p.y);
    if (d > 110) p.warned = false;
    if (p.seen || d > 66 || S.dialog) continue;
    if (poolVisible(p) > 0.6) {
      p.seen = true; q.pools.seen++; chime([880,1175,1397],0.09); renderQuests();
      const said = earlyFind('pools','seal', `pip.pool.${p.k}.early`);
      // only point at Pearl once she has asked
      const all = q.pools.seen===4 ? (q.pools.state==='new' ? 'pip.pools.all.early' : 'pip.pools.all') : null;
      if (!said) setTimeout(() => { if (!S.dialog) speak([`pip.pool.${p.k}`, all]); }, 350);
    } else if (!p.warned) { p.warned = true; pop(p.x, p.y-46, 'Too deep! Wait for low tide'); }
  }
  // driftwood rides in on the high tide, then lands on the sand when the water goes out
  if (prevH < 0.85 && h >= 0.85) {
    const want = 3 - q.wood.have - S.wood.filter(w => w.state==='float' || w.state==='beach').length;
    let n = 0; for (const w of S.wood) if (w.state==='none' && n < Math.max(0,want)) { w.state='float'; n++; }
  }
  for (const w of S.wood) {
    if (w.state==='float' && h < 0.62) w.state='beach';
    if (w.state==='beach' && d2(P.x,P.y,w.x,w.y) < 52 && !S.dialog) {
      w.state='taken'; q.wood.have++; chime([660,880],0.09); renderQuests();
      pop(w.x, w.y-36, `${q.wood.have} driftwood`);
      if (!earlyFind('wood','puffin','pip.early.wood') && q.wood.have===3 && q.wood.state!=='done')
        setTimeout(() => { if (!S.dialog) speak(q.wood.state==='new' ? 'pip.wood.all.early' : 'pip.wood.all'); }, 600);
    }
  }
  if (S.boatT > 0) S.boatT = Math.max(0, S.boatT - dt);
}

// ---------- Tide pool art ----------
// The shelf is one flat rock platform split into angular slabs (cut paper), with a darker front edge.
const SHELF_SLABS = (() => {
  const R = rng(77), out = [], cols = ['#a89f8f','#9d9485','#b1a898','#968d7f'];
  for (let row=0; row<4; row++) for (let col=0; col<10; col++) {
    const cx = 590 + col*112 + (row%2)*56 + (R()-0.5)*20, cy = 760 + row*66 + (R()-0.5)*14;
    if (!inPoly(SHELF, cx, cy) && polyEdgeD(SHELF, cx, cy) > 50) continue;
    out.push({ pts: slabPts(R, cx, cy, 66, 40, 5 + (col+row)%2), c: cols[(row*3+col)%4], cx, cy });
  }
  return out;
})();
function drawShelf(){
  ctx.fillStyle = '#6a6256'; polyPath(SHELF, 0, 16); ctx.fill();          // the front edge, in shade
  ctx.fillStyle = '#7d7568'; polyPath(SHELF); ctx.fill();                  // cracks between slabs
  ctx.save(); polyPath(SHELF); ctx.clip();
  for (const s of SHELF_SLABS) {
    ctx.fillStyle = s.c; polyPath(s.pts); ctx.fill();
    // a lit facet toward the sun (upper left)
    ctx.fillStyle = 'rgba(255,248,230,.16)'; ctx.beginPath();
    ctx.moveTo(s.pts[0][0], s.pts[0][1]);
    for (const [x,y] of s.pts) if (x <= s.cx + 10 || y <= s.cy) ctx.lineTo(x, y);
    ctx.lineTo(s.cx, s.cy); ctx.closePath(); ctx.fill();
  }
  ctx.restore();
  // seaweed hanging off the front edge
  const R = rng(91); ctx.lineCap = 'round';
  for (let i=0;i<34;i++){
    const k = Math.floor(R()*SHELF.length), [x,y] = SHELF[k];
    if (y < 860) continue;
    ctx.strokeStyle = R() > 0.5 ? '#5f8a5a' : '#7a8f4e'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(x, y+8); ctx.quadraticCurveTo(x+6, y+18, x+2, y+30); ctx.stroke();
  }
}
const POOL_SHAPES = POOLS.map((p,i) => { const R = rng(200+i); return Array.from({length:7}, (_,k) => { const a = k/7*Math.PI*2, j = 0.85 + R()*0.25; return [Math.cos(a)*j, Math.sin(a)*j]; }); });
const poolOutline = (i, rx, ry) => smoothPts(POOL_SHAPES[i].map(([u,v]) => [POOLS[i].x + u*rx, POOLS[i].y + v*ry]), 6);
function drawPoolBasin(i){
  ctx.fillStyle = '#5d564c'; polyPath(poolOutline(i, 50, 31)); ctx.fill();
  const p = POOLS[i], g = ctx.createLinearGradient(0, p.y-26, 0, p.y+26);
  g.addColorStop(0,'#2f7684'); g.addColorStop(1,'#7cc3cd');
  ctx.fillStyle = g; polyPath(poolOutline(i, 42, 25)); ctx.fill();
}
function waterline(x){ return 1030 - tideH()*240 + Math.sin(x*0.012 + S.tideT*0.9)*7; }
const poolVisible = p => Math.max(0, Math.min(1, (waterline(p.x) - p.y - 8) / 28));
function drawPool(p, t){
  const i = POOLS.indexOf(p);
  drawPoolCreature(p, poolVisible(p), t);
  ctx.save(); ctx.translate(p.x, p.y);
  ctx.strokeStyle='rgba(255,255,255,.4)'; ctx.lineWidth=1.6; ctx.lineCap='round';
  const o = Math.sin(t*1.3 + i)*3; ctx.beginPath(); ctx.moveTo(-24, -10+o*0.3); ctx.quadraticCurveTo(-8, -14+o, 8, -10); ctx.stroke();
  ctx.strokeStyle='#5f8a5a'; ctx.lineWidth=2.4;
  for (let k=0;k<3;k++){ const sw = Math.sin(t*1.6+k)*3; ctx.beginPath(); ctx.moveTo(30+k*4, 10); ctx.quadraticCurveTo(34+k*4+sw, 0, 30+k*5+sw, -10); ctx.stroke(); }
  ctx.restore();
}
function drawTideWater(t){
  const base = 1030 - tideH()*240;
  ctx.beginPath(); ctx.moveTo(0, VH);
  for (let x=0; x<=VW; x+=20) ctx.lineTo(x, waterline(x));
  ctx.lineTo(VW, VH); ctx.closePath();
  const g = ctx.createLinearGradient(0, base-20, 0, base+260);
  g.addColorStop(0,'rgba(150,208,218,.62)'); g.addColorStop(1,'rgba(118,186,202,.92)');
  ctx.fillStyle = g; ctx.fill();
  for (const [off,a,w] of [[0,0.85,3.5],[10,0.35,2]]) {
    ctx.strokeStyle = `rgba(255,255,255,${a})`; ctx.lineWidth = w; ctx.beginPath();
    for (let x=0; x<=VW; x+=20){ const y = waterline(x) + off + Math.sin(x*0.05 + t*2)*1.5; x===0 ? ctx.moveTo(x,y) : ctx.lineTo(x,y); }
    ctx.stroke();
  }
}

// ---------- Cove drawing ----------
function drawPuffin(x,y,s,face,t,captain){
  ctx.save(); ctx.translate(x,y); ctx.scale((face||1)*s, s);
  const bob = Math.sin(t*2.6 + x*0.01)*1.2;
  ell(-4,0,5,2.5,'#f08a3c'); ell(6,0,5,2.5,'#f08a3c');
  ell(0,-16+bob,13,16,'#2e3138');
  ell(3,-12+bob,8,12,'#fbf8ef');
  circ(4,-34+bob,11,'#2e3138');
  ell(6,-33+bob,8,7.5,'#fbf8ef');
  circ(8,-35+bob,1.8,'#2e3138');
  ctx.fillStyle='#f08a3c'; ctx.beginPath(); ctx.moveTo(12,-38+bob); ctx.quadraticCurveTo(24,-34+bob,13,-28+bob); ctx.closePath(); ctx.fill();
  ctx.strokeStyle='#d8573a'; ctx.lineWidth=1.4; ctx.beginPath(); ctx.moveTo(15,-36+bob); ctx.lineTo(15,-30+bob); ctx.stroke();
  ctx.fillStyle='#3f4250'; ctx.beginPath(); ctx.ellipse(-8,-14+bob,5,11,0.3,0,Math.PI*2); ctx.fill();
  if (captain) {
    ctx.fillStyle='#2f4a7a'; ctx.beginPath(); ctx.roundRect(-8,-52+bob,20,8,3); ctx.fill();
    ell(3,-44+bob,14,3.5,'#2f4a7a'); ctx.fillStyle='#fbf8ef'; ctx.fillRect(-8,-47+bob,20,2.4);
    circ(3,-49+bob,2.2,'#f4b85a');
  }
  ctx.restore();
}
// Pearl lies on the sand: she breathes and flicks her tail, but never leaves the ground.
function drawSealPup(n,t){
  const {x,y} = n, br = Math.sin(t*1.8)*0.025, flick = Math.sin(t*2.4)*0.18;
  ctx.save(); ctx.translate(x,y); ctx.scale(-1,1);
  ell(-4,-1,30,5,'rgba(52,67,58,.16)');
  ctx.save(); ctx.translate(-26,-6); ctx.rotate(flick);
  ctx.fillStyle='#e3ded2'; ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(-13,-8); ctx.lineTo(-11,5); ctx.closePath(); ctx.fill();
  ctx.restore();
  ctx.save(); ctx.scale(1, 1+br);
  ell(-6,-10,24,11,'#ebe7dd');
  ell(4,-3,8,3,'#d9d4c8');
  circ(12,-20,13,'#f2efe7');
  ell(19,-16,6,4.5,'#ffffff');
  circ(8,-22,3.3,'#2e3138'); circ(16,-23,3.3,'#2e3138'); circ(9,-23,1,'#fff'); circ(17,-24,1,'#fff');
  if (blink(t, 3.3)) { ell(8,-22,3.5,1.2,'#f2efe7'); ell(16,-23,3.5,1.2,'#f2efe7'); }
  circ(21,-17,1.8,'#3b2a22');
  ctx.strokeStyle='rgba(52,67,58,.45)'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(20,-15); ctx.lineTo(28,-16); ctx.moveTo(20,-14); ctx.lineTo(27,-11); ctx.stroke();
  ctx.restore();
  ctx.restore();
}
function drawLighthouse(t, beamOnly){
  const {x,y} = LIGHTHOUSE;
  if (!beamOnly) {
  ell(x+6,y+4,30,8,'rgba(52,67,58,.2)');
  ctx.fillStyle='#fbf8ef'; ctx.beginPath(); ctx.moveTo(x-20,y); ctx.lineTo(x-13,y-96); ctx.lineTo(x+13,y-96); ctx.lineTo(x+20,y); ctx.closePath(); ctx.fill();
  ctx.fillStyle='#d8573a'; for (const yy of [-24,-64]) { ctx.beginPath(); ctx.moveTo(x-19+(-yy)*0.075,y+yy); ctx.lineTo(x-17+(-yy-14)*0.075,y+yy-14); ctx.lineTo(x+17-(-yy-14)*0.075,y+yy-14); ctx.lineTo(x+19-(-yy)*0.075,y+yy); ctx.fill(); }
  ctx.fillStyle='#3f4250'; ctx.fillRect(x-16,y-100,32,5);
  ctx.fillStyle='#ffe08a'; ctx.fillRect(x-10,y-116,20,16);
  ctx.fillStyle='#d8573a'; ctx.beginPath(); ctx.moveTo(x-14,y-116); ctx.lineTo(x,y-130); ctx.lineTo(x+14,y-116); ctx.fill();
  }
  if (t === null) return;
  // slow sweeping beam
  const a = t*0.6, bx = Math.cos(a), by = Math.sin(a)*0.35;
  ctx.fillStyle='rgba(255,236,170,.18)'; ctx.beginPath(); ctx.moveTo(x,y-108); ctx.lineTo(x+bx*260-by*40, y-108+by*260+bx*12); ctx.lineTo(x+bx*260+by*40, y-108+by*260-bx*12); ctx.closePath(); ctx.fill();
}
function drawWood(w,t){
  if (w.state==='none' || w.state==='taken') return;
  const float = w.state==='float';
  const yy = w.y + (float ? 24 + Math.sin(t*2 + w.x)*3 : 0);
  ctx.save(); ctx.translate(w.x, yy); ctx.rotate(w.a);
  if (!float) ell(2,4,26,5,'rgba(52,67,58,.18)');
  ctx.fillStyle='#b89a72'; ctx.beginPath(); ctx.roundRect(-24,-5,48,10,5); ctx.fill();
  ctx.strokeStyle='#9a7c56'; ctx.lineWidth=1.3; ctx.beginPath(); ctx.moveTo(-16,-1); ctx.lineTo(12,-1); ctx.moveTo(-8,2.5); ctx.lineTo(18,2.5); ctx.stroke();
  circ(6,-1,1.6,'#8a6c48');
  ctx.restore();
  if (!float) sparkle(w.x+20, yy-14, t*0.8 + w.x);
}
function drawPoolCreature(p, a, t){
  if (a <= 0.02) return;
  ctx.save(); ctx.globalAlpha = a; ctx.translate(p.x, p.y);
  if (p.k==='star') { ctx.rotate(0.3); ctx.fillStyle='#f08a5c'; ctx.beginPath(); for (let i=0;i<10;i++){ const r = i%2 ? 4.5 : 11, an = i/10*Math.PI*2; ctx.lineTo(Math.cos(an)*r, Math.sin(an)*r); } ctx.closePath(); ctx.fill(); circ(0,0,2,'#ffd0b0'); }
  else if (p.k==='anemone') { ctx.strokeStyle='#f39ab6'; ctx.lineWidth=2.6; ctx.lineCap='round'; for (let i=0;i<10;i++){ const an = i/10*Math.PI*2, w = Math.sin(t*2+i)*2; ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(Math.cos(an)*(10+w), Math.sin(an)*(7+w)); ctx.stroke(); } circ(0,0,4.5,'#d8708f'); }
  else if (p.k==='hermit') { const sx = Math.sin(t*0.8)*6; ctx.translate(sx,0); ctx.strokeStyle='#d8573a'; ctx.lineWidth=1.6; for (let i=-1;i<=1;i++){ ctx.beginPath(); ctx.moveTo(-4,2+i*2); ctx.lineTo(-10,4+i*3); ctx.stroke(); } ell(2,0,8,6,'#e2c9a6'); ctx.strokeStyle='#b8946a'; ctx.lineWidth=1.4; ctx.beginPath(); ctx.arc(3,0,4,0,Math.PI*1.6); ctx.stroke(); circ(-7,-3,1.4,'#2e3138'); }
  else if (p.k==='fishy') { const an = t*1.4, fx = Math.cos(an)*12, fy = Math.sin(an)*5; ctx.translate(fx,fy); ctx.rotate(an + Math.PI/2); ell(0,0,8,3.5,'#f4b85a'); ctx.fillStyle='#f4b85a'; ctx.beginPath(); ctx.moveTo(-7,0); ctx.lineTo(-12,-4); ctx.lineTo(-12,4); ctx.fill(); ctx.fillStyle='#fbf8ef'; ctx.fillRect(-2,-3.5,1.6,7); ctx.fillRect(2.5,-3,1.6,6); }
  ctx.restore();
}
// On Day 3 the boat is ready to sail: freshly painted blue, a striped sail and bunting.
function drawBoatAt(x, y, t, k = 1){
  const ready = S.day >= 3;
  ctx.save(); ctx.translate(x, y + Math.sin(t*1.6)*2.5); ctx.scale(k,k);
  ctx.strokeStyle='rgba(255,255,255,.55)'; ctx.lineWidth=2; ctx.beginPath(); ctx.ellipse(0,6,44,8,0,0,Math.PI*2); ctx.stroke();
  ctx.fillStyle = ready ? '#4f86b8' : '#a8774f'; ctx.beginPath(); ctx.moveTo(-40,-6); ctx.quadraticCurveTo(0,22,40,-6); ctx.lineTo(34,-12); ctx.lineTo(-34,-12); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = ready ? '#fbf8ef' : '#8a5f3e'; ctx.lineWidth = ready ? 2.5 : 1.5; ctx.beginPath(); ctx.moveTo(-32,-6); ctx.quadraticCurveTo(0,10,32,-6); ctx.stroke();
  ctx.strokeStyle='#6e4630'; ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(0,-10); ctx.lineTo(0,-66); ctx.stroke();
  ctx.fillStyle='#fbf8ef'; ctx.beginPath(); ctx.moveTo(3,-64); ctx.quadraticCurveTo(30,-40,28,-16); ctx.lineTo(3,-16); ctx.closePath(); ctx.fill();
  if (ready) {
    ctx.save(); ctx.beginPath(); ctx.moveTo(3,-64); ctx.quadraticCurveTo(30,-40,28,-16); ctx.lineTo(3,-16); ctx.closePath(); ctx.clip();
    ctx.fillStyle = '#d8573a'; for (const yy of [-56,-40,-24]) ctx.fillRect(0, yy, 34, 7);
    ctx.restore();
    // bunting from the masthead to bow and stern
    const flags = ['#f6d55c','#d8573a','#7fb35c','#5aa9b8','#f2a3c4'];
    for (const s of [-1, 1]) { const ex = s*36, ey = -12;
      ctx.strokeStyle = 'rgba(110,70,48,.8)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(0,-64); ctx.quadraticCurveTo(ex*0.5, -30, ex, ey); ctx.stroke();
      for (let i=1;i<=4;i++){ const u = i/5, px = (1-u)*(1-u)*0 + 2*(1-u)*u*ex*0.5 + u*u*ex, py = (1-u)*(1-u)*-64 + 2*(1-u)*u*-30 + u*u*ey, sw = Math.sin(t*3 + i + s)*1.5;
        ctx.fillStyle = flags[(i + (s>0?2:0)) % flags.length]; ctx.beginPath(); ctx.moveTo(px-4, py); ctx.lineTo(px+4, py); ctx.lineTo(px+sw, py+9); ctx.closePath(); ctx.fill(); }
    }
  }
  ctx.fillStyle='#d8573a'; ctx.beginPath(); ctx.moveTo(0,-66); ctx.lineTo(14 + (ready ? Math.sin(t*4)*2 : 0),-62); ctx.lineTo(0,-58); ctx.fill();
  ctx.restore();
}
// Day 3: Captain Puff waits on a rock by the dock, next to his boat.
const PUFF_ROCK = { x:1640, y:562 };
function drawPuffRock(){
  cached('puff-rock', PUFF_ROCK.x, PUFF_ROCK.y, [-44,-30,46,26], () => {
    const pts = slabPts(rng(612), PUFF_ROCK.x, PUFF_ROCK.y, 38, 22, 6);
    ctx.fillStyle = '#7d7568'; polyPath(pts, 0, 12); ctx.fill();
    ctx.fillStyle = '#a39a8a'; polyPath(pts); ctx.fill();
    ctx.fillStyle = 'rgba(255,248,230,.18)'; ctx.beginPath(); ctx.moveTo(PUFF_ROCK.x-26, PUFF_ROCK.y-2); ctx.lineTo(PUFF_ROCK.x-6, PUFF_ROCK.y-18); ctx.lineTo(PUFF_ROCK.x+8, PUFF_ROCK.y-6); ctx.closePath(); ctx.fill();
  }, { shadow:36, h:24, shy:14 });
}
function drawBoat(t){
  if (!S.boat || (S.boatAt && S.boatAt !== 'cove')) return;
  drawBoatAt(BOAT_COVE.bx, BOAT_COVE.by, t, S.boatT > 0 ? 1 + Math.sin(S.boatT*20)*0.04 : 1);
}
// Puffin Isle on the horizon, with its puffins circling: you can see where they live, but only a boat gets there.
function drawFarIsle(t){
  const {x,y} = FAR_ISLE;
  cached('far-isle', x, y, [-230,-110,230,40], () => {
    ctx.fillStyle = 'rgba(255,255,255,.55)'; polyPath(smoothPts([[x-210,y+14],[x-120,y-10],[x+40,y-16],[x+200,y+6],[x+150,y+26],[x-150,y+28]])); ctx.fill();
    ctx.fillStyle = '#86a98a'; polyPath(smoothPts([[x-190,y+8],[x-120,y-44],[x-40,y-70],[x+60,y-78],[x+150,y-40],[x+190,y+6]])); ctx.fill();
    ctx.fillStyle = '#9dbd8f'; polyPath(smoothPts([[x-150,y-20],[x-60,y-62],[x+60,y-72],[x+120,y-44],[x+20,y-30]])); ctx.fill();
    ctx.fillStyle = '#c9b48e'; polyPath(smoothPts([[x-180,y+8],[x-60,y-6],[x+80,y-6],[x+180,y+8],[x,y+16]])); ctx.fill();
  });
  for (let i=0;i<5;i++){
    const a = t*0.7 + i*1.26, px = x - 20 + Math.cos(a)*(70 + i*12), py = y - 110 + Math.sin(a)*22, f = Math.abs(Math.sin(t*9 + i))*5;
    ctx.fillStyle = '#2e3138'; ctx.beginPath(); ctx.moveTo(px-8, py-f); ctx.lineTo(px, py+2); ctx.lineTo(px+8, py-f); ctx.lineTo(px, py-1); ctx.closePath(); ctx.fill();
    circ(px+(Math.cos(a+1.6)>0?3:-3), py+1, 1.4, '#f08a3c');
  }
}
// The cove is drawn in three layers: a baked sea, the moving shoreline (foam and wet sand that grow and
// shrink with the tide), then a baked top layer (beach, cliff and cave, rock shelf, dock).
function drawCoveBack(){
  ctx.fillStyle = C.sea; ctx.fillRect(0,0,VW,VH);
  const g = ctx.createLinearGradient(0, 700, 0, VH); g.addColorStop(0,'rgba(121,185,200,0)'); g.addColorStop(1,'rgba(98,165,186,.55)');
  ctx.fillStyle = g; ctx.fillRect(0,700,VW,VH-700);
}
// a cliff edge line across the cove: angular, like torn paper
const CLIFF_FOOT = (() => { const R = rng(12), out = []; for (let x=-20; x<=VW+40; x+=70) out.push([x, 466 + (R()-0.5)*26]); return out; })();
function drawCliff(){
  const R = rng(19);
  ctx.fillStyle = '#857c70'; ctx.beginPath(); ctx.moveTo(-20,-20); ctx.lineTo(VW+40,-20);
  for (let i=CLIFF_FOOT.length-1; i>=0; i--) ctx.lineTo(CLIFF_FOOT[i][0], CLIFF_FOOT[i][1]);
  ctx.closePath(); ctx.fill();
  // big angular facets in a few rock tones, lit from the upper left
  const tones = ['#968d80','#8b8276','#a29989','#7e766a','#9a9184'];
  for (let i=0;i<46;i++){
    const cx = R()*VW, cy = 120 + R()*320, w = 70 + R()*90, h = 40 + R()*50;
    ctx.fillStyle = tones[i%tones.length]; ctx.beginPath();
    ctx.moveTo(cx - w*0.5, cy + h*0.2); ctx.lineTo(cx - w*0.1, cy - h*0.5); ctx.lineTo(cx + w*0.5, cy - h*0.1); ctx.lineTo(cx + w*0.2, cy + h*0.5);
    ctx.closePath(); ctx.fill();
  }
  // shade at the foot of the cliff, where it meets the sand
  ctx.strokeStyle = 'rgba(60,52,44,.35)'; ctx.lineWidth = 10; ctx.lineJoin = 'round';
  ctx.beginPath(); CLIFF_FOOT.forEach(([x,y],i) => i ? ctx.lineTo(x,y-6) : ctx.moveTo(x,y-6)); ctx.stroke();
  // grass along the top, with a ragged edge of tufts
  ctx.fillStyle = '#9fc777'; ctx.beginPath(); ctx.moveTo(-20,-20); ctx.lineTo(VW+40,-20);
  for (let x=VW+40; x>=-20; x-=18) ctx.lineTo(x, 84 + Math.sin(x*0.013)*12 + (Math.round(x/18)%2 ? 10 : 0));
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#86b064'; ctx.lineWidth = 3; ctx.lineCap = 'round';
  for (let x=10; x<VW; x+=46){ const y = 80 + Math.sin(x*0.013)*12; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x-4, y-12); ctx.moveTo(x+5, y); ctx.lineTo(x+8, y-10); ctx.stroke(); }
  // the sea cave: a dark arch with a sandy floor
  ctx.fillStyle = '#3e352f'; polyPath(CAVE_ARCH); ctx.fill();
  // a rim around the top of the arch only: below the cliff foot the floor runs straight out onto the beach
  ctx.save(); ctx.beginPath(); ctx.rect(0, 0, 600, 470); ctx.clip();
  ctx.strokeStyle = '#6d645a'; ctx.lineWidth = 14; polyPath(CAVE_ARCH); ctx.stroke(); ctx.restore();
}
function drawCoveTop(){
  ctx.fillStyle = C.sand; polyPath(BEACH); ctx.fill();
  // soft ripples in the sand
  const R = rng(5); ctx.strokeStyle = 'rgba(200,170,120,.35)'; ctx.lineWidth = 2; ctx.lineCap = 'round';
  for (let i=0;i<40;i++){ const x = 420 + R()*1200, y = 500 + R()*300; if (!insidePoly(BEACH, x, y, 30)) continue;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x+16, y-5, x+32, y); ctx.stroke(); }
  drawCliff();
  // the cave floor: shaded deep inside, fading to plain beach sand at the mouth
  ctx.save(); polyPath(CAVE_ARCH); ctx.clip();
  const fg = ctx.createRadialGradient(230, 300, 30, 230, 330, 330);
  fg.addColorStop(0, '#a8926c'); fg.addColorStop(0.55, '#cdb88e'); fg.addColorStop(1, C.sand);
  ctx.fillStyle = fg; polyPath(BEACH); ctx.fill(); ctx.restore();
  drawShelf();
  POOLS.forEach((p,i) => drawPoolBasin(i));
  ctx.fillStyle='#6e533c'; ctx.fillRect(DOCK.x0, DOCK.y1, DOCK.x1-DOCK.x0, 8);
  ctx.fillStyle='#8a6a4d'; ctx.fillRect(DOCK.x0, DOCK.y0, DOCK.x1-DOCK.x0, DOCK.y1-DOCK.y0);
  ctx.strokeStyle='#6e533c'; ctx.lineWidth=2; for (let x=DOCK.x0+10; x<DOCK.x1; x+=14){ ctx.beginPath(); ctx.moveTo(x,DOCK.y0); ctx.lineTo(x,DOCK.y1); ctx.stroke(); }
  for (const x of [DOCK.x0+8, DOCK.x1-10]) { ctx.fillStyle='#5e4636'; ctx.fillRect(x-3, DOCK.y1-2, 6, 12); }
  for (const d of S.coveDecos) drawDeco(d,0);
}
function drawCove(t){
  const h = tideH();
  blitGround(bakedGround('cove-back', VW, VH, drawCoveBack), VW, VH);
  ctx.strokeStyle = 'rgba(255,255,255,.25)'; ctx.lineWidth = 3; ctx.lineCap='round';
  for (let i=0;i<46;i++){ const x=(i*397)%VW, y=500+(i*233)%700, o=Math.sin(t*0.8+i)*10; ctx.beginPath(); ctx.moveTo(x+o,y); ctx.quadraticCurveTo(x+o+14,y-6,x+o+28,y); ctx.stroke(); }
  // foam and wet sand hug the beach's outline and breathe with the tide
  const wet = 18 + (1-h)*40;
  ctx.lineJoin = 'round';
  ctx.strokeStyle = C.foam; ctx.lineWidth = (wet + 12 + Math.sin(t*1.2)*4)*2; polyPath(BEACH); ctx.stroke();
  ctx.strokeStyle = '#d2bb8a'; ctx.lineWidth = wet*2; polyPath(BEACH); ctx.stroke();
  blitGround(bakedGround('cove-top:' + S.day, VW, VH, drawCoveTop, {transparent:true}), VW, VH);
  POOLS.forEach(p => drawPool(p, t));
  // the tide: a wavy waterline that creeps up the rocks and back down
  drawTideWater(t);
  drawFarIsle(t);
  drawBoat(t);

  const ents = [];
  S.wood.forEach(w => ents.push({y:w.y, f:() => (w.state==='beach' || w.state==='float') && styled(w.x, w.y, [-30,-30,34,36], () => drawWood(w,t), w.state==='beach' ? {shadow:20, h:8} : {})}));
  ents.push({y:COVE_LADDER.y, f:() => {
    const L = COVE_LADDER; ell(L.x, L.y+6, 34, 12, 'rgba(30,24,20,.5)');
    ctx.strokeStyle='#a07c58'; ctx.lineWidth=5; ctx.beginPath(); ctx.moveTo(L.x-14,L.y+6); ctx.lineTo(L.x-14,L.y-40); ctx.moveTo(L.x+14,L.y+6); ctx.lineTo(L.x+14,L.y-40); ctx.stroke();
    ctx.lineWidth=4; for (let yy=L.y-32; yy<L.y+6; yy+=12){ ctx.beginPath(); ctx.moveTo(L.x-14,yy); ctx.lineTo(L.x+14,yy); ctx.stroke(); }
  }});
  if (S.day >= 3) ents.push({y:PUFF_ROCK.y - 30, f:drawPuffRock});
  S.npcs.forEach(n => { if (n.scene==='cove') ents.push({y:n.y, f:() => drawNpcStyled(n,t,false)}); });
  S.ducklings.forEach(d => { if (d.state==='follow') ents.push({y:d.y, f:() => drawDucklingStyled(d,t)}); });
  ents.push({y:S.player.y, f:() => drawPipStyled(t)});
  ents.sort((a,b) => a.y-b.y).forEach(e => e.f());
  // the sea cave is shadowy inside
  const g = ctx.createRadialGradient(220,360,40,220,360,260);
  g.addColorStop(0,'rgba(24,18,22,.4)'); g.addColorStop(1,'rgba(24,18,22,0)');
  ctx.fillStyle = g; ctx.fillRect(0,80,560,700);
  for (const gl of S.gulls) drawGull(gl,t);
  drawMarkers(t);
  drawPops();
  drawTargetRing();
}
// The tide sign: water level, an arrow showing which way it is going, and the words.
function drawTideGauge(t){
  if (S.scene!=='cove') return;
  const h = tideH(), rising = Math.sin(2*Math.PI*S.tideT/36) > 0;
  const label = h < 0.3 ? 'Low tide' : h > 0.7 ? 'High tide' : rising ? 'Tide coming in' : 'Tide going out';
  const x = 16, y = innerHeight - (S.dialog ? dlg.offsetHeight + 74 : 64) - (parseFloat(getComputedStyle(document.documentElement).paddingBottom) || 0);
  ctx.save(); ctx.font = '700 15px Andika, Verdana, sans-serif';
  const w = ctx.measureText(label).width + 74, cx = x+25, cy = y+24;
  ctx.fillStyle='#fffaf0'; ctx.beginPath(); ctx.roundRect(x,y,w,48,24); ctx.fill();
  ctx.fillStyle='#e7f3f5'; ctx.beginPath(); ctx.arc(cx,cy,19,0,Math.PI*2); ctx.fill();
  ctx.save(); ctx.beginPath(); ctx.arc(cx,cy,19,0,Math.PI*2); ctx.clip();
  ctx.fillStyle='#5aa9b8'; const lvl = cy+16 - h*30;
  ctx.beginPath(); ctx.moveTo(cx-20,cy+20); for (let i=0;i<=40;i+=4) ctx.lineTo(cx-20+i, lvl + Math.sin(t*3+i*0.4)*2); ctx.lineTo(cx+20,cy+20); ctx.closePath(); ctx.fill();
  ctx.restore();
  // the arrow matches the tide picture in the dialog box: up while it comes in, down while it goes out
  const nudge = Math.sin(t*4)*1.5*(rising ? -1 : 1), dir = rising ? -1 : 1;
  ctx.strokeStyle = C.ink; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(cx, cy - 9*dir + nudge); ctx.lineTo(cx, cy + 9*dir + nudge);
  ctx.moveTo(cx-6, cy + 3*dir + nudge); ctx.lineTo(cx, cy + 9*dir + nudge); ctx.lineTo(cx+6, cy + 3*dir + nudge); ctx.stroke();
  ctx.fillStyle = C.ink; ctx.textBaseline='middle'; ctx.textAlign='left'; ctx.fillText(label, x+52, cy+1);
  ctx.restore();
}
function drawCoveMap(t, w){
  const k = w / VW, u = 1/k, R = (w > 200 ? 5.5 : 4.5)*u;
  mctx.setTransform(DPR*k,0,0,DPR*k,0,0);
  mctx.fillStyle=C.sea; mctx.fillRect(0,0,VW,VH);
  const poly = (pts, f) => { mctx.beginPath(); pts.forEach(([x,y],i) => i ? mctx.lineTo(x,y) : mctx.moveTo(x,y)); mctx.closePath(); mctx.fillStyle = f; mctx.fill(); };
  const c = (x,y,r,f) => { mctx.beginPath(); mctx.arc(x,y,r,0,Math.PI*2); mctx.fillStyle=f; mctx.fill(); };
  poly(BEACH, C.sand);
  mctx.fillStyle='#8d8478'; mctx.beginPath(); mctx.moveTo(0,0); mctx.lineTo(VW,0); CLIFF_FOOT.slice().reverse().forEach(([x,y]) => mctx.lineTo(x,y)); mctx.closePath(); mctx.fill();
  poly(CAVE_ARCH, '#5a4e44');
  poly(SHELF, '#9d9485');
  POOLS.forEach(p => c(p.x,p.y,30,'#5aa9b8'));
  poly(smoothPts([[FAR_ISLE.x-190,FAR_ISLE.y+8],[FAR_ISLE.x-40,FAR_ISLE.y-70],[FAR_ISLE.x+150,FAR_ISLE.y-40],[FAR_ISLE.x+190,FAR_ISLE.y+6]]), '#86a98a');
  mctx.fillStyle='#8a6a4d'; mctx.fillRect(DOCK.x0, DOCK.y0, DOCK.x1-DOCK.x0, DOCK.y1-DOCK.y0);
  c(COVE_LADDER.x, COVE_LADDER.y, R, '#ffe9a8');
  const NC = { seal:'#ebe7dd', puffin:'#2e3138' };
  S.npcs.forEach(n => {
    if (n.scene!=='cove') return;
    const m = npcMarker(n);
    if (m) { mctx.lineWidth = 2*u; mctx.strokeStyle = m==='ready' ? '#6f9e55' : '#e0904a'; mctx.beginPath(); mctx.arc(n.x, n.y, R+(2.5+Math.sin(t*4)*0.8)*u, 0, Math.PI*2); mctx.stroke(); }
    c(n.x, n.y, R, NC[n.id] || '#fff'); mctx.lineWidth = 1.2*u; mctx.strokeStyle = '#34433a'; mctx.beginPath(); mctx.arc(n.x, n.y, R, 0, Math.PI*2); mctx.stroke();
  });
  mctx.lineWidth = 1.5*u; mctx.strokeStyle = 'rgba(255,250,240,.9)';
  mctx.strokeRect(cam.x, cam.y, Math.min(cam.vw,VW), Math.min(cam.vh,VH));
  const P = S.player;
  c(P.x, P.y, R*1.6 + Math.sin(t*5)*u, 'rgba(244,184,90,.5)');
  c(P.x, P.y, R*1.05, '#f4b85a');
  mctx.lineWidth = 1.2*u; mctx.strokeStyle = '#34433a'; mctx.beginPath(); mctx.arc(P.x, P.y, R*1.05, 0, Math.PI*2); mctx.stroke();
}

// ---------- Day 2 setup ----------
function coveDecos(){
  const R = rng(31), out = [];
  for (let i=0;i<90 && out.length<26;i++){ const x = 300 + R()*1400, y = 420 + R()*380;
    if (!insidePoly(BEACH,x,y,40) || x < 470 || WOOD_SPOTS.some(([wx,wy]) => d2(x,y,wx,wy) < 60) || d2(x,y,930,700) < 60 || d2(x,y,1640,555) < 60) continue;
    out.push({ k: ['star','pebble','weed','pebble'][i%4], x, y, v: R() }); }
  return out;
}
function startDay2(quiet){
  document.getElementById('end').hidden = true;
  if (S.endTimer) clearTimeout(S.endTimer);
  Object.values(S.quests).forEach(q => { q.state = 'done'; });
  S.day = 2; S.ending = 0; S.finished = false; S.dialog = null; dlg.hidden = true;
  S.quests.dig = { state:'new' };
  S.quests.pools = { state:'new', seen:0 };
  S.quests.wood = { state:'new', have:0 };
  S.hinted = new Set(); S.metOwl = false; S.early = {};
  S.scene = 'island'; S.trans = null; S.show = null; cam.snap = true;
  S.player.x = 1150; S.player.y = 1000; S.player.face = 1; clearGoal(); S.trail = [];
  S.litOn = LANTERNS.map(() => true); S.lit = LANTERNS.map(() => 1); S.lightT = 1;
  S.hasLantern = true; S.moleLantern = true; S.hop = 0; S.moths = []; S.sparks = [];
  S.glowcaps.forEach(g => g.taken = true); S.shell.taken = true; S.boat = false; S.boatT = 0;
  S.ducklings.forEach((d,i) => { d.state='swim'; d.a = i*2.1; });
  const HOME = { owl:[bigTree.x+4, bigTree.y-78,'island'], duck:[1450,790,'island'], hog:[700,1050,'island'], crab:[2040,1250,'island'], mole:[1135,180,'cave'], mouse:[1215,560,'cave'] };
  S.npcs = S.npcs.filter(n => HOME[n.id]);
  S.npcs.forEach(n => { const [x,y,sc] = HOME[n.id]; n.x = x; n.y = y; n.scene = sc; n.goal = null; n.walk = null; n.route = null; n.moving = false; n.near = false; n.digging = false; });
  S.npcs.find(n => n.id==='duck').talkAt = { x: pond.x, y: pond.y, r: 165 };
  S.npcs.push({ id:'seal', name:'Pearl', x:930, y:700, near:false, scene:'cove' });
  S.npcs.push({ id:'puffin', name:'Captain Puff', x:1640, y:555, near:false, scene:'cove' });
  S.tideT = 5; S.coveLadderArmed = false; S.visitedCove = false;
  S.pools = POOLS.map(p => ({ ...p, seen:false, warned:false }));
  S.wood = WOOD_SPOTS.map(([x,y],i) => ({ x, y, a: (i%2 ? 0.25 : -0.2), state:'none' }));
  S.coveDecos = coveDecos();
  for (const k in grids) delete grids[k];
  clearGround();
  renderQuests(); running = true;
  if (!quiet) setTimeout(() => speak('pip.day2.start'), 400);
}

