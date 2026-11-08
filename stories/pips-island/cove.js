// Days, Digby's tunnel, Seagrass Cove.
// ---------- Days ----------
// Each quest belongs to a day. Day 1: the island and the burrow. Day 2: Digby's new tunnel and Seagrass Cove.
const QUEST_DAY = Object.fromEntries(STORY.quests.map(q => [q.id, q.day]));
const dayQuests = () => Object.entries(S.quests).filter(([k]) => QUEST_DAY[k] === S.day).map(([,v]) => v);
const sceneDims = sc => sc==='cave' ? [CW,CH] : sc==='cove' ? [VW,VH] : [W,H];

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
const COVE_SAND = [[360,520,120],[520,560,190],[800,600,210],[1080,620,210],[1360,600,190],[1590,570,150]];
const COVE_CAVE = { x:230, y:440, r:150 };
const SHELF = [[700,860,140],[970,900,160],[1250,880,150],[1490,800,120]];
const POOLS = [
  { x:690,  y:880, k:'star',    name:'a sea star' },
  { x:975,  y:925, k:'anemone', name:'a wiggly anemone' },
  { x:1255, y:900, k:'hermit',  name:'a little hermit crab' },
  { x:1495, y:812, k:'fishy',   name:'a tiny stripy fish' },
];
const COVE_LADDER = { x:200, y:356 };
const DOCK = { x0:1700, x1:1800, y0:578, y1:620 };
const WOOD_SPOTS = [[560,742],[860,800],[1150,812],[1420,770]];
const CLIFF_PUFFINS = [[700,250,1],[770,232,-1],[1060,262,1],[1240,238,-1],[1320,250,1]];
const LIGHTHOUSE = { x:1560, y:200 };
const tideH = () => 0.5 - 0.5*Math.cos(2*Math.PI*S.tideT/36);
const onShelf = (x,y) => SHELF.some(([cx,cy,r]) => d2(x,y,cx,cy) < r-8);
const onSandCove = (x,y) => COVE_SAND.some(([cx,cy,r]) => d2(x,y,cx,cy) < r-10);
function coveWalkable(x,y){
  if (x > DOCK.x0 && x < DOCK.x1-6 && y > DOCK.y0+4 && y < DOCK.y1-4) return true;
  if (d2(x,y,COVE_CAVE.x,COVE_CAVE.y) < COVE_CAVE.r-14) return true;
  if (onSandCove(x,y)) return true;
  if (onShelf(x,y)) return !POOLS.some(p => ((x-p.x)/40)**2 + ((y-p.y)/24)**2 < 1);
  return false;
}
// Otters swim: on the rocks at high tide, Pip paddles instead of walking.
const isSwimming = (x,y) => S.scene==='cove' && !onSandCove(x,y) && onShelf(x,y) && y > waterline(x) - 6;

function updateCove(dt){
  const P = S.player, q = S.quests;
  const prevH = tideH();
  S.tideT += dt;
  const h = tideH();
  const dl = d2(P.x,P.y,COVE_LADDER.x,COVE_LADDER.y);
  if (dl > 60) S.coveLadderArmed = true;
  if (S.coveLadderArmed && dl < 28 && !S.dialog) goTo('cave');
  // tide pools: only visible when the water is low
  for (const p of S.pools) {
    const d = d2(P.x,P.y,p.x,p.y);
    if (d > 110) p.warned = false;
    if (p.seen || d > 66 || S.dialog) continue;
    if (poolVisible(p) > 0.6) {
      p.seen = true; q.pools.seen++; chime([880,1175,1397],0.09); renderQuests();
      const said = earlyFind('pools','seal', `pip.pool.${p.k}.early`);
      if (!said) setTimeout(() => { if (!S.dialog) speak([`pip.pool.${p.k}`, q.pools.seen===4 ? 'pip.pools.all' : null]); }, 350);
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
        setTimeout(() => { if (!S.dialog) speak('pip.wood.all'); }, 600);
    }
  }
  if (S.boatT > 0) S.boatT = Math.max(0, S.boatT - dt);
}

// ---------- Tide pool art ----------
const SHELF_ROCKS = (() => {
  const R = rng(77), cols = ['#a59c8c','#988f80','#aea595','#8f877a'];
  return SHELF.map(([cx,cy,r]) => {
    const rocks = [];
    for (let k=0;k<9;k++){
      const a = R()*Math.PI*2, d = Math.sqrt(R())*r*0.62;
      const rx = 30 + R()*28;
      rocks.push({ x: cx+Math.cos(a)*d, y: cy+Math.sin(a)*d*0.8, rx, ry: rx*(0.6+R()*0.2), a: (R()-0.5)*0.6, c: cols[k%4], n: Array.from({length:8}, () => R()-0.5), b: Array.from({length:4}, () => [R()-0.5, R()-0.5]) });
    }
    rocks.sort((p,q) => p.y-q.y);
    const weed = Array.from({length:7}, () => { const a = 0.15*Math.PI + R()*0.7*Math.PI; return { x: cx+Math.cos(a)*r*0.92, y: cy+Math.sin(a)*r*0.78, s: R() }; });
    return { rocks, weed };
  });
})();
function blobPath(rx, ry, n){
  const pts = n.map((v,i) => { const an = i/n.length*Math.PI*2, k = 1 + v*0.22; return [Math.cos(an)*rx*k, Math.sin(an)*ry*k]; });
  ctx.beginPath();
  const mid = (a,b) => [(a[0]+b[0])/2, (a[1]+b[1])/2];
  let m = mid(pts[pts.length-1], pts[0]); ctx.moveTo(m[0], m[1]);
  for (let i=0;i<pts.length;i++){ const nx = mid(pts[i], pts[(i+1)%pts.length]); ctx.quadraticCurveTo(pts[i][0], pts[i][1], nx[0], nx[1]); }
  ctx.closePath();
}
function drawShelf(i){
  const [cx,cy,r] = SHELF[i], { rocks, weed } = SHELF_ROCKS[i];
  // wet bed under the boulders
  ctx.save(); ctx.translate(cx,cy); ctx.fillStyle='#776f63'; blobPath(r*1.02, r*0.7, [0.5,-0.9,0.7,-0.2,0.9,-0.6,0.3,-1.0,0.6,0.1,-0.7,0.4]); ctx.fill(); ctx.restore();
  for (const b of rocks) {
    ctx.save(); ctx.translate(b.x,b.y); ctx.rotate(b.a);
    ctx.fillStyle = b.c; blobPath(b.rx, b.ry, b.n); ctx.fill();
    ell(-b.rx*0.2, -b.ry*0.32, b.rx*0.5, b.ry*0.32, 'rgba(255,250,235,.2)');
    ctx.strokeStyle='rgba(60,54,48,.35)'; ctx.lineWidth=1.6; ctx.beginPath(); ctx.moveTo(-b.rx*0.3, b.ry*0.1); ctx.quadraticCurveTo(0, b.ry*0.35, b.rx*0.35, b.ry*0.05); ctx.stroke();
    for (const [u,v] of b.b) { const bx = u*b.rx, by = v*b.ry*0.8; circ(bx, by, 2.6, '#ece6d8'); circ(bx, by, 1, '#8f877a'); }
    ctx.restore();
  }
  ctx.lineCap='round';
  for (const w of weed) {
    ctx.strokeStyle = w.s > 0.5 ? '#5f8a5a' : '#7a8f4e'; ctx.lineWidth = 3;
    for (let k=-1;k<=1;k++){ ctx.beginPath(); ctx.moveTo(w.x+k*5, w.y); ctx.quadraticCurveTo(w.x+k*8+4, w.y+10, w.x+k*6-2, w.y+20); ctx.stroke(); }
  }
}
const POOL_SHAPES = POOLS.map((p,i) => { const R = rng(200+i); return Array.from({length:8}, () => R()-0.5); });
function waterline(x){ return 1030 - tideH()*240 + Math.sin(x*0.012 + S.tideT*0.9)*7; }
const poolVisible = p => Math.max(0, Math.min(1, (waterline(p.x) - p.y - 8) / 28));
function drawPool(p, t){
  const i = POOLS.indexOf(p), n = POOL_SHAPES[i];
  ctx.save(); ctx.translate(p.x, p.y);
  ctx.fillStyle='#5a534a'; blobPath(46, 28, n); ctx.fill();
  const g = ctx.createRadialGradient(-6,-4,4,0,0,40);
  g.addColorStop(0,'#3a8796'); g.addColorStop(1,'#78c0cc');
  ctx.fillStyle = g; blobPath(38, 22, n); ctx.fill();
  for (let k=0;k<6;k++) circ(Math.cos(k*1.7)*22, Math.sin(k*2.3)*11, 1.6, 'rgba(240,226,184,.55)');
  ctx.restore();
  drawPoolCreature(p, poolVisible(p), t);
  ctx.save(); ctx.translate(p.x, p.y);
  ctx.strokeStyle='rgba(255,255,255,.35)'; ctx.lineWidth=1.4;
  for (let k=0;k<2;k++){ const o = Math.sin(t*1.3 + k*2 + i)*4; ctx.beginPath(); ctx.moveTo(-22, -8+k*9+o*0.3); ctx.quadraticCurveTo(-6, -12+k*9+o, 10, -7+k*9); ctx.stroke(); }
  ctx.strokeStyle='#5f8a5a'; ctx.lineWidth=2.4; ctx.lineCap='round';
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
function drawSealPup(n,t){
  const {x,y} = n; shadow(x,y+2,26);
  const bob = Math.sin(t*2)*1.2;
  ctx.save(); ctx.translate(x,y+bob); ctx.scale(-1,1);
  ell(-6,-10,24,13,'#ebe7dd');
  ctx.fillStyle='#ebe7dd'; ctx.beginPath(); ctx.moveTo(-26,-8); ctx.lineTo(-36,-16); ctx.lineTo(-34,-2); ctx.closePath(); ctx.fill();
  ell(4,-4,7,3.5,'#d9d4c8');
  circ(12,-22,13,'#f2efe7');
  ell(19,-18,6,4.5,'#ffffff');
  circ(8,-24,3.3,'#2e3138'); circ(16,-25,3.3,'#2e3138'); circ(9,-25,1,'#fff'); circ(17,-26,1,'#fff');
  if (blink(t, 3.3)) { ell(8,-24,3.5,1.2,'#f2efe7'); ell(16,-25,3.5,1.2,'#f2efe7'); }
  circ(21,-19,1.8,'#3b2a22');
  ctx.strokeStyle='rgba(52,67,58,.45)'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(20,-17); ctx.lineTo(28,-18); ctx.moveTo(20,-16); ctx.lineTo(27,-13); ctx.stroke();
  circ(-12,-18,1.4,'#c9c2b2'); circ(-4,-20,1.2,'#c9c2b2'); circ(-16,-12,1.2,'#c9c2b2');
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
function drawBoat(t){
  if (!S.boat) return;
  const x = 1755, y = 672 + Math.sin(t*1.6)*2.5, k = S.boatT > 0 ? 1 + Math.sin(S.boatT*20)*0.04 : 1;
  ctx.save(); ctx.translate(x,y); ctx.scale(k,k);
  ctx.strokeStyle='rgba(255,255,255,.55)'; ctx.lineWidth=2; ctx.beginPath(); ctx.ellipse(0,6,44,8,0,0,Math.PI*2); ctx.stroke();
  ctx.fillStyle='#a8774f'; ctx.beginPath(); ctx.moveTo(-40,-6); ctx.quadraticCurveTo(0,22,40,-6); ctx.lineTo(34,-12); ctx.lineTo(-34,-12); ctx.closePath(); ctx.fill();
  ctx.strokeStyle='#8a5f3e'; ctx.lineWidth=1.5; ctx.beginPath(); ctx.moveTo(-32,-6); ctx.quadraticCurveTo(0,10,32,-6); ctx.stroke();
  ctx.strokeStyle='#6e4630'; ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(0,-10); ctx.lineTo(0,-66); ctx.stroke();
  ctx.fillStyle='#fbf8ef'; ctx.beginPath(); ctx.moveTo(3,-64); ctx.quadraticCurveTo(30,-40,28,-16); ctx.lineTo(3,-16); ctx.closePath(); ctx.fill();
  ctx.fillStyle='#d8573a'; ctx.beginPath(); ctx.moveTo(0,-66); ctx.lineTo(14,-62); ctx.lineTo(0,-58); ctx.fill();
  ctx.restore();
}
// The cove is drawn in three layers: a baked backdrop (sea, cliffs, lighthouse, cave rock), the
// moving shoreline (ripples, foam and wet sand that grow and shrink with the tide), then a baked
// top layer (dry sand, cave floor, dock, beach bits).
function drawCoveBack(){
  ctx.fillStyle = C.sea; ctx.fillRect(0,0,VW,VH);
  ctx.fillStyle='#8d8478'; ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(VW,0); ctx.lineTo(VW,330);
  for (let x=VW; x>=0; x-=60) ctx.lineTo(x, 400 + Math.sin(x*0.013)*26 + Math.sin(x*0.041)*10);
  ctx.closePath(); ctx.fill();
  // cliff face: strata bands and boulders give it depth
  for (let i=0;i<9;i++){ ctx.strokeStyle = i%2 ? 'rgba(60,52,44,.18)' : 'rgba(255,240,215,.1)'; ctx.lineWidth = 10; ctx.beginPath();
    for (let x=0; x<=VW; x+=40) { const y = 130 + i*32 + Math.sin(x*0.011 + i)*8; x ? ctx.lineTo(x,y) : ctx.moveTo(x,y); } ctx.stroke(); }
  for (let i=0;i<22;i++){ const x = (i*173)%VW, y = 110 + (i*97)%230; ell(x, y, 22, 12, '#9b9284'); }
  ctx.fillStyle='#9fc777'; ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(VW,0); ctx.lineTo(VW,70);
  for (let x=VW; x>=0; x-=50) ctx.lineTo(x, 90 + Math.sin(x*0.02)*16); ctx.closePath(); ctx.fill();
  for (let x=0; x<VW; x+=50) circ(x, 92 + Math.sin(x*0.02)*16, 9, '#86b064');
  for (const [px,py,f] of CLIFF_PUFFINS) { ell(px-26*f, py+4, 13, 8, '#4a443e'); drawPuffin(px, py, 0.7, f, 0, false); }
  drawLighthouse(null);
  ell(170,430,270,330,'#6f665d'); ell(150,380,220,250,'#7b7268');
}
function drawCoveTop(){
  COVE_SAND.forEach(([x,y,r]) => circ(x,y+10,r+3,'#b89c6e'));
  COVE_SAND.forEach(([x,y,r]) => circ(x,y,r+3,'#d6bf8c'));
  COVE_SAND.forEach(([x,y,r]) => circ(x,y,r,C.sand));
  circ(COVE_CAVE.x,COVE_CAVE.y,COVE_CAVE.r+4,'#5a4e44'); circ(COVE_CAVE.x,COVE_CAVE.y,COVE_CAVE.r,'#cbb68c');
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
  const wet = 18 + (1-h)*40;
  COVE_SAND.forEach(([x,y,r],i) => { ctx.beginPath(); ctx.arc(x,y,r+wet+12+Math.sin(t*1.2+i)*4,0,Math.PI*2); ctx.fillStyle=C.foam; ctx.fill(); });
  COVE_SAND.forEach(([x,y,r]) => circ(x,y,r+wet,'#d2bb8a'));
  blitGround(bakedGround('cove-top:' + S.day, VW, VH, drawCoveTop, {transparent:true}), VW, VH);
  // rocky shelf: clusters of cut-paper boulders with barnacles and weed, lit like everything else
  SHELF.forEach(([x,y,r],i) => cached('shelf'+i, x, y, [-r-50,-r-46,r+50,r+46], () => drawShelf(i), { ink:'#4f4840', ow:1.6 }));
  POOLS.forEach(p => drawPool(p, t));
  // the tide: a wavy waterline that creeps up the rocks and back down
  drawTideWater(t);
  drawBoat(t);

  const ents = [];
  S.wood.forEach(w => ents.push({y:w.y, f:() => (w.state==='beach' || w.state==='float') && styled(w.x, w.y, [-30,-30,34,36], () => drawWood(w,t), w.state==='beach' ? {shadow:20, h:8} : {})}));
  ents.push({y:COVE_LADDER.y, f:() => {
    const L = COVE_LADDER; ell(L.x, L.y+6, 34, 12, 'rgba(30,24,20,.5)');
    ctx.strokeStyle='#a07c58'; ctx.lineWidth=5; ctx.beginPath(); ctx.moveTo(L.x-14,L.y+6); ctx.lineTo(L.x-14,L.y-40); ctx.moveTo(L.x+14,L.y+6); ctx.lineTo(L.x+14,L.y-40); ctx.stroke();
    ctx.lineWidth=4; for (let yy=L.y-32; yy<L.y+6; yy+=12){ ctx.beginPath(); ctx.moveTo(L.x-14,yy); ctx.lineTo(L.x+14,yy); ctx.stroke(); }
  }});
  S.npcs.forEach(n => { if (n.scene==='cove') ents.push({y:n.y, f:() => drawNpcStyled(n,t,false)}); });
  S.ducklings.forEach(d => { if (d.state==='follow') ents.push({y:d.y, f:() => drawDucklingStyled(d,t)}); });
  ents.push({y:S.player.y, f:() => {
    drawPipStyled(t);
    if (S.player.swim) { const P = S.player; ctx.save(); ctx.globalAlpha=.88; ell(P.x, P.y-4, 30, 11, '#8cc8d4'); ctx.restore(); ctx.strokeStyle='rgba(255,255,255,.7)'; ctx.lineWidth=2; ctx.beginPath(); ctx.ellipse(P.x, P.y-4, 30+Math.sin(t*4)*3, 11, 0, 0, Math.PI*2); ctx.stroke(); }
  }});
  ents.sort((a,b) => a.y-b.y).forEach(e => e.f());
  // the sea cave is shadowy inside
  const g = ctx.createRadialGradient(180,400,40,180,400,320);
  g.addColorStop(0,'rgba(24,18,22,.5)'); g.addColorStop(1,'rgba(24,18,22,0)');
  ctx.fillStyle = g; ctx.fillRect(0,80,520,700);
  drawLighthouse(t, true);
  for (const gl of S.gulls) drawGull(gl,t);
  drawMarkers(t);
  drawPops();
  drawTargetRing();
}
function drawTideGauge(t){
  if (S.scene!=='cove') return;
  const h = tideH(), rising = Math.sin(2*Math.PI*S.tideT/36) > 0;
  const label = h < 0.3 ? 'Low tide' : h > 0.7 ? 'High tide' : rising ? 'Tide coming in' : 'Tide going out';
  const x = 16, y = innerHeight - (S.dialog ? dlg.offsetHeight + 74 : 58) - (parseFloat(getComputedStyle(document.documentElement).paddingBottom) || 0);
  ctx.save(); ctx.font = '700 15px Andika, Verdana, sans-serif';
  const w = ctx.measureText(label).width + 62;
  ctx.fillStyle='#fffaf0'; ctx.beginPath(); ctx.roundRect(x,y,w,40,20); ctx.fill();
  ctx.fillStyle='#e7f3f5'; ctx.beginPath(); ctx.arc(x+20,y+20,14,0,Math.PI*2); ctx.fill();
  ctx.save(); ctx.beginPath(); ctx.arc(x+20,y+20,14,0,Math.PI*2); ctx.clip();
  ctx.fillStyle='#5aa9b8'; const lvl = y+34 - h*24;
  ctx.beginPath(); ctx.moveTo(x+4,y+40); for (let i=0;i<=32;i+=4) ctx.lineTo(x+4+i, lvl + Math.sin(t*3+i*0.4)*2); ctx.lineTo(x+36,y+40); ctx.closePath(); ctx.fill();
  ctx.restore();
  ctx.fillStyle='#34433a'; ctx.textBaseline='middle'; ctx.textAlign='left'; ctx.fillText(label, x+42, y+21);
  ctx.restore();
}
function drawCoveMap(t, w){
  const k = w / VW, u = 1/k, R = (w > 200 ? 5.5 : 4.5)*u;
  mctx.setTransform(DPR*k,0,0,DPR*k,0,0);
  mctx.fillStyle=C.sea; mctx.fillRect(0,0,VW,VH);
  mctx.fillStyle='#8d8478'; mctx.fillRect(0,0,VW,380);
  const c = (x,y,r,f) => { mctx.beginPath(); mctx.arc(x,y,r,0,Math.PI*2); mctx.fillStyle=f; mctx.fill(); };
  c(COVE_CAVE.x,COVE_CAVE.y,COVE_CAVE.r,'#5a4e44');
  SHELF.forEach(([x,y,r]) => c(x,y,r,'#7c8a86'));
  POOLS.forEach(p => c(p.x,p.y,30,'#5aa9b8'));
  COVE_SAND.forEach(([x,y,r]) => c(x,y,r,C.sand));
  mctx.fillStyle='#8a6a4d'; mctx.fillRect(DOCK.x0, DOCK.y0, DOCK.x1-DOCK.x0, DOCK.y1-DOCK.y0);
  c(COVE_LADDER.x, COVE_LADDER.y, R, '#ffe9a8');
  const NC = { seal:'#ebe7dd', puffin:'#2e3138' };
  S.npcs.forEach(n => {
    if (n.scene!=='cove') return;
    const m = npcMarker(n);
    if (m) { mctx.lineWidth = 2*u; mctx.strokeStyle = m==='ready' ? '#6f9e55' : '#e0904a'; mctx.beginPath(); mctx.arc(n.x, n.y, R+(2.5+Math.sin(t*4)*0.8)*u, 0, Math.PI*2); mctx.stroke(); }
    c(n.x, n.y, R, NC[n.id]); mctx.lineWidth = 1.2*u; mctx.strokeStyle = '#34433a'; mctx.beginPath(); mctx.arc(n.x, n.y, R, 0, Math.PI*2); mctx.stroke();
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
    if (!onSandCove(x,y) || WOOD_SPOTS.some(([wx,wy]) => d2(x,y,wx,wy) < 60) || d2(x,y,930,700) < 60 || d2(x,y,1640,555) < 60) continue;
    out.push({ k: ['star','pebble','weed','pebble'][i%4], x, y, v: R() }); }
  return out;
}
function startDay2(){
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
  S.npcs.forEach(n => { const [x,y,sc] = HOME[n.id]; n.x = x; n.y = y; n.scene = sc; n.goal = null; n.walk = null; n.near = false; n.digging = false; });
  S.npcs.push({ id:'seal', name:'Pearl', x:930, y:700, near:false, scene:'cove' });
  S.npcs.push({ id:'puffin', name:'Captain Puff', x:1640, y:555, near:false, scene:'cove' });
  S.tideT = 5; S.coveLadderArmed = false; S.visitedCove = false;
  S.pools = POOLS.map(p => ({ ...p, seen:false, warned:false }));
  S.wood = WOOD_SPOTS.map(([x,y],i) => ({ x, y, a: (i%2 ? 0.25 : -0.2), state:'none' }));
  S.coveDecos = coveDecos();
  for (const k in grids) delete grids[k];
  clearGround();
  renderQuests(); running = true;
  setTimeout(() => speak('pip.day2.start'), 400);
}

