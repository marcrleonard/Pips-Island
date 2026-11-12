// Day 5: "The Deep" — a dive from the cove into a sunlit kelp lagoon that drops into a glowing trench.
// Underwater, Pip swims freely in 2D (the whole lagoon is "walkable"); rocks, coral and kelp roots block.
// Reused friends: Grandpa Crab (find 3 pearls), Pearl the seal (catch 4 glow-jellies), Captain Puff — puffins
// swim! — (light 3 sea-anemone lanterns to brighten the dark trench). Hosted by Marina the sea turtle.
// ---------- The Deep ----------
const DW = 2200, DH = 1500;
// The swimmable lagoon: most of the scene, inset from the edges. The seabed is the lower band (visual only).
const LAGOON = smoothPts([[120,160],[500,120],[1000,140],[1500,130],[1900,170],[2080,360],[2110,760],
  [2080,1160],[1900,1360],[1400,1420],[800,1420],[320,1380],[140,1180],[110,760],[120,420]]);
const BEDY = 980;                       // where the sand starts (visual)
const SURFACE = { x: 320, y: 230 };     // where Pip dives in from the cove, and surfaces to go back
const TRENCH = { x0: 1480, y0: 900 };   // the dark, glowing trench fills the lower-right
const MARINA_SPOT = { x: 720, y: 560 };
const D_KELP = [[180,1080,1.1],[300,1040,0.9],[460,1120,1],[150,1140,0.8],[620,1060,1.05],[780,1120,0.9],
  [980,1080,1],[1180,1140,0.85],[560,980,0.8],[880,980,0.75],[1320,1120,0.9],[1460,1180,0.8]];
const D_ROCKS = [[400,1040,38],[760,1080,30],[1080,1120,34],[260,1160,26],[1260,1160,30],[1640,1240,40],[1860,1300,34]];
const D_CORAL = [[520,1040,1,'#e08a9c'],[920,1060,0.9,'#e6a35c'],[1160,1100,0.8,'#c87fae'],[680,1020,0.8,'#7fb8c0'],[1380,1160,0.9,'#e08a9c']];
const PEARL_SPOTS = [[560,1040],[1020,1080],[840,980]];        // Grandpa Crab's quest
const JELLY_SPOTS = [[1320,520],[1560,760],[1180,900],[1660,1040]];  // Pearl's quest (drift on currents)
const ANEM_SPOTS = [[1660,1120],[1900,1260],[1540,1280]];      // Captain Puff's quest (light the trench)
const CRAB_SPOT = { x: 900, y: 1040 };
const SEAL_SPOT = { x: 480, y: 700 };
const PUFF_SPOT_DEEP = { x: 1520, y: 700 };

const inTrench = (x,y) => x > TRENCH.x0 - 120 && y > TRENCH.y0 - 80;
function deepBlocked(x,y){
  for (const [rx,ry,r] of D_ROCKS) if (d2(x,y,rx,ry) < r*0.75) return true;
  for (const [kx,ky] of D_KELP) if (d2(x,y,kx,ky+6) < 16) return true;   // kelp roots
  return false;
}
function deepWalkable(x,y){
  if (!insidePoly(LAGOON, x, y, 16)) return false;
  return !deepBlocked(x,y);
}
// how dark the trench is: 1 (pitch) with no anemones lit, 0 once all three glow
const darkLevel = () => S.anems ? 1 - S.anems.filter(a => a.lit).length / 3 : 1;

function updateDeep(dt){
  const P = S.player, q = S.quests;
  // surface back to the cove
  const ds = d2(P.x,P.y,SURFACE.x,SURFACE.y);
  if (ds > 80) S.surfaceArmed = true;
  if (S.surfaceArmed && ds < 40 && !S.dialog && !S.trans && !S.ending) goTo('cove');
  // pearls: swim up and collect
  for (const pl of S.pearls) {
    if (!pl.taken && d2(P.x,P.y,pl.x,pl.y) < 48 && !S.dialog) {
      pl.taken = true; q.pearls.have++; chime([1047,1319,1568],0.08); renderQuests();
      earlyFind('pearls','crab','pip.early.pearl');
      pop(pl.x, pl.y-36, `${q.pearls.have} pearl${q.pearls.have===1?'':'s'}`);
      if (q.pearls.have===3 && q.pearls.state!=='done') setTimeout(() => { if (!S.dialog && q.pearls.state!=='done') speak(q.pearls.state==='new' ? 'pip.pearls.all.early' : 'pip.pearls.all'); }, 600);
    }
  }
  // glow-jellies drift on slow loops; catch by swimming into one
  for (const j of S.jellies) {
    if (j.caught) continue;
    j.a += dt * j.sp;
    j.px = j.x + Math.cos(j.a) * j.rx; j.py = j.y + Math.sin(j.a*1.2) * j.ry;
    if (d2(P.x, P.y, j.px, j.py) < 48 && !S.dialog) {
      j.caught = true; q.jellies.have++; chime([784,1047,1319],0.08); renderQuests();
      earlyFind('jellies','seal','pip.early.jelly');
      pop(j.px, j.py-30, `${q.jellies.have} glow-jell${q.jellies.have===1?'y':'ies'}`);
      if (q.jellies.have===4 && q.jellies.state!=='done') setTimeout(() => { if (!S.dialog && q.jellies.state!=='done') speak(q.jellies.state==='new' ? 'pip.jellies.all.early' : 'pip.jellies.all'); }, 600);
    }
  }
  // anemone lanterns: swim close to light one; lighting all three brightens the trench
  for (const an of S.anems) {
    if (!an.lit && d2(P.x,P.y,an.x,an.y) < 54 && !S.dialog) {
      an.lit = true; q.anemones.have++; chime([523,784,1047],0.1); renderQuests();
      earlyFind('anemones','puffin','pip.early.anem');
      pop(an.x, an.y-44, `${q.anemones.have} sea lantern${q.anemones.have===1?'':'s'}`);
      if (q.anemones.have===3 && q.anemones.state!=='done') setTimeout(() => { if (!S.dialog && q.anemones.state!=='done') speak(q.anemones.state==='new' ? 'pip.anems.all.early' : 'pip.anems.all'); }, 600);
    }
  }
  if (!S.ending) S.npcs.forEach(n => { if (n.scene==='deep' && n.route) stepNpc(n, dt, 70); });
  S.bubbles.forEach(b => { b.y -= b.v*dt; b.x += Math.sin(b.y*0.03 + b.p)*0.4; if (b.y < 120) { b.y = DH-20; b.x = 120 + Math.random()*(DW-240); } });
  S.dfish.forEach(f => { f.a += dt*f.sp; });
  S.sparks.forEach(p => { p.t += dt; p.x += p.vx*dt; p.y += p.vy*dt; });
  S.sparks = S.sparks.filter(p => p.t < p.life);
}

// ---------- art ----------
function drawDeepStatic(){
  // the water column: bright teal near the surface, deep navy toward the trench
  const g = ctx.createLinearGradient(0,0,0,DH);
  g.addColorStop(0,'#7fd0d6'); g.addColorStop(0.26,'#4fa8b8'); g.addColorStop(0.52,'#2d7f9a'); g.addColorStop(0.78,'#1b5473'); g.addColorStop(1,'#123a56');
  ctx.fillStyle = g; ctx.fillRect(0,0,DW,DH);
  // the sandy seabed
  const bed = smoothPts([[-40,BEDY+40],[300,BEDY-20],[700,BEDY+20],[1100,BEDY-10],[1480,BEDY+40],[1900,BEDY+120],[2240,BEDY+200],[2240,DH+40],[-40,DH+40]]);
  polyPath(bed); const bg = ctx.createLinearGradient(0,BEDY-20,0,DH); bg.addColorStop(0,'#cdbe8e'); bg.addColorStop(1,'#7a7056'); ctx.fillStyle = bg; ctx.fill();
  // faint baked caustics on the bed
  ctx.save(); polyPath(bed); ctx.clip();
  const R = rng(9);
  for (let i=0;i<60;i++){ const x=R()*DW, y=BEDY-20+R()*(DH-BEDY+20), a=0.08*(1-(y-BEDY)/(DH-BEDY));
    ctx.fillStyle = `rgba(210,255,248,${Math.max(0,a)})`; ctx.beginPath(); ctx.ellipse(x,y,26+R()*40,(26+R()*40)*0.5,0,0,Math.PI*2); ctx.fill(); }
  ctx.restore();
  // the trench: a dark cleft dropping away on the lower right
  const tr = smoothPts([[TRENCH.x0,TRENCH.y0-40],[TRENCH.x0+180,TRENCH.y0+40],[TRENCH.x0+360,TRENCH.y0+160],[2240,TRENCH.y0+120],[2240,DH+40],[TRENCH.x0-40,DH+40],[TRENCH.x0-120,TRENCH.y0+200]]);
  polyPath(tr); const tg = ctx.createLinearGradient(0,TRENCH.y0,0,DH); tg.addColorStop(0,'rgba(10,26,42,.35)'); tg.addColorStop(1,'rgba(5,14,24,.92)'); ctx.fillStyle = tg; ctx.fill();
  // rocks and coral on the bed
  for (const [x,y,r] of D_ROCKS){ ell(x,y,r,r*0.6,'#6f6a5c'); ell(x-r*0.25,y-r*0.3,r*0.5,r*0.3,'#847d6c'); }
  for (const [x,y,s,c] of D_CORAL) drawCoralStatic(x,y,s,c);
  // kelp holdfasts (roots) baked; the fronds sway live
  for (const [x,y,s] of D_KELP){ ell(x,y+6,14*s,6*s,'#4f6a3c'); }
}
function drawCoralStatic(x,y,s,c){
  ctx.save(); ctx.translate(x,y); ctx.scale(s,s); ctx.strokeStyle=c; ctx.lineWidth=7; ctx.lineCap='round';
  for (let i=-2;i<=2;i++){ ctx.beginPath(); ctx.moveTo(0,0); ctx.quadraticCurveTo(i*10,-22,i*16,-42); ctx.stroke(); circ(i*16,-42,5,c); }
  ctx.restore();
}
function drawKelp(x,y,h,s,t){
  ctx.save(); ctx.strokeStyle='#5f8a4c'; ctx.lineCap='round';
  for (const off of [-6*s,0,6*s]){
    ctx.lineWidth = 7*s; ctx.beginPath();
    for (let k=0;k<=10;k++){ const u=k/10, yy=y-u*h, xx=x+off+Math.sin(u*3 + t*1.4 + x*0.01)*18*u*s; k?ctx.lineTo(xx,yy):ctx.moveTo(xx,yy); }
    ctx.stroke();
    ctx.lineWidth = 2*s;
    for (let k=2;k<10;k+=2){ const u=k/10, yy=y-u*h, xx=x+off+Math.sin(u*3 + t*1.4 + x*0.01)*18*u*s; ctx.beginPath(); ctx.moveTo(xx,yy); ctx.quadraticCurveTo(xx+12*s,yy-4,xx+18*s,yy-14); ctx.stroke(); }
  }
  ctx.restore();
}
function drawPearl(pl,t){
  if (pl.taken) return;
  ell(pl.x, pl.y, 8, 8, '#eef2f0'); circ(pl.x-2, pl.y-2, 2, '#ffffff');
  ctx.save(); ctx.globalCompositeOperation='lighter';
  const gr = ctx.createRadialGradient(pl.x,pl.y,1,pl.x,pl.y,18+Math.sin(t*2+pl.x)*3); gr.addColorStop(0,'rgba(220,240,255,.5)'); gr.addColorStop(1,'rgba(220,240,255,0)');
  ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(pl.x,pl.y,18,0,Math.PI*2); ctx.fill(); ctx.restore();
}
function drawAnemone(an,t){
  const x = an.x, y = an.y, lit = an.lit;
  // a cushion of tentacles; dark until lit, then it glows warm
  ctx.strokeStyle = lit ? '#ffcf8c' : '#6a5a66'; ctx.lineWidth = 4; ctx.lineCap='round';
  for (let i=0;i<12;i++){ const a = i/12*Math.PI*2, w = Math.sin(t*2 + i)*3;
    ctx.beginPath(); ctx.moveTo(x,y); ctx.lineTo(x+Math.cos(a)*(16+w), y+Math.sin(a)*(12+w)); ctx.stroke(); }
  circ(x, y, 7, lit ? '#ffe3a8' : '#5a4e58');
  if (lit) { ctx.save(); ctx.globalCompositeOperation='lighter';
    const gr = ctx.createRadialGradient(x,y,2,x,y,80); gr.addColorStop(0,'rgba(255,214,140,.5)'); gr.addColorStop(1,'rgba(255,214,140,0)');
    ctx.fillStyle=gr; ctx.beginPath(); ctx.arc(x,y,80,0,Math.PI*2); ctx.fill(); ctx.restore(); }
  else { const k=(t*0.7+x*0.01)%1; ctx.strokeStyle=`rgba(255,224,160,${0.5*(1-k)})`; ctx.lineWidth=2; ctx.beginPath(); ctx.ellipse(x,y,16+k*22,(16+k*22)*0.5,0,0,Math.PI*2); ctx.stroke(); }
}
function drawJelly(j,t){
  if (j.caught) return;
  const x = j.px, y = j.py, c = j.c;
  ctx.save(); ctx.globalCompositeOperation='lighter';
  const gr = ctx.createRadialGradient(x,y,2,x,y,36); gr.addColorStop(0,`rgba(${c},.5)`); gr.addColorStop(1,`rgba(${c},0)`); ctx.fillStyle=gr; ctx.beginPath(); ctx.arc(x,y,36,0,Math.PI*2); ctx.fill(); ctx.restore();
  ctx.save(); ctx.translate(x,y);
  ctx.fillStyle=`rgba(${c},.85)`; ctx.beginPath(); ctx.ellipse(0,0,15,12,0,Math.PI,0); ctx.lineTo(13,2); ctx.lineTo(-13,2); ctx.closePath(); ctx.fill();
  ctx.strokeStyle=`rgba(${c},.6)`; ctx.lineWidth=2; ctx.lineCap='round';
  for (let i=-2;i<=2;i++){ ctx.beginPath(); ctx.moveTo(i*6,2); ctx.quadraticCurveTo(i*6+Math.sin(t*2+i)*5,22,i*6,34); ctx.stroke(); }
  ctx.restore();
}
function drawDFish(f,t){
  const x = f.x + Math.cos(f.a)*f.r, y = f.y + Math.sin(f.a)*f.r*0.5, face = -Math.sin(f.a) > 0 ? 1 : -1;
  ctx.save(); ctx.translate(x,y); ctx.scale(face*f.s, f.s);
  ell(0,0,8,4,f.c); ctx.fillStyle=f.c; ctx.beginPath(); ctx.moveTo(-6,0); ctx.lineTo(-12,-4); ctx.lineTo(-12,4); ctx.fill(); circ(4,-1,1,'#0a2238');
  ctx.restore();
}
// Pip, diving: the otter swims horizontally, scarf streaming, with a little bubble trail
function drawOtterDive(t){
  const P = S.player, x = P.x, y = P.y;
  const kick = P.moving ? Math.sin(P.walk*1.5)*0.12 : Math.sin(t*2)*0.04;
  ctx.save(); ctx.translate(x,y); ctx.scale(P.face||1, 1); ctx.rotate(-0.12 + kick);
  ctx.fillStyle='#8a5a3c'; ctx.beginPath(); ctx.moveTo(-18,2); ctx.quadraticCurveTo(-42,-2+Math.sin(t*4)*4,-44,8); ctx.quadraticCurveTo(-30,4,-14,6); ctx.fill();
  ell(0,0,20,15,'#9b6845'); ell(3,2,11,9,'#e9cfa8');
  circ(22,-6,14,'#9b6845'); ell(29,-3,8,6,'#e9cfa8');
  circ(16,-18,4.5,'#9b6845'); circ(30,-20,4.5,'#9b6845'); circ(16,-18,2,'#6e4630'); circ(30,-20,2,'#6e4630');
  const bl = (t%4) > 3.85;
  if (bl){ ctx.strokeStyle=C.ink; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(24,-8); ctx.lineTo(30,-8); ctx.stroke(); }
  else { circ(26,-8,2.6,C.ink); circ(26.8,-8.8,0.9,'#fff'); }
  circ(35,-4,2.4,'#3b2a22');
  const st = P.moving ? Math.sin(P.walk)*4 : 0;
  ell(-2+st,14,7,4,'#6e4630'); ell(10-st,16,7,4,'#6e4630');
  ctx.fillStyle='#f4b85a'; ctx.beginPath(); ctx.moveTo(8,-4); ctx.quadraticCurveTo(-6,2+Math.sin(t*5)*2,-18,-6); ctx.quadraticCurveTo(-6,0,8,2); ctx.closePath(); ctx.fill();
  ctx.restore();
  ctx.save(); ctx.globalCompositeOperation='lighter';
  for (let i=0;i<4;i++){ const k=(t*1.5+i*0.25)%1; circ(x + (P.face||1)*(38+i*8), y-12-k*40, 2+i*0.6, `rgba(230,250,255,${0.5*(1-k)})`); }
  ctx.restore();
}
const drawPipDive = t => styled(S.player.x, S.player.y, [-50,-36,50,30], () => drawOtterDive(t), { key:'pipdive', fps:20 });

// Marina the sea turtle (host): drifts with slow flipper strokes
function drawTurtle(n,t){
  const {x,y} = n; const row = Math.sin(t*1.4)*0.3, bob = Math.sin(t*1.4)*2;
  ctx.save(); ctx.translate(x, y+bob); ctx.scale(n.face||1, 1);
  ctx.fillStyle='#5f8a6c';
  ctx.save(); ctx.rotate(-0.5+row*0.4); ell(-30,6,16,8,'#5f8a6c'); ctx.restore();
  ctx.save(); ctx.rotate(0.5-row*0.4); ell(28,6,16,8,'#5f8a6c'); ctx.restore();
  ell(-22,24,11,6,'#5f8a6c'); ell(22,24,11,6,'#5f8a6c');
  ell(0,4,34,26,'#6f9e7a'); ell(0,0,30,21,'#7faa86');
  ctx.strokeStyle='#4f7a5c'; ctx.lineWidth=2;
  for (const [hx,hy] of [[-8,-4],[10,-6],[0,12],[-12,14],[12,12]]) { ctx.beginPath(); ctx.moveTo(hx-8,hy); ctx.lineTo(hx,hy-7); ctx.lineTo(hx+8,hy); ctx.lineTo(hx,hy+7); ctx.closePath(); ctx.stroke(); }
  circ(0,-30,12,'#6f9e7a'); ell(0,-26,8,6,'#8fbf9a');
  if (blink(t,3.5)) { ctx.strokeStyle=C.ink; ctx.lineWidth=1.4; ctx.beginPath(); ctx.moveTo(-6,-33); ctx.lineTo(-2,-33); ctx.moveTo(3,-33); ctx.lineTo(7,-33); ctx.stroke(); }
  else { circ(-4,-33,2,C.ink); circ(5,-33,2,C.ink); }
  ctx.strokeStyle='#3c5a46'; ctx.lineWidth=1.4; ctx.beginPath(); ctx.arc(-4,-33,4,0,Math.PI*2); ctx.arc(5,-33,4,0,Math.PI*2); ctx.moveTo(1,-33); ctx.lineTo(1,-33); ctx.stroke();
  ctx.restore();
}
// Pearl the seal, swimming here (reused character, swim pose)
function drawSealSwim(n,t){
  const {x,y} = n; const u = Math.sin(t*1.8)*0.12;
  ctx.save(); ctx.translate(x, y+Math.sin(t*1.8)*2); ctx.scale(n.face||1,1); ctx.rotate(0.08+u);
  ctx.fillStyle='#b8b6a8'; ctx.beginPath(); ctx.moveTo(-30,0); ctx.lineTo(-44,-8-u*10); ctx.lineTo(-42,8); ctx.closePath(); ctx.fill();
  ell(-6,-6,26,14,'#cfcdc0'); ell(2,-3,9,4,'#d9d4c8');
  circ(16,-16,12,'#ebe7dd'); ell(22,-13,6,4.5,'#ffffff');
  circ(11,-18,3,C.ink); circ(19,-19,3,C.ink); circ(12,-19,1,'#fff'); circ(20,-20,1,'#fff');
  circ(21,-13,1.8,'#3b2a22');
  ctx.save(); ctx.translate(-18,-4); ctx.rotate(-0.3+Math.sin(t*2)*0.3); ell(-8,0,10,5,'#cfcdc0'); ctx.restore();
  ctx.restore();
}
// Captain Puff, diving (reused): wings become flippers, body tilted, little cap kept on
function drawPuffinDive(n,t){
  const {x,y} = n; const stroke = Math.sin(t*3)*0.6;
  ctx.save(); ctx.translate(x, y+Math.sin(t*2)*2); ctx.scale(n.face||-1,1); ctx.rotate(0.25);
  ctx.fillStyle='#2e3138'; ctx.save(); ctx.rotate(-0.6+stroke); ell(-12,-2,15,6,'#2e3138'); ctx.restore(); ctx.save(); ctx.rotate(0.6-stroke); ell(12,-2,15,6,'#2e3138'); ctx.restore();
  ell(0,0,13,16,'#2e3138'); ell(2,3,8,11,'#fbf8ef'); circ(3,-16,10,'#2e3138'); ell(5,-15,7,6.5,'#fbf8ef');
  ctx.fillStyle='#f08a3c'; ctx.beginPath(); ctx.moveTo(11,-18); ctx.quadraticCurveTo(22,-14,11,-10); ctx.closePath(); ctx.fill();
  ctx.fillStyle='#3f4250'; ctx.beginPath(); ctx.ellipse(-5,-12,5,10,0.3,0,Math.PI*2); ctx.fill();
  circ(6,-18,1.6,'#2e3138');
  // captain's cap
  ctx.fillStyle='#2f4a7a'; ctx.beginPath(); ctx.roundRect(-4,-30,16,6,2); ctx.fill(); ell(8,-24,11,3,'#2f4a7a'); ctx.fillStyle='#fbf8ef'; ctx.fillRect(-4,-26,16,2);
  ctx.restore();
}
function drawDNpc(n,t){
  const walk = fn => n.moving ? () => { ctx.save(); ctx.translate(0,-Math.abs(Math.sin(n.walkT||0))*2); fn(); ctx.restore(); } : fn;
  if (n.id==='marina') return styled(n.x, n.y, [-50,-48,50,40], walk(() => drawTurtle(n,t)), { key:'npc:marina', fps:12 });
  if (n.id==='seal')   return styled(n.x, n.y, [-48,-34,34,20], walk(() => drawSealSwim(n,t)), { key:'npc:seal:deep', fps:12 });
  if (n.id==='puffin') return styled(n.x, n.y, [-30,-34,30,22], walk(() => drawPuffinDive(n,t)), { key:'npc:puffin:deep', fps:12 });
  if (n.id==='crab')   return styled(n.x, n.y, NPC_STYLE.crab.box, walk(() => drawCrab(n,t)), { shadow:24, h:8, key:'npc:crab:deep', fps:12 });
}

function drawDeep(t){
  blitGround(bakedGround('deep', DW, DH, drawDeepStatic), DW, DH);
  // god rays slanting down from the surface (cheap, additive)
  ctx.save(); ctx.globalCompositeOperation='lighter';
  for (let i=0;i<8;i++){ const x = ((i*300 + t*14) % (DW+500)) - 250, w = 50 + (i%3)*18;
    const gr = ctx.createLinearGradient(x,0,x-260,DH); gr.addColorStop(0,'rgba(210,255,255,.10)'); gr.addColorStop(1,'rgba(210,255,255,0)');
    ctx.fillStyle = gr; ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x+w,0); ctx.lineTo(x+w-300,DH); ctx.lineTo(x-300,DH); ctx.closePath(); ctx.fill(); }
  // moving caustics on the bed
  for (let i=0;i<24;i++){ const x=(i*317 + Math.sin(t+i)*30)%DW, y=BEDY+40+(i*131)%(DH-BEDY-40);
    ctx.fillStyle=`rgba(200,255,248,${0.05+0.04*Math.sin(t*2+i)})`; ctx.beginPath(); ctx.ellipse(x,y,30,14,0,0,Math.PI*2); ctx.fill(); }
  ctx.restore();
  // the surface shimmer you dove in from
  ctx.save(); ctx.globalCompositeOperation='lighter';
  const sg = ctx.createRadialGradient(SURFACE.x,SURFACE.y,4,SURFACE.x,SURFACE.y,90); sg.addColorStop(0,'rgba(220,255,255,.4)'); sg.addColorStop(1,'rgba(220,255,255,0)');
  ctx.fillStyle=sg; ctx.beginPath(); ctx.ellipse(SURFACE.x,SURFACE.y,90,30,0,0,Math.PI*2); ctx.fill();
  ctx.strokeStyle='rgba(255,255,255,.4)'; ctx.lineWidth=2; for (let i=0;i<3;i++){ const k=(t*0.5+i/3)%1; ctx.globalAlpha=1-k; ctx.beginPath(); ctx.ellipse(SURFACE.x,SURFACE.y,20+k*60,(20+k*60)*0.3,0,0,Math.PI*2); ctx.stroke(); } ctx.globalAlpha=1;
  ctx.restore();

  S.dfish.forEach(f => drawDFish(f,t));

  const ents = [];
  D_KELP.forEach(([x,y,s]) => ents.push({y, f:() => drawKelp(x,y,300*s+120,s,t)}));
  S.pearls.forEach(pl => ents.push({y:pl.y, f:() => drawPearl(pl,t)}));
  S.anems.forEach(an => ents.push({y:an.y, f:() => drawAnemone(an,t)}));
  S.npcs.forEach(n => { if (n.scene==='deep') ents.push({y:n.y, f:() => drawDNpc(n,t)}); });
  ents.push({y:S.player.y, f:() => drawPipDive(t)});
  ents.sort((a,b) => a.y-b.y).forEach(e => e.f());

  // glow-jellies drift over everything; the trench darkness sits on top, lifting as anemones are lit
  S.jellies.forEach(j => drawJelly(j,t));
  const dk = darkLevel();
  if (dk > 0.02) {
    ctx.save();
    const g = ctx.createRadialGradient(TRENCH.x0+300, DH-60, 60, TRENCH.x0+300, DH-60, 760);
    g.addColorStop(0, `rgba(5,12,22,${0.86*dk})`); g.addColorStop(1, 'rgba(5,12,22,0)');
    ctx.fillStyle = g; ctx.fillRect(TRENCH.x0-220, TRENCH.y0-120, DW-(TRENCH.x0-220), DH-(TRENCH.y0-120));
    ctx.restore();
  }
  // rising bubbles + sparkles
  ctx.save(); ctx.globalCompositeOperation='lighter';
  for (const bub of S.bubbles) circ(bub.x, bub.y, bub.r, `rgba(220,245,255,${bub.a})`);
  for (const p of S.sparks) { if (p.scene!=='deep') continue; const a=1-p.t/p.life; circ(p.x,p.y,p.r*(0.6+a),`rgba(${p.c},${a*0.8})`); }
  ctx.restore();

  drawMarkers(t);
  drawPops();
  drawTargetRing();
}

function drawDeepMap(t, w){
  const k = w / DW, u = 1/k, R = (w > 200 ? 5 : 4)*u;
  mctx.setTransform(DPR*k,0,0,DPR*k,0,0);
  mctx.fillStyle='#163a52'; mctx.fillRect(0,0,DW,DH);
  const poly = (pts,f) => { mctx.beginPath(); pts.forEach(([x,y],i)=> i?mctx.lineTo(x,y):mctx.moveTo(x,y)); mctx.closePath(); mctx.fillStyle=f; mctx.fill(); };
  const c = (x,y,r,f) => { mctx.beginPath(); mctx.arc(x,y,r,0,Math.PI*2); mctx.fillStyle=f; mctx.fill(); };
  poly(LAGOON, '#2d7f9a');
  mctx.fillStyle='#c9bb8c'; mctx.fillRect(0,BEDY,DW,DH-BEDY);
  mctx.fillStyle='#0b1c2e'; mctx.beginPath(); mctx.moveTo(TRENCH.x0,TRENCH.y0); mctx.lineTo(DW,TRENCH.y0+60); mctx.lineTo(DW,DH); mctx.lineTo(TRENCH.x0-120,DH); mctx.closePath(); mctx.fill();
  c(SURFACE.x, SURFACE.y, R*0.9, '#cfeeff');
  S.anems && S.anems.forEach(a => c(a.x, a.y, R*0.6, a.lit ? '#ffd68c' : '#55606a'));
  const NC = { marina:'#6f9e7a', crab:'#e07355', seal:'#ebe7dd', puffin:'#2e3138' };
  S.npcs.forEach(n => { if (n.scene!=='deep') return; const mk = npcMarker(n);
    if (mk) { mctx.lineWidth=2*u; mctx.strokeStyle = mk==='ready' ? '#6f9e55' : '#e0904a'; mctx.beginPath(); mctx.arc(n.x,n.y,R+(2.5+Math.sin(t*4)*0.8)*u,0,Math.PI*2); mctx.stroke(); }
    c(n.x,n.y,R,NC[n.id]||'#fff'); mctx.lineWidth=1.2*u; mctx.strokeStyle='#0a2238'; mctx.beginPath(); mctx.arc(n.x,n.y,R,0,Math.PI*2); mctx.stroke(); });
  mctx.lineWidth=1.5*u; mctx.strokeStyle='rgba(255,250,240,.9)'; mctx.strokeRect(cam.x,cam.y,Math.min(cam.vw,DW),Math.min(cam.vh,DH));
  const P=S.player; c(P.x,P.y,R*1.6+Math.sin(t*5)*u,'rgba(244,184,90,.5)'); c(P.x,P.y,R*1.05,'#f4b85a');
  mctx.lineWidth=1.2*u; mctx.strokeStyle='#0a2238'; mctx.beginPath(); mctx.arc(P.x,P.y,R*1.05,0,Math.PI*2); mctx.stroke();
}

// ---------- Day 5 quest logic (Marina hosts) ----------
function marinaHint(){
  const q = S.quests;
  for (const f of friendsToday()) { if (q[f.id].state !== 'new') continue; S.hinted.add(f.owner); return 'marina.hint.' + f.id; }
  return null;
}
function talkDay5(npc){
  const q = S.quests;
  if (npc.id === 'marina') {
    if (allDone()) return speak('marina.end', startEnding), true;
    const first = !S.metOwl; S.metOwl = true;
    const hint = marinaHint();
    const busy = friendsToday().find(f => q[f.id].state === 'active');
    const ids = [];
    if (first) ids.push('marina.first'); else ids.push(hint ? 'marina.again.next' : 'marina.again.busy');
    if (hint) ids.push(hint); else if (busy) ids.push('marina.remind.' + busy.id);
    if (first) ids.push('marina.close.first'); else if (hint) ids.push('marina.close.next');
    return speak(ids), true;
  }
  if (npc.id === 'crab') {
    const b = q.pearls;
    if (b.state === 'done') return speak('crab.deep.after'), true;
    if (b.have >= 3) return speak(['crab.deep.thanks', lastOne() ? 'crab.deep.gotell' : null], () => { b.state='done'; chime([523,659,784,1046],0.12); pop(npc.x,npc.y-50,'Click click!'); }), true;
    if (b.state === 'new') return speak(['crab.deep.open', b.have ? `crab.deep.already.${b.have}` : 'crab.deep.need', 'crab.deep.close'], () => { b.state='active'; }), true;
    return speak(`crab.deep.progress.${b.have}`), true;
  }
  if (npc.id === 'seal') {
    const s = q.jellies;
    if (s.state === 'done') return speak('seal.deep.after'), true;
    if (s.have >= 4) return speak(['seal.deep.thanks', lastOne() ? 'seal.deep.gotell' : null], () => { s.state='done'; chime([523,659,784,1046],0.12); pop(npc.x,npc.y-50,'Arf arf!'); }), true;
    if (s.state === 'new') return speak(['seal.deep.open', s.have ? `seal.deep.already.${s.have}` : 'seal.deep.need', 'seal.deep.close'], () => { s.state='active'; S.hinted.add('seal'); }), true;
    return speak(`seal.deep.progress.${s.have}`), true;
  }
  if (npc.id === 'puffin') {
    const w = q.anemones;
    if (w.state === 'done') return speak('puffin.deep.after'), true;
    if (w.have >= 3) return speak(['puffin.deep.thanks', lastOne() ? 'puffin.deep.gotell' : null], () => { w.state='done'; chime([392,523,659,784,1047],0.12); pop(npc.x,npc.y-50,'Hooray!'); }), true;
    if (w.state === 'new') return speak(['puffin.deep.open', w.have ? `puffin.deep.already.${w.have}` : 'puffin.deep.need', 'puffin.deep.close'], () => { w.state='active'; }), true;
    return speak(`puffin.deep.progress.${w.have}`), true;
  }
  if (['duck','hog','mole','mouse','nana','pebble'].includes(npc.id)) return speak(`${npc.id}.d5`), true;
  return false;
}

// ---------- the cove dive point (Day 5) ----------
const DIVE_SPOT = { x: 1150, y: 846 };    // on the cove's lower shelf, at the water's edge
function updateCoveDive(){
  if (S.day < 5) return;
  const P = S.player, d = d2(P.x,P.y,DIVE_SPOT.x,DIVE_SPOT.y);
  if (d > 70) S.diveArmed = true;
  if (S.diveArmed && d < 36 && !S.dialog && !S.ending && !S.trans) goTo('deep');
}
function drawDiveSpot(t){
  if (S.day < 5 || S.scene !== 'cove') return;
  const {x,y} = DIVE_SPOT;
  ctx.save(); ctx.globalCompositeOperation='lighter';
  const g = ctx.createRadialGradient(x,y,4,x,y,54); g.addColorStop(0,'rgba(120,220,230,.5)'); g.addColorStop(1,'rgba(120,220,230,0)');
  ctx.fillStyle=g; ctx.beginPath(); ctx.ellipse(x,y,54,30,0,0,Math.PI*2); ctx.fill(); ctx.restore();
  ctx.strokeStyle='rgba(255,255,255,.6)'; ctx.lineWidth=2.5; ctx.lineCap='round';
  for (let i=0;i<3;i++){ const k=(t*0.5+i/3)%1; ctx.globalAlpha=1-k; ctx.beginPath(); ctx.ellipse(x,y,14+k*34,(14+k*34)*0.42,0,0,Math.PI*2); ctx.stroke(); }
  ctx.globalAlpha=1;
  // a few bubbles rising from the spot
  for (let i=0;i<4;i++){ const k=(t*0.6+i/4)%1; ctx.fillStyle=`rgba(220,245,255,${0.5*(1-k)})`; circ(x-8+i*5, y-k*40, 2+i*0.5, `rgba(220,245,255,${0.5*(1-k)})`); }
}

// ---------- Day 5 setup ----------
function startDay5(quiet){
  startDay4(true);
  Object.values(S.quests).forEach(q => { q.state = 'done'; });
  S.day = 5;
  S.quests.pearls = { state:'new', have:0 };
  S.quests.jellies = { state:'new', have:0 };
  S.quests.anemones = { state:'new', have:0 };
  S.hinted = new Set(); S.metOwl = false; S.early = {};
  S.scene = 'island'; S.trans = null; cam.snap = true;
  S.player.x = 1150; S.player.y = 1000; S.player.face = 1; clearGoal(); S.trail = [];
  S.diveArmed = false; S.surfaceArmed = false; S.visitedDeep = false;
  S.pearls = PEARL_SPOTS.map(([x,y],i) => ({ x, y, i, taken:false }));
  S.jellies = JELLY_SPOTS.map(([x,y],i) => ({ x, y, i, a:i*1.6, sp:0.4+i*0.1, rx:60+i*16, ry:34+(i%2)*18, px:x, py:y, c:['150,220,255','190,160,255','120,230,210','255,180,210'][i%4], caught:false }));
  S.anems = ANEM_SPOTS.map(([x,y],i) => ({ x, y, i, lit:false }));
  S.bubbles = Array.from({length:40}, () => ({ x:120+Math.random()*(DW-240), y:Math.random()*DH, v:30+Math.random()*50, r:1+Math.random()*2.5, a:0.1+Math.random()*0.25, p:Math.random()*6 }));
  S.dfish = Array.from({length:14}, (_,i) => ({ x:300+(i*140)%1400, y:300+(i*90)%500, r:40+(i%4)*20, a:i*0.9, sp:0.4+(i%3)*0.15, s:0.8+(i%3)*0.2, c:i%2?'#f4c06a':'#8fd0e0' }));
  // the friends live in the deep (reused), hosted by Marina
  S.npcs.push({ id:'marina', name:'Marina', x:MARINA_SPOT.x, y:MARINA_SPOT.y, near:false, scene:'deep' });
  const place = (id, name, x, y) => { let n = S.npcs.find(z => z.id===id); if (!n) { n = { id, name }; S.npcs.push(n); } Object.assign(n, { name, x, y, scene:'deep', near:false, route:null, moving:false }); };
  place('crab','Grandpa Crab', CRAB_SPOT.x, CRAB_SPOT.y);
  place('seal','Pearl', SEAL_SPOT.x, SEAL_SPOT.y);
  place('puffin','Captain Puff', PUFF_SPOT_DEEP.x, PUFF_SPOT_DEEP.y);
  for (const k in grids) delete grids[k];
  clearGround(); renderQuests(); running = true;
  if (!quiet) setTimeout(() => speak('pip.day5.start'), 400);
}

// ---- Way-finding for days whose new place is a trip away (Day 4 up the North Path, Day 5 down to the dive spot) ----
// A soft beacon floats over the next doorway on the route until Pip arrives; off screen, an arrow at the edge points to it.
function guideTarget(){
  if (S.ending || S.trans) return null;
  if (S.day === 4 && !S.visitedHighland) return S.scene === 'island' ? { x: NORTH_PATH.x, y: NORTH_PATH.y } : null;
  if (S.day !== 5 || S.visitedDeep) return null;
  if (S.scene === 'island') return { x: burrow.x, y: burrow.y + 60 };
  if (S.scene === 'cave') return digStage() === 2 ? CAVE_LADDER2 : null;
  if (S.scene === 'cove') return DIVE_SPOT;
  return null;
}
function drawGuide(t){
  const T = guideTarget(); if (!T || S.dialog) return;
  const z = cam.z, sx = (T.x - cam.x) * z, sy = (T.y - cam.y) * z, m = 46;
  const inView = sx > m && sx < innerWidth - m && sy > 120 && sy < innerHeight - m;
  ctx.save();
  if (inView) {   // a bobbing glow and a downward chevron over the spot
    const by = sy - 70 - Math.sin(t*3)*6, pulse = 0.5 + 0.5*Math.sin(t*3);
    const g = ctx.createRadialGradient(sx, by, 2, sx, by, 34); g.addColorStop(0, `rgba(255,236,160,${0.55+0.3*pulse})`); g.addColorStop(1, 'rgba(255,236,160,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(sx, by, 34, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#fffaf0'; ctx.beginPath(); ctx.arc(sx, by, 17, 0, Math.PI*2); ctx.fill();
    ctx.strokeStyle = '#e0904a'; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(sx-7, by-4); ctx.lineTo(sx, by+4); ctx.lineTo(sx+7, by-4); ctx.stroke();
  } else {        // an arrow at the screen edge, pointing the way
    const cx = innerWidth/2, cy = innerHeight/2, a = Math.atan2(sy - cy, sx - cx);
    const k = Math.min((innerWidth/2 - m) / Math.abs(Math.cos(a) || 1e-6), (innerHeight/2 - m - 40) / Math.abs(Math.sin(a) || 1e-6));
    const ax = cx + Math.cos(a)*k, ay = cy + Math.sin(a)*k + (Math.sin(a) < 0 ? 30 : 0), nud = Math.sin(t*4)*4;
    ctx.translate(ax + Math.cos(a)*nud, ay + Math.sin(a)*nud); ctx.rotate(a);
    ctx.fillStyle = 'rgba(52,67,58,.25)'; ctx.beginPath(); ctx.arc(1, 3, 22, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#fffaf0'; ctx.beginPath(); ctx.arc(0, 0, 22, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#e0904a'; ctx.beginPath(); ctx.moveTo(12, 0); ctx.lineTo(-6, -10); ctx.lineTo(-2, 0); ctx.lineTo(-6, 10); ctx.closePath(); ctx.fill();
  }
  ctx.restore();
}
