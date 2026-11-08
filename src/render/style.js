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
// A soft ellipse drawn with a radial gradient. (Canvas filter: blur() would be simpler, but WebKit, which every iOS
// browser uses, ignores it and the shadows come out hard-edged.) The stops follow a blurred-edge falloff.
function blobSprite(color){ const c = document.createElement('canvas'); c.width = 128; c.height = 64; const x = c.getContext('2d');
  const [r, g, b] = [1,3,5].map(i => parseInt(color.slice(i, i+2), 16)), a = k => `rgba(${r},${g},${b},${k})`;
  x.setTransform(1, 0, 0, 0.44, 64, 32);
  const gr = x.createRadialGradient(0, 0, 0, 0, 0, 52);
  [[0,1],[0.55,0.97],[0.7,0.82],[0.8,0.58],[0.9,0.26],[0.96,0.08],[1,0]].forEach(([s, k]) => gr.addColorStop(s, a(k)));
  x.fillStyle = gr; x.beginPath(); x.arc(0, 0, 52, 0, Math.PI*2); x.fill(); return c; }
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
// A long cast shadow reaches well past its sprite (down and to the right), so visibility checks include it;
// otherwise the shadow pops in when the sprite comes on screen.
function shadowReach(box, opt){
  if (!opt.shadow) return box;
  const s = LOOK.sun, rx = opt.shadow, len = (opt.h ?? rx*2.2)*s.len, sy = opt.shy ?? 2;
  return [Math.min(box[0], -rx*1.3), box[1], Math.max(box[2], s.dx*len + rx*1.3), Math.max(box[3], sy + s.dy*len + rx)];
}
function onScreen(x,y,box){ const [L,T,Rr,B]=box; return !(x+Rr < cam.x-30 || x+L > cam.x+cam.vw+30 || y+B < cam.y-30 || y+T > cam.y+cam.vh+30); }
// Characters and anything animated. With opt.key, the drawn pose is reused until the animation
// clock ticks (opt.fps times a second, default 15), so a character costs one image stamp most frames.
const poseCache = new Map();
function styled(x, y, box, fn, opt = {}){
  if (!onScreen(x,y,shadowReach(box,opt))) return;
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
  if (!onScreen(x,y,shadowReach(box,opt))) return;
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
    // the colour at the world's corner, so the screen beyond the world's edge matches the baked sea
    if (!opt.transparent) { const px = x.getImageData(0, 0, 8, 8).data; let r = 0, g = 0, b = 0;
      for (let i=0;i<px.length;i+=4){ r += px[i]; g += px[i+1]; b += px[i+2]; } const n = px.length/4;
      gC.edge = `rgb(${Math.round(r/n)},${Math.round(g/n)},${Math.round(b/n)})`; }
  }
  return gC;
}
let GROUND_EDGE = null;
function blitGround(gC, w, h){
  if (gC.edge) GROUND_EDGE = gC.edge;
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
  seal:  { box:[-46,-40,44,6], shadow:24, h:8 },
  puffin:{ box:[-30,-62,30,6], shadow:16, h:50 },
  mouse: { box:[-28,-50,28,6], shadow:16, h:40 },
  mouseStool: { box:[-40,-50,28,24], shadow:24, shy:20, h:50 },
  owl:   { box:[-24,-52,24,4] },
};
function drawNpcStyled(n, t, stool){
  const st = NPC_STYLE[n.id==='mouse' && stool ? 'mouseStool' : n.id];
  const fn = n.id==='duck' ? () => drawDuck(n.x,n.y,1,-1,t,true) : n.id==='hog' ? () => drawHog(n,t) : n.id==='crab' ? () => drawCrab(n,t)
    : n.id==='mole' ? () => drawMole(n,t) : n.id==='mouse' ? () => drawMouse(n,t,stool) : n.id==='seal' ? () => drawSealPup(n,t) : n.id==='puffin' ? () => drawPuffin(n.x,n.y,1,-1,t,true) : () => drawOwl(n,t);
  // a friend on the move bobs a little with each step (Digby draws his own waddle)
  const walk = n.moving && n.id !== 'mole' ? () => { ctx.save(); ctx.translate(0, -Math.abs(Math.sin(n.walkT))*3); fn(); ctx.restore(); } : fn;
  styled(n.x, n.y, st.box, walk, { ...st, key:'npc:'+n.id+(stool?':s':''), fps:12 });
}
const drawPipStyled = t => { const k = swimDepth(S.player.x, S.player.y);
  return k > 0.03 ? drawPipSwim(t, k) : styled(S.player.x, S.player.y, [-44,-70,44,8], () => drawOtter(S.player,t), { shadow:22, h:62, key:'pip', fps:24 }); };
// Wading and swimming: a waterline crosses Pip and climbs his body as the water gets deeper (k: 0 dry, 1 swimming).
// Below the line he shows faintly through the water.
function drawPipSwim(t, k){
  const P = S.player, sink = k*9, bob = Math.sin(t*2.6)*1.2*k, line = P.y + 2 - k*24;
  if (P.moving && k > 0.6) {
    ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 2; ctx.lineCap = 'round';
    for (let j=1;j<=2;j++){ const back = -P.face*(22 + j*14), spread = 8 + j*6;
      ctx.beginPath(); ctx.moveTo(P.x + back*0.6, line - 1); ctx.lineTo(P.x + back, line - spread*0.45); ctx.moveTo(P.x + back*0.6, line + 3); ctx.lineTo(P.x + back, line + spread*0.6); ctx.stroke(); }
  }
  styled(P.x, P.y, [-44,-70,44,8], () => {
    ctx.save(); ctx.translate(0, sink + bob); ctx.globalAlpha = 0.28; drawOtter(P, t); ctx.restore();
    ctx.save(); ctx.beginPath(); ctx.rect(P.x-60, P.y-130, 120, line - (P.y-130)); ctx.clip();
    ctx.translate(0, sink + bob); drawOtter(P, t); ctx.restore();
  }, { key:'pipswim', fps:24 });
  // the waterline across his body, wobbling a little
  const w = 15 + k*7;
  ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 2.4; ctx.lineCap = 'round'; ctx.beginPath();
  for (let x = -w; x <= w; x += 3) { const y = line + Math.sin(x*0.35 + t*5)*1.2; x === -w ? ctx.moveTo(P.x + x, y) : ctx.lineTo(P.x + x, y); }
  ctx.stroke();
  if (k > 0.5) { const r2 = (t*0.8) % 1; ctx.strokeStyle = `rgba(255,255,255,${0.45*(1-r2)*(k-0.5)*2})`; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(P.x - w - 4 - r2*14, line + 1); ctx.lineTo(P.x - w - 12 - r2*14, line + 2); ctx.moveTo(P.x + w + 4 + r2*14, line + 1); ctx.lineTo(P.x + w + 12 + r2*14, line + 2); ctx.stroke(); }
}
const drawDucklingStyled = (d,t) => styled(d.x, d.y, [-18,-25,18,3], () => drawDuck(d.x,d.y,0.55,d.face||1,t,false), { shadow:10, h:18, key:'duckling:'+S.ducklings.indexOf(d), fps:12 });

// ---------- Smooth shapes ----------
// Land and rock outlines are smooth closed curves, not unions of circles. smoothPts turns a few control points
// into a dense polygon (quadratic curve through the midpoints), so drawing and walking use the same outline.
function smoothPts(pts, steps = 8){
  const n = pts.length, out = [], mid = (a, b) => [(a[0]+b[0])/2, (a[1]+b[1])/2];
  for (let i=0;i<n;i++){
    const p0 = mid(pts[(i-1+n)%n], pts[i]), c = pts[i], p1 = mid(pts[i], pts[(i+1)%n]);
    for (let k=0;k<steps;k++){ const t = k/steps, u = 1-t; out.push([u*u*p0[0]+2*u*t*c[0]+t*t*p1[0], u*u*p0[1]+2*u*t*c[1]+t*t*p1[1]]); }
  }
  return out;
}
function polyPath(poly, dx = 0, dy = 0){ ctx.beginPath(); poly.forEach(([x,y],i) => i ? ctx.lineTo(x+dx,y+dy) : ctx.moveTo(x+dx,y+dy)); ctx.closePath(); }
function inPoly(poly, x, y){
  let c = false;
  for (let i=0, j=poly.length-1; i<poly.length; j=i++){ const [xi,yi] = poly[i], [xj,yj] = poly[j];
    if ((yi > y) !== (yj > y) && x < (xj-xi)*(y-yi)/(yj-yi) + xi) c = !c; }
  return c;
}
function polyEdgeD(poly, x, y){
  let m = 1e9;
  for (let i=0, j=poly.length-1; i<poly.length; j=i++){ const [ax,ay] = poly[j], [bx,by] = poly[i], dx = bx-ax, dy = by-ay, l = dx*dx+dy*dy;
    const t = l ? Math.max(0, Math.min(1, ((x-ax)*dx+(y-ay)*dy)/l)) : 0; m = Math.min(m, Math.hypot(x-ax-dx*t, y-ay-dy*t)); }
  return m;
}
// inside the outline and at least `margin` away from its edge
const insidePoly = (poly, x, y, margin = 0) => inPoly(poly, x, y) && (!margin || polyEdgeD(poly, x, y) > margin);
// The same outline pushed out (or in) by g, along each point's normal. Results are cached per poly and g.
const offsetCache = new Map();
function offsetPoly(poly, g){
  const key = g, per = offsetCache.get(poly) || offsetCache.set(poly, new Map()).get(poly);
  if (per.has(key)) return per.get(key);
  const n = poly.length; let area = 0;
  for (let i=0;i<n;i++){ const [x1,y1] = poly[i], [x2,y2] = poly[(i+1)%n]; area += x1*y2 - x2*y1; }
  const s = area > 0 ? 1 : -1;
  const out = poly.map((p,i) => { const a = poly[(i-1+n)%n], b = poly[(i+1)%n], dx = b[0]-a[0], dy = b[1]-a[1], l = Math.hypot(dx,dy) || 1;
    return [p[0] + s*dy/l*g, p[1] - s*dx/l*g]; });
  per.set(key, out); return out;
}
// An angular cut-paper slab: a few jittered corners around a centre.
function slabPts(R, cx, cy, rx, ry, n = 6){
  const a0 = R()*Math.PI, out = [];
  for (let k=0;k<n;k++){ const a = a0 + k/n*Math.PI*2, j = 0.82 + R()*0.3; out.push([cx + Math.cos(a)*rx*j, cy + Math.sin(a)*ry*j]); }
  return out;
}
