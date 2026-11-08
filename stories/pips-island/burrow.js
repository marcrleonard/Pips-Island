// The Burrow: layout, crystal song, light show, drawing.
// ---------- The Burrow (underground level) ----------
// Layout: four chambers joined by tunnels. Entry hall (ladder up to the island), Glow Grotto (west),
// Pool Room (north), Echo Cave (east) where the singing crystals live.
const CW = 1600, CH = 1200;
const ROOMS = [ {x:800,y:950,r:170,name:'Entry Hall'}, {x:330,y:620,r:210,name:'Glow Grotto'}, {x:1270,y:560,r:220,name:'Echo Cave'}, {x:800,y:320,r:160,name:'Pool Room'} ];
const TUNNELS = [[0,1],[0,2],[1,3],[3,2]];
const TW = 46;
const cpool = { x:800, y:300, rx:72, ry:44 };
const shaft = { x:800, y:1062 };
const STALAGS = [ {x:675,y:905,r:18},{x:935,y:1035,r:16},{x:455,y:520,r:20},{x:290,y:775,r:16},{x:690,y:395,r:16},{x:760,y:440,r:16} ];
const GLOWCAP_SPOTS = [[240,520],[420,760],[175,680],[705,235],[1035,440]];
const NOTES = [523.25, 587.33, 659.25, 783.99, 880.0];
const CRYSTAL_COLS = [['#f6a8c4','#e48aae','246,168,196'],['#ffe08a','#efc65e','255,224,138'],['#9fe6c8','#74cfa9','159,230,200'],['#9cc9ff','#77abeb','156,201,255'],['#c9b4f4','#a98fe0','201,180,244']];
const CRYSTALS = [-100,-50,0,50,100].map((deg,i) => { const a = deg*Math.PI/180; return { x: 1270 + Math.cos(a)*150, y: 560 + Math.sin(a)*150, i, col: CRYSTAL_COLS[i] }; });
const SONG_ROUNDS = [[0,2,4],[4,1,3,0]];
const segD = (px,py,ax,ay,bx,by) => { const dx=bx-ax, dy=by-ay, l=dx*dx+dy*dy; const t=Math.max(0,Math.min(1,((px-ax)*dx+(py-ay)*dy)/l)); return d2(px,py,ax+dx*t,ay+dy*t); };
const LANTERNS = [];
TUNNELS.forEach(([a,b]) => { const A=ROOMS[a], B=ROOMS[b]; const dx=B.x-A.x, dy=B.y-A.y, l=Math.hypot(dx,dy); const nx=-dy/l, ny=dx/l;
  [0.36, 0.64].forEach((t,j) => LANTERNS.push({ x: A.x+dx*t + nx*(TW-6)*(j?1:-1), y: A.y+dy*t + ny*(TW-6)*(j?1:-1) })); });
const caveShrooms = [], caveSpecks = [], cavePatches = [], caveRoots = [];
(function scatterCave(){
  const R = rng(42);
  ROOMS.forEach((rm,ri) => {
    for (let i=0;i<9;i++){ const a = R()*Math.PI*2, rr = rm.r - 22 - R()*16; caveShrooms.push({ x: rm.x+Math.cos(a)*rr, y: rm.y+Math.sin(a)*rr, c: R()<0.5 ? '255,186,110' : '250,150,190', n: 2+Math.floor(R()*3), v:R() }); }
    for (let i=0;i<5;i++){ const a = -2.5 + R()*1.9; caveRoots.push({ x: rm.x+Math.cos(a)*(rm.r+4), y: rm.y+Math.sin(a)*(rm.r+4), len: 40+R()*50, bend: (R()-0.5)*30, v:R() }); }
    for (let i=0;i<5;i++){ const a=R()*Math.PI*2, rr=R()*rm.r*0.6; cavePatches.push({ x: rm.x+Math.cos(a)*rr, y: rm.y+Math.sin(a)*rr, rx: 40+R()*60, ry: 20+R()*30 }); }
  });
  for (let i=0;i<700;i++) caveSpecks.push({ x: R()*CW, y: R()*CH, r: 1+R()*2.5 });
})();

function caveWalkable(x,y){
  const inside = ROOMS.some(c => d2(x,y,c.x,c.y) < c.r-14) || TUNNELS.some(([a,b]) => segD(x,y,ROOMS[a].x,ROOMS[a].y,ROOMS[b].x,ROOMS[b].y) < TW-10) || newTunnelWalk(x,y);
  if (!inside) return false;
  if (((x-cpool.x)/(cpool.rx+12))**2 + ((y-cpool.y)/(cpool.ry+10))**2 < 1) return false;
  for (const st of STALAGS) if (d2(x,y,st.x,st.y) < st.r+6) return false;
  if (d2(x,y,1215,578) < 30) return false;
  return true;
}

// ---------- Scene switching ----------
function goTo(scene){ if (!S.trans) S.trans = { to: scene, from: S.scene, t: 0, swapped: false }; clearGoal(); }
function updateTrans(dt){
  const T = S.trans; if (!T) return;
  T.t += dt;
  const half = T.half || 0.4;
  if (!T.swapped && T.t >= half) {
    T.swapped = true; S.scene = T.to; S.trail = []; cam.snap = true;
    const P = S.player;
    if (T.sail) arriveBy(T); else
    if (T.to==='cave' && T.from==='cove') { P.x = CAVE_LADDER2.x - 34; P.y = CAVE_LADDER2.y + 70; S.ladder2Armed = false; }
    else if (T.to==='cave') { P.x = shaft.x; P.y = shaft.y - 75; S.shaftArmed = false; }
    else if (T.to==='cove') { P.x = 255; P.y = 470; S.coveLadderArmed = false; }
    else { P.x = burrow.x; P.y = burrow.y + 115; S.doorArmed = false; }
    S.ducklings.forEach(d => { if (d.state==='follow') { d.x = P.x; d.y = P.y; } });
    chime(T.to==='cave' ? [392,330,262] : T.to==='cove' ? [523,659,784,1047] : [523,659,784], 0.12);
  }
  if (T.t >= 2*half) {
    S.trans = null;
    if (T.sail) return arrived(T);
    if (S.scene==='cave' && !S.visitedCave) { S.visitedCave = true; speak('pip.cave.first'); }
    if (S.scene==='cove' && !S.visitedCove) { S.visitedCove = true; speak('pip.cove.first'); }
  }
}
function updateDoor(){
  const P = S.player, d = d2(P.x,P.y,burrow.x,burrow.y+60);
  if (d > 60) S.doorArmed = true;
  if (S.doorArmed && d < 30 && !S.dialog && !S.ending) goTo('cave');
}

// ---------- Crystal song ----------
const songTimers = [];
function ring(i){ const c = S.crystals[i]; c.flash = 1; chime([NOTES[i]], 0.32); }
function playSequence(){
  const sg = S.quests.song; songTimers.forEach(clearTimeout); songTimers.length = 0;
  sg.playing = true; sg.input = [];
  const seq = SONG_ROUNDS[sg.round];
  seq.forEach((ci,k) => songTimers.push(setTimeout(() => ring(ci), 700 + k*700)));
  songTimers.push(setTimeout(() => { sg.playing = false; fernSays('mouse.song.turn', 'Your turn!'); }, 700 + seq.length*700 + 150));
}
// Fern talks during the song game without opening the dialog box: her line plays and floats up as a pop.
function fernSays(id, text){ pop(1215, 470, text); if (!S.dialog) voiceLine(convo(id)[0]); }
function touchCrystal(i){
  ring(i);
  const sg = S.quests.song;
  if (sg.state!=='active' || sg.playing) return;
  const seq = SONG_ROUNDS[sg.round];
  if (seq[sg.input.length] === i) {
    sg.input.push(i);
    if (sg.input.length === seq.length) {
      sg.round++; sg.input = []; renderQuests();
      if (sg.round >= SONG_ROUNDS.length) {
        sg.state = 'done';
        songTimers.push(setTimeout(() => { chime([523,659,784,1046,1319],0.12); speak(['mouse.thanks', allDone() ? 'mouse.gotell' : null]); renderQuests(); }, 600));
      } else {
        fernSays('mouse.song.next', 'Ready for the next one?');
        sg.playing = true; songTimers.push(setTimeout(playSequence, 2600));
      }
    }
  } else {
    fernSays('mouse.song.oops', 'Oops! Listen again');
    sg.input = []; sg.playing = true;
    songTimers.push(setTimeout(() => chime([330,262],0.18), 250));
    songTimers.push(setTimeout(playSequence, 2400));
  }
}

function updateCave(dt){
  const P = S.player, q = S.quests;
  const ds = d2(P.x,P.y,shaft.x,shaft.y);
  if (ds > 60) S.shaftArmed = true;
  if (S.shaftArmed && ds < 30 && !S.dialog) goTo('island');
  if (digStage()===2) { const dl = d2(P.x,P.y,CAVE_LADDER2.x,CAVE_LADDER2.y); if (dl > 60) S.ladder2Armed = true; if (S.ladder2Armed && dl < 28 && !S.dialog) goTo('cove'); }
  // Digby walks to the end of his tunnel, then starts digging
  S.npcs.forEach(n => { if (n.walk) { if (!n.route) sendNpc(n, n.walk.x, n.walk.y, 'cave'); if (stepNpc(n, dt, 95)) { n.walk = null; n.face = 1; n.digging = true; for (const g in grids) delete grids[g]; } } });
  for (const g of S.glowcaps) {
    if (!g.taken && d2(P.x,P.y,g.x,g.y) < 50 && !S.dialog) {
      g.taken = true; q.glow.have++; chime([1047,1319,1568],0.08); renderQuests();
      earlyFind('glow','mole', 'pip.early.glow');
      pop(g.x, g.y-40, `${q.glow.have} glowcap${q.glow.have===1?'':'s'}`);
      if (q.glow.have===4 && q.glow.state!=='done') setTimeout(() => !S.dialog && speak('pip.glow.all'), 600);
    }
  }
  S.crystals.forEach((c,i) => {
    c.flash = Math.max(0, c.flash - dt*1.4);
    const d = d2(P.x,P.y,c.x,c.y);
    if (d < 44 && c.armed && !S.dialog) { c.armed = false; touchCrystal(i); }
    if (d > 70) c.armed = true;
  });
  updateShow(dt);
  if (S.day>=2) { const f = S.npcs.find(n => n.id==='mouse'); if (f && d2(P.x,P.y,f.x,f.y) < 330 && !S.dialog) { S.fernT = (S.fernT||0) + dt; if (S.fernT > 3.2) { S.fernT = 0; const tune = [0,2,4,3,1]; S.fernNote = ((S.fernNote||0)+1) % tune.length; ring(tune[S.fernNote]); } } }
  S.litOn.forEach((on,i) => { if (on) S.lit[i] = Math.min(1, S.lit[i] + dt*2.2); });
  S.lightT = S.lit.reduce((a,b) => a+b, 0) / S.lit.length;
  S.sparks.forEach(p => { p.t += dt; p.x += p.vx*dt; p.y += p.vy*dt; p.vy += 50*dt; });
  S.sparks = S.sparks.filter(p => p.t < p.life);
  S.moths.forEach(m => { m.a += dt*m.sp; m.f += dt*18; });
  S.hop = Math.max(0, S.hop - dt);
}

// ---------- Lantern light show (Digby's reward) ----------
const SHOW_NOTES = [523,587,659,784,880,1047,1175,1319];
function burst(x, y, c, n){
  for (let i=0;i<n;i++){ const a = Math.random()*Math.PI*2, v = 40 + Math.random()*90;
    S.sparks.push({ x, y, vx: Math.cos(a)*v, vy: Math.sin(a)*v - 40, t: 0, life: 0.7 + Math.random()*0.6, c, r: 1.5 + Math.random()*2 }); }
}
function startLightShow(n){
  const order = LANTERNS.map((L,i) => ({ i, d: d2(L.x,L.y,n.x,n.y) })).sort((a,b) => a.d-b.d).map(o => o.i);
  S.show = { t: 0, order, next: 0, n };
  clearGoal();
}
function updateShow(dt){
  const sh = S.show; if (!sh) return;
  sh.t += dt;
  if (sh.t > 1.0 && !S.moleLantern) { S.moleLantern = true; chime([392,523],0.2); burst(sh.n.x-24, sh.n.y-56, '255,224,138', 18); }
  while (sh.next < sh.order.length && sh.t > 1.6 + sh.next*0.34) {
    const i = sh.order[sh.next], L = LANTERNS[i];
    S.litOn[i] = true; chime([SHOW_NOTES[sh.next % SHOW_NOTES.length]], 0.25); burst(L.x+9, L.y-24, '255,206,120', 20);
    sh.next++;
  }
  const doneAt = 1.6 + sh.order.length*0.34 + 0.3;
  if (sh.t > doneAt && !sh.moths) {
    sh.moths = true; S.hop = 2.6;
    chime([523,659,784,1047,1319,1568],0.09);
    LANTERNS.forEach((L,i) => { for (let k=0;k<2;k++) S.moths.push({ i, a: Math.random()*6.28, r: 16 + Math.random()*16, sp: (Math.random()<.5?-1:1)*(1.4+Math.random()), f: Math.random()*6 }); });
  }
  if (sh.t > 6.4) {
    S.show = null; S.hasLantern = true;
    speak(['mole.gift', allDone() ? 'mole.gotell' : null], () => { const m = S.npcs.find(n => n.id==='mole'); const e = stubEnd(); m.walk = { x: e.x - 6, y: e.y + 18 }; });
  }
}
function drawSparksAndMoths(t){
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (const p of S.sparks) { const a = 1 - p.t/p.life; circ(p.x, p.y, p.r*(0.6+a), `rgba(${p.c},${a})`); }
  for (const m of S.moths) {
    const L = LANTERNS[m.i], x = L.x + 9 + Math.cos(m.a)*m.r, y = L.y - 30 + Math.sin(m.a)*m.r*0.6;
    const w = Math.abs(Math.sin(m.f))*3 + 1;
    ell(x - w, y, w, 2.2, 'rgba(255,240,200,.75)'); ell(x + w, y, w, 2.2, 'rgba(255,240,200,.75)');
    circ(x, y, 1.6, 'rgba(255,255,230,.95)');
  }
  ctx.restore();
}
function drawPoolFish(t){
  if (S.quests.glow.state!=='done' || S.lightT < 0.5) return;
  for (let i=0;i<3;i++){
    const a = t*(0.5+i*0.15) + i*2.1, fx = cpool.x + Math.cos(a)*(40-i*8), fy = cpool.y + Math.sin(a)*(22-i*4);
    ctx.save(); ctx.translate(fx,fy); ctx.rotate(a + Math.PI/2);
    ell(0,0,7,3,'rgba(255,170,90,.95)'); ctx.fillStyle='rgba(255,170,90,.95)'; ctx.beginPath(); ctx.moveTo(-6,0); ctx.lineTo(-11,-3.5); ctx.lineTo(-11,3.5); ctx.fill();
    ctx.restore();
  }
}

// ---------- Burrow drawing ----------
function drawMound(t){
  const {x,y} = burrow;
  shadow(x,y+40,90);
  ell(x,y,88,56,'#86b665'); ell(x-14,y-14,64,36,'#9cc874'); ell(x+20,y-24,26,12,'#acd383');
  ctx.strokeStyle='#6f9e55'; ctx.lineWidth=3; ctx.lineCap='round';
  for (let i=-3;i<=3;i++){ const bx=x+i*18, by=y-40+Math.abs(i)*6; ctx.beginPath(); ctx.moveTo(bx,by); ctx.lineTo(bx+Math.sin(t*2+i)*2,by-10); ctx.stroke(); }
  // round door
  ctx.fillStyle='#3a2a22'; ctx.beginPath(); ctx.arc(x,y+30,26,Math.PI,0); ctx.lineTo(x+26,y+52); ctx.lineTo(x-26,y+52); ctx.closePath(); ctx.fill();
  ctx.strokeStyle='#b38a63'; ctx.lineWidth=6; ctx.beginPath(); ctx.arc(x,y+30,28,Math.PI,0); ctx.stroke();
  circ(x-30,y+24,3,'#b38a63'); circ(x+30,y+24,3,'#b38a63');
  // lantern on a post
  ctx.strokeStyle='#8c6a4d'; ctx.lineWidth=4; ctx.beginPath(); ctx.moveTo(x+52,y+56); ctx.lineTo(x+52,y+14); ctx.lineTo(x+40,y+14); ctx.stroke();
  ctx.fillStyle='#ffe08a'; ctx.beginPath(); ctx.roundRect(x+34,y+16,12,14,3); ctx.fill();
  ctx.strokeStyle='#5e4636'; ctx.lineWidth=2; ctx.strokeRect(x+34,y+16,12,14);
}
function drawMoundStones(){ const {x,y} = burrow; [[0,72],[-10,94],[6,114]].forEach(([dx,dy]) => { ell(x+dx+1,y+dy+2,12,6,'rgba(52,67,58,.14)'); ell(x+dx,y+dy,12,6,'#cfcdc0'); ell(x+dx-3,y+dy-2,6,2.5,'#e2e0d6'); }); }
function drawMoundFx(t){ const {x,y} = burrow; const glow = 0.6 + Math.sin(t*3)*0.15; circ(x+40,y+24,16,`rgba(255,224,138,${glow*0.35})`); }

function drawMole(n,t){
  const {x,y} = n; shadow(x,y+2,24);
  const lit = S.moleLantern;
  const hop = S.hop > 0 ? -Math.abs(Math.sin(t*9))*8 : 0;
  const step = n.moving ? -Math.abs(Math.sin(n.walkT))*3 : 0;
  ctx.save(); ctx.translate(x, y + Math.sin(t*2)*1 + hop + step);
  ctx.scale(n.face || 1, 1); if (n.moving) ctx.rotate(Math.sin(n.walkT)*0.06);
  // lantern pole
  ctx.strokeStyle='#8c6a4d'; ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(-18,-4); ctx.lineTo(-24,-56); ctx.stroke();
  ctx.fillStyle = lit ? '#ffe08a' : '#4a4038'; ctx.beginPath(); ctx.roundRect(-32,-64,16,18,3); ctx.fill();
  ctx.strokeStyle='#3a2a22'; ctx.lineWidth=2; ctx.strokeRect(-32,-64,16,18);
  if (lit) { circ(-24,-55,4,'#7ff0dc'); }
  ell(0,-18,22,20,'#5c5463'); ell(2,-12,13,10,'#6d6474');
  ell(10,-32,13,11,'#5c5463');
  ell(21,-29,6,4.5,'#f2a3b3'); circ(25,-29,2.4,'#e0708a');
  ctx.strokeStyle='#f4b85a'; ctx.lineWidth=1.8;
  ctx.beginPath(); ctx.arc(7,-36,4.5,0,Math.PI*2); ctx.stroke();
  ctx.beginPath(); ctx.arc(16,-37,4.5,0,Math.PI*2); ctx.stroke();
  circ(7,-36,1.4,C.ink); circ(16,-37,1.4,C.ink);
  ell(-15,-6,8,6,'#f2a3b3'); ell(17,-8,8,6,'#f2a3b3');
  ctx.strokeStyle='#e9dcc4'; ctx.lineWidth=1.2;
  for (let i=-1;i<=1;i++){ ctx.beginPath(); ctx.moveTo(22,-8+i*3); ctx.lineTo(26,-8+i*3.5); ctx.stroke(); }
  if (n.digging) for (let i=0;i<3;i++){ const k = (t*1.8 + i/3) % 1; circ(30 + k*16, -8 - Math.sin(k*Math.PI)*18, 2.4, '#7a5f4b'); }
  ctx.restore();
}
function drawMouse(n,t,stool=true){
  const {x,y} = n;
  if (stool) {
    shadow(x,y+20,24);
    ctx.fillStyle='#e9dcc4'; ctx.beginPath(); ctx.roundRect(x-7,y+2,14,18,4); ctx.fill();
    ctx.beginPath(); ctx.ellipse(x,y+4,22,9,0,Math.PI,0); ctx.fillStyle='#c96f5a'; ctx.fill();
    circ(x-9,y,2,'#fff6e8'); circ(x+7,y-1,2,'#fff6e8');
    // candle
    ctx.fillStyle='#fff6e8'; ctx.beginPath(); ctx.roundRect(x-34,y+4,8,16,2); ctx.fill();
    const fl = Math.sin(t*9)*1.2;
    ell(x-30,y-2+fl*0.3,3.5,6,'#ffcf5a'); circ(x-30,y,1.6,'#fff6e8');
  } else shadow(x,y+2,16);
  const bob = Math.sin(t*3)*1.2;
  ctx.save(); ctx.translate(x, y + bob + (stool ? -2 : 0));
  ctx.strokeStyle='#e0a9a0'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(-10,-2); ctx.quadraticCurveTo(-28,0,-24,14); ctx.stroke();
  ell(0,-10,12,13,'#c9a27e'); ell(2,-8,7,8,'#efdcc2');
  circ(-4,-38,7,'#c9a27e'); circ(-4,-38,4,'#f2b8c0'); circ(13,-37,7,'#c9a27e'); circ(13,-37,4,'#f2b8c0');
  circ(5,-28,10,'#c9a27e');
  if (blink(t, 2.9)) { ctx.strokeStyle=C.ink; ctx.lineWidth=1.4; ctx.beginPath(); ctx.moveTo(6,-29); ctx.lineTo(10,-29); ctx.stroke(); } else { circ(8,-29,1.9,C.ink); circ(8.6,-29.6,0.6,'#fff'); }
  circ(15,-26,2,'#e0708a');
  ctx.strokeStyle='rgba(52,67,58,.45)'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(14,-25); ctx.lineTo(22,-26); ctx.moveTo(14,-24); ctx.lineTo(21,-21); ctx.stroke();
  ctx.save(); ctx.translate(3,-39); ctx.rotate(-0.5); ell(0,0,11,3.5,'#6f9e55'); ctx.strokeStyle='#5f9150'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(-10,0); ctx.lineTo(10,0); ctx.stroke(); ctx.restore();
  ctx.restore();
}
function drawCrystal(c,t){
  const {x,y,col,flash} = c;
  shadow(x,y+2,22);
  const shard = (dx,h,w,rot,fill) => { ctx.save(); ctx.translate(x+dx,y); ctx.rotate(rot); ctx.fillStyle=fill; ctx.beginPath(); ctx.moveTo(-w,0); ctx.lineTo(-w*0.75,-h*0.7); ctx.lineTo(0,-h); ctx.lineTo(w*0.75,-h*0.7); ctx.lineTo(w,0); ctx.closePath(); ctx.fill(); ctx.restore(); };
  shard(-12,30,8,-0.35,col[1]); shard(12,26,7,0.35,col[1]); shard(0,48,10,0,col[0]);
  ctx.fillStyle='rgba(255,255,255,.45)'; ctx.beginPath(); ctx.moveTo(x-2,y-4); ctx.lineTo(x-5,y-30); ctx.lineTo(x,y-44); ctx.lineTo(x+1,y-6); ctx.fill();
  if (flash > 0) { ctx.globalAlpha = flash*0.85; shard(0,48,10,0,'#ffffff'); ctx.globalAlpha = 1; }
}
function drawCrystalFx(c){
  const {x,y,col,flash} = c;
  if (flash > 0) {
    ctx.strokeStyle = `rgba(${col[2]},${flash})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(x,y,22+(1-flash)*40,(22+(1-flash)*40)*0.45,0,0,Math.PI*2); ctx.stroke();
    ctx.fillStyle = `rgba(${col[2]},${flash})`; ctx.font='800 20px Grandstander, system-ui, sans-serif'; ctx.textAlign='center'; ctx.fillText('♪', x+18, y-50-(1-flash)*20);
  }
}
function drawGlowcap(g,t){
  if (g.taken) return;
  const p = 0.8 + Math.sin(t*3 + g.x)*0.2;
  const bob = Math.sin(t*2.4 + g.x)*2.5;
  // pulsing ring on the ground says "pick me up"
  const k = (t*0.8 + g.x*0.01) % 1;
  ctx.strokeStyle = `rgba(127,240,220,${0.7*(1-k)})`; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.ellipse(g.x, g.y+2, 14+k*26, (14+k*26)*0.4, 0, 0, Math.PI*2); ctx.stroke();
  ell(g.x,g.y+2,13,4,'rgba(0,0,0,.28)');
  ctx.save(); ctx.translate(g.x, g.y + bob*0.3); ctx.scale(1.45,1.45);
  ctx.fillStyle='#efe4cf'; ctx.beginPath(); ctx.roundRect(-3.5,-13,7,13,3.5); ctx.fill();
  ctx.beginPath(); ctx.ellipse(0,-13,13,10,0,Math.PI,0); ctx.fillStyle=`rgba(110,235,215,${p})`; ctx.fill();
  ctx.strokeStyle='#3fb7a4'; ctx.lineWidth=1.4; ctx.beginPath(); ctx.ellipse(0,-13,13,10,0,Math.PI,0); ctx.closePath(); ctx.stroke();
  circ(-5,-17,2,'#ffffff'); circ(3,-20,1.6,'#ffffff'); circ(7,-15,1.3,'#ffffff');
  ctx.restore();
  sparkle(g.x+16, g.y-36+bob, t*0.7+g.x);
}
// Decorative glow-berry sprigs: thin curly stems with tiny warm bulbs. Deliberately unlike glowcaps
// (no cap, no teal, small and low) so the things to collect stand out.
function drawCaveShroom(m,t){
  ctx.lineCap='round';
  for (let i=0;i<m.n;i++){
    const x = m.x + (i-m.n/2)*8, y = m.y + (i%2)*4, h = 10 + ((i*7+m.v*10)%6), bend = (i%2 ? 1 : -1)*4;
    ctx.strokeStyle='#6f5a48'; ctx.lineWidth=1.6;
    ctx.beginPath(); ctx.moveTo(x,y); ctx.quadraticCurveTo(x+bend,y-h*0.6,x+bend*0.4,y-h); ctx.stroke();
    const a = 0.55 + Math.sin(t*2+m.v*9+i)*0.2;
    circ(x+bend*0.4, y-h, 2.2, `rgba(${m.c},${a})`);
    circ(x+bend*0.8, y-h*0.55, 1.6, `rgba(${m.c},${a*0.85})`);
  }
}
function drawLantern(L,t,i){
  const v = S.lit[i] || 0;
  ctx.strokeStyle='#5e4636'; ctx.lineWidth=4; ctx.lineCap='round';
  ctx.beginPath(); ctx.moveTo(L.x,L.y); ctx.lineTo(L.x,L.y-34); ctx.lineTo(L.x+8,L.y-34); ctx.stroke();
  ctx.fillStyle = v > 0 ? `rgba(255,224,138,${0.5+0.5*v})` : '#4a4038';
  ctx.beginPath(); ctx.roundRect(L.x+3,L.y-30,12,14,3); ctx.fill();
  ctx.strokeStyle='#3a2a22'; ctx.lineWidth=1.5; ctx.strokeRect(L.x+3,L.y-30,12,14);
}
function drawStalag(st){
  ell(st.x,st.y+2,st.r,st.r*0.35,'rgba(0,0,0,.22)');
  ctx.fillStyle='#8a7462'; ctx.beginPath(); ctx.moveTo(st.x-st.r,st.y); ctx.quadraticCurveTo(st.x-st.r*0.3,st.y-st.r*1.2,st.x,st.y-st.r*2.6); ctx.quadraticCurveTo(st.x+st.r*0.3,st.y-st.r*1.2,st.x+st.r,st.y); ctx.closePath(); ctx.fill();
  ctx.fillStyle='#a28b77'; ctx.beginPath(); ctx.moveTo(st.x-st.r*0.4,st.y-2); ctx.quadraticCurveTo(st.x-st.r*0.2,st.y-st.r*1.3,st.x,st.y-st.r*2.4); ctx.lineTo(st.x-st.r*0.05,st.y-2); ctx.fill();
}

const fogC = document.createElement('canvas'), fctx = fogC.getContext('2d');
function drawFog(lights, dark){
  // the darkness is soft, so it is drawn at half resolution and scaled up
  const fw = Math.ceil(cvs.width/2), fh = Math.ceil(cvs.height/2);
  if (fogC.width !== fw || fogC.height !== fh) { fogC.width = fw; fogC.height = fh; }
  fctx.setTransform(1,0,0,1,0,0); fctx.globalCompositeOperation='source-over';
  fctx.clearRect(0,0,fogC.width,fogC.height);
  fctx.fillStyle = `rgba(12,10,26,${dark})`; fctx.fillRect(0,0,fogC.width,fogC.height);
  fctx.globalCompositeOperation='destination-out';
  const k = cam.z*DPR/2;
  for (const L of lights) {
    const sx=(L.x-cam.x)*k, sy=(L.y-cam.y)*k, r=L.r*k;
    if (sx<-r || sy<-r || sx>fogC.width+r || sy>fogC.height+r) continue;
    const g = fctx.createRadialGradient(sx,sy,0,sx,sy,r);
    g.addColorStop(0,`rgba(0,0,0,${L.a ?? 1})`); g.addColorStop(0.45,`rgba(0,0,0,${(L.a ?? 1)*0.75})`); g.addColorStop(1,'rgba(0,0,0,0)');
    fctx.fillStyle = g; fctx.beginPath(); fctx.arc(sx,sy,r,0,Math.PI*2); fctx.fill();
  }
  ctx.save(); ctx.setTransform(1,0,0,1,0,0);
  ctx.drawImage(fogC,0,0,cvs.width,cvs.height);
  ctx.globalCompositeOperation='lighter';
  for (const L of lights) if (L.c) {
    const sx=(L.x-cam.x)*k*2, sy=(L.y-cam.y)*k*2, r=L.r*k*2*0.55;
    if (sx<-r || sy<-r || sx>cvs.width+r || sy>cvs.height+r) continue;
    const g = ctx.createRadialGradient(sx,sy,0,sx,sy,r);
    g.addColorStop(0,`rgba(${L.c},${L.g ?? 0.18})`); g.addColorStop(1,`rgba(${L.c},0)`);
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(sx,sy,r,0,Math.PI*2); ctx.fill();
  }
  ctx.restore();
}

// The rock, tunnels, pool basin, ladder, roots and glowing sprigs are baked once per tunnel stage.
function drawCaveStatic(){
  ctx.fillStyle='#241b18'; ctx.fillRect(0,0,CW,CH);
  ctx.fillStyle='#2e2420'; for (const sp of caveSpecks) { ctx.beginPath(); ctx.arc(sp.x,sp.y,sp.r,0,Math.PI*2); ctx.fill(); }
  ctx.lineCap='round';
  const dst = digStage(), dEnd = dst===2 ? NEW_TUNNEL.b : stubEnd();
  const rooms = dst===2 ? [...ROOMS, NEW_ROOM] : ROOMS;
  const tun = (w,col) => { ctx.strokeStyle=col; ctx.lineWidth=w; TUNNELS.forEach(([a,b]) => { ctx.beginPath(); ctx.moveTo(ROOMS[a].x,ROOMS[a].y); ctx.lineTo(ROOMS[b].x,ROOMS[b].y); ctx.stroke(); });
    if (dst) { ctx.beginPath(); ctx.moveTo(NEW_TUNNEL.a.x,NEW_TUNNEL.a.y); ctx.lineTo(dEnd.x,dEnd.y); ctx.stroke(); } };
  tun(TW*2+30,'#3d2f28'); rooms.forEach(rm => circ(rm.x,rm.y,rm.r+16,'#3d2f28'));
  tun(TW*2+10,'#55433a'); rooms.forEach(rm => circ(rm.x,rm.y,rm.r+5,'#55433a'));
  tun(TW*2-6,'#6b5444'); rooms.forEach(rm => circ(rm.x,rm.y,rm.r-6,'#6b5444'));
  for (const p of cavePatches) ell(p.x,p.y,p.rx,p.ry,'rgba(122,99,82,.55)');
  ell(cpool.x,cpool.y,cpool.rx+10,cpool.ry+8,'#55433a');
  ell(cpool.x,cpool.y,cpool.rx,cpool.ry,'#3f6f7c');
  ell(shaft.x,shaft.y+6,46,18,'rgba(255,240,190,.25)');
  ctx.strokeStyle='#a07c58'; ctx.lineWidth=5;
  ctx.beginPath(); ctx.moveTo(shaft.x-16,shaft.y+10); ctx.lineTo(shaft.x-16,shaft.y+90); ctx.moveTo(shaft.x+16,shaft.y+10); ctx.lineTo(shaft.x+16,shaft.y+90); ctx.stroke();
  ctx.lineWidth=4; for (let yy=shaft.y+20; yy<shaft.y+90; yy+=16){ ctx.beginPath(); ctx.moveTo(shaft.x-16,yy); ctx.lineTo(shaft.x+16,yy); ctx.stroke(); }
  ctx.strokeStyle='#8a6a50'; ctx.lineCap='round';
  for (const r of caveRoots) { ctx.lineWidth = 4 + r.v*3;
    ctx.beginPath(); ctx.moveTo(r.x,r.y); ctx.quadraticCurveTo(r.x+r.bend, r.y+r.len*0.5, r.x+r.bend*0.5, r.y+r.len); ctx.stroke();
    ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(r.x+r.bend*0.4, r.y+r.len*0.5); ctx.lineTo(r.x+r.bend*0.4+10, r.y+r.len*0.65); ctx.stroke(); }
  caveShrooms.forEach(m => drawCaveShroom(m,0));
}
function drawCave(t){
  blitGround(bakedGround('cave:' + digStage(), CW, CH, drawCaveStatic), CW, CH);
  drawNewTunnel(t);
  ctx.strokeStyle='rgba(180,230,240,.35)'; ctx.lineWidth=1.5;
  for (let i=0;i<2;i++){ const k=((t*0.25+i/2)%1); ctx.globalAlpha=1-k; ctx.beginPath(); ctx.ellipse(cpool.x+14,cpool.y+6,8+k*44,(8+k*44)*0.55,0,0,Math.PI*2); ctx.stroke(); }
  ctx.globalAlpha=1;
  drawPoolFish(t);

  const ents = [];
  STALAGS.forEach((st,i) => ents.push({y:st.y, f:() => cached('stalag'+i, st.x, st.y, [-st.r-2,-st.r*2.7,st.r+2,4], () => drawStalag(st), {ink:'#3a2c25'})}));
  LANTERNS.forEach((L,i) => ents.push({y:L.y, f:() => drawLantern(L,t,i)}));
  S.glowcaps.forEach(g => ents.push({y:g.y, f:() => drawGlowcap(g,t)}));
  S.crystals.forEach(c => ents.push({y:c.y, f:() => { styled(c.x, c.y, [-24,-52,24,4], () => drawCrystal(c,t), {shadow:22, key:'crystal:'+c.i, fps:20}); drawCrystalFx(c); }}));
  S.npcs.forEach(n => { if (n.scene==='cave') ents.push({y:n.y + (n.id==='mouse'?20:0), f:() => drawNpcStyled(n,t,true)}); });
  S.ducklings.forEach(d => { if (d.state==='follow') ents.push({y:d.y, f:() => drawDucklingStyled(d,t)}); });
  ents.push({y:S.player.y, f:() => drawPipStyled(t)});
  ents.sort((a,b) => a.y-b.y).forEach(e => e.f());

  // light and darkness
  const P = S.player, lt = S.lightT;
  const lights = [ {x:P.x, y:P.y-24, r:200 + lt*40 + (S.hasLantern ? 80 : 0), c: S.hasLantern ? '255,214,140' : undefined, g:0.2}, {x:shaft.x, y:shaft.y+30, r:200, c:'255,236,170', g:0.25} ];
  LANTERNS.forEach((L,i) => { const v = S.lit[i]; lights.push(v > 0 ? {x:L.x+9, y:L.y-24, r:40 + 230*v, c:'255,206,120', g:0.3} : {x:L.x+9, y:L.y-24, r:22, a:0.5}); });
  if (S.quests.glow.state==='done' && lt > 0.5) for (let i=0;i<3;i++) lights.push({x:cpool.x, y:cpool.y, r:70, c:'255,170,90', g:0.2});
  S.moths.forEach(m => { const L = LANTERNS[m.i]; lights.push({x:L.x+9+Math.cos(m.a)*m.r, y:L.y-30+Math.sin(m.a)*m.r*0.6, r:16, a:0.6}); });
  newTunnelLights(lights);
  S.glowcaps.forEach(g => { if (!g.taken) lights.push({x:g.x, y:g.y-16, r:115, c:'110,235,215', g:0.45}); });
  caveShrooms.forEach(m => lights.push({x:m.x, y:m.y-8, r:32, c:m.c, a:0.55, g:0.18}));
  S.crystals.forEach(c => lights.push({x:c.x, y:c.y-24, r:70 + c.flash*90, c:c.col[2], a:0.85, g:0.25 + c.flash*0.35}));
  S.npcs.forEach(n => { if (n.scene!=='cave') return;
    if (n.id==='mouse') lights.push({x:n.x-30, y:n.y-4, r:120, c:'255,200,110', g:0.3});
    if (n.id==='mole') lights.push(S.moleLantern ? {x:n.x-24, y:n.y-56, r:150, c:'255,224,138', g:0.3} : {x:n.x, y:n.y-20, r:60, a:0.5}); });
  drawGrain(0.45);
  drawFog(lights, 0.9 - 0.45*lt);
  ctx.setTransform(DPR*cam.z,0,0,DPR*cam.z,-cam.x*DPR*cam.z,-cam.y*DPR*cam.z);
  drawSparksAndMoths(t);
  drawMarkers(t);
  drawPops();
  drawTargetRing();
}

function drawCaveMap(t, w){
  const k = w / CW, u = 1/k, R = (w > 200 ? 5.5 : 4.5)*u;
  mctx.setTransform(DPR*k,0,0,DPR*k,0,0);
  mctx.fillStyle='#241b18'; mctx.fillRect(0,0,CW,CH);
  mctx.lineCap='round'; mctx.strokeStyle='#8a6e5a'; mctx.lineWidth=TW*2;
  TUNNELS.forEach(([a,b]) => { mctx.beginPath(); mctx.moveTo(ROOMS[a].x,ROOMS[a].y); mctx.lineTo(ROOMS[b].x,ROOMS[b].y); mctx.stroke(); });
  const c = (x,y,r,f) => { mctx.beginPath(); mctx.arc(x,y,r,0,Math.PI*2); mctx.fillStyle=f; mctx.fill(); };
  ROOMS.forEach(rm => c(rm.x,rm.y,rm.r,'#8a6e5a'));
  mctx.beginPath(); mctx.ellipse(cpool.x,cpool.y,cpool.rx,cpool.ry,0,0,Math.PI*2); mctx.fillStyle='#4f8a98'; mctx.fill();
  if (digStage()) { const e = digStage()===2 ? NEW_TUNNEL.b : stubEnd(); mctx.beginPath(); mctx.moveTo(NEW_TUNNEL.a.x,NEW_TUNNEL.a.y); mctx.lineTo(e.x,e.y); mctx.stroke(); if (digStage()===2) { c(NEW_ROOM.x,NEW_ROOM.y,NEW_ROOM.r,'#8a6e5a'); c(CAVE_LADDER2.x,CAVE_LADDER2.y,28*u/5,'#ffe9a8'); } }
  c(shaft.x, shaft.y+20, 28*u/5, '#ffe9a8');
  S.crystals.forEach(cr => c(cr.x, cr.y, R*0.8, cr.col[0]));
  LANTERNS.forEach((L,i) => { if (S.litOn[i]) c(L.x, L.y, R*0.6, '#ffe08a'); });
  const NC = { mole:'#5c5463', mouse:'#c9a27e' };
  S.npcs.forEach(n => {
    if (n.scene!=='cave') return;
    const m = npcMarker(n);
    if (m) { mctx.lineWidth = 2*u; mctx.strokeStyle = m==='ready' ? '#6f9e55' : '#e0904a'; mctx.beginPath(); mctx.arc(n.x, n.y, R+(2.5+Math.sin(t*4)*0.8)*u, 0, Math.PI*2); mctx.stroke(); }
    c(n.x, n.y, R, NC[n.id]); mctx.lineWidth = 1.2*u; mctx.strokeStyle = '#fffaf0'; mctx.beginPath(); mctx.arc(n.x, n.y, R, 0, Math.PI*2); mctx.stroke();
  });
  mctx.lineWidth = 1.5*u; mctx.strokeStyle = 'rgba(255,250,240,.8)';
  mctx.strokeRect(cam.x, cam.y, Math.min(cam.vw,CW), Math.min(cam.vh,CH));
  const P = S.player;
  c(P.x, P.y, R*1.6 + Math.sin(t*5)*u, 'rgba(244,184,90,.5)');
  c(P.x, P.y, R*1.05, '#f4b85a');
  mctx.lineWidth = 1.2*u; mctx.strokeStyle = '#fffaf0'; mctx.beginPath(); mctx.arc(P.x, P.y, R*1.05, 0, Math.PI*2); mctx.stroke();
}

