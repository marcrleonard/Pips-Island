// Day 4: "Above the Clouds" — the Cloudtop Highlands.
// A tall vertical scene the player climbs: misty pine switchbacks at the base, a gorge crossed by a rope
// bridge, and a cloud meadow crown at the top, above a sea of clouds. Reached from the island's North Path,
// which stays walled by mist on Days 1-3 and opens on Day 4 (the north wind clears it overnight).
//
// New friends, hosted by Willow the stag (who points Pip at one friend at a time, like Bramble / Captain Puff):
//   * Juniper the fawn  — relight 3 trail lanterns, which clears the low mist (quest 'trail').
//   * Pine the squirrel — gather 3 bridge planks, then the rope bridge drops and the crown opens (quest 'bridge').
//   * Lark the skylark   — catch 4 thistle seeds drifting on the wind up on the crown (quest 'seeds').
// ---------- Puffin... no: the Highlands ----------
const HW = 1700, HH = 2600;
// One tall mountain the player walks over (like the island's grass). A gorge near the top splits it; the only
// way across is the rope bridge. Props block locally.
const MOUNTAIN = smoothPts([
  [250,260],[430,210],[640,190],[860,195],[1070,220],[1250,280],[1360,440],[1430,700],
  [1470,1000],[1500,1360],[1520,1760],[1480,2120],[1360,2360],[1120,2470],[850,2500],
  [580,2470],[360,2360],[240,2120],[200,1760],[190,1360],[210,1000],[220,640],[220,420]]);
// Grassy crown cap (the meadow at the top). Its top edge reaches the mountain's summit, so above the grass
// is open sky, not rock — you really are on top, above the clouds.
const CROWN = smoothPts([[330,300],[470,212],[700,196],[930,206],[1130,258],[1300,470],[1335,700],[1285,900],
  [1080,992],[820,1002],[560,986],[360,900],[295,680],[300,470]]);
// The gorge: a chasm band that cuts the mountain in two. Below it is the climb, above it the crown.
const GORGE = { y0: 1010, y1: 1170 };
// The rope bridge across the gorge (walkable only once dropped).
const BRIDGE = { x0: 770, x1: 940, y0: GORGE.y0 - 6, y1: GORGE.y1 + 6 };
// Where the waterfall spills off the crown's east ledge, down past the gorge and into the clouds.
const FALL = { x: 1230, y0: 980, y1: 2050 };
// The worn switchback trail (visual + a gentle guide). Also where lanterns sit.
const TRAIL = [[850,2380],[650,2240],[900,2120],[640,1980],[920,1840],[640,1700],[900,1560],[700,1420],
  [860,1290],[855,1200],[855,1050],[855,900],[760,720],[640,560],[760,440]];
const H_LANTERNS = [[905,2118],[636,1978],[855,1292]];   // the three trail lanterns Juniper asks about
const H_PLANKS = [[430,1640],[1140,1520],[600,1360]];     // bridge planks scattered on the lower ledges
const SEED_SPOTS = [[560,560],[980,520],[760,760],[1140,680]];  // where thistle seeds drift on the crown
const CAIRN = { x: 1180, y: 470 };
const H_ROCKS = [[400,1500,34],[1180,1900,40],[520,2180,30],[1250,760,28],[380,760,30],[1080,1300,26]];
const H_PINES = [[320,2300,1.1],[520,2160,0.95],[300,1980,1],[1120,2160,1.05],[1250,1980,0.9],[260,1740,0.95],
  [1180,1700,1],[330,1520,0.85],[1240,1420,0.9],[300,1240,0.8],[1200,1120,0.85],[360,1040,0.8],[1240,980,0.8]];
const H_THRIFT = [[420,620,1],[560,700,0.8],[700,560,0.9],[960,640,0.9],[1100,560,0.8],[840,860,1],
  [1180,820,0.8],[500,860,0.9],[1000,880,0.8],[680,400,0.8],[920,400,0.8]];
const HILL_ENTRY = { x: 855, y: 2360 };   // where Pip arrives when he climbs up
const HILL_EXIT = { x: 855, y: 2460 };    // walk to the base of the trail to climb back down to the island
const WILLOW_SPOT = { x: 740, y: 2250 };
const PICNIC = { x: 760, y: 560 };        // the crown picnic at the end of the day

const inGorge = (x,y) => y > GORGE.y0 && y < GORGE.y1;
const onBridge = (x,y) => x > BRIDGE.x0+8 && x < BRIDGE.x1-8 && y > BRIDGE.y0 && y < BRIDGE.y1;
function highlandBlocked(x,y){
  if (d2(x,y,CAIRN.x,CAIRN.y) < 34) return true;
  if (d2(x,y,WILLOW_SPOT.x,WILLOW_SPOT.y) < 10) return false;
  for (const [rx,ry,r] of H_ROCKS) if (d2(x,y,rx,ry) < r*0.8) return true;
  for (const [px,py,s] of H_PINES) if (d2(x,y,px,py) < 20*s) return true;
  return false;
}
function highlandWalkable(x,y){
  if (S.bridge && onBridge(x,y)) return true;
  if (inGorge(x,y)) return false;
  if (!insidePoly(MOUNTAIN, x, y, 14)) return false;
  return !highlandBlocked(x,y);
}

// lower mist clears as the trail lanterns are lit (0 lanterns -> thick, 3 -> clear)
const mistLevel = () => S.hLit ? 1 - S.hLit.filter(Boolean).length / 3 : 1;

function updateHighland(dt){
  const P = S.player, q = S.quests;
  // climb back down to the island
  const de = d2(P.x,P.y,HILL_EXIT.x,HILL_EXIT.y);
  if (de > 70) S.hExitArmed = true;
  if (S.hExitArmed && de < 34 && !S.dialog && !S.trans && !S.ending) goTo('island');
  // relight trail lanterns by walking up to them
  for (const L of S.hLanterns) {
    if (!L.lit && d2(P.x,P.y,L.x,L.y) < 52 && !S.dialog) {
      L.lit = true; S.hLit[L.i] = true; q.trail.lit++; chime([784,988,1175],0.09); renderQuests();
      for (const k in grids) delete grids[k];
      earlyFind('trail','juniper','pip.early.trail');
      pop(L.x, L.y-48, `${q.trail.lit} lantern${q.trail.lit===1?'':'s'} lit`);
      if (q.trail.lit===3 && q.trail.state!=='done') setTimeout(() => { if (!S.dialog) speak(q.trail.state==='new' ? 'pip.trail.all.early' : 'pip.trail.all'); }, 600);
    }
  }
  // pick up bridge planks
  for (const pk of S.hPlanks) {
    if (!pk.taken && d2(P.x,P.y,pk.x,pk.y) < 50 && !S.dialog) {
      pk.taken = true; q.bridge.have++; chime([660,880],0.09); renderQuests();
      earlyFind('bridge','pine','pip.early.plank');
      pop(pk.x, pk.y-40, `${q.bridge.have} plank${q.bridge.have===1?'':'s'}`);
      if (q.bridge.have===3 && q.bridge.state!=='done') setTimeout(() => { if (!S.dialog) speak(q.bridge.state==='new' ? 'pip.plank.all.early' : 'pip.plank.all'); }, 600);
    }
  }
  // thistle seeds drift on the wind; catch one by being near it
  for (const sd of S.seeds) {
    if (sd.caught) continue;
    sd.a += dt * sd.sp;
    sd.px = sd.x + Math.cos(sd.a) * sd.rx + Math.sin(sd.a*0.7) * 14;
    sd.py = sd.y + Math.sin(sd.a*1.3) * sd.ry - (S.t*18 % 40 - 20) * 0.15;
    if (d2(P.x, P.y - 26, sd.px, sd.py) < 46 && !S.dialog) {
      sd.caught = true; q.seeds.have++; chime([988,1319,1568],0.08); renderQuests();
      earlyFind('seeds','lark','pip.early.seed');
      pop(sd.px, sd.py-24, `${q.seeds.have} seed${q.seeds.have===1?'':'s'}`);
      if (q.seeds.have===4 && q.seeds.state!=='done') setTimeout(() => { if (!S.dialog) speak(q.seeds.state==='new' ? 'pip.seeds.all.early' : 'pip.seeds.all'); }, 600);
    }
  }
  // friends that have somewhere to be amble there (the ending walk is driven by update.js's ending loop instead,
  // so don't double-step them here)
  if (!S.ending) S.npcs.forEach(n => { if (n.scene==='highland' && n.route) stepNpc(n, dt, 70); });
  S.sparks.forEach(p => { p.t += dt; p.x += p.vx*dt; p.y += p.vy*dt; p.vy += 50*dt; });
  S.sparks = S.sparks.filter(p => p.t < p.life);
  if (S.bridgeDrop > 0) S.bridgeDrop = Math.max(0, S.bridgeDrop - dt);
}
function dropBridge(){
  if (S.bridge) return;
  S.bridge = true; S.bridgeDrop = 1.2;
  for (const k in grids) delete grids[k];
  chime([392,523,659,784],0.14);
  pop((BRIDGE.x0+BRIDGE.x1)/2, BRIDGE.y0-10, 'The bridge drops!');
}

// ---------- Highland art ----------
function drawHighlandSky(){
  // sky-ground backdrop: golden near the crown, cooler toward the misty base. The surround beyond the world
  // reads from the top-left corner (see blitGround), so keep that a soft sky blue.
  const g = ctx.createLinearGradient(0,0,0,HH);
  g.addColorStop(0,'#bfe0ea'); g.addColorStop(0.16,'#d8ead0'); g.addColorStop(0.33,'#f1e6c4');
  g.addColorStop(0.5,'#e8ddc6'); g.addColorStop(0.72,'#cdd6d2'); g.addColorStop(0.9,'#c2d0cf'); g.addColorStop(1,'#bcccce');
  ctx.fillStyle = g; ctx.fillRect(0,0,HW,HH);
  // soft sun glow upper-left
  let rg = ctx.createRadialGradient(360,320,20,360,320,640); rg.addColorStop(0,'rgba(255,246,214,.7)'); rg.addColorStop(1,'rgba(255,246,214,0)');
  ctx.fillStyle = rg; ctx.fillRect(0,0,HW,1100);
  // far isles poking through the horizon of cloud, far below (the cove & Puffin Isle)
  const isle = (x,y,s,grassy) => { ctx.fillStyle='#9fb6b8'; polyPath(smoothPts([[x-150*s,y+12],[x-80*s,y-28*s],[x+10*s,y-42*s],[x+90*s,y-26*s],[x+150*s,y+12]])); ctx.fill();
    if (grassy) { ctx.fillStyle='#8fae86'; polyPath(smoothPts([[x-110*s,y-6],[x-30*s,y-30*s],[x+60*s,y-26*s],[x+110*s,y-2]])); ctx.fill(); } };
  isle(430,2360,0.8,1); isle(1250,2330,0.9,1); isle(760,2420,0.6,1);
  // a high cloud layer the summit rises into: distant peaks on the horizon, then soft cloud tops above the crown
  ctx.fillStyle='rgba(150,170,172,.45)';
  [[120,150,60],[1560,160,70],[1640,120,44]].forEach(([x,y,s]) => { ctx.beginPath(); ctx.moveTo(x-s,y+10); ctx.lineTo(x-s*0.3,y-s*0.5); ctx.lineTo(x+s*0.3,y-s*0.6); ctx.lineTo(x+s,y+10); ctx.closePath(); ctx.fill(); });
  const Rc = rng(203);
  for (let i=0;i<16;i++){ const x=Rc()*HW, y=96+(Rc()-0.5)*90, w=130+Rc()*170, h=w*0.3;
    ctx.fillStyle=`rgba(252,253,252,${0.5+Rc()*0.4})`; ctx.beginPath(); ctx.ellipse(x,y,w,h,0,0,Math.PI*2); ctx.fill(); }
  // the static part of the sea of clouds at the base
  const R = rng(88);
  for (let i=0;i<40;i++){ const x=R()*HW, y=2180+R()*420, w=100+R()*200, h=w*(0.32+R()*0.16);
    ctx.fillStyle = `rgba(${248},${250},${248},${0.6+R()*0.4})`; ctx.beginPath(); ctx.ellipse(x,y,w,h,0,0,Math.PI*2); ctx.fill(); }
}
function drawHighlandStatic(){
  drawHighlandSky();
  const L = LOOK.light;
  // the mountain: a rock massif with a soft sandy foot where it meets the clouds
  ctx.fillStyle = '#b7a98e'; polyPath(offsetPoly(MOUNTAIN, 16), 0, 10); ctx.fill();
  ctx.fillStyle = '#9a9184'; polyPath(MOUNTAIN); ctx.fill();
  ctx.save(); polyPath(MOUNTAIN); ctx.clip();
  // rolling light on the rock
  const Rr = rng(31);
  for (let i=0;i<40;i++){ const x=Rr()*HW, y=200+Rr()*2300, r=160+Rr()*240;
    const a = ctx.createRadialGradient(x+L.x*r*0.35, y+L.y*r*0.35, 0, x, y, r);
    a.addColorStop(0,'rgba(255,244,200,.12)'); a.addColorStop(1,'rgba(255,244,200,0)'); ctx.fillStyle=a; ctx.fillRect(x-r,y-r,2*r,2*r); }
  // cut-paper facets
  const tones = ['#a29989','#968d80','#8b8276','#9a9184','#7e766a'];
  for (let i=0;i<120;i++){ const cx=Rr()*HW, cy=300+Rr()*2000, w=80+Rr()*120, h=52+Rr()*70;
    ctx.fillStyle = tones[i%tones.length]; ctx.beginPath();
    ctx.moveTo(cx-w*0.5,cy+h*0.2); ctx.lineTo(cx-w*0.1,cy-h*0.5); ctx.lineTo(cx+w*0.5,cy-h*0.1); ctx.lineTo(cx+w*0.2,cy+h*0.5); ctx.closePath(); ctx.fill(); }
  // ledge shelves: soft horizontal shadow bands so it reads as climbable tiers
  ctx.strokeStyle='rgba(60,52,44,.22)'; ctx.lineWidth=22; ctx.lineCap='round';
  [1360,1700,2040].forEach(y => { ctx.beginPath(); for (let x=240;x<1480;x+=48) ctx.lineTo(x, y+Math.sin(x*0.01+y)*20); ctx.stroke(); });
  // moss (sparse, soft — just enough to warm the rock)
  for (let i=0;i<26;i++){ const x=240+Rr()*1220, y=1000+Rr()*1400; ctx.fillStyle = Rr()>0.5?'rgba(120,160,86,.3)':'rgba(150,175,100,.26)'; ctx.beginPath(); ctx.ellipse(x,y,44+Rr()*50,20+Rr()*18,0,0,Math.PI*2); ctx.fill(); }
  ctx.restore();

  // the grassy crown
  ctx.fillStyle = '#7aa35a'; polyPath(CROWN, 0, 14); ctx.fill();
  ctx.fillStyle = C.grass; polyPath(CROWN); ctx.fill();
  ctx.save(); polyPath(CROWN); ctx.clip();
  let rg = ctx.createRadialGradient(640,480,30,660,560,560); rg.addColorStop(0,'rgba(255,246,196,.4)'); rg.addColorStop(1,'rgba(255,246,196,0)'); ctx.fillStyle=rg; ctx.fillRect(280,220,1080,820);
  const Rg = rng(7); ctx.lineCap='round';
  for (let i=0;i<9000;i++){ const x=Rg()*HW, y=220+Rg()*800, l=5+Rg()*6, tt=Rg()*2-1; if (!inPoly(CROWN,x,y)) continue;
    ctx.strokeStyle = lit(C.grass, tt*0.45); ctx.lineWidth=1.2; ctx.beginPath(); ctx.moveTo(x,y); ctx.lineTo(x+(Rg()-0.5)*4, y-l); ctx.stroke(); }
  ctx.restore();
  // crown rim: lit grass edge + tuft fringe
  ctx.strokeStyle = lit(C.grass, 0.9); ctx.lineWidth=2.5; polyPath(CROWN); ctx.stroke();
  ctx.strokeStyle='#86b064'; ctx.lineWidth=3;
  CROWN.forEach(([x,y],i) => { if (i%3===0){ ctx.beginPath(); ctx.moveTo(x,y+6); ctx.lineTo(x-4,y-8); ctx.moveTo(x+5,y+6); ctx.lineTo(x+8,y-5); ctx.stroke(); } });
  // baked thrift clusters on the crown (small; the pickable things stand out as entities elsewhere)
  for (const [x,y,s] of H_THRIFT) drawThrift(x,y,s);

  // the worn switchback trail
  ctx.lineJoin='round'; ctx.lineCap='round';
  const trail = (w,col) => { ctx.strokeStyle=col; ctx.lineWidth=w; ctx.beginPath(); TRAIL.forEach(([x,y],i)=>{const p=TRAIL[i-1]; i?ctx.quadraticCurveTo((p[0]+x)/2,(p[1]+y)/2,x,y):ctx.moveTo(x,y);}); ctx.stroke(); };
  trail(42, lit(C.grass,-0.7)); trail(34,'#d8c08a'); trail(14,'rgba(255,246,214,.5)');
  for (let i=0;i<TRAIL.length-1;i++){ const [x,y]=TRAIL[i]; circ(x+((i*7)%12)-6, y+((i*11)%10)-5, 2.4, '#c7b386'); }

  // the gorge: a dark chasm with a rocky rim
  ctx.save(); ctx.beginPath(); ctx.rect(0,GORGE.y0-4,HW,GORGE.y1-GORGE.y0+8); ctx.clip();
  polyPath(MOUNTAIN); ctx.fillStyle='#3a322b'; ctx.fill();
  const gg = ctx.createLinearGradient(0,GORGE.y0,0,GORGE.y1); gg.addColorStop(0,'#5a4e44'); gg.addColorStop(0.5,'#241d18'); gg.addColorStop(1,'#4a4038');
  ctx.fillStyle=gg; polyPath(MOUNTAIN); ctx.fill();
  ctx.restore();
  // rims (lit top edge, shaded bottom edge)
  ctx.strokeStyle='rgba(60,52,44,.5)'; ctx.lineWidth=8;
  ctx.beginPath(); ctx.moveTo(190,GORGE.y1); ctx.lineTo(1520,GORGE.y1); ctx.stroke();
  ctx.strokeStyle = lit('#9a9184',0.5); ctx.lineWidth=6;
  ctx.beginPath(); ctx.moveTo(190,GORGE.y0); ctx.lineTo(1520,GORGE.y0); ctx.stroke();

  // the waterfall's rock channel (water drawn live)
  ctx.strokeStyle='#5f564b'; ctx.lineWidth=70; ctx.lineCap='round';
  ctx.beginPath(); ctx.moveTo(FALL.x,FALL.y0); ctx.quadraticCurveTo(FALL.x+20,(FALL.y0+FALL.y1)/2,FALL.x+36,FALL.y1); ctx.stroke();
}
function drawHThrift(){}   // (thrift baked into ground; kept for clarity)
function drawWaterfallLive(t){
  const x0=FALL.x, y0=FALL.y0, y1=FALL.y1;
  ctx.save(); ctx.lineCap='round';
  ctx.strokeStyle='rgba(150,195,205,.6)'; ctx.lineWidth=58;
  ctx.beginPath(); ctx.moveTo(x0,y0); ctx.quadraticCurveTo(x0+20,(y0+y1)/2,x0+36,y1); ctx.stroke();
  ctx.strokeStyle='rgba(255,255,255,.8)'; ctx.lineWidth=3;
  for (let s=-2;s<=2;s++){ ctx.beginPath(); for (let y=y0;y<y1;y+=18){ const u=(y-y0)/(y1-y0), x=x0+20*u*u+s*11+Math.sin(y*0.05+s+t*3)*3; y===y0?ctx.moveTo(x,y):ctx.lineTo(x,y); } ctx.stroke(); }
  // spray where it meets the gorge and where it vanishes into the clouds
  for (const sy of [GORGE.y0, y1]) { const g = ctx.createRadialGradient(x0+(sy>1500?30:4),sy,4,x0+(sy>1500?30:4),sy,80); g.addColorStop(0,'rgba(255,255,255,.85)'); g.addColorStop(1,'rgba(255,255,255,0)'); ctx.fillStyle=g; ctx.beginPath(); ctx.ellipse(x0+(sy>1500?30:4),sy,80,34,0,0,Math.PI*2); ctx.fill(); }
  ctx.restore();
}
function drawBridgeHighland(t){
  const ax=BRIDGE.x0, bx=BRIDGE.x1, mid=(GORGE.y0+GORGE.y1)/2, sag=30;
  const drop = S.bridgeDrop > 0 ? Math.sin(S.bridgeDrop*14)*3*(S.bridgeDrop) : 0;
  if (!S.bridge) {
    // undropped: coiled rope on the near rim, posts standing
    ctx.strokeStyle='#5e4636'; ctx.lineWidth=8; ctx.lineCap='round';
    ctx.beginPath(); ctx.moveTo(ax,GORGE.y1-6); ctx.lineTo(ax,GORGE.y1-54); ctx.moveTo(bx,GORGE.y0+6); ctx.lineTo(bx,GORGE.y0-48); ctx.stroke();
    ctx.strokeStyle='#8a6a4d'; ctx.lineWidth=5; ctx.beginPath(); ctx.arc(ax+8,GORGE.y1-18,10,0,Math.PI*2); ctx.arc(ax+8,GORGE.y1-18,16,0,Math.PI*2); ctx.stroke();
    return;
  }
  ctx.save(); ctx.translate(0, drop);
  // ropes
  ctx.strokeStyle='#6e4630'; ctx.lineWidth=4;
  for (const off of [-18,18]){ ctx.beginPath(); for (let i=0;i<=22;i++){ const u=i/22, x=ax+(bx-ax)*u, y=GORGE.y0-4 + (mid-(GORGE.y0-4))*0 + Math.sin(u*Math.PI)*sag + (GORGE.y1-GORGE.y0)*0.1; const yy = GORGE.y0 + 4 + Math.sin(u*Math.PI)*sag; i?ctx.lineTo(x,yy+off):ctx.moveTo(x,yy+off); } ctx.stroke(); }
  // planks
  ctx.strokeStyle='#b89a72'; ctx.lineWidth=16; ctx.lineCap='round';
  for (let i=1;i<22;i++){ const u=i/22, x=ax+(bx-ax)*u, yy=GORGE.y0+4+Math.sin(u*Math.PI)*sag; ctx.beginPath(); ctx.moveTo(x,yy-16); ctx.lineTo(x,yy+16); ctx.stroke(); }
  ctx.strokeStyle='#9a7c56'; ctx.lineWidth=2;
  for (let i=1;i<22;i++){ const u=i/22, x=ax+(bx-ax)*u, yy=GORGE.y0+4+Math.sin(u*Math.PI)*sag; ctx.beginPath(); ctx.moveTo(x,yy-10); ctx.lineTo(x,yy+10); ctx.stroke(); }
  ctx.restore();
  // posts
  ctx.strokeStyle='#5e4636'; ctx.lineWidth=8; ctx.lineCap='round';
  ctx.beginPath(); ctx.moveTo(ax,GORGE.y1-6); ctx.lineTo(ax,GORGE.y1-54); ctx.moveTo(bx,GORGE.y0+6); ctx.lineTo(bx,GORGE.y0-48); ctx.stroke();
}
function drawHLantern(L,t){
  const on = L.lit;
  ctx.strokeStyle='#5e4636'; ctx.lineWidth=5; ctx.lineCap='round';
  ctx.beginPath(); ctx.moveTo(L.x,L.y); ctx.lineTo(L.x,L.y-46); ctx.lineTo(L.x+11,L.y-46); ctx.stroke();
  ctx.fillStyle = on ? '#ffe08a' : '#4a4038'; ctx.beginPath(); ctx.roundRect(L.x+4,L.y-42,15,18,3); ctx.fill();
  ctx.strokeStyle='#3a2a22'; ctx.lineWidth=2; ctx.strokeRect(L.x+4,L.y-42,15,18);
  if (on) { circ(L.x+11,L.y-33,3.4,'#7ff0dc'); sparkle(L.x+24, L.y-48, t*0.7+L.x); }
  else { // a pulsing ring says "relight me"
    const k = (t*0.8 + L.x*0.01) % 1; ctx.strokeStyle=`rgba(255,224,138,${0.6*(1-k)})`; ctx.lineWidth=2.4;
    ctx.beginPath(); ctx.ellipse(L.x+11,L.y+2,12+k*22,(12+k*22)*0.4,0,0,Math.PI*2); ctx.stroke();
  }
}
function drawPlank(pk,t){
  if (pk.taken) return;
  ctx.save(); ctx.translate(pk.x, pk.y); ctx.rotate(pk.a);
  ell(2,5,26,5,'rgba(52,67,58,.2)');
  ctx.fillStyle='#b89a72'; ctx.beginPath(); ctx.roundRect(-26,-6,52,12,5); ctx.fill();
  ctx.strokeStyle='#9a7c56'; ctx.lineWidth=1.4; ctx.beginPath(); ctx.moveTo(-18,-2); ctx.lineTo(14,-2); ctx.moveTo(-10,3); ctx.lineTo(20,3); ctx.stroke();
  circ(8,-2,1.8,'#8a6c48');
  ctx.restore();
  sparkle(pk.x+22, pk.y-16, t*0.8 + pk.x);
}
function drawThrift(x,y,s){
  // sea-thrift: a cushion of grass with little pink pompom flowers (decor on the crown)
  const R = rng(Math.round(x*7+y));
  ctx.fillStyle = '#6f9e55'; ctx.beginPath(); ctx.ellipse(x, y, 30*s, 12*s, 0, Math.PI, 0); ctx.fill();
  ctx.strokeStyle = '#5f8a4c'; ctx.lineWidth = 1.6;
  for (let i=0;i<9;i++){ const px = x + (R()-0.5)*50*s, py = y - 10*s - R()*22*s;
    ctx.beginPath(); ctx.moveTo(px, py+4); ctx.lineTo(x + (px-x)*0.4, y); ctx.stroke();
    circ(px, py, 5*s, i%3 ? '#f2a3c4' : '#e886b0'); }
}
function drawSeed(sd,t){
  if (sd.caught) return;
  const x = sd.px, y = sd.py;
  ctx.strokeStyle='rgba(255,255,255,.85)'; ctx.lineWidth=1.4; ctx.lineCap='round';
  for (let i=0;i<9;i++){ const a=i/9*Math.PI*2 + t*0.5; ctx.beginPath(); ctx.moveTo(x,y); ctx.lineTo(x+Math.cos(a)*8, y+Math.sin(a)*8); ctx.stroke(); }
  circ(x,y,2.4,'#efe3cf');
}
function drawCairn(){
  cached('h-cairn', CAIRN.x, CAIRN.y, [-30,-64,30,20], () => {
    ell(CAIRN.x,CAIRN.y-6,26,16,'#a39a8a'); ell(CAIRN.x-2,CAIRN.y-22,20,13,'#b1a898'); ell(CAIRN.x,CAIRN.y-36,14,10,'#968d7f'); ell(CAIRN.x+1,CAIRN.y-48,9,7,'#a39a8a');
    circ(CAIRN.x-6,CAIRN.y-50,2,'#e2e0d6');
  }, { shadow:30, h:48, shy:12 });
}
function drawHPine(x,y,s,i){
  cached('h-pine'+i, x, y, [-50*s,-104*s,50*s,6], () => drawPine(x,y,s), { shadow:26*s, shy:4, h:100*s });
}
function drawHRock(x,y,r,i){
  cached('h-rock'+i, x, y, [-r-2,-r*1.1,r+2,r*0.5+2], () => {
    const pts = slabPts(rng(400+i), x, y-r*0.3, r, r*0.7, 6);
    ctx.fillStyle='#857c70'; polyPath(pts,0,8); ctx.fill();
    ctx.fillStyle='#a39a8a'; polyPath(pts); ctx.fill();
    ctx.fillStyle='rgba(255,248,230,.18)'; ctx.beginPath(); ctx.moveTo(x-r*0.6,y-r*0.3); ctx.lineTo(x-r*0.1,y-r*0.9); ctx.lineTo(x+r*0.2,y-r*0.4); ctx.closePath(); ctx.fill();
  }, { shadow:r, shy:4, h:r*0.8 });
}

// ---------- the new friends ----------
function drawStag(n,t){
  const {x,y} = n; const bob = Math.sin(t*1.6)*1;
  ctx.save(); ctx.translate(x, y + bob); ctx.scale(n.face||1, 1);
  // legs
  ctx.strokeStyle='#a67f4f'; ctx.lineWidth=7; ctx.lineCap='round';
  [[-16],[-6],[8],[18]].forEach(([dx]) => { ctx.beginPath(); ctx.moveTo(dx,-34); ctx.lineTo(dx,0); ctx.stroke(); });
  ell(0,-46,32,20,'#b58a5a');            // body
  ell(-8,-44,17,12,'#e0c79e');           // belly
  // neck + head
  ctx.save(); ctx.translate(22,-52); ctx.rotate(-0.35);
  ctx.fillStyle='#b58a5a'; ctx.beginPath(); ctx.roundRect(-6,-26,16,34,8); ctx.fill(); ctx.restore();
  circ(30,-74,15,'#b58a5a'); ell(36,-71,8,6,'#efdcc0');
  // antlers
  ctx.strokeStyle='#d8c9a8'; ctx.lineWidth=4; ctx.lineCap='round';
  ctx.beginPath(); ctx.moveTo(24,-86); ctx.lineTo(16,-110); ctx.moveTo(20,-98); ctx.lineTo(8,-106);
  ctx.moveTo(36,-86); ctx.lineTo(44,-112); ctx.moveTo(40,-98); ctx.lineTo(52,-106); ctx.stroke();
  ell(22,-88,4,8,'#b58a5a'); ell(38,-88,4,8,'#b58a5a');   // ears
  if (blink(t,2.2)) { ctx.strokeStyle=C.ink; ctx.lineWidth=1.6; ctx.beginPath(); ctx.moveTo(31,-76); ctx.lineTo(37,-76); ctx.stroke(); }
  else { circ(33,-76,2.6,C.ink); circ(33.8,-76.8,0.8,'#fff'); }
  circ(41,-70,2.2,'#3b2a22');
  ctx.strokeStyle='rgba(52,67,58,.5)'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(40,-68); ctx.lineTo(47,-69); ctx.stroke();
  ctx.restore();
}
function drawFawn(n,t){
  const {x,y} = n; const bob = Math.sin(t*2)*1;
  ctx.save(); ctx.translate(x, y + bob); ctx.scale(n.face||1, 1);
  ctx.strokeStyle='#cb9f67'; ctx.lineWidth=5; ctx.lineCap='round';
  [[-11],[-4],[6],[13]].forEach(([dx]) => { ctx.beginPath(); ctx.moveTo(dx,-20); ctx.lineTo(dx,0); ctx.stroke(); });
  ell(0,-26,22,14,'#cb9f67'); ell(-5,-24,12,8,'#ead0a6');
  ctx.save(); ctx.translate(14,-32); ctx.rotate(-0.3); ctx.fillStyle='#cb9f67'; ctx.beginPath(); ctx.roundRect(-5,-16,12,22,6); ctx.fill(); ctx.restore();
  circ(22,-46,11,'#cb9f67'); ell(27,-44,6,5,'#f0ddba');
  // spots
  circ(-6,-30,2,'#eee0c6'); circ(4,-24,2,'#eee0c6'); circ(-12,-26,1.6,'#eee0c6'); circ(10,-30,1.6,'#eee0c6');
  // big ears
  ctx.save(); ctx.translate(17,-56); ctx.rotate(-0.3); ell(0,0,4.5,8,'#cb9f67'); ell(0,1,2,5,'#f2cfd6'); ctx.restore();
  ctx.save(); ctx.translate(28,-55); ctx.rotate(0.3); ell(0,0,4.5,8,'#cb9f67'); ell(0,1,2,5,'#f2cfd6'); ctx.restore();
  if (blink(t,2.6)) { ctx.strokeStyle=C.ink; ctx.lineWidth=1.4; ctx.beginPath(); ctx.moveTo(20,-48); ctx.lineTo(25,-48); ctx.stroke(); }
  else { circ(23,-48,2.8,C.ink); circ(23.8,-48.8,0.9,'#fff'); }
  circ(31,-42,2,'#3b2a22');
  ctx.restore();
}
function drawSquirrel(n,t){
  const {x,y} = n; const bob = Math.sin(t*3)*1.2;
  ctx.save(); ctx.translate(x, y + bob); ctx.scale(n.face||1, 1);
  // big curled tail
  const sw = Math.sin(t*2)*0.1;
  ctx.save(); ctx.rotate(sw);
  ctx.fillStyle='#c25f36'; ctx.beginPath(); ctx.moveTo(-6,-8); ctx.quadraticCurveTo(-44,-26,-30,-62); ctx.quadraticCurveTo(-22,-74,-10,-66); ctx.quadraticCurveTo(-20,-54,-8,-20); ctx.closePath(); ctx.fill();
  ctx.fillStyle='#d47a4e'; ctx.beginPath(); ctx.moveTo(-10,-16); ctx.quadraticCurveTo(-34,-30,-26,-58); ctx.quadraticCurveTo(-20,-66,-14,-60); ctx.quadraticCurveTo(-22,-48,-12,-24); ctx.closePath(); ctx.fill();
  ctx.restore();
  ell(2,0,6,4,'#8a4f2e'); ell(-6,0,6,4,'#8a4f2e');
  ell(0,-16,12,14,'#cf6b40'); ell(2,-13,7,9,'#f0e0cf');
  circ(6,-34,10,'#cf6b40');
  // ear tufts
  ctx.fillStyle='#c25f36'; ctx.beginPath(); ctx.moveTo(0,-44); ctx.lineTo(-2,-54); ctx.lineTo(4,-46); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(11,-44); ctx.lineTo(13,-54); ctx.lineTo(7,-46); ctx.closePath(); ctx.fill();
  ell(2,-40,3,5,'#cf6b40'); ell(10,-40,3,5,'#cf6b40');
  if (blink(t,3.1)) { ctx.strokeStyle=C.ink; ctx.lineWidth=1.4; ctx.beginPath(); ctx.moveTo(7,-36); ctx.lineTo(11,-36); ctx.stroke(); }
  else { circ(9,-36,2.4,C.ink); circ(9.8,-36.8,0.8,'#fff'); }
  circ(14,-31,1.8,'#3b2a22');
  ctx.restore();
}
function drawSkylark(n,t){
  const {x,y} = n; const hop = n.gliding ? Math.sin(t*3)*6 : Math.sin(t*2.4)*1;
  ctx.save(); ctx.translate(x, y - (n.gliding?16:0) + hop); ctx.scale(n.face||1, 1);
  if (!n.gliding) { ell(-4,2,5,2.5,'#8a6c48'); ell(6,2,5,2.5,'#8a6c48'); }   // little legs when perched
  ell(0,-8,12,10,'#b79a6e'); ell(2,-6,7,6,'#efe3cf');
  // crest + head
  circ(8,-20,8,'#b79a6e');
  ctx.strokeStyle='#8a6c48'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(8,-28); ctx.lineTo(7,-34); ctx.moveTo(11,-27); ctx.lineTo(12,-33); ctx.stroke();
  ctx.fillStyle='#8a6c48'; ctx.beginPath(); ctx.moveTo(15,-20); ctx.lineTo(23,-18); ctx.lineTo(15,-16); ctx.fill();
  // wings
  const flap = n.gliding ? Math.sin(t*9)*8 : Math.sin(t*2)*2;
  ctx.fillStyle='#a88a5e'; ctx.beginPath(); ctx.moveTo(-2,-8); ctx.quadraticCurveTo(-18,-18-flap,-26,-10); ctx.quadraticCurveTo(-14,-4,-4,-4); ctx.fill();
  if (blink(t,2.4)) { ctx.strokeStyle=C.ink; ctx.lineWidth=1.2; ctx.beginPath(); ctx.moveTo(8,-21); ctx.lineTo(11,-21); ctx.stroke(); }
  else { circ(10,-21,1.6,C.ink); circ(10.5,-21.6,0.6,'#fff'); }
  ctx.restore();
}
function drawHNpc(n,t){
  // a friend on the move bobs a little with each step (matches drawNpcStyled)
  const walk = fn => n.moving ? () => { ctx.save(); ctx.translate(0, -Math.abs(Math.sin(n.walkT||0))*3); fn(); ctx.restore(); } : fn;
  if (n.id==='stag' || n.id==='willow') return styled(n.x, n.y, [-40,-120,46,8], walk(() => drawStag(n,t)), { shadow:30, h:70, key:'npc:willow', fps:12 });
  if (n.id==='juniper') return styled(n.x, n.y, [-28,-66,30,6], walk(() => drawFawn(n,t)), { shadow:20, h:48, key:'npc:juniper', fps:12 });
  if (n.id==='pine') return styled(n.x, n.y, [-34,-60,30,6], walk(() => drawSquirrel(n,t)), { shadow:14, h:40, key:'npc:pine', fps:12 });
  if (n.id==='lark') return styled(n.x, n.y, [-30,-40,26,8], () => drawSkylark(n,t), n.gliding ? { key:'npc:lark', fps:14 } : { shadow:10, h:24, key:'npc:lark', fps:12 });
}

function drawHighland(t){
  blitGround(bakedGround('highland', HW, HH, drawHighlandStatic), HW, HH);
  // drifting sea of clouds at the base, over the baked static clouds
  ctx.save();
  for (let i=0;i<22;i++){ const bx=(i*331 + t*12)%(HW+400)-200, by=2240+(i*137)%360, w=120+(i%4)*60;
    ctx.fillStyle=`rgba(250,251,250,${0.5+(i%3)*0.15})`; ctx.beginPath(); ctx.ellipse(bx,by,w,w*0.34,0,0,Math.PI*2); ctx.fill(); }
  ctx.restore();
  drawWaterfallLive(t);

  const ents = [];
  H_PINES.forEach(([x,y,s],i) => ents.push({y, f:() => faded(x,y,[-50*s,-104*s,50*s,6], () => drawHPine(x,y,s,i))}));
  H_ROCKS.forEach(([x,y,r],i) => ents.push({y, f:() => drawHRock(x,y,r,i)}));
  ents.push({y: CAIRN.y, f: drawCairn});
  S.hLanterns.forEach(L => ents.push({y:L.y, f:() => drawHLantern(L,t)}));
  S.hPlanks.forEach(pk => { if (!pk.taken) ents.push({y:pk.y, f:() => styled(pk.x, pk.y, [-30,-24,34,12], () => drawPlank(pk,t), { key:'plank:'+pk.i, fps:10 })}); });
  S.npcs.forEach(n => { if (n.scene==='highland') ents.push({y:n.y, f:() => drawHNpc(n,t)}); });
  ents.push({y:S.player.y, f:() => drawPipStyled(t)});
  ents.sort((a,b) => a.y-b.y).forEach(e => e.f());

  // the rope bridge spans the gorge (drawn after entities so it reads on top of the chasm)
  drawBridgeHighland(t);
  // thistle seeds drifting on the wind
  S.seeds.forEach(sd => drawSeed(sd,t));
  // sparkles for caught things
  ctx.save(); ctx.globalCompositeOperation='lighter';
  for (const p of S.sparks) { if (p.scene!=='highland') continue; const a=1-p.t/p.life; circ(p.x,p.y,p.r*(0.6+a),`rgba(${p.c},${a*0.8})`); }
  ctx.restore();

  // the low mist that clears as the lanterns are lit (localized to the lower switchbacks, not full-screen)
  const m = mistLevel();
  if (m > 0.02) {
    ctx.save();
    const R = rng(55);
    for (let i=0;i<26;i++){ const x=R()*HW, y=1300+R()*1100, w=140+R()*220, h=w*0.26;
      const g = ctx.createRadialGradient(x+Math.sin(t*0.3+i)*20,y,4,x,y,w); g.addColorStop(0,`rgba(234,241,239,${(0.3+R()*0.3)*m})`); g.addColorStop(1,'rgba(234,241,239,0)');
      ctx.fillStyle=g; ctx.beginPath(); ctx.ellipse(x,y,w,h,0,0,Math.PI*2); ctx.fill(); }
    // a soft veil over the very bottom
    const vg = ctx.createLinearGradient(0,1900,0,HH); vg.addColorStop(0,'rgba(226,236,234,0)'); vg.addColorStop(1,`rgba(226,236,234,${0.5*m})`);
    ctx.fillStyle=vg; ctx.fillRect(0,1900,HW,HH-1900);
    ctx.restore();
  }
  for (const gl of S.gulls) drawGull(gl,t);
  drawMarkers(t);
  drawPops();
  drawTargetRing();
}

function drawHighlandMap(t, w){
  const k = w / HW, u = 1/k, R = (w > 200 ? 5 : 4)*u;
  mctx.setTransform(DPR*k,0,0,DPR*k,0,0);
  mctx.fillStyle = '#cfe0e2'; mctx.fillRect(0,0,HW,HH);
  const poly = (pts, f) => { mctx.beginPath(); pts.forEach(([x,y],i) => i ? mctx.lineTo(x,y) : mctx.moveTo(x,y)); mctx.closePath(); mctx.fillStyle=f; mctx.fill(); };
  const c = (x,y,r,f) => { mctx.beginPath(); mctx.arc(x,y,r,0,Math.PI*2); mctx.fillStyle=f; mctx.fill(); };
  poly(MOUNTAIN, '#a79e8d'); poly(CROWN, C.grass);
  mctx.fillStyle='#241d18'; mctx.fillRect(190, GORGE.y0, 1330, GORGE.y1-GORGE.y0);
  if (S.bridge) { mctx.fillStyle='#b89a72'; mctx.fillRect(BRIDGE.x0, GORGE.y0, BRIDGE.x1-BRIDGE.x0, GORGE.y1-GORGE.y0); }
  mctx.strokeStyle='#e3d3a6'; mctx.lineWidth=30; mctx.lineCap='round'; mctx.lineJoin='round';
  mctx.beginPath(); TRAIL.forEach(([x,y],i)=>{const p=TRAIL[i-1]; i?mctx.quadraticCurveTo((p[0]+x)/2,(p[1]+y)/2,x,y):mctx.moveTo(x,y);}); mctx.stroke();
  S.hLanterns.forEach(L => c(L.x, L.y, R*0.7, L.lit ? '#ffe08a' : '#6b6456'));
  const NC = { willow:'#b58a5a', juniper:'#cb9f67', pine:'#cf6b40', lark:'#b79a6e' };
  S.npcs.forEach(n => {
    if (n.scene!=='highland') return;
    const mk = npcMarker(n);
    if (mk) { mctx.lineWidth=2*u; mctx.strokeStyle = mk==='ready' ? '#6f9e55' : '#e0904a'; mctx.beginPath(); mctx.arc(n.x, n.y, R+(2.5+Math.sin(t*4)*0.8)*u, 0, Math.PI*2); mctx.stroke(); }
    c(n.x, n.y, R, NC[n.id] || '#fff'); mctx.lineWidth=1.2*u; mctx.strokeStyle=C.ink; mctx.beginPath(); mctx.arc(n.x, n.y, R, 0, Math.PI*2); mctx.stroke();
  });
  mctx.lineWidth=1.5*u; mctx.strokeStyle='rgba(255,250,240,.9)';
  mctx.strokeRect(cam.x, cam.y, Math.min(cam.vw,HW), Math.min(cam.vh,HH));
  const P = S.player;
  c(P.x, P.y, R*1.6 + Math.sin(t*5)*u, 'rgba(244,184,90,.5)');
  c(P.x, P.y, R*1.05, '#f4b85a');
  mctx.lineWidth=1.2*u; mctx.strokeStyle=C.ink; mctx.beginPath(); mctx.arc(P.x, P.y, R*1.05, 0, Math.PI*2); mctx.stroke();
}

// ---------- Day 4 quest logic (Willow hosts, like Bramble / Captain Puff) ----------
function willowHint(){
  const q = S.quests;
  for (const f of friendsToday()) {
    if (q[f.id].state !== 'new') continue;
    if (f.id === 'seeds' && !S.bridge) continue;   // the crown isn't reachable until the bridge is down
    S.hinted.add(f.owner);
    return 'willow.hint.' + f.id;
  }
  return null;
}
function talkDay4(npc){
  const q = S.quests;
  if (npc.id === 'willow') {
    if (allDone()) return speak('willow.end', startEnding), true;
    const first = !S.metOwl; S.metOwl = true;
    const hint = willowHint();
    const busy = friendsToday().find(f => q[f.id].state === 'active');
    const ids = [];
    if (first) ids.push('willow.first'); else ids.push(hint ? 'willow.again.next' : 'willow.again.busy');
    if (hint) ids.push(hint); else if (busy) ids.push('willow.remind.' + busy.id);
    if (first) ids.push('willow.close.first'); else if (hint) ids.push('willow.close.next');
    return speak(ids), true;
  }
  if (npc.id === 'juniper') {
    const tr = q.trail;
    if (tr.state === 'done') return speak('juniper.after'), true;
    if (tr.lit >= 3) return speak(['juniper.thanks', goTell('juniper')], () => { tr.state='done'; chime([523,659,784,1046],0.12); pop(npc.x,npc.y-50,'Yay!'); }), true;
    if (tr.state === 'new') return speak(['juniper.ask.open', tr.lit ? `juniper.ask.already.${tr.lit}` : 'juniper.ask.need', 'juniper.ask.close'], () => { tr.state='active'; }), true;
    return speak(`juniper.progress.${tr.lit}`), true;
  }
  if (npc.id === 'pine') {
    const b = q.bridge;
    if (b.state === 'done') return speak('pine.after'), true;
    if (b.have >= 3) return speak(['pine.thanks', goTell('pine')], () => { b.state='done'; dropBridge(); }), true;
    if (b.state === 'new') return speak(['pine.ask.open', b.have ? `pine.ask.already.${b.have}` : 'pine.ask.need', 'pine.ask.close'], () => { b.state='active'; }), true;
    return speak(`pine.progress.${b.have}`), true;
  }
  if (npc.id === 'lark') {
    const s = q.seeds;
    if (s.state === 'done') return speak('lark.after'), true;
    if (s.have >= 4) return speak(['lark.thanks', goTell('lark')], () => { s.state='done'; chime([523,659,784,1046],0.12); pop(npc.x,npc.y-50,'Wheee!'); }), true;
    if (s.state === 'new') return speak(['lark.ask.open', s.have ? `lark.ask.already.${s.have}` : 'lark.ask.need', 'lark.ask.close'], () => { s.state='active'; S.hinted.add('lark'); }), true;
    return speak(`lark.progress.${s.have}`), true;
  }
  if (['duck','hog','crab','mouse','mole','seal','puffin','nana','pebble'].includes(npc.id)) return speak(`${npc.id}.d4`), true;
  return false;
}

// ---------- The island's North Path (the way up) ----------
function updateNorthPath(){
  const P = S.player, d = d2(P.x,P.y,NORTH_PATH.x,NORTH_PATH.y);
  if (d > 64) S.northArmed = true;
  if (!S.northArmed || d >= 32 || S.dialog || S.ending || S.trans) return;
  if (S.day >= 4) { goTo('highland'); return; }
  S.northArmed = false; pop(NORTH_PATH.x, NORTH_PATH.y-46, 'Too misty to climb');
  if (!S.dialog && !S.northWondered) { S.northWondered = true; setTimeout(() => { if (!S.dialog) speak('pip.north.locked'); }, 350); }
}
function drawNorthPathIsland(t){
  const {x,y} = NORTH_PATH, open = S.day >= 4;
  // a short worn path leading off the top of the island into the mist
  ctx.lineJoin='round'; ctx.lineCap='round';
  ctx.strokeStyle = lit(C.grass,-0.7); ctx.lineWidth=34; ctx.beginPath(); ctx.moveTo(x, y+70); ctx.quadraticCurveTo(x+6, y+10, x, y-70); ctx.stroke();
  ctx.strokeStyle = '#d8c08a'; ctx.lineWidth=26; ctx.beginPath(); ctx.moveTo(x, y+70); ctx.quadraticCurveTo(x+6, y+10, x, y-70); ctx.stroke();
  // a little signpost pointing up the path
  const sx = x+34, sy = y+6;
  ctx.save();
  ell(sx, sy+4, 10, 4, 'rgba(52,67,58,.2)');
  ctx.strokeStyle='#8c6a4d'; ctx.lineWidth=5; ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx, sy-40); ctx.stroke();
  ctx.save(); ctx.translate(sx, sy-40);
  ctx.fillStyle='#c9a77d'; ctx.beginPath(); ctx.moveTo(-4,-10); ctx.lineTo(30,-10); ctx.lineTo(38,-2); ctx.lineTo(30,6); ctx.lineTo(-4,6); ctx.closePath(); ctx.fill();
  ctx.fillStyle='#5e4636'; ctx.font='800 11px Grandstander, system-ui, sans-serif'; ctx.textAlign='left'; ctx.textBaseline='middle'; ctx.fillText('HIGH PATH', -1, -2);
  ctx.restore(); ctx.restore();
  // the mist bank that walls the path off until Day 4 (soft cloud puffs along the north edge)
  if (!open) {
    const R = rng(123);
    ctx.save();
    for (let i=0;i<16;i++){ const cx = x - 150 + R()*300, cy = y - 110 + Math.sin(t*0.4+i)*6 + R()*40, w = 40 + R()*60;
      const g = ctx.createRadialGradient(cx,cy,4,cx,cy,w); g.addColorStop(0,`rgba(244,248,247,${0.72+R()*0.2})`); g.addColorStop(1,'rgba(244,248,247,0)');
      ctx.fillStyle=g; ctx.beginPath(); ctx.ellipse(cx,cy,w,w*0.7,0,0,Math.PI*2); ctx.fill(); }
    ctx.restore();
  } else {
    // open: a faint sparkle and a hint of the heights beyond
    sparkle(x+2, y-78, t*0.5);
  }
}

// ---------- Day 4 setup ----------
function startDay4(quiet){
  startDay3(true);
  Object.values(S.quests).forEach(q => { q.state = 'done'; });
  S.day = 4;
  S.quests.trail = { state:'new', lit:0 };
  S.quests.bridge = { state:'new', have:0 };
  S.quests.seeds = { state:'new', have:0 };
  S.hinted = new Set(); S.metOwl = false; S.early = {};
  S.scene = 'island'; S.trans = null; cam.snap = true;
  S.player.x = 1150; S.player.y = 1000; S.player.face = 1; clearGoal(); S.trail = [];
  S.northArmed = false; S.hExitArmed = false;
  S.bridge = false; S.bridgeDrop = 0;
  S.hLit = [false,false,false];
  S.hLanterns = H_LANTERNS.map(([x,y],i) => ({ x, y, i, lit:false }));
  S.hPlanks = H_PLANKS.map(([x,y],i) => ({ x, y, i, a:(i%2?0.2:-0.25), taken:false }));
  S.seeds = SEED_SPOTS.map(([x,y],i) => ({ x, y, i, a:i*1.7, sp:0.5+i*0.12, rx:70+i*14, ry:40+(i%2)*20, px:x, py:y, caught:false }));
  // the new friends live on the highland
  S.npcs.push({ id:'willow', name:'Willow', x:WILLOW_SPOT.x, y:WILLOW_SPOT.y, near:false, scene:'highland' });
  S.npcs.push({ id:'juniper', name:'Juniper', x:600, y:1900, near:false, scene:'highland' });
  S.npcs.push({ id:'pine', name:'Pine', x:900, y:1180, near:false, scene:'highland' });
  S.npcs.push({ id:'lark', name:'Lark', x:900, y:600, near:false, scene:'highland', gliding:true });
  for (const k in grids) delete grids[k];
  clearGround(); renderQuests(); running = true;
  if (!quiet) setTimeout(() => speak('pip.day4.start'), 400);
}
