// Island art and characters.
// ---------- Drawing ----------

// The island's ground is drawn once into a big image (see bakedGround) and stamped each frame.
const BANK = 22;
const SEA_RIPPLES = Array.from({length:90}, (_,i) => [(i*397)%W, (i*233)%H]).filter(([x,y]) => !land.some(([cx,cy,r]) => d2(x,y,cx,cy) < r+80));
function landPath(grow, dy=0){ ctx.beginPath(); land.forEach(([x,y,r]) => { ctx.moveTo(x+r+grow, y+dy); ctx.arc(x, y+dy, r+grow, 0, Math.PI*2); }); }
function drawGroundStatic(){
  const L = LOOK.light;
  ctx.fillStyle = C.sea; ctx.fillRect(0,0,W,H);
  ctx.fillStyle = '#97cfd9'; landPath(150); ctx.fill();
  ctx.fillStyle = '#a5d8df'; landPath(108); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.55)'; landPath(60, BANK+6); ctx.fill();
  ctx.fillStyle = '#d8c290'; landPath(52, BANK); ctx.fill();
  // the sandy bank has a visible side, so the island sits up out of the water
  for (let i=BANK; i>0; i-=2) { ctx.fillStyle = mixHex('#cdb07c', '#9c8158', i/BANK); landPath(44, i); ctx.fill(); }
  ctx.fillStyle = C.sand; landPath(44); ctx.fill();
  for (let i=8; i>0; i-=2) { ctx.fillStyle = mixHex('#86ae5e', '#5f8a45', i/8); landPath(2, i); ctx.fill(); }
  ctx.fillStyle = C.grass; landPath(0); ctx.fill();
  ctx.save(); landPath(0); ctx.clip();
  const R = rng(9);
  // rolling ground, lit from one side
  for (let i=0;i<46;i++){ const x = R()*W, y = R()*H, r = 140 + R()*220;
    const a = ctx.createRadialGradient(x+L.x*r*0.35, y+L.y*r*0.35, 0, x, y, r);
    a.addColorStop(0, 'rgba(255,240,190,.16)'); a.addColorStop(1, 'rgba(255,240,190,0)'); ctx.fillStyle = a; ctx.fillRect(x-r,y-r,2*r,2*r);
    const b = ctx.createRadialGradient(x-L.x*r*0.5, y-L.y*r*0.5, 0, x-L.x*r*0.3, y-L.y*r*0.3, r*0.8);
    b.addColorStop(0, 'rgba(50,60,90,.1)'); b.addColorStop(1, 'rgba(50,60,90,0)'); ctx.fillStyle = b; ctx.fillRect(x-r*1.5,y-r*1.5,3*r,3*r); }
  for (const p of patches) { ctx.beginPath(); ctx.ellipse(p.x,p.y,p.rx,p.ry,p.a,0,Math.PI*2); ctx.fillStyle=p.c; ctx.globalAlpha=.4; ctx.fill(); }
  ctx.globalAlpha = 1;
  for (let i=0;i<7000;i++){ const x = R()*W, y = R()*H, l = 5 + R()*6, t = R()*2-1;
    ctx.strokeStyle = lit(C.grass, t*0.45); ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(x,y); ctx.lineTo(x+(R()-0.5)*4, y-l); ctx.stroke(); }
  ctx.restore();
  ctx.strokeStyle = lit(C.grass, 0.9); ctx.lineWidth = 2.5; landPath(0); ctx.stroke();
  // paths are worn slightly into the grass
  ctx.lineCap='round'; ctx.lineJoin='round';
  const strokePaths = (w, col, dx=0, dy=0) => { ctx.strokeStyle = col; ctx.lineWidth = w; for (const [a,c,b] of PATHS){ ctx.beginPath(); ctx.moveTo(a[0]+dx,a[1]+dy); ctx.quadraticCurveTo(c[0]+dx,c[1]+dy,b[0]+dx,b[1]+dy); ctx.stroke(); } };
  strokePaths(46, lit(C.grass, -0.8)); strokePaths(38, '#e1cfa0'); strokePaths(20, 'rgba(255,244,214,.45)', L.x*4, L.y*4);
  for (let i=0;i<pathPts.length;i+=2){ const [x,y]=pathPts[i]; circ(x+((i*7)%15)-7, y+((i*11)%11)-5, 2.4, '#c7b386'); }
  for (const d of decos) drawDeco(d,0);
  for (const f of flowers) circ(f.x,f.y,3.2,f.c);
  for (const d of tallDecos) drawCattail(d,0);
  for (const s of [{x:1000,y:700},{x:1500,y:1050},{x:420,y:1100},{x:1700,y:420}]) drawTuft(s.x,s.y,0,0);
  if (S.day>=2) drawPicnic(0);
  drawMoundStones();
  // the pond sits in a hollow: a dark rim, water that reflects the sky, and the bank's shadow on the water
  ell(pond.x, pond.y+5, pond.r+22, (pond.r+22)*0.64, lit(C.grass, -0.9));
  ell(pond.x, pond.y, pond.r+12, (pond.r+12)*0.62, '#8a7556');
  ctx.save(); ctx.beginPath(); ctx.ellipse(pond.x,pond.y,pond.r,pond.r*0.6,0,0,Math.PI*2); ctx.clip();
  const wg = ctx.createLinearGradient(0, pond.y-pond.r*0.6, 0, pond.y+pond.r*0.6); wg.addColorStop(0,'#cfe6df'); wg.addColorStop(1,'#5fa3b0');
  ctx.fillStyle = wg; ctx.fillRect(pond.x-pond.r, pond.y-pond.r, pond.r*2, pond.r*2);
  for (let i=0;i<6;i++) ell(pond.x-pond.r+30+i*38, pond.y-pond.r*0.6+6, 30, 18, 'rgba(95,140,80,.32)');
  ctx.beginPath(); ctx.ellipse(pond.x,pond.y,pond.r,pond.r*0.6,0,0,Math.PI*2); ctx.ellipse(pond.x+L.x*12, pond.y+L.y*10, pond.r, pond.r*0.6, 0, 0, Math.PI*2);
  ctx.fillStyle = 'rgba(20,34,46,.3)'; ctx.fill('evenodd');
  ctx.restore();
  [[-60,-20],[50,15],[20,-35]].forEach(([dx,dy]) => { ell(pond.x+dx,pond.y+dy,16,10,'#7fb35c'); });
  circ(pond.x+50,pond.y+12,4,'#f6c6d0');
}
function drawGroundLive(t){
  ctx.strokeStyle = 'rgba(255,255,255,.28)'; ctx.lineWidth = 3; ctx.lineCap='round';
  for (let i=0;i<SEA_RIPPLES.length;i++){ const [x,y] = SEA_RIPPLES[i], o = Math.sin(t*0.8+i)*10; ctx.beginPath(); ctx.moveTo(x+o,y); ctx.quadraticCurveTo(x+o+14,y-6,x+o+28,y); ctx.stroke(); }
  for (const p of S.prints) {
    ctx.globalAlpha = Math.max(0, 0.45*(1 - p.t/9));
    ctx.save(); ctx.translate(p.x,p.y); ctx.rotate(p.a);
    ell(0,0,4.5,3,'#b89c66'); circ(5,-2.5,1.3,'#b89c66'); circ(6,0,1.3,'#b89c66'); circ(5,2.5,1.3,'#b89c66');
    ctx.restore();
  }
  ctx.globalAlpha = 1;
  ctx.save(); ctx.beginPath(); ctx.ellipse(pond.x,pond.y,pond.r,pond.r*0.6,0,0,Math.PI*2); ctx.clip();
  ctx.strokeStyle='rgba(255,255,255,.45)'; ctx.lineWidth=2;
  for (let i=0;i<3;i++){ const k=((t*0.3+i/3)%1); ctx.globalAlpha=1-k; ctx.beginPath(); ctx.ellipse(pond.x-30,pond.y+10,10+k*50,(10+k*50)*0.55,0,0,Math.PI*2); ctx.stroke(); }
  ctx.globalAlpha = 1;
  ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = 2;
  for (let i=0;i<4;i++){ const o = Math.sin(t*1.2+i)*6; ctx.beginPath(); ctx.moveTo(pond.x-50+i*22+o, pond.y+26+i*5); ctx.lineTo(pond.x-28+i*22+o, pond.y+26+i*5); ctx.stroke(); }
  ctx.restore();
  styled(sealRock.x, sealRock.y, [-72,-46,62,20], () => drawSeal(t), {key:'seal', fps:10});
  drawFish(t);
}

function drawDeco(d,t){
  const {x,y,v} = d;
  if (d.k==='mush'){
    const red = v > 0.5;
    ell(x,y,8,3,'rgba(52,67,58,.14)');
    ctx.fillStyle='#f3ead6'; ctx.beginPath(); ctx.roundRect(x-3,y-10,6,10,2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(x,y-10,10,7,0,Math.PI,0); ctx.fillStyle= red ? '#e0705a' : '#c99b6d'; ctx.fill();
    if (red){ circ(x-4,y-13,1.6,'#fff6e8'); circ(x+3,y-15,1.4,'#fff6e8'); circ(x+5,y-11,1.2,'#fff6e8'); }
    if (v > 0.75){ ctx.fillStyle='#f3ead6'; ctx.beginPath(); ctx.roundRect(x+9,y-6,4,6,2); ctx.fill(); ctx.beginPath(); ctx.ellipse(x+11,y-6,6,4,0,Math.PI,0); ctx.fillStyle= red ? '#e0705a' : '#c99b6d'; ctx.fill(); }
  } else if (d.k==='fern'){
    ctx.strokeStyle = v>0.5 ? '#5f9150' : '#6f9e55'; ctx.lineWidth=3; ctx.lineCap='round';
    for (let i=-2;i<=2;i++){ const sw = Math.sin(t*1.5+x)*1.5; ctx.beginPath(); ctx.moveTo(x,y); ctx.quadraticCurveTo(x+i*10+sw,y-14,x+i*18+sw,y-10+Math.abs(i)*3); ctx.stroke(); }
  } else if (d.k==='bloom'){
    const col = ['#f6c6d0','#ffe08a','#d9c8f2','#fff6e8'][Math.floor(v*4)];
    ctx.strokeStyle='#6f9e55'; ctx.lineWidth=2;
    for (let i=0;i<4;i++){ const fx=x+(i-1.5)*9, fy=y-12-(i%2)*6; ctx.beginPath(); ctx.moveTo(fx,y); ctx.lineTo(fx,fy); ctx.stroke();
      for (let k=0;k<5;k++){ const a=k/5*Math.PI*2+t*0.2; circ(fx+Math.cos(a)*3.4,fy+Math.sin(a)*3.4,2.6,col); } circ(fx,fy,1.8,'#f4b85a'); }
  } else if (d.k==='star'){
    ctx.save(); ctx.translate(x,y); ctx.rotate(v*6); ctx.fillStyle = v>0.5 ? '#ec9478' : '#f2b25c';
    ctx.beginPath(); for (let i=0;i<10;i++){ const r = i%2 ? 3.5 : 9; const a = i/10*Math.PI*2; ctx.lineTo(Math.cos(a)*r, Math.sin(a)*r); } ctx.closePath(); ctx.fill(); ctx.restore();
  } else if (d.k==='pebble'){
    ell(x,y,6,4,'#c4c0b0'); ell(x+8,y+3,4,3,'#d6d2c4'); ell(x-6,y+4,3,2.4,'#b4b0a2');
  } else if (d.k==='drift'){
    ctx.save(); ctx.translate(x,y); ctx.rotate(v*3-1.5);
    ctx.fillStyle='#cbb89c'; ctx.beginPath(); ctx.roundRect(-26,-5,52,10,5); ctx.fill();
    ctx.strokeStyle='#ab977b'; ctx.lineWidth=1.5; ctx.beginPath(); ctx.moveTo(-18,-1); ctx.lineTo(14,-1); ctx.moveTo(-10,2); ctx.lineTo(20,2); ctx.stroke();
    ctx.fillStyle='#cbb89c'; ctx.beginPath(); ctx.moveTo(8,-4); ctx.lineTo(18,-14); ctx.lineTo(21,-12); ctx.lineTo(13,-3); ctx.fill();
    ctx.restore();
  } else if (d.k==='weed'){
    ctx.strokeStyle='#6b8f5a'; ctx.lineWidth=2.5; ctx.lineCap='round';
    for (let i=0;i<3;i++){ ctx.beginPath(); ctx.moveTo(x-8+i*6,y); ctx.bezierCurveTo(x-14+i*6,y-4,x-2+i*6,y-8,x-10+i*7,y-12); ctx.stroke(); }
  }
}
function drawCattail(d,t){
  const sw = Math.sin(t*1.3 + d.v*6)*3;
  ctx.strokeStyle='#6f9e55'; ctx.lineWidth=2.5; ctx.lineCap='round';
  ctx.beginPath(); ctx.moveTo(d.x,d.y); ctx.quadraticCurveTo(d.x+sw*0.3,d.y-20,d.x+sw,d.y-40-d.v*10); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(d.x+3,d.y); ctx.quadraticCurveTo(d.x+10,d.y-14,d.x+14,d.y-22); ctx.stroke();
  ctx.save(); ctx.translate(d.x+sw, d.y-40-d.v*10); ctx.rotate(sw*0.02);
  ctx.fillStyle='#8a5a3c'; ctx.beginPath(); ctx.roundRect(-3,-12,6,14,3); ctx.fill(); ctx.restore();
}
function drawHouseFx(t){
  const {x,y} = house;
  for (let i=0;i<4;i++){ const k=((t*0.35)+i/4)%1; ctx.globalAlpha = 0.5*(1-k); circ(x+21+Math.sin(k*6+i)*8, y-116-k*70, 6+k*10, '#fffaf0'); }
  if (S.quests.berry.state==='done') for (let i=0;i<3;i++){ ctx.globalAlpha=.5; circ(x-28+i*3,y-42-((t*12+i*5)%14),2,'#fffaf0'); }
  ctx.globalAlpha = 1;
}
function drawHouse(t){
  const {x,y} = house;
  shadow(x,y+4,58);
  // stump
  ctx.fillStyle='#9a7556'; ctx.beginPath(); ctx.roundRect(x-44,y-76,88,80,14); ctx.fill();
  ctx.strokeStyle='#86644a'; ctx.lineWidth=2;
  for (const dx of [-30,-12,20,34]){ ctx.beginPath(); ctx.moveTo(x+dx,y-66); ctx.lineTo(x+dx,y-4); ctx.stroke(); }
  // roots
  ctx.fillStyle='#9a7556'; ctx.beginPath(); ctx.moveTo(x-44,y-10); ctx.quadraticCurveTo(x-60,y+2,x-58,y+4); ctx.lineTo(x-38,y+2); ctx.fill();
  ctx.beginPath(); ctx.moveTo(x+44,y-10); ctx.quadraticCurveTo(x+60,y+2,x+56,y+4); ctx.lineTo(x+38,y+2); ctx.fill();
  // mossy roof
  ell(x,y-78,52,20,'#6f9e55'); ell(x-10,y-84,30,10,'#86b665');
  circ(x+30,y-88,5,'#e0705a'); circ(x+28,y-90,1.4,'#fff6e8');
  // chimney + smoke
  ctx.fillStyle='#b8b6a8'; ctx.beginPath(); ctx.roundRect(x+14,y-110,14,28,3); ctx.fill();
  // door
  ctx.fillStyle='#5e4636'; ctx.beginPath(); ctx.moveTo(x-6,y+2); ctx.lineTo(x-6,y-30); ctx.arc(x+8,y-30,14,Math.PI,0); ctx.lineTo(x+22,y+2); ctx.fill();
  circ(x+17,y-14,2,'#f4b85a');
  // window
  circ(x-26,y-44,10,'#f6dc8e'); ctx.strokeStyle='#5e4636'; ctx.lineWidth=3; ctx.beginPath(); ctx.arc(x-26,y-44,10,0,Math.PI*2); ctx.moveTo(x-36,y-44); ctx.lineTo(x-16,y-44); ctx.moveTo(x-26,y-54); ctx.lineTo(x-26,y-34); ctx.stroke();
  // pie on the sill once baked
  if (S.quests.berry.state==='done'){ ell(x-26,y-32,10,4,'#d9a35c'); ell(x-26,y-34,8,3,'#5a6fb8'); }
  // little sign
  ctx.fillStyle='#c9a77d'; ctx.beginPath(); ctx.roundRect(x+34,y-30,26,16,3); ctx.fill(); ctx.fillStyle='#86644a'; ctx.fillRect(x+45,y-14,4,16);
  ctx.fillStyle='#5e4636'; ctx.font='700 9px Andika, sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText('HAZEL', x+47, y-22);
}
function drawNest(){
  const {x,y} = nest;
  ell(x,y,30,13,'#9a7556'); ell(x,y-2,22,8,'#7d5c43');
  ctx.strokeStyle='#b89170'; ctx.lineWidth=2;
  for (let i=0;i<9;i++){ const a=i/9*Math.PI*2; ctx.beginPath(); ctx.moveTo(x+Math.cos(a)*18,y+Math.sin(a)*7); ctx.lineTo(x+Math.cos(a+0.6)*31,y+Math.sin(a+0.6)*13); ctx.stroke(); }
  if (S.quests.duck.state==='done') { circ(x-5,y-4,4,'#fdf7e8'); }
}
function drawSeal(t){
  const {x,y} = sealRock;
  ctx.beginPath(); ctx.ellipse(x,y+6,70+Math.sin(t)*4,24,0,0,Math.PI*2); ctx.fillStyle='rgba(255,255,255,.4)'; ctx.fill();
  ell(x,y,58,22,'#a9a79a'); ell(x-12,y-8,36,12,'#bdbbae');
  const lift = Math.max(0, Math.sin(t*0.6))*6;
  ell(x+4,y-18,30,12,'#8d9aa3');
  circ(x+30,y-26-lift,11,'#8d9aa3');
  circ(x+34,y-29-lift,1.8,C.ink); circ(x+40,y-24-lift,2,'#3b2a22');
  ctx.strokeStyle='rgba(52,67,58,.5)'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(x+39,y-22-lift); ctx.lineTo(x+48,y-23-lift); ctx.stroke();
  ctx.save(); ctx.translate(x-22,y-16); ctx.rotate(-0.3+Math.sin(t*1.8)*0.25); ell(-8,0,12,5,'#7a8892'); ctx.restore();
  circ(x+10,y-18,1.5,'#7a8892'); circ(x-2,y-20,1.5,'#7a8892');
}
function drawFish(t){
  const k = (t % 7) / 1.1; if (k > 1) return;
  const x0 = 2180, y0 = 1460;
  const fx = x0 + k*70, fy = y0 - Math.sin(k*Math.PI)*46;
  if (k < 0.12 || k > 0.88) { ctx.strokeStyle='rgba(255,255,255,.7)'; ctx.lineWidth=2; ctx.beginPath(); ctx.ellipse(k<0.5?x0:x0+70,y0,12,4,0,0,Math.PI*2); ctx.stroke(); }
  ctx.save(); ctx.translate(fx,fy); ctx.rotate((k-0.5)*1.8);
  ell(0,0,10,4.5,'#f2a65a'); ctx.fillStyle='#f2a65a'; ctx.beginPath(); ctx.moveTo(-8,0); ctx.lineTo(-15,-5); ctx.lineTo(-15,5); ctx.fill(); circ(5,-1,1.2,C.ink);
  ctx.restore();
}
function drawGull(g,t){
  const flap = Math.sin(g.p*6)*7;
  const y = g.y + Math.sin(g.p*0.8)*20;
  ell(g.x+30,y+120,10,3,'rgba(52,67,58,.1)');
  ctx.strokeStyle='#fffaf0'; ctx.lineWidth=3.5; ctx.lineCap='round'; ctx.lineJoin='round';
  ctx.beginPath(); ctx.moveTo(g.x-16,y-flap); ctx.quadraticCurveTo(g.x-8,y-6-flap*0.4,g.x,y); ctx.quadraticCurveTo(g.x+8,y-6-flap*0.4,g.x+16,y-flap); ctx.stroke();
  ctx.strokeStyle='rgba(52,67,58,.35)'; ctx.lineWidth=1.2; ctx.stroke();
}
function drawPine(x,y,s){
  shadow(x,y+4,26*s);
  ctx.fillStyle='#8c6a4d'; ctx.fillRect(x-5*s,y-18*s,10*s,20*s);
  [['#4f8250',0,46,34],['#5d8f5a',-26,38,28],['#6c9c62',-50,28,22]].forEach(([c,dy,w,h]) => {
    ctx.fillStyle=c; ctx.beginPath(); ctx.moveTo(x-w*s,y+(dy-12)*s); ctx.quadraticCurveTo(x,y+(dy-4)*s,x+w*s,y+(dy-12)*s); ctx.lineTo(x,y+(dy-12-h*1.6)*s); ctx.closePath(); ctx.fill();
    ctx.strokeStyle='rgba(30,60,36,.35)'; ctx.lineWidth=1.6*s; ctx.beginPath(); ctx.moveTo(x-w*0.55*s,y+(dy-14)*s); ctx.lineTo(x-w*0.2*s,y+(dy-12-h*0.5)*s); ctx.moveTo(x+w*0.55*s,y+(dy-14)*s); ctx.lineTo(x+w*0.2*s,y+(dy-12-h*0.5)*s); ctx.stroke();
  });
}
function drawBirch(x,y,s,t){
  shadow(x,y+4,28*s);
  ctx.fillStyle='#f3efe6'; ctx.beginPath(); ctx.roundRect(x-5*s,y-56*s,10*s,60*s,4); ctx.fill();
  ctx.fillStyle='#5e5a52'; [[-12,6],[-26,4],[-40,5],[-50,3]].forEach(([dy,w]) => ctx.fillRect(x-5*s,y+dy*s,w*s,2*s));
  const sw = Math.sin(t*0.9+x)*1.5;
  circ(x-14*s+sw,y-66*s,18*s,'#a7c96f'); circ(x+14*s+sw,y-70*s,18*s,'#a7c96f'); circ(x+sw,y-86*s,20*s,'#a7c96f');
  circ(x-4*s+sw,y-82*s,10*s,'#c2dc87'); circ(x+12*s+sw,y-68*s,7*s,'#c2dc87');
}
function drawTree(tr){
  const {x,y,s,hue,kind} = tr;
  if (kind==='pine') return drawPine(x,y,s);
  if (kind==='birch') return drawBirch(x,y,s,S.t);
  shadow(x,y+4,34*s);
  ctx.fillStyle='#9a7556'; ctx.beginPath(); ctx.roundRect(x-6*s,y-36*s,12*s,40*s,4); ctx.fill();
  const g1 = hue>0.5 ? '#6f9e55' : '#7aa75c', g2 = hue>0.5 ? '#86b665' : '#93bf6c';
  circ(x-18*s,y-50*s,26*s,g1); circ(x+18*s,y-52*s,26*s,g1); circ(x,y-72*s,30*s,g1);
  circ(x-6*s,y-66*s,18*s,g2); circ(x+12*s,y-56*s,12*s,g2);
  if (hue > 0.78) [[-22,-48],[14,-62],[-4,-84],[24,-46],[-10,-56]].forEach(([dx,dy]) => circ(x+dx*s,y+dy*s,3.2*s,'#e86f5c'));
  else if (hue < 0.2) [[-20,-52],[16,-60],[0,-86],[22,-44]].forEach(([dx,dy]) => circ(x+dx*s,y+dy*s,3*s,'#fbe3ea'));
  leafCurls(x, y, s, [[-26,-58],[-12,-80],[8,-90],[22,-64],[-30,-44],[4,-46]], hue>0.5 ? '#a3c97d' : '#b0d488');
}
function leafCurls(x, y, s, spots, col){
  ctx.strokeStyle = col; ctx.lineWidth = 2*s; ctx.lineCap = 'round';
  for (const [dx,dy] of spots){ ctx.beginPath(); ctx.arc(x+dx*s, y+dy*s, 5*s, Math.PI*1.1, Math.PI*1.75); ctx.stroke(); }
  ctx.strokeStyle = 'rgba(52,80,46,.35)';
  for (const [dx,dy] of spots){ ctx.beginPath(); ctx.arc(x+(dx+6)*s, y+(dy+12)*s, 4*s, Math.PI*0.15, Math.PI*0.8); ctx.stroke(); }
}
function drawBigTree(t){
  const {x,y} = bigTree;
  shadow(x,y+22,80);
  ctx.fillStyle='#8c6a4d'; ctx.beginPath(); ctx.moveTo(x-30,y+24); ctx.quadraticCurveTo(x-18,y-40,x-22,y-80); ctx.lineTo(x+22,y-80); ctx.quadraticCurveTo(x+18,y-40,x+32,y+24); ctx.closePath(); ctx.fill();
  ell(x+4,y-52,9,12,'#5e4636');
  const sway = Math.sin(t*0.7)*2;
  [[-60,-110,52],[60,-112,52],[0,-150,62],[-30,-170,40],[40,-165,42]].forEach(([dx,dy,r]) => circ(x+dx+sway,y+dy,r,'#5f9150'));
  [[-34,-140,30],[30,-150,26],[0,-175,22]].forEach(([dx,dy,r]) => circ(x+dx+sway,y+dy,r,'#78aa5e'));
  leafCurls(x+sway, y, 1.6, [[-50,-82],[-30,-110],[0,-118],[26,-104],[50,-78],[-12,-92],[38,-90]], '#93c06e');
}
function drawRock(r){ shadow(r.x,r.y+4,r.s); ell(r.x,r.y-r.s*0.3,r.s,r.s*0.7,'#b8b6a8'); ell(r.x-r.s*0.25,r.y-r.s*0.5,r.s*0.45,r.s*0.25,'#cfcdc0'); }
function drawBush(b,t){
  shadow(b.x,b.y+2,30);
  circ(b.x-14,b.y-14,18,'#6f9e55'); circ(b.x+14,b.y-14,18,'#6f9e55'); circ(b.x,b.y-26,20,'#7fae5f');
  if (b.berry) [[-14,-16],[10,-10],[2,-30],[16,-24],[-6,-6]].forEach(([dx,dy],i) => circ(b.x+dx,b.y+dy+Math.sin(t*2+i)*0.6,4.2,'#5a6fb8'));
}
function drawTuft(x,y,t,wig){
  ctx.strokeStyle='#5f9150'; ctx.lineWidth=4; ctx.lineCap='round';
  for (let i=-3;i<=3;i++){ const w = wig*Math.sin(t*14+i)*5; ctx.beginPath(); ctx.moveTo(x+i*7,y); ctx.quadraticCurveTo(x+i*8+w,y-22,x+i*10+w*1.6,y-38-Math.abs(i)*-2); ctx.stroke(); }
  ctx.strokeStyle='#86b665';
  for (let i=-2;i<=2;i++){ const w = wig*Math.sin(t*14+i+1)*5; ctx.beginPath(); ctx.moveTo(x+i*9,y); ctx.quadraticCurveTo(x+i*9+w,y-18,x+i*11+w*1.4,y-30); ctx.stroke(); }
}

function drawOtter(P,t){
  const bob = P.moving ? Math.abs(Math.sin(P.walk))*3 : Math.sin(t*2)*1;
  const x=P.x, y=P.y;
  shadow(x,y+2,22);
  const sq = P.moving ? Math.sin(P.walk*2)*0.05 : Math.sin(t*2.2)*0.018;
  ctx.save(); ctx.translate(x,y-bob); ctx.scale(P.face*(1-sq*0.6),1+sq);
  // tail
  ctx.fillStyle='#8a5a3c'; ctx.beginPath(); ctx.moveTo(-14,-8); ctx.quadraticCurveTo(-36,-4+Math.sin(t*4)*3,-34,6); ctx.quadraticCurveTo(-24,0,-10,0); ctx.fill();
  // feet
  const st = P.moving ? Math.sin(P.walk)*4 : 0;
  ell(-6+st,0,6,4,'#6e4630'); ell(8-st,0,6,4,'#6e4630');
  // body
  ell(0,-16,17,19,'#9b6845');
  ell(3,-14,10,13,'#e9cfa8');
  // head
  circ(6,-42,15,'#9b6845');
  ell(13,-38,9,7,'#e9cfa8');
  circ(-4,-53,4.5,'#9b6845'); circ(14,-55,4.5,'#9b6845');
  circ(-4,-53,2,'#6e4630'); circ(14,-55,2,'#6e4630');
  const blink = (t%4) > 3.85;
  if (blink){ ctx.strokeStyle=C.ink; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(6,-45); ctx.lineTo(12,-45); ctx.stroke(); }
  else { circ(9,-45,2.6,C.ink); circ(9.8,-45.8,0.9,'#fff'); }
  circ(20,-40,2.6,'#3b2a22');
  ctx.strokeStyle='rgba(52,67,58,.55)'; ctx.lineWidth=1;
  ctx.beginPath(); ctx.moveTo(18,-37); ctx.lineTo(28,-38); ctx.moveTo(18,-36); ctx.lineTo(27,-33); ctx.stroke();
  circ(4,-38,3,'rgba(240,150,140,.45)');
  // scarf
  ctx.fillStyle='#f4b85a'; ctx.beginPath(); ctx.roundRect(-8,-31,22,6,3); ctx.fill();
  ctx.beginPath(); ctx.moveTo(-6,-28); ctx.lineTo(-14,-18+Math.sin(t*5)*2); ctx.lineTo(-8,-18); ctx.closePath(); ctx.fill();
  // Digby's gift: a little lantern Pip carries underground
  if (S.hasLantern && S.scene==='cave') {
    const sw = Math.sin(t*3 + (P.moving ? P.walk : 0))*0.25;
    ctx.save(); ctx.translate(16,-20); ctx.rotate(sw);
    ctx.strokeStyle='#5e4636'; ctx.lineWidth=1.6; ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(0,6); ctx.stroke();
    ctx.fillStyle='#ffe08a'; ctx.beginPath(); ctx.roundRect(-5,6,10,12,3); ctx.fill();
    ctx.strokeStyle='#5e4636'; ctx.lineWidth=1.4; ctx.strokeRect(-5,6,10,12);
    circ(0,12,2.6,'#7ff0dc');
    ctx.restore();
  }
  ctx.restore();
}
function drawDuck(x,y,s,face,t,mama){
  ctx.save(); ctx.translate(x,y); ctx.scale(face||1,1);
  if (!mama || true) shadow(0,2,16*s);
  const body = mama ? '#fffdf6' : '#f6d55c', dark = mama ? '#e8e3d4' : '#e9bf3f';
  const bob = Math.sin(t*3 + x)*1.2;
  ell(0,-12*s+bob,18*s,12*s,body);
  ell(-6*s,-12*s+bob,9*s,6*s,dark);
  circ(10*s,-26*s+bob,9*s,body);
  ctx.fillStyle='#f09a3e'; ctx.beginPath(); ctx.moveTo(17*s,-28*s+bob); ctx.lineTo(26*s,-25*s+bob); ctx.lineTo(17*s,-22*s+bob); ctx.fill();
  if (blink(t, x*0.013)) { ctx.strokeStyle=C.ink; ctx.lineWidth=1.4; ctx.beginPath(); ctx.moveTo(10*s,-28*s+bob); ctx.lineTo(14*s,-28*s+bob); ctx.stroke(); } else circ(12*s,-28*s+bob,1.8*s+0.4,C.ink);
  if (mama){ ctx.fillStyle='#f6c6d0'; ctx.beginPath(); ctx.arc(6*s,-34*s+bob,3*s,0,Math.PI*2); ctx.fill(); }
  ctx.restore();
}
function drawSwimDuck(x,y,face,t,s=1){
  ctx.save(); ctx.translate(x,y); ctx.scale(face*s,s);
  ctx.strokeStyle='rgba(255,255,255,.5)'; ctx.lineWidth=1.5; ctx.beginPath(); ctx.ellipse(0,0,14,4,0,0,Math.PI*2); ctx.stroke();
  ell(0,-4,10,6,'#f6d55c'); circ(6,-11,5,'#f6d55c');
  ctx.fillStyle='#f09a3e'; ctx.beginPath(); ctx.moveTo(10,-12); ctx.lineTo(15,-10); ctx.lineTo(10,-9); ctx.fill();
  circ(7,-12,1.2,C.ink);
  ctx.restore();
}
function drawMamaSwim(m, t){
  ctx.save(); ctx.translate(m.x, m.y); ctx.scale(m.face||1, 1);
  ctx.strokeStyle='rgba(255,255,255,.6)'; ctx.lineWidth=2; ctx.beginPath(); ctx.ellipse(0,0,26,7,0,0,Math.PI*2); ctx.stroke();
  ell(0,-8,20,11,'#fffdf6'); ell(-6,-9,10,6,'#e8e3d4'); circ(12,-22,10,'#fffdf6');
  ctx.fillStyle='#f09a3e'; ctx.beginPath(); ctx.moveTo(20,-24); ctx.lineTo(29,-21); ctx.lineTo(20,-18); ctx.fill();
  circ(14,-24,1.8,C.ink); circ(8,-30,3,'#f6c6d0');
  ctx.restore();
}
function drawPicnic(t){
  // Hazel's breakfast picnic outside her house on Day 2
  const x = 830, y = 1100;
  ctx.save(); ctx.translate(x,y); ctx.rotate(-0.08);
  ctx.fillStyle='#fbf3e4'; ctx.fillRect(-48,-26,96,52);
  ctx.fillStyle='rgba(216,87,58,.75)';
  for (let i=0;i<6;i++) ctx.fillRect(-48+i*16, -26, 8, 52);
  for (let j=0;j<4;j++) ctx.fillRect(-48, -26+j*14, 96, 7);
  ctx.restore();
  ell(x+8, y+2, 18, 8, '#d9a35c'); ell(x+8, y, 15, 6, '#5a6fb8');
  ctx.fillStyle='#fbf3e4'; ctx.beginPath(); ctx.moveTo(x+8,y); ctx.lineTo(x+24,y-4); ctx.lineTo(x+22,y+6); ctx.closePath(); ctx.fill();
  circ(x-22, y-6, 7, '#fbf8ef'); circ(x-22, y-6, 4.5, '#b38a63');
  for (let i=0;i<2;i++){ const k = ((t*0.5)+i/2)%1; ctx.globalAlpha = 0.45*(1-k); circ(x-22+Math.sin(k*6)*3, y-14-k*18, 2.5+k*2, '#fffaf0'); }
  ctx.globalAlpha = 1;
}
function drawHog(n,t){
  const {x,y} = n; shadow(x,y+2,24);
  const bob = Math.sin(t*2.2)*1;
  ctx.save(); ctx.translate(x,y+bob);
  ctx.fillStyle='#7a5a44';
  for (let i=0;i<9;i++){ const a = Math.PI*(0.95+i*0.11); ctx.beginPath(); ctx.moveTo(Math.cos(a)*16-2,-14+Math.sin(a)*14); ctx.lineTo(Math.cos(a)*30-2,-14+Math.sin(a)*26); ctx.lineTo(Math.cos(a+0.12)*16-2,-14+Math.sin(a+0.12)*14); ctx.fill(); }
  ell(-2,-14,22,16,'#8f6b50');
  ell(10,-12,14,11,'#ecd2b0');
  circ(23,-12,3.2,'#3b2a22');
  if (blink(t, 1.7)) { ctx.strokeStyle=C.ink; ctx.lineWidth=1.6; ctx.beginPath(); ctx.moveTo(9.5,-16); ctx.lineTo(14.5,-16); ctx.stroke(); } else { circ(12,-16,2.4,C.ink); circ(12.8,-16.8,0.8,'#fff'); }
  circ(6,-24,4,'#ecd2b0');
  ell(-8,-1,5,3,'#6e4630'); ell(8,-1,5,3,'#6e4630');
  // apron
  ctx.fillStyle='#fff6e8'; ctx.beginPath(); ctx.roundRect(2,-8,10,8,2); ctx.fill();
  ctx.restore();
}
function drawCrab(n,t){
  const {x,y} = n; shadow(x,y+2,26);
  const sn = Math.sin(t*3)*0.25;
  ctx.save(); ctx.translate(x,y);
  ctx.strokeStyle='#c4583e'; ctx.lineWidth=3; ctx.lineCap='round';
  for (const sd of [-1,1]) for (let i=0;i<3;i++){ ctx.beginPath(); ctx.moveTo(sd*12,-8+i*3); ctx.lineTo(sd*24,-2+i*4); ctx.lineTo(sd*26,4+i*2); ctx.stroke(); }
  ell(0,-12,20,13,'#e07355');
  ell(-4,-16,9,5,'#ec9478');
  for (const sd of [-1,1]){ ctx.save(); ctx.translate(sd*22,-22); ctx.rotate(sd*(-0.4+sn)); ell(0,-6,8,7,'#e07355'); ctx.fillStyle=C.sand; ctx.beginPath(); ctx.moveTo(sd*2,-8); ctx.lineTo(sd*9,-12); ctx.lineTo(sd*6,-4); ctx.fill(); ctx.restore(); }
  ctx.strokeStyle='#c4583e'; ctx.lineWidth=2.5; ctx.beginPath(); ctx.moveTo(-6,-22); ctx.lineTo(-7,-31); ctx.moveTo(6,-22); ctx.lineTo(7,-31); ctx.stroke();
  circ(-7,-33,4,'#fff'); circ(7,-33,4,'#fff'); circ(-6.4,-33,2,C.ink); circ(7.6,-33,2,C.ink);
  if (S.quests.shell.state==='done') {
    ctx.fillStyle='#f7cdb2'; ctx.strokeStyle='#c7835f'; ctx.lineWidth=2.2; ctx.lineCap='round';
    ctx.beginPath(); ctx.moveTo(-16,-18); ctx.bezierCurveTo(-16,-34,4,-36,6,-24); ctx.bezierCurveTo(6,-18,-4,-18,-4,-24); ctx.bezierCurveTo(-4,-28,0,-28,0,-25); ctx.fill(); ctx.stroke();
  }
  // white eyebrows: grandpa
  ctx.strokeStyle='#fffaf0'; ctx.lineWidth=2.5; ctx.beginPath(); ctx.moveTo(-11,-39); ctx.lineTo(-4,-38); ctx.moveTo(4,-38); ctx.lineTo(11,-39); ctx.stroke();
  ctx.restore();
}
function drawOwl(n,t){
  const {x,y} = n;
  const tilt = Math.sin(t*0.9)*0.08;
  ctx.save(); ctx.translate(x,y); ctx.rotate(tilt);
  ell(0,-18,17,21,'#a58467');
  ell(0,-12,11,13,'#e8d8bf');
  for (let i=0;i<3;i++){ ctx.strokeStyle='#c8b090'; ctx.lineWidth=1.5; ctx.beginPath(); ctx.arc(0,-16+i*6,4,0.2,Math.PI-0.2); ctx.stroke(); }
  ctx.fillStyle='#a58467'; ctx.beginPath(); ctx.moveTo(-14,-34); ctx.lineTo(-11,-46); ctx.lineTo(-5,-36); ctx.moveTo(14,-34); ctx.lineTo(11,-46); ctx.lineTo(5,-36); ctx.fill();
  circ(-7,-30,7,'#fffaf0'); circ(7,-30,7,'#fffaf0');
  const blink = (t%5) > 4.8;
  if (blink){ ctx.strokeStyle=C.ink; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(-11,-30); ctx.lineTo(-3,-30); ctx.moveTo(3,-30); ctx.lineTo(11,-30); ctx.stroke(); }
  else { circ(-7,-30,3.4,C.ink); circ(7,-30,3.4,C.ink); circ(-6,-31,1,'#fff'); circ(8,-31,1,'#fff'); }
  ctx.fillStyle='#f0a24a'; ctx.beginPath(); ctx.moveTo(-3,-25); ctx.lineTo(3,-25); ctx.lineTo(0,-20); ctx.fill();
  ctx.restore();
}
function drawShell(sh,t){
  if (sh.taken) return;
  const {x,y} = sh;
  shadow(x,y+2,12);
  ctx.fillStyle='#f7cdb2'; ctx.strokeStyle='#c7835f'; ctx.lineWidth=2.5; ctx.lineCap='round';
  ctx.beginPath(); ctx.moveTo(x-12,y); ctx.bezierCurveTo(x-12,y-20,x+12,y-22,x+12,y-8); ctx.bezierCurveTo(x+12,y,x,y,x,y-8); ctx.bezierCurveTo(x,y-12,x+5,y-12,x+5,y-8); ctx.fill(); ctx.stroke();
  sparkle(x+10,y-22,t);
}
function sparkle(x,y,t){
  const k = (Math.sin(t*4)+1)/2, s = 4 + k*6;
  ctx.fillStyle = `rgba(255,255,255,${0.5+k*0.5})`;
  ctx.beginPath(); ctx.moveTo(x,y-s); ctx.lineTo(x+s*0.25,y-s*0.25); ctx.lineTo(x+s,y); ctx.lineTo(x+s*0.25,y+s*0.25); ctx.lineTo(x,y+s); ctx.lineTo(x-s*0.25,y+s*0.25); ctx.lineTo(x-s,y); ctx.lineTo(x-s*0.25,y-s*0.25); ctx.closePath(); ctx.fill();
}
function marker(x,y,t,kind){
  const by = y + Math.sin(t*3)*4;
  ctx.fillStyle = '#fffaf0'; ctx.beginPath(); ctx.roundRect(x-14,by-30,28,26,10); ctx.fill();
  ctx.beginPath(); ctx.moveTo(x-5,by-5); ctx.lineTo(x,by+3); ctx.lineTo(x+5,by-5); ctx.fill();
  ctx.fillStyle = kind==='ready' ? '#6f9e55' : '#e0904a';
  ctx.font = '800 20px Grandstander, system-ui, sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.fillText(kind==='ready' ? '★' : '!', x, by-16);
}
function npcMarker(n){
  const q = S.quests;
  if (S.ending) return null;
  if (S.day===2) {
    if (n.id==='mole') return q.dig.state==='new' ? (S.hinted.has('mole') ? 'new' : null) : null;
    if (n.id==='seal') return q.pools.state==='new' ? (S.hinted.has('seal') ? 'new' : null) : (q.pools.state==='active' && q.pools.seen>=4 ? 'ready' : null);
    if (n.id==='puffin') return q.wood.state==='new' ? (S.hinted.has('puffin') ? 'new' : null) : (q.wood.state==='active' && q.wood.have>=3 ? 'ready' : null);
    if (n.id!=='owl') return null;
  }
  if (n.id==='owl') {
    if (allDone()) return 'ready';
    const waiting = dayQuests().some(x => x.state==='active') || friendsToday().some(f => S.hinted.has(f.owner) && q[f.id].state==='new');
    return waiting ? null : 'new';
  }
  const f = friendsToday().find(f => f.owner===n.id && q[f.id].state==='new');
  if (f && !S.hinted.has(n.id)) return null;
  if (n.id==='mole') return q.glow.state==='new' ? 'new' : (q.glow.state==='active' && q.glow.have>=4 ? 'ready' : null);
  if (n.id==='mouse') return q.song.state==='new' ? 'new' : null;
  if (n.id==='duck') return q.duck.state==='new' ? 'new' : (q.duck.state==='active' && S.ducklings.filter(d=>d.state==='follow').length===3 ? 'ready' : null);
  if (n.id==='hog') return q.berry.state==='new' ? 'new' : (q.berry.state==='active' && q.berry.have>=5 ? 'ready' : null);
  if (n.id==='crab') return q.shell.state==='new' ? 'new' : (q.shell.state==='active' && q.shell.have ? 'ready' : null);
}

