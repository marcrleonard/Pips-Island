// Rendering style: soft 2.5D volumes lit from one direction, directional shadows, a color grade per
// scene, and baked layers so each frame only stamps images.
//
// How the look is made
//   * Inside a sprite (characters, trees, props) every circle and ellipse drawn with a plain hex
//     color is shaded as a rounded volume: lit side, base color, shadow side (see circ/ell).
//   * shadow() casts a soft shadow away from the light, plus a dark contact patch under the object.
//   * The scene's grade (golden hour by day) is applied inside each baked image, so nothing pays for
//     a full-screen blend every frame.
//   * Ground (sea, sand, grass, paths, pond, decor) is drawn once per scene into one big image.
//
// Porting note: everything here is plain Canvas 2D. In another engine, a "sprite" is a pre-rendered
// texture, LOOK maps to a light direction plus a post-process LUT, and bakedGround is a static tile map.

// ---------- looks ----------
const LOOK_DAY = {
  light: { x:-0.72, y:-0.69 }, key:'#ffe2a6', keyAmt:0.5, shade:'#4a4c86', shadeAmt:0.42,
  sun: { dx:0.95, dy:0.31, len:0.9, alpha:0.3, color:'#2b2452' }, ao:0.32,
  grade: [{ m:'soft-light', c:'#ff9a48', a:0.32 }, { m:'multiply', c:'#fbe0c0', a:0.26 }],
  grain: 0.45,
};
const LOOK_CAVE = {
  light: { x:0.25, y:-0.97 }, key:'#fff3dc', keyAmt:0.28, shade:'#2c2a40', shadeAmt:0.45,
  sun: { dx:0, dy:0, len:0, alpha:0, color:'#000000' }, ao:0.38,
  grade: [], grain: 0.35,
};
let LOOK = LOOK_DAY;
const lookFor = scene => scene === 'cave' ? LOOK_CAVE : LOOK_DAY;

// ---------- color helpers ----------
const hexRGB = h => [parseInt(h.slice(1,3),16), parseInt(h.slice(3,5),16), parseInt(h.slice(5,7),16)];
const isHex = c => typeof c === 'string' && c.length === 7 && c[0] === '#';
const mixHex = (a, b, t) => { const A = hexRGB(a), B = hexRGB(b); t = Math.max(0, Math.min(1, t));
  return '#' + A.map((v,i) => Math.round(v + (B[i]-v)*t).toString(16).padStart(2,'0')).join(''); };
const lit = (base, t) => t >= 0 ? mixHex(base, LOOK.key, t*LOOK.keyAmt) : mixHex(base, LOOK.shade, -t*LOOK.shadeAmt);

// ---------- shaded primitives ----------
let BAKING_GROUND = false;
function shadeable(fill, r){ return isHex(fill) && r >= 2.5 && (SPRITE_MODE || (BAKING_GROUND && r <= 26)); }
function volume(x, y, rx, ry, base){
  // a radial gradient that reads as a lit, rounded surface; mirrored sprites keep the light on the correct side
  const m = ctx.getTransform(), fx = m.a < 0 ? -1 : 1, L = LOOK.light, r = Math.max(rx, ry);
  const g = ctx.createRadialGradient(x + fx*L.x*rx*0.42, y + L.y*ry*0.42 - ry*0.1, r*0.04, x - fx*L.x*rx*0.18, y - L.y*ry*0.18 + ry*0.08, r*1.15);
  g.addColorStop(0, lit(base, 1)); g.addColorStop(0.5, base); g.addColorStop(1, lit(base, -1));
  return g;
}
function circ(x,y,r,fill){ ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.fillStyle = shadeable(fill, r) ? volume(x,y,r,r,fill) : fill; ctx.fill(); }
function ell(x,y,rx,ry,fill){ ctx.beginPath(); ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2); ctx.fillStyle = shadeable(fill, Math.min(rx,ry)) ? volume(x,y,rx,ry,fill) : fill; ctx.fill(); }

// ---------- shadows ----------
function blobSprite(color){ const c = document.createElement('canvas'); c.width = 128; c.height = 64; const x = c.getContext('2d');
  x.filter = 'blur(7px)'; x.fillStyle = color; x.beginPath(); x.ellipse(64,32,44,16,0,0,Math.PI*2); x.fill(); return c; }
const AO_BLOB = blobSprite('#1a1f17');
let SUN_BLOB = blobSprite(LOOK_DAY.sun.color);
// x,y: where the object touches the ground. rx: footprint radius. h: how tall it stands.
function shadow(x, y, rx, h){
  if (SPRITE_MODE) return;
  h = h ?? rx*2.2;
  ctx.save();
  ctx.globalAlpha = LOOK.ao; ctx.drawImage(AO_BLOB, x - rx*1.3, y - rx*0.5, rx*2.6, rx*1.0);
  const s = LOOK.sun;
  if (s.alpha) {
    const len = h*s.len;
    ctx.translate(x + s.dx*len*0.5, y + s.dy*len*0.5); ctx.rotate(Math.atan2(s.dy, s.dx));
    ctx.globalAlpha = s.alpha; const w = len + rx*2.4, hh = rx*1.25;
    ctx.drawImage(SUN_BLOB, -w/2, -hh/2, w, hh);
  }
  ctx.restore();
}

// ---------- sprites ----------
const scratch = document.createElement('canvas'); scratch.width = scratch.height = 1024;
const scx = scratch.getContext('2d');
const tmpC = document.createElement('canvas'); tmpC.width = tmpC.height = 1024;
const tmpX = tmpC.getContext('2d');
const renderScale = () => Math.round(Math.min(3, Math.max(1.25, DPR*cam.z)) * 4) / 4;
const PAD = 4;
// apply the look's grade to the first w×h pixels of a canvas without touching transparent pixels
function gradeCanvas(c2, can, w, h){
  if (!LOOK.grade.length) return;
  tmpX.setTransform(1,0,0,1,0,0); tmpX.globalAlpha = 1; tmpX.globalCompositeOperation = 'copy'; tmpX.drawImage(can, 0,0,w,h, 0,0,w,h);
  for (const q of LOOK.grade) { tmpX.globalCompositeOperation = q.m; tmpX.globalAlpha = q.a; tmpX.fillStyle = q.c; tmpX.fillRect(0,0,w,h); }
  tmpX.globalAlpha = 1; tmpX.globalCompositeOperation = 'destination-in'; tmpX.drawImage(can, 0,0,w,h, 0,0,w,h);
  c2.save(); c2.setTransform(1,0,0,1,0,0); c2.globalAlpha = 1; c2.globalCompositeOperation = 'copy'; c2.drawImage(tmpC, 0,0,w,h, 0,0,w,h); c2.restore();
}
function bake(c2, x, y, box, fn, scale){
  const [L,T,Rr,B] = box, w = Rr-L+2*PAD, h = B-T+2*PAD;
  const pw = Math.min(1024, Math.ceil(w*scale)), ph = Math.min(1024, Math.ceil(h*scale));
  c2.setTransform(1,0,0,1,0,0); c2.globalCompositeOperation='source-over'; c2.globalAlpha = 1; c2.clearRect(0,0,pw+2,ph+2);
  c2.setTransform(scale,0,0,scale,(-(x+L)+PAD)*scale,(-(y+T)+PAD)*scale);
  const prev = ctx; ctx = c2; SPRITE_MODE = true;
  try { fn(); } finally { ctx = prev; SPRITE_MODE = false; }
  gradeCanvas(c2, c2.canvas, pw, ph);
  return { pw, ph, w, h, dx: x+L-PAD, dy: y+T-PAD };
}
function onScreen(x,y,box){ const [L,T,Rr,B]=box; return !(x+Rr < cam.x-30 || x+L > cam.x+cam.vw+30 || y+B < cam.y-30 || y+T > cam.y+cam.vh+30); }
// Characters and anything animated. With opt.key, the drawn pose is reused until the animation
// clock ticks (opt.fps times a second, default 15), so a character costs one image stamp most frames.
const poseCache = new Map();
function styled(x, y, box, fn, opt = {}){
  if (!onScreen(x,y,box)) return;
  if (opt.shadow) shadow(x, y + (opt.shy ?? 2), opt.shadow, opt.h);
  const scale = renderScale();
  if (!opt.key) { const m = bake(scx, x, y, box, fn, scale); ctx.drawImage(scratch, 0,0,m.pw,m.ph, m.dx,m.dy,m.w,m.h); return; }
  const tick = Math.floor(S.t * (opt.fps || 15)), lk = LOOK === LOOK_CAVE ? 'c' : 'd', fx = Math.round(x*4)/4, fy = Math.round(y*4)/4;
  let c = poseCache.get(opt.key);
  if (!c || c.tick !== tick || c.scale !== scale || c.lk !== lk || c.fx !== fx || c.fy !== fy || opt.always) {
    // a moving character is re-drawn at its new spot; a still one keeps its image
    const m = bake(scx, x, y, box, fn, scale);
    const can = c && c.can.width >= m.pw && c.can.height >= m.ph ? c.can : document.createElement('canvas');
    if (can.width < m.pw || can.height < m.ph) { can.width = Math.max(can.width, m.pw); can.height = Math.max(can.height, m.ph); }
    const c2 = can.getContext('2d'); c2.clearRect(0,0,can.width,can.height); c2.drawImage(scratch, 0,0,m.pw,m.ph, 0,0,m.pw,m.ph);
    c = { can, pw:m.pw, ph:m.ph, w:m.w, h:m.h, dx:m.dx-x, dy:m.dy-y, tick, scale, lk, fx, fy };
    poseCache.set(opt.key, c);
  }
  ctx.drawImage(c.can, 0, 0, c.pw, c.ph, x+c.dx, y+c.dy, c.w, c.h);
}
// drawn once and reused: trees, rocks, houses
const spriteCache = new Map();
function cached(key, x, y, box, fn, opt = {}){
  if (!onScreen(x,y,box)) return;
  const scale = renderScale(), lk = LOOK === LOOK_CAVE ? 'c' : 'd';
  let c = spriteCache.get(key);
  if (!c || c.scale !== scale || c.lk !== lk) {
    const m = bake(scx, x, y, box, fn, scale);
    const can = c && c.can.width >= m.pw && c.can.height >= m.ph ? c.can : document.createElement('canvas');
    if (can.width < m.pw || can.height < m.ph) { can.width = m.pw; can.height = m.ph; }
    const c2 = can.getContext('2d'); c2.clearRect(0,0,can.width,can.height); c2.drawImage(scratch, 0,0,m.pw,m.ph, 0,0,m.pw,m.ph);
    c = { can, pw:m.pw, ph:m.ph, w:m.w, h:m.h, dx:m.dx-x, dy:m.dy-y, scale, lk };
    spriteCache.set(key, c);
  }
  if (opt.shadow) shadow(x, y + (opt.shy ?? 2), opt.shadow, opt.h);
  ctx.drawImage(c.can, 0, 0, c.pw, c.ph, x+c.dx, y+c.dy, c.w, c.h);
}

// ---------- paper grain ----------
const grainC = document.createElement('canvas'); grainC.width = grainC.height = 192;
(function makeGrain(){
  const g = grainC.getContext('2d'), id = g.createImageData(192,192), Rn = rng(99);
  for (let i=0;i<id.data.length;i+=4){ const v = 222 + Rn()*33; id.data[i]=v; id.data[i+1]=v-3; id.data[i+2]=v-10; id.data[i+3]=255; }
  g.putImageData(id,0,0);
  g.strokeStyle='rgba(150,128,96,.22)'; g.lineWidth=0.8; g.lineCap='round';
  for (let i=0;i<46;i++){ const x=Rn()*192, y=Rn()*192, a=Rn()*Math.PI, l=5+Rn()*16; g.beginPath(); g.moveTo(x,y); g.quadraticCurveTo(x+Math.cos(a)*l*0.5+2, y+Math.sin(a)*l*0.5-2, x+Math.cos(a)*l, y+Math.sin(a)*l); g.stroke(); }
})();
let grainPat = null;
function drawGrain(alpha){
  if (!grainPat) { grainPat = mainCtx.createPattern(grainC,'repeat'); try { grainPat.setTransform(new DOMMatrix().scale(0.7)); } catch(e){} }
  ctx.save(); ctx.globalCompositeOperation='multiply'; ctx.globalAlpha=alpha; ctx.fillStyle=grainPat;
  ctx.fillRect(cam.x-20, cam.y-20, cam.vw+40, cam.vh+40); ctx.restore();
}

// ---------- baked ground ----------
// One image per scene layer, at a resolution capped so it fits comfortably in phone memory.
const GROUND = {};
function bakedGround(key, w, h, drawFn, opt = {}){
  const k = Math.round(Math.min(renderScale(), Math.sqrt(12e6/(w*h)))*4)/4;
  let gC = GROUND[key];
  if (!gC || gC.k !== k) {
    const c = document.createElement('canvas'); c.width = Math.ceil(w*k); c.height = Math.ceil(h*k);
    const x = c.getContext('2d'); x.setTransform(k,0,0,k,0,0);
    const prev = ctx; ctx = x; BAKING_GROUND = true;
    try {
      drawFn();
      if (LOOK.grain) { if (!grainPat) grainPat = mainCtx.createPattern(grainC,'repeat');
        x.save(); x.globalCompositeOperation = opt.transparent ? 'source-atop' : 'multiply'; x.globalAlpha = opt.transparent ? LOOK.grain*0.35 : LOOK.grain; x.fillStyle = grainPat; x.fillRect(0,0,w,h); x.restore(); }
    } finally { ctx = prev; BAKING_GROUND = false; }
    if (LOOK.grade.length) {
      if (opt.transparent) { const big = document.createElement('canvas'); big.width = c.width; big.height = c.height; const bx = big.getContext('2d');
        bx.drawImage(c,0,0); for (const q of LOOK.grade) { bx.globalCompositeOperation = q.m; bx.globalAlpha = q.a; bx.fillStyle = q.c; bx.fillRect(0,0,big.width,big.height); }
        bx.globalAlpha = 1; bx.globalCompositeOperation = 'destination-in'; bx.drawImage(c,0,0);
        x.setTransform(1,0,0,1,0,0); x.globalCompositeOperation = 'copy'; x.drawImage(big,0,0); }
      else { x.setTransform(1,0,0,1,0,0); for (const q of LOOK.grade) { x.globalCompositeOperation = q.m; x.globalAlpha = q.a; x.fillStyle = q.c; x.fillRect(0,0,c.width,c.height); } }
      x.globalCompositeOperation = 'source-over'; x.globalAlpha = 1;
    }
    GROUND[key] = gC = { can:c, k };
  }
  return gC;
}
function blitGround(gC, w, h){
  const x0 = Math.max(0, cam.x), y0 = Math.max(0, cam.y), x1 = Math.min(w, cam.x+cam.vw), y1 = Math.min(h, cam.y+cam.vh);
  if (x1 <= x0 || y1 <= y0) return;
  ctx.drawImage(gC.can, x0*gC.k, y0*gC.k, (x1-x0)*gC.k, (y1-y0)*gC.k, x0, y0, x1-x0, y1-y0);
}
function clearGround(){ for (const k in GROUND) delete GROUND[k]; }

// ---------- characters and depth helpers ----------
const blink = (t, seed) => ((t*0.9 + seed) % 4.3) > 4.14;
function behind(x, y, box){
  const P = S.player, [L,T,Rr] = box;
  return P.y < y - 6 && P.y - 50 > y + T && P.x > x + L + 6 && P.x < x + Rr - 6;
}
function faded(x, y, box, draw){ const f = behind(x,y,box); if (f) ctx.globalAlpha = 0.5; draw(); ctx.globalAlpha = 1; }
const treeBox = tr => { const s = tr.s; return tr.kind==='pine' ? [-50*s,-104*s,50*s,6] : tr.kind==='birch' ? [-40*s,-112*s,40*s,6] : [-50*s,-108*s,50*s,6]; };
const NPC_STYLE = {
  duck:  { box:[-32,-44,32,4], shadow:18, h:34 },
  hog:   { box:[-36,-44,36,4], shadow:24, h:34 },
  crab:  { box:[-36,-46,36,8], shadow:26, h:30 },
  mole:  { box:[-36,-82,48,6], shadow:24, h:44 },
  seal:  { box:[-40,-42,40,6], shadow:26, h:30 },
  puffin:{ box:[-30,-62,30,6], shadow:16, h:50 },
  mouse: { box:[-28,-50,28,6], shadow:16, h:40 },
  mouseStool: { box:[-40,-50,28,24], shadow:24, shy:20, h:50 },
  owl:   { box:[-24,-52,24,4] },
};
function drawNpcStyled(n, t, stool){
  const st = NPC_STYLE[n.id==='mouse' && stool ? 'mouseStool' : n.id];
  const fn = n.id==='duck' ? () => drawDuck(n.x,n.y,1,-1,t,true) : n.id==='hog' ? () => drawHog(n,t) : n.id==='crab' ? () => drawCrab(n,t)
    : n.id==='mole' ? () => drawMole(n,t) : n.id==='mouse' ? () => drawMouse(n,t,stool) : n.id==='seal' ? () => drawSealPup(n,t) : n.id==='puffin' ? () => drawPuffin(n.x,n.y,1,-1,t,true) : () => drawOwl(n,t);
  styled(n.x, n.y, st.box, fn, { ...st, key:'npc:'+n.id+(stool?':s':''), fps:12 });
}
const drawPipStyled = t => styled(S.player.x, S.player.y, [-44,-70,44,8], () => drawOtter(S.player,t), { shadow:22, h:62, key:'pip', fps:24 });
const drawDucklingStyled = (d,t) => styled(d.x, d.y, [-18,-25,18,3], () => drawDuck(d.x,d.y,0.55,d.face||1,t,false), { shadow:10, h:18, key:'duckling:'+S.ducklings.indexOf(d), fps:12 });
