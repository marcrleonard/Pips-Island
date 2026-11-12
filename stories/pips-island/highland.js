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
// A tall grassy mountain. Unlike the open island, you can only walk the path (carved through grass and rock)
// plus the clearings along it and the crown meadow on top — the slope's grass and rock wall you in, so the
// terrain shows where you can and can't go. A gorge near the top is crossed only by the rope bridge.
const MOUNTAIN = smoothPts([
  [250,260],[430,210],[640,190],[860,195],[1070,220],[1250,280],[1360,440],[1430,700],
  [1470,1000],[1500,1360],[1520,1760],[1480,2120],[1360,2360],[1120,2470],[850,2500],
  [580,2470],[360,2360],[240,2120],[200,1760],[190,1360],[210,1000],[220,640],[220,420]]);
// Grassy crown cap (the open meadow at the top). Its top edge reaches the summit, so above the grass is sky.
const CROWN = smoothPts([[330,300],[470,212],[700,196],[930,206],[1130,258],[1300,470],[1335,700],[1285,900],
  [1080,992],[820,1002],[560,986],[360,900],[295,680],[300,470]]);
const GORGE = { y0: 1010, y1: 1170 };
// the walkable bridge span reaches a little past the gorge at both ends, so it connects cleanly to the crown
// above and the landing below (the drawn bridge still sags across the gorge itself)
const BRIDGE = { x0: 770, x1: 940, y0: GORGE.y0 - 40, y1: GORGE.y1 + 40 };
// The waterfall pours off a rock lip on the crown's east side, down past the gorge and into the clouds.
const FALL = { x: 1240, w: 64, lip: 980, y1: 2060 };
const fallX = y => FALL.x + 10 * ((y - FALL.lip) / (FALL.y1 - FALL.lip));   // drifts gently right as it falls
// The trail winds gently up the slope with two hairpin landings, straight through the gorge (the bridge).
const TRAIL = [[855,2400],[812,2288],[735,2168],[720,2030],[792,1910],[888,1788],[905,1662],[832,1556],
  [712,1452],[690,1332],[772,1240],[850,1150],[855,1040],[855,930],[812,812],[732,694],[712,576],[762,468]];
const TRAIL_W = 58;                                      // how wide the walkable path is
const TRAIL_LANDINGS = [[905,1662],[690,1332]];          // the two hairpin turns (flat dirt landings)
// Walkable clearings: the trailhead you arrive at, the two hairpin landings, and the bridge's south landing.
const H_CLEARINGS = [[855,2330,128],[905,1662,76],[690,1332,76],[855,1216,98]];
const H_LANTERNS = [[905,1662],[690,1332],[735,2030]];   // the three trail lanterns (two on the hairpins)
const H_PLANKS = [[836,1552],[708,1452],[772,1240]];     // bridge planks, along the path as you climb
const SEED_SPOTS = [[560,560],[980,520],[760,760],[1140,680]];  // where thistle seeds drift on the crown
const CAIRN = { x: 1160, y: 452 };
// rocky outcrops that frame the path and wall the slope (off-path; decoration)
const H_ROCKS = [[585,2150,44],[1010,1960,48],[560,2330,30],[392,1560,38],[998,1452,42],[600,1150,34],
  [1050,1070,40],[468,760,34],[1138,740,30],[300,1240,34],[1120,1560,38]];
// pines dotted over the grassy slope, framing the trail — kept well clear of the waterfall channel
const H_PINES = [[300,2280,1.1],[460,2120,0.95],[250,1900,1],[560,1720,0.9],[300,1500,0.95],[380,1120,0.9],
  [300,900,0.8],[1080,2200,1],[1360,2000,0.9],[1110,1760,0.95],[1380,1500,0.85],[1050,1300,0.9],
  [1400,900,0.8],[1000,820,0.8],[640,2060,0.85]];
const H_THRIFT = [[420,620,1],[560,700,0.8],[700,560,0.9],[960,640,0.9],[1100,560,0.8],[840,860,1],
  [1180,820,0.8],[500,860,0.9],[1000,880,0.8],[680,400,0.8],[920,400,0.8]];
const HILL_ENTRY = { x: 855, y: 2360 };   // where Pip arrives when he climbs up
const HILL_EXIT = { x: 855, y: 2460 };    // walk to the base of the trail to climb back down to the island
const WILLOW_SPOT = { x: 792, y: 2318 };
const PICNIC = { x: 760, y: 560 };        // the crown picnic at the end of the day

const inGorge = (x,y) => y > GORGE.y0 && y < GORGE.y1;
const onBridge = (x,y) => x > BRIDGE.x0+8 && x < BRIDGE.x1-8 && y > BRIDGE.y0 && y < BRIDGE.y1;
const onTrailPath = (x,y) => { for (let i=0;i<TRAIL.length-1;i++) if (segD(x,y,TRAIL[i][0],TRAIL[i][1],TRAIL[i+1][0],TRAIL[i+1][1]) < TRAIL_W) return true; return false; };
const inClearing = (x,y) => H_CLEARINGS.some(([cx,cy,r]) => d2(x,y,cx,cy) < r);
function highlandBlocked(x,y){
  if (d2(x,y,CAIRN.x,CAIRN.y) < 30) return true;
  for (const [rx,ry,r] of H_ROCKS) if (d2(x,y,rx,ry) < r*0.7) return true;
  return false;
}
function highlandWalkable(x,y){
  if (S.bridge && onBridge(x,y)) return true;
  if (inGorge(x,y)) return false;
  if (insidePoly(CROWN, x, y, 16)) return !highlandBlocked(x,y);   // the open meadow on top
  if (inClearing(x,y) || onTrailPath(x,y)) return !highlandBlocked(x,y);
  return false;
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
// little roadside greenery, baked along the path edges
function hTuft(x,y){ ctx.strokeStyle='#6f9e55'; ctx.lineWidth=2.4; ctx.lineCap='round';
  for (let i=-2;i<=2;i++){ ctx.beginPath(); ctx.moveTo(x+i*3,y); ctx.lineTo(x+i*4,y-11-Math.abs(i)); ctx.stroke(); }
  ctx.strokeStyle='#86b064'; for (let i=-1;i<=1;i++){ ctx.beginPath(); ctx.moveTo(x+i*4,y); ctx.lineTo(x+i*5,y-8); ctx.stroke(); } }
function hFern(x,y){ ctx.strokeStyle=rng(Math.round(x+y))()>0.5?'#5f9150':'#6f9e55'; ctx.lineWidth=2.2; ctx.lineCap='round';
  for (let i=-2;i<=2;i++){ ctx.beginPath(); ctx.moveTo(x,y); ctx.quadraticCurveTo(x+i*7,y-11,x+i*13,y-8+Math.abs(i)*2); ctx.stroke(); } }
function hBloom(x,y){ const c=['#f6c6d0','#ffe08a','#d9c8f2','#fff6e8'][Math.floor(rng(Math.round(x*3+y))()*4)];
  ctx.strokeStyle='#6f9e55'; ctx.lineWidth=1.6; ctx.beginPath(); ctx.moveTo(x,y); ctx.lineTo(x,y-9); ctx.stroke();
  for (let k=0;k<5;k++){ const a=k/5*Math.PI*2; circ(x+Math.cos(a)*3,y-9+Math.sin(a)*3,2.2,c); } circ(x,y-9,1.4,'#f4b85a'); }

// ---- lush, varied "cut-paper" plants, layered for depth (Puffin Rock-style overgrowth) ----
const H_GREENS = ['#5f8a4c','#6f9e55','#7fae5f','#4f7a5c','#6a9e78','#7aa860','#55836a'];
function plFan(x,y,s,c){ for (let i=-3;i<=3;i++){ ctx.save(); ctx.translate(x,y); ctx.rotate(i*0.23); ctx.fillStyle = i%2?c:lit(c,0.12);
  ctx.beginPath(); ctx.moveTo(-3.5*s,0); ctx.quadraticCurveTo(-2*s,-28*s,0,-47*s); ctx.quadraticCurveTo(2*s,-28*s,3.5*s,0); ctx.closePath(); ctx.fill(); ctx.restore(); } }
function plBush(x,y,s,c){ for (const [dx,dy,r] of [[-13,-7,15],[13,-7,15],[0,-18,18],[-5,-12,11],[9,-14,10]]) ell(x+dx*s,y+dy*s,r*s,r*0.9*s,c); ell(x-6*s,-18*s+y,9*s,6*s,lit(c,0.3)); }
function plBloom(x,y,s,c){ ctx.strokeStyle=lit(c,-0.3); ctx.lineWidth=1.8*s; ctx.lineCap='round'; ctx.beginPath(); ctx.moveTo(x,y); ctx.quadraticCurveTo(x+2*s,y-24*s,x,y-44*s); ctx.stroke();
  const hx=x, hy=y-48*s; circ(hx,hy,8*s,'rgba(240,246,238,.45)'); ctx.strokeStyle='rgba(236,244,234,.85)'; ctx.lineWidth=1*s;
  for (let i=0;i<16;i++){ const a=i/16*Math.PI*2; ctx.beginPath(); ctx.moveTo(hx,hy); ctx.lineTo(hx+Math.cos(a)*9*s,hy+Math.sin(a)*9*s); ctx.stroke(); }
  for (let i=0;i<16;i++){ const a=i/16*Math.PI*2; circ(hx+Math.cos(a)*9*s,hy+Math.sin(a)*9*s,1.3*s,'#fbfdf8'); } }
function plThistle(x,y,s,c){ ctx.strokeStyle=lit(c,-0.3); ctx.lineWidth=2.4*s; ctx.lineCap='round'; ctx.beginPath(); ctx.moveTo(x,y); ctx.lineTo(x,y-42*s); ctx.stroke();
  for (const i of [-1,1]){ ctx.beginPath(); ctx.moveTo(x,y-12*s); ctx.lineTo(x+i*15*s,y-18*s); ctx.stroke(); ctx.beginPath(); ctx.moveTo(x,y-24*s); ctx.lineTo(x+i*11*s,y-32*s); ctx.stroke(); }
  ell(x,y-46*s,7*s,10*s,lit(c,0.15)); ctx.strokeStyle=lit(c,0.35); ctx.lineWidth=1.4*s;
  for (let i=-2;i<=2;i++){ ctx.beginPath(); ctx.moveTo(x+i*3*s,y-54*s); ctx.lineTo(x+i*4.5*s,y-61*s); ctx.stroke(); } circ(x,y-58*s,4*s,'#c98fc4'); }
function plSpike(x,y,s,c){ ctx.strokeStyle=c; ctx.lineWidth=4*s; ctx.lineCap='round'; for (let i=-3;i<=3;i++){ ctx.beginPath(); ctx.moveTo(x+i*4*s,y); ctx.quadraticCurveTo(x+i*5*s,y-32*s,x+i*7*s,y-56*s); ctx.stroke(); } }
function plFern(x,y,s,c){ ctx.strokeStyle=c; ctx.lineCap='round'; for (let i=-2;i<=2;i++){ if (!i) continue; ctx.lineWidth=3*s; ctx.beginPath(); ctx.moveTo(x,y); ctx.quadraticCurveTo(x+i*13*s,y-22*s,x+i*26*s,y-15*s); ctx.stroke();
  ctx.lineWidth=1.4*s; for (let k=1;k<=3;k++){ const t=k/4, px=x+i*26*s*t, py=y-22*s*Math.sin(t*1.9); ctx.beginPath(); ctx.moveTo(px,py); ctx.lineTo(px+i*7*s,py-7*s); ctx.stroke(); } } }
const PLANT_FNS = [plFan,plBush,plBloom,plThistle,plSpike,plFern];
// a grassy mound with little arched burrow holes — a nook along the path
function hNook(x,y,s){ ell(x,y+5,48*s,20*s,'rgba(38,56,34,.2)');
  ell(x,y,46*s,26*s,'#6f9e55'); ell(x-10*s,y-9*s,30*s,15*s,'#7fae5f'); ell(x+16*s,y-6*s,16*s,8*s,'#86b064');
  for (let i=-1;i<=1;i++){ const hx=x+i*22*s, hy=y+4*s; ctx.fillStyle='#2b211c'; ctx.beginPath(); ctx.moveTo(hx-9*s,hy); ctx.quadraticCurveTo(hx-9*s,hy-18*s,hx,hy-18*s); ctx.quadraticCurveTo(hx+9*s,hy-18*s,hx+9*s,hy); ctx.closePath(); ctx.fill();
    ctx.fillStyle='rgba(255,246,214,.12)'; ctx.beginPath(); ctx.ellipse(hx,hy-4*s,6*s,8*s,0,0,Math.PI*2); ctx.fill(); }
  ctx.strokeStyle='#5f9150'; ctx.lineWidth=2.4*s; ctx.lineCap='round'; for (let i=-3;i<=3;i++){ ctx.beginPath(); ctx.moveTo(x+i*9*s,y-16*s); ctx.lineTo(x+i*10*s,y-27*s); ctx.stroke(); } }
// Dense, varied, depth-sorted foliage over the slope: smaller/paler far up, bigger/darker near the bottom, so
// the climb reads as a path threading through layered overgrowth with little nooks and crannies.
function drawHighlandFoliage(){
  const R = rng(808), spots = [];
  for (let i=0;i<680;i++){
    const x = 170 + R()*1360, y = 250 + R()*2210;
    if (!insidePoly(MOUNTAIN, x, y, 18) || inGorge(x,y)) continue;
    if (Math.abs(x - fallX(y)) < FALL.w/2 + 34 && y > FALL.lip - 50) continue;   // keep out of the waterfall
    const nearPath = onTrailPath(x,y) || inClearing(x,y);
    if (nearPath && R() < 0.9) continue;                                          // path stays mostly clear
    if (insidePoly(CROWN, x, y, 12) && R() < 0.5) continue;                        // crown a bit more open
    spots.push([x,y]);
  }
  spots.sort((a,b) => a[1]-b[1]);                                                  // far (top) first → near (bottom) on top
  for (const [x,y] of spots){
    const depth = Math.max(0, Math.min(1, (y-250)/2210));                          // 0 far .. 1 near
    const s = 0.45 + depth*0.95 + R()*0.3;
    let c = H_GREENS[Math.floor(R()*H_GREENS.length)];
    c = depth > 0.58 ? mixHex(c, '#2c4034', (depth-0.58)*0.75) : mixHex(c, '#cfe0d4', (0.5-depth)*0.5);   // near darker, far hazier
    PLANT_FNS[Math.floor(R()*PLANT_FNS.length)](x, y, s, c);
  }
  // a few burrow nooks tucked beside the path
  for (const [x,y,s] of [[612,1150,1],[1000,1452,0.9],[560,2150,1.05],[988,860,0.85]]) if (!onTrailPath(x,y)) hNook(x,y,s);
}
// The slope as overlapping rolling-hill bands that recede into haze (Old Man's Journey): each is a flat green
// plane with a lit crest and a soft shadow where the hill in front of it tucks over — far ones paler and cooler,
// near ones richer and warmer. Gives the terrain real stacked depth instead of one flat plane.
function drawHighlandHills(){
  const R = rng(441), N = 7;
  const crests = Array.from({length:N}, (_,i) => ({ cy: 1030 + i*238, amp: 26+R()*34, ph: R()*6.28, freq: 0.0034+R()*0.0024, amp2: 10+R()*16, ph2: R()*6.28 }));
  const crestY = (w,x) => w.cy + Math.sin(x*w.freq+w.ph)*w.amp + Math.sin(x*w.freq*2.4+w.ph2)*w.amp2;
  const trace = (w,dy=0) => { for (let x=-60;x<=HW+60;x+=22){ const y=crestY(w,x)+dy; x<-40?ctx.moveTo(x,y):ctx.lineTo(x,y); } };
  ctx.save(); polyPath(MOUNTAIN); ctx.clip();
  for (let i=0;i<N;i++){
    const w=crests[i], depth=i/(N-1);
    let c = mixHex('#a9cb8c','#5f8a45', depth);
    c = depth<0.5 ? mixHex(c,'#cfe0d6',(0.5-depth)*0.6) : mixHex(c,'#41603a',(depth-0.5)*0.5);
    ctx.fillStyle=c; ctx.beginPath(); ctx.moveTo(-60,HH+60); trace(w); ctx.lineTo(HW+60,HH+60); ctx.closePath(); ctx.fill();
    ctx.lineCap='round';
    ctx.strokeStyle='rgba(38,56,32,.14)'; ctx.lineWidth=28; ctx.beginPath(); trace(w,20); ctx.stroke();   // shade under the crest
    ctx.strokeStyle=lit(c,0.7); ctx.lineWidth=3.5; ctx.beginPath(); trace(w); ctx.stroke();                 // lit crest rim
  }
  ctx.restore();
}
function drawHighlandStatic(){
  drawHighlandSky();
  const L = LOOK.light;
  // the mountain is a grassy alpine slope (not bare rock): a sandy/rocky foot, then grass with rocky outcrops
  ctx.fillStyle = '#b7a98e'; polyPath(offsetPoly(MOUNTAIN, 16), 0, 10); ctx.fill();
  for (let i=10; i>0; i-=2) { ctx.fillStyle = mixHex('#8fb268','#5f8a45', i/10); polyPath(offsetPoly(MOUNTAIN, 2), 0, i); ctx.fill(); }
  ctx.fillStyle = C.grass; polyPath(MOUNTAIN); ctx.fill();
  drawHighlandHills();                         // overlapping rolling-hill bands (depth)
  ctx.save(); polyPath(MOUNTAIN); ctx.clip();
  const Rr = rng(31);
  // darker grass patches
  for (let i=0;i<70;i++){ const x=Rr()*HW, y=300+Rr()*2150; ctx.fillStyle = Rr()<0.5?'rgba(120,160,86,.4)':'rgba(150,175,100,.32)'; ctx.beginPath(); ctx.ellipse(x,y,50+Rr()*80,28+Rr()*44,Rr()*3,0,Math.PI*2); ctx.fill(); }
  // fine grass blades over the whole slope
  ctx.lineCap='round';
  for (let i=0;i<7000;i++){ const x=Rr()*HW, y=240+Rr()*2240, l=5+Rr()*7, tt=Rr()*2-1;
    ctx.strokeStyle = lit(C.grass, tt*0.4); ctx.lineWidth=1.2; ctx.beginPath(); ctx.moveTo(x,y); ctx.lineTo(x+(Rr()-0.5)*4, y-l); ctx.stroke(); }
  // bare rocky scree showing through here and there (greys), especially on the steeper flanks
  const rtones = ['#9a9184','#8b8276','#a7a090','#7e766a'];
  for (let i=0;i<34;i++){ const x=Rr()*HW, y=400+Rr()*2000; if (x>200 && x<1500 && !(x<360||x>1360) && Rr()<0.6) continue;
    ctx.fillStyle = rtones[i%4]; ctx.beginPath(); ctx.moveTo(x-30,y+8); ctx.lineTo(x-8,y-18); ctx.lineTo(x+22,y-6); ctx.lineTo(x+12,y+16); ctx.closePath(); ctx.fill(); }
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

  // the trail: a worn dirt path, carved slightly into the slope (soft edges, dirt tones, gravel — no hard ribbon)
  ctx.lineJoin='round'; ctx.lineCap='round';
  const trail = (w,col,a=1) => { ctx.globalAlpha=a; ctx.strokeStyle=col; ctx.lineWidth=w;
    ctx.beginPath(); TRAIL.forEach(([x,y],i)=>{const p=TRAIL[i-1]; i?ctx.quadraticCurveTo((p[0]+x)/2,(p[1]+y)/2,x,y):ctx.moveTo(x,y);}); ctx.stroke(); ctx.globalAlpha=1; };
  // flat dirt landings at the hairpins, so the turns read as resting places rather than kinks
  for (const [lx,ly] of TRAIL_LANDINGS) { ell(lx, ly+2, 48, 27, 'rgba(60,50,40,.22)'); ell(lx, ly, 42, 23, '#c3a878'); ell(lx-6, ly-4, 24, 12, '#d2bb8a'); }
  trail(46, 'rgba(60,50,40,.2)');      // soft recess
  trail(36, 'rgba(92,74,56,.5)');      // dirt shade
  trail(28, '#c3a878');                // dirt body
  trail(21, '#d2bb8a');                // lighter trodden dirt
  trail(7,  'rgba(255,246,214,.28)');  // worn centre
  // gravel and dirt flecks scattered along the path (seeded so the bake stays stable)
  const Rt = rng(3140);
  for (let i=0;i<TRAIL.length-1;i++){ const a=TRAIL[i], bq=TRAIL[i+1];
    for (let t=0;t<1;t+=0.07){ if (Rt()>0.42) continue;
      const x=a[0]+(bq[0]-a[0])*t, y=a[1]+(bq[1]-a[1])*t, ox=(Rt()-0.5)*24, oy=(Rt()-0.5)*14;
      ell(x+ox, y+oy, 2.4+Rt()*3, 1.8+Rt()*2, Rt()>0.5?'#b4a68e':'#9c9078'); } }
  // line both edges of the path with grass tufts, stones, ferns and the odd flower, so the way reads clearly
  const Rf = rng(515);
  for (let i=0;i<TRAIL.length-1;i++){ const a=TRAIL[i], bq=TRAIL[i+1];
    const dx=bq[0]-a[0], dy=bq[1]-a[1], len=Math.hypot(dx,dy)||1, nx=-dy/len, ny=dx/len;
    for (let t=0;t<1;t+=0.1){ for (const side of [-1,1]){ if (Rf()>0.72) continue;
      const off = TRAIL_W - 6 + Rf()*18, x=a[0]+dx*t+nx*off*side, y=a[1]+dy*t+ny*off*side, k=Rf();
      if (inGorge(x,y)) continue;
      if (k<0.52) hTuft(x,y); else if (k<0.74) ell(x,y,3+Rf()*3,2.2+Rf()*2,Rf()>0.5?'#b0a890':'#9a927e'); else if (k<0.9) hFern(x,y); else hBloom(x,y); } } }
  // a few tufts around the clearings too
  for (const [cx,cy,r] of H_CLEARINGS){ for (let a=0;a<Math.PI*2;a+=0.5){ if (Rf()>0.6) continue; const x=cx+Math.cos(a)*(r*0.7+Rf()*16), y=cy+Math.sin(a)*(r*0.5+Rf()*12); if (inGorge(x,y)) continue; Rf()<0.6?hTuft(x,y):hFern(x,y); } }
  // lush, layered overgrowth filling the slope and crowding the path's edges
  drawHighlandFoliage();

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

  // the waterfall: a shaded rock channel the water pours down, with a grassy rock lip at the top (water is live)
  const w = FALL.w;
  ctx.fillStyle = '#4f473d'; ctx.beginPath();
  ctx.moveTo(fallX(FALL.lip)-w/2-7, FALL.lip);
  for (let y=FALL.lip; y<=FALL.y1; y+=20) ctx.lineTo(fallX(y)-w/2-7, y);
  for (let y=FALL.y1; y>=FALL.lip; y-=20) ctx.lineTo(fallX(y)+w/2+7, y);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle='#5f564b'; ctx.lineWidth=5; ctx.beginPath();
  for (let y=FALL.lip; y<=FALL.y1; y+=20) ctx.lineTo(fallX(y)-w/2-7, y); ctx.stroke();
  // the rock lip + a grassy brow where the stream goes over
  ell(FALL.x, FALL.lip+4, w/2+20, 15, '#8b8276');
  ctx.fillStyle=C.grass; ctx.beginPath(); ctx.ellipse(FALL.x, FALL.lip-6, w/2+24, 15, 0, Math.PI, 0); ctx.fill();
  ctx.strokeStyle='#86b064'; ctx.lineWidth=2.5; for (let i=-2;i<=2;i++){ const bx=FALL.x+i*16; ctx.beginPath(); ctx.moveTo(bx,FALL.lip-8); ctx.lineTo(bx+2,FALL.lip-20); ctx.stroke(); }
}
function drawHThrift(){}   // (thrift baked into ground; kept for clarity)
function drawWaterfallLive(t){
  const w = FALL.w, lip = FALL.lip, y1 = FALL.y1;
  ctx.save();
  // the falling column of water
  ctx.beginPath(); ctx.moveTo(fallX(lip)-w/2, lip);
  for (let y=lip; y<=y1; y+=16) ctx.lineTo(fallX(y)-w/2, y);
  for (let y=y1; y>=lip; y-=16) ctx.lineTo(fallX(y)+w/2, y);
  ctx.closePath();
  const wg = ctx.createLinearGradient(0,lip,0,y1); wg.addColorStop(0,'rgba(232,248,251,.92)'); wg.addColorStop(0.5,'rgba(188,224,234,.82)'); wg.addColorStop(1,'rgba(214,238,244,.86)');
  ctx.fillStyle = wg; ctx.fill();
  // the lip curl where water tips over
  ctx.fillStyle='rgba(255,255,255,.9)'; ctx.beginPath(); ctx.ellipse(FALL.x, lip, w/2+3, 9, 0, 0, Math.PI*2); ctx.fill();
  // falling streaks that stream downward
  ctx.save(); ctx.beginPath(); ctx.moveTo(fallX(lip)-w/2, lip);
  for (let y=lip; y<=y1; y+=16) ctx.lineTo(fallX(y)-w/2, y);
  for (let y=y1; y>=lip; y-=16) ctx.lineTo(fallX(y)+w/2, y); ctx.closePath(); ctx.clip();
  ctx.lineCap='round'; ctx.lineWidth=2.6;
  for (let s=-3;s<=3;s++){ ctx.beginPath(); for (let y=lip;y<y1;y+=12){ const x=fallX(y)+s*(w/8)+Math.sin(y*0.05+s)*2; y===lip?ctx.moveTo(x,y):ctx.lineTo(x,y); }
    const o=((s*40 + t*620)%80+80)%80; ctx.strokeStyle=`rgba(255,255,255,${o<46?0.7:0.22})`; ctx.stroke(); }
  ctx.restore();
  // foam + mist where it crashes through the gorge and where it dissolves into the clouds
  for (const sy of [GORGE.y1+8, y1]){ const cx = fallX(sy);
    ctx.save(); ctx.globalCompositeOperation='lighter';
    const g = ctx.createRadialGradient(cx,sy,4,cx,sy,96); g.addColorStop(0,'rgba(255,255,255,.9)'); g.addColorStop(1,'rgba(255,255,255,0)');
    ctx.fillStyle=g; ctx.beginPath(); ctx.ellipse(cx,sy,96,40,0,0,Math.PI*2); ctx.fill(); ctx.restore();
    for (let i=0;i<6;i++){ const k=(t*0.8+i/6)%1; circ(cx-34+i*14+Math.sin(t*2+i)*4, sy-k*30, 4+k*7, `rgba(255,255,255,${0.55*(1-k)})`); }
  }
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
  S.npcs.push({ id:'juniper', name:'Juniper', x:778, y:1952, near:false, scene:'highland' });
  S.npcs.push({ id:'pine', name:'Pine', x:855, y:1238, near:false, scene:'highland' });
  S.npcs.push({ id:'lark', name:'Lark', x:900, y:600, near:false, scene:'highland', gliding:true });
  for (const k in grids) delete grids[k];
  clearGround(); renderQuests(); running = true;
  if (!quiet) setTimeout(() => speak('pip.day4.start'), 400);
}
