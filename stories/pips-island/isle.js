// Day 3: the boat trip to Puffin Isle.
// Captain Puff sails Pip from the cove dock to the isle. There, Nana Puff's pufflings need sand eels
// (they leap in the shallows) and little Pebble wants to play hide and seek. Captain Puff is the one who
// suggests the next friend while Pip is on the isle, and sails everyone home for the picnic at the end.
// ---------- Puffin Isle ----------
const IW = 1800, IH = 1300;
const ISLE_LAND = smoothPts([[250,720],[300,520],[430,420],[520,330],[700,300],[800,250],[1000,270],[1100,240],[1300,300],[1420,360],[1560,440],[1690,560],[1640,700],[1580,860],[1420,960],[1180,1000],[1040,1040],[800,1030],[640,990],[480,970],[360,900],[300,820]]);
const ISLE_GRASS = smoothPts([[330,660],[380,500],[520,400],[640,350],[800,300],[960,310],[1100,290],[1280,350],[1420,420],[1530,520],[1580,640],[1500,760],[1350,800],[1200,860],[1000,850],[820,870],[640,830],[480,800],[380,740]]);
const ISLE_CREST = smoothPts([[560,520],[720,380],[960,330],[1200,360],[1340,470],[1180,560],[900,580],[700,580]]);
const SHALLOWS = smoothPts([[300,820],[560,930],[800,990],[1100,990],[1380,930],[1560,800],[1660,900],[1560,1080],[1300,1180],[1000,1220],[700,1210],[420,1140],[250,980]]);
const JETTY = { x0:560, x1:620, y0:960, y1:1170 };
const BOAT_COVE = { x:1772, y:600, bx:1755, by:672 };          // where Pip boards, where the boat floats
const BOAT_ISLE = { x:590, y:1150, bx:590, by:1218 };
const PUFF_SPOT = { cove:[1640,548], isle:[668,962] };
const NANA_DOOR = { x:1180, y:420 };
const BURROWS = [[620,432],[760,420],[960,380],[1090,384],[1380,480],[820,540]];
const ISLE_ROCKS = [[1440,640,40],[420,720,34],[1300,900,30],[980,700,26]];
const THRIFT = [[520,560,1.3],[470,640,0.8],[700,640,0.9],[1240,640,0.9],[1500,560,0.8],[880,460,0.8],[1100,520,0.9],[1350,760,0.8],[640,760,0.8],[1020,800,0.7]];
const DECO_PUFFINS = [[560,480,1],[690,400,-1],[910,350,1],[1040,425,-1],[1330,525,-1],[1430,580,1],[860,580,1]];
const EEL_SPOTS = [[760,1120],[1010,1150],[1250,1110],[1470,1010]];
// Pebble's hiding places: in the sea pinks, behind a rock, down an empty burrow
const HIDE_SPOTS = [[520,566,'thrift'],[1482,640,'rock'],[760,424,'burrow']];
const onJetty = (x,y) => x > JETTY.x0+6 && x < JETTY.x1-6 && y > JETTY.y0 && y < JETTY.y1;
function isleBlocked(x,y){
  if (BURROWS.some(([bx,by]) => d2(x,y,bx,by-6) < 24)) return true;
  if (d2(x,y,NANA_DOOR.x,NANA_DOOR.y-10) < 44) return true;
  if (d2(x,y,LIGHTHOUSE.x,LIGHTHOUSE.y-6) < 30) return true;
  return ISLE_ROCKS.some(([rx,ry,r]) => d2(x,y,rx,ry) < r*0.85);
}
function isleWalkable(x,y){
  if (onJetty(x,y)) return true;
  if (insidePoly(ISLE_LAND, x, y, 10)) return !isleBlocked(x,y);
  return insidePoly(SHALLOWS, x, y, 8);
}
const isleDepth = (x,y) => onJetty(x,y) || inPoly(ISLE_LAND, x, y) ? 0 : Math.max(0, Math.min(1, (polyEdgeD(ISLE_LAND, x, y) - 2) / 40));

// ---------- Sailing ----------
// Walking to the end of a dock with the boat there sets sail (Day 3, once Captain Puff has said hop aboard).
function updateBoatStop(stop, to){
  const P = S.player, d = d2(P.x,P.y,stop.x,stop.y);
  if (d > 70) S.boatArmed = true;
  if (S.day < 3 || !S.boat || !S.quests.sail || S.quests.sail.state==='new' || S.boatAt !== S.scene) return;
  if (S.boatArmed && d < 34 && !S.dialog && !S.trans) sail(to);
}
function sail(to, then){
  S.boatArmed = false; clearGoal();
  S.trans = { to, from: S.scene, t: 0, swapped: false, half: 1.3, sail: true, then,
    label: to==='isle' ? 'Sailing to Puffin Isle...' : 'Sailing home...' };
  chime([392,494,587,784],0.16);
}
// called by updateTrans when the screen is dark: move Pip, Captain Puff and the boat
function arriveBy(T){
  const P = S.player, puff = S.npcs.find(n => n.id==='puffin');
  S.boatAt = T.to === 'island' ? 'cove' : T.to;
  if (puff) { puff.scene = T.to; puff.route = null; puff.moving = false;
    if (PUFF_SPOT[T.to]) [puff.x, puff.y] = PUFF_SPOT[T.to]; else { puff.x = bigTree.x+240; puff.y = bigTree.y+260; } }
  if (T.to==='isle') { P.x = 590; P.y = 1100; P.face = 1; }
  else if (T.to==='cove') { P.x = 1730; P.y = 598; P.face = -1; }
  else { P.x = bigTree.x - 50; P.y = bigTree.y + 240; }
}
function arrived(T){
  if (T.to==='isle' && S.quests.sail.state!=='done') {
    S.quests.sail.state = 'done'; chime([523,659,784,1047],0.12); renderQuests();
    speak(['pip.isle.first', 'puffin.d3.arrive', puffHint()]);
  }
  if (T.then) T.then();
}

// ---------- Day 3 friends ----------
// On the isle Captain Puff points Pip at one friend at a time, like Bramble does at home.
function puffHint(){
  const q = S.quests, next = friendsToday().find(f => q[f.id].state==='new');
  if (!next) return null;
  S.hinted.add(next.owner);
  return 'puffin.hint.' + next.id;
}
function talkDay3(npc){
  const q = S.quests;
  if (npc.id==='puffin') {
    if (q.sail.state!=='done') return speak(q.sail.state==='new' ? 'puffin.d3.board' : 'puffin.d3.board.again', () => { q.sail.state='active'; renderQuests(); }), true;
    if (allDone()) return speak('puffin.end.d3', () => sail('island', startEnding)), true;
    if (S.scene!=='isle') return speak('puffin.d3.board.again'), true;
    const busy = friendsToday().find(f => q[f.id].state==='active');
    const hint = puffHint();
    return speak(['puffin.d3.again', hint || (busy ? 'puffin.remind.' + busy.id : null), 'puffin.d3.home']), true;
  }
  if (npc.id==='nana') {
    const e = q.eels;
    if (e.state==='done') return speak('nana.after'), true;
    if (e.have >= 4) return speak(['nana.thanks', goTell('nana')], () => { e.state='done'; S.fed = true; chime([523,659,784,1046],0.12); pop(npc.x, npc.y-60, 'Munch munch!'); }), true;
    if (e.state==='new') return speak(['nana.ask.open', e.have ? `nana.ask.already.${e.have}` : 'nana.ask.need', 'nana.ask.close'], () => { e.state='active'; S.hinted.add('nana'); }), true;
    return speak(`nana.progress.${e.have}`), true;
  }
  if (npc.id==='pebble') {
    const h = q.hide;
    if (h.state==='done') return speak('pebble.after'), true;
    if (h.state==='new') return speak('pebble.ask', () => { h.state='active'; h.found = 0; hidePebble(npc, 0); }), true;
    // he's hiding and Pip just walked up to him: found!
    h.found++; chime([784,988,1175,1568],0.08); pop(npc.x, npc.y-50, 'Found me!'); renderQuests();
    if (h.found >= 3) { npc.x = 1250; npc.y = 470; npc.hiding = null; return speak(['pebble.found.3', goTell('pebble')], () => { h.state='done'; chime([523,659,784,1046],0.12); }), true; }
    npc.hiding = null;
    return speak(`pebble.found.${h.found}`, () => hidePebble(npc, h.found)), true;
  }
  if (['duck','hog','crab','mouse','mole','seal'].includes(npc.id)) return speak(`${npc.id}.d3`), true;
  return false;
}
function hidePebble(npc, i){
  const [x,y,k] = HIDE_SPOTS[i];
  poof(npc.x, npc.y-20); npc.x = x; npc.y = y; npc.hiding = k; npc.near = false;
}
function poof(x,y){ for (let i=0;i<10;i++){ const a = Math.random()*Math.PI*2, v = 30 + Math.random()*60; S.sparks.push({ x, y, vx: Math.cos(a)*v, vy: Math.sin(a)*v - 30, t: 0, life: 0.6 + Math.random()*0.4, c: '255,250,240', r: 2 + Math.random()*2, scene: S.scene }); } }

function updateIsle(dt){
  const P = S.player, q = S.quests;
  updateBoatStop(BOAT_ISLE, 'cove');
  // sand eels leap in the shallows. Their ripples show where; Pip has to be there when one jumps.
  for (const e of S.eels) {
    if (e.caught || S.dialog) continue;
    // caught in mid-air: near the top of its leap, close to where it is in the air
    const air = eelAir(e, S.t);
    if (air && air.k > 0.25 && air.k < 0.75 && d2(P.x, P.y - 20, air.x, air.y) < 52) {
      e.caught = true; e.caughtAt = S.t; e.cx = air.x; e.cy = air.y; q.eels.have++; chime([988,1319,1568],0.08); renderQuests();
      pop(e.x, e.y-40, `${q.eels.have} sand eel${q.eels.have===1?'':'s'}`);
      if (!earlyFind('eels','nana','pip.early.eel') && q.eels.have===4 && q.eels.state!=='done')
        setTimeout(() => { if (!S.dialog) speak(q.eels.state==='new' ? 'pip.eels.all.early' : 'pip.eels.all'); }, 600);
    }
  }
  // the puffins on the hill flap and squawk when Pip comes close
  for (const d of S.decoPuffins) {
    const near = d2(P.x,P.y,d.x,d.y) < 70;
    if (near && d.armed) { d.armed = false; d.flap = 1.2; pop(d.x, d.y-56, d.i%2 ? 'Squawk!' : 'Peep!'); chime([1175 + d.i*60],0.06); }
    if (!near && d2(P.x,P.y,d.x,d.y) > 120) d.armed = true;
    d.flap = Math.max(0, d.flap - dt);
  }
  S.sparks.forEach(p => { p.t += dt; p.x += p.vx*dt; p.y += p.vy*dt; p.vy += 50*dt; });
  S.sparks = S.sparks.filter(p => p.t < p.life);
}

// ---------- Puffin Isle art ----------
function drawIsleSea(){
  ctx.fillStyle = C.sea; ctx.fillRect(0,0,IW,IH);
  ctx.fillStyle = 'rgba(190,232,232,.55)'; polyPath(SHALLOWS); ctx.fill();
  ctx.fillStyle = 'rgba(232,214,170,.35)'; polyPath(SHALLOWS, 0, -20); ctx.fill();
}
function drawBurrow(x,y){
  ctx.fillStyle = '#7fa760'; ctx.beginPath(); ctx.ellipse(x, y-6, 30, 20, 0, Math.PI, 0); ctx.fill();
  ctx.fillStyle = '#3a2e28'; ctx.beginPath(); ctx.moveTo(x-16, y); ctx.quadraticCurveTo(x-16, y-24, x, y-24); ctx.quadraticCurveTo(x+16, y-24, x+16, y); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#c9b48e'; ctx.beginPath(); ctx.ellipse(x, y+3, 20, 5, 0, 0, Math.PI*2); ctx.fill();
}
function drawThrift(x,y,s){
  const R = rng(Math.round(x*7+y));
  ctx.fillStyle = '#6f9e55'; ctx.beginPath(); ctx.ellipse(x, y, 30*s, 12*s, 0, Math.PI, 0); ctx.fill();
  ctx.strokeStyle = '#5f8a4c'; ctx.lineWidth = 1.6;
  for (let i=0;i<9;i++){ const px = x + (R()-0.5)*48*s, py = y - 10*s - R()*20*s;
    ctx.beginPath(); ctx.moveTo(px, py+4); ctx.lineTo(x + (px-x)*0.4, y); ctx.stroke();
    circ(px, py, 5*s, i%3 ? '#f2a3c4' : '#e886b0'); }
}
function drawIsleTop(){
  ctx.fillStyle = '#d9c597'; polyPath(ISLE_LAND, 0, 8); ctx.fill();
  ctx.fillStyle = C.sand; polyPath(ISLE_LAND); ctx.fill();
  ctx.fillStyle = '#8fbf68'; polyPath(ISLE_GRASS, 0, 10); ctx.fill();
  ctx.fillStyle = C.grass; polyPath(ISLE_GRASS); ctx.fill();
  ctx.fillStyle = '#b6d88c'; polyPath(ISLE_CREST); ctx.fill();
  // grass tufts and sand ripples
  const R = rng(41); ctx.lineCap = 'round';
  for (let i=0;i<120;i++){ const x = 300 + R()*1300, y = 280 + R()*600; if (!insidePoly(ISLE_GRASS, x, y, 16)) continue;
    ctx.strokeStyle = R() > 0.5 ? '#8fbf68' : '#97c36e'; ctx.lineWidth = 2.4;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x-3, y-9); ctx.moveTo(x+4, y); ctx.lineTo(x+6, y-8); ctx.stroke(); }
  ctx.strokeStyle = 'rgba(200,170,120,.35)'; ctx.lineWidth = 2;
  for (let i=0;i<40;i++){ const x = 300 + R()*1300, y = 700 + R()*330; if (!insidePoly(ISLE_LAND, x, y, 20) || insidePoly(ISLE_GRASS, x, y)) continue;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x+14, y-5, x+28, y); ctx.stroke(); }
  // a sandy path from the jetty up to Nana Puff's door
  ctx.strokeStyle = 'rgba(226,207,160,.9)'; ctx.lineWidth = 30;
  ctx.beginPath(); ctx.moveTo(590, 980); ctx.bezierCurveTo(700, 820, 1000, 720, 1160, 470); ctx.stroke();
  BURROWS.forEach(([x,y]) => drawBurrow(x,y));
  // Nana Puff's home: a grassy mound with a round red door and a flower pot
  const {x,y} = NANA_DOOR;
  ctx.fillStyle = '#8fbf68'; ctx.beginPath(); ctx.ellipse(x, y+4, 70, 52, 0, Math.PI, 0); ctx.fill();
  ctx.fillStyle = '#c95b45'; ctx.beginPath(); ctx.arc(x, y, 24, Math.PI, 0); ctx.lineTo(x+24, y+4); ctx.lineTo(x-24, y+4); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#a7463a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, y-24); ctx.lineTo(x, y+4); ctx.stroke();
  circ(x+9, y-8, 2.4, '#f4b85a');
  ctx.fillStyle = '#c7835f'; ctx.beginPath(); ctx.moveTo(x+40, y+4); ctx.lineTo(x+54, y+4); ctx.lineTo(x+51, y-10); ctx.lineTo(x+43, y-10); ctx.closePath(); ctx.fill();
  circ(x+44, y-15, 4, '#f2a3c4'); circ(x+50, y-17, 4, '#f6d55c');
  // rocks: angular, cut-paper
  ISLE_ROCKS.forEach(([rx,ry,r], i) => {
    const pts = slabPts(rng(300+i), rx, ry-r*0.3, r, r*0.7, 6);
    ctx.fillStyle = '#857c70'; polyPath(pts, 0, 8); ctx.fill();
    ctx.fillStyle = '#a39a8a'; polyPath(pts); ctx.fill();
    ctx.fillStyle = 'rgba(255,248,230,.18)'; ctx.beginPath(); ctx.moveTo(rx - r*0.6, ry - r*0.3); ctx.lineTo(rx - r*0.1, ry - r*0.9); ctx.lineTo(rx + r*0.2, ry - r*0.4); ctx.closePath(); ctx.fill();
  });
  drawLighthouse(null);
  // the jetty
  ctx.fillStyle = '#6e533c'; ctx.fillRect(JETTY.x0, JETTY.y0+8, JETTY.x1-JETTY.x0, JETTY.y1-JETTY.y0);
  ctx.fillStyle = '#8a6a4d'; ctx.fillRect(JETTY.x0, JETTY.y0, JETTY.x1-JETTY.x0, JETTY.y1-JETTY.y0);
  ctx.strokeStyle = '#6e533c'; ctx.lineWidth = 2;
  for (let yy=JETTY.y0+12; yy<JETTY.y1; yy+=14){ ctx.beginPath(); ctx.moveTo(JETTY.x0, yy); ctx.lineTo(JETTY.x1, yy); ctx.stroke(); }
  for (const yy of [JETTY.y0+60, JETTY.y1-8]) for (const xx of [JETTY.x0+4, JETTY.x1-4]) { ctx.fillStyle = '#5e4636'; ctx.fillRect(xx-3, yy-4, 6, 14); }
}
// thrift and the near side of a rock are drawn over Pebble when he hides there
function drawThriftLive(x,y,s){ cached('thrift'+x+','+y, x, y, [-40*s,-40*s,40*s,8], () => drawThrift(x,y,s)); }
function drawPebble(n, t){
  const h = n.hiding;
  if (!h) return drawPuffin(n.x, n.y, 0.62, Math.sin(t*0.7) > 0 ? 1 : -1, t, false);
  // hiding: only a wiggling bit of him shows
  const wig = (t % 4.5) < 0.35 ? Math.sin(t*20)*1.5 : 0;
  if (h==='thrift') { ell(n.x+14+wig, n.y+2, 5, 2.5, '#f08a3c'); ell(n.x+22+wig, n.y+2, 5, 2.5, '#f08a3c'); }
  else if (h==='rock') { ctx.fillStyle = '#2e3138'; ctx.beginPath(); ctx.moveTo(n.x+4, n.y-14); ctx.lineTo(n.x+18+wig, n.y-22); ctx.lineTo(n.x+14, n.y-8); ctx.closePath(); ctx.fill(); }
  else { circ(n.x-5, n.y-10, 3, '#fbf8ef'); circ(n.x+5, n.y-10, 3, '#fbf8ef'); circ(n.x-5+wig*0.4, n.y-10, 1.4, '#2e3138'); circ(n.x+5+wig*0.4, n.y-10, 1.4, '#2e3138'); }
}
function drawNana(n, t){
  drawPuffin(n.x, n.y, 1.05, -1, t*0.6, false);
  // a knitted shawl and little glasses
  ctx.save(); ctx.translate(n.x, n.y); ctx.scale(-1.05, 1.05);
  ctx.fillStyle = '#9b7fc4'; ctx.beginPath(); ctx.moveTo(-12,-26); ctx.quadraticCurveTo(2,-14,14,-26); ctx.lineTo(10,-14); ctx.quadraticCurveTo(0,-6,-10,-14); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#6d6474'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(8,-35,3.4,0,Math.PI*2); ctx.stroke();
  ctx.restore();
  if (S.fed) for (let i=0;i<2;i++){ const px = NANA_DOOR.x - 10 + i*20, py = NANA_DOOR.y + 2, b = Math.abs(Math.sin(t*4 + i))*3;
    ell(px, py-8-b, 8, 9, '#9a958c'); circ(px+2, py-16-b, 6, '#a8a39a'); circ(px+4, py-17-b, 1.2, '#2e3138'); }
}
const eelPhase = (e, t) => (t*0.9 + e.ph) % 3.4;
// where the leaping eel is (k: 0 leaving the water, 1 back in), or null while it's under water
function eelAir(e, t){ const ph = eelPhase(e, t); if (ph >= 0.9) return null; const k = ph/0.9;
  return { k, x: e.x - 22 + k*44, y: e.y - Math.sin(k*Math.PI)*34, ang: Math.cos(k*Math.PI)*-0.9 }; }
function drawEelBody(x, y, ang, s = 1){
  ctx.save(); ctx.translate(x, y); ctx.rotate(ang); ctx.scale(s, s);
  ctx.fillStyle = '#cfd8dc'; ctx.beginPath(); ctx.ellipse(0, 0, 14, 3.4, 0, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = '#9fb0b8'; ctx.beginPath(); ctx.moveTo(-12,0); ctx.lineTo(-19,-4); ctx.lineTo(-19,4); ctx.closePath(); ctx.fill();
  circ(9, -1, 1.2, '#2e3138'); ctx.restore();
}
function drawEel(e, t){
  // just caught: the eel zips into Pip's paws with a little sparkle
  if (e.caught) { const a = (t - (e.caughtAt ?? -9)) / 0.45; if (a >= 1) return;
    const P = S.player, x = e.cx + (P.x - e.cx)*a, y = e.cy + (P.y - 28 - e.cy)*a;
    drawEelBody(x, y, a*6, 1 - a*0.4); sparkle(x + 8, y - 10, t*3); return; }
  const ph = eelPhase(e, t);
  ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 1.6;
  const r = (t*1.2 + e.ph) % 1; ctx.globalAlpha = 1 - r;
  ctx.beginPath(); ctx.ellipse(e.x, e.y, 10 + r*20, 4 + r*7, 0, 0, Math.PI*2); ctx.stroke(); ctx.globalAlpha = 1;
  const air = eelAir(e, t);
  if (air) drawEelBody(air.x, air.y, air.ang);   // a silver eel leaps out in an arc and dives back in
  else sparkle(e.x + 10, e.y - 12, t + e.ph);
}
function drawIsle(t){
  blitGround(bakedGround('isle-sea', IW, IH, drawIsleSea), IW, IH);
  ctx.strokeStyle = 'rgba(255,255,255,.25)'; ctx.lineWidth = 3; ctx.lineCap='round';
  for (let i=0;i<50;i++){ const x=(i*397)%IW, y=(i*233)%IH, o=Math.sin(t*0.8+i)*10; if (insidePoly(ISLE_LAND, x, y)) continue; ctx.beginPath(); ctx.moveTo(x+o,y); ctx.quadraticCurveTo(x+o+14,y-6,x+o+28,y); ctx.stroke(); }
  ctx.lineJoin = 'round'; ctx.strokeStyle = C.foam; ctx.lineWidth = 34 + Math.sin(t*1.2)*6; polyPath(ISLE_LAND); ctx.stroke();
  blitGround(bakedGround('isle-top', IW, IH, drawIsleTop, {transparent:true}), IW, IH);
  S.eels.forEach(e => drawEel(e, t));
  if (S.boatAt==='isle') drawBoatAt(BOAT_ISLE.bx, BOAT_ISLE.by, t);

  const ents = [];
  THRIFT.forEach(([x,y,s]) => ents.push({y, f:() => drawThriftLive(x,y,s)}));
  S.decoPuffins.forEach(d => ents.push({y:d.y, f:() => styled(d.x, d.y, [-26,-60,26,6], () => {
    const fl = d.flap > 0 ? Math.sin(d.flap*30)*0.5 : 0;
    drawPuffin(d.x, d.y - (d.flap > 0 ? Math.abs(Math.sin(d.flap*8))*8 : 0), 0.85, d.f, t + d.i, false);
    if (fl) { ctx.fillStyle = '#2e3138'; ctx.beginPath(); ctx.ellipse(d.x - 6*d.f, d.y - 30, 4, 12, fl*d.f, 0, Math.PI*2); ctx.fill(); }
  }, { shadow:12, h:40, key:'deco-puffin:'+d.i, fps:12 })}));
  S.npcs.forEach(n => { if (n.scene==='isle') ents.push({y:n.y + (n.hiding==='thrift' ? -1 : 0), f:() => {
    if (n.id==='pebble') return styled(n.x, n.y, [-30,-44,34,8], () => drawPebble(n,t), n.hiding ? { key:'pebble', fps:15 } : { shadow:10, h:30, key:'pebble', fps:12 });
    if (n.id==='nana') return styled(n.x, n.y, [-34,-64,34,8], () => drawNana(n,t), { shadow:16, h:52, key:'nana', fps:12 });
    drawNpcStyled(n, t, false);
  }}); });
  ents.push({y:S.player.y, f:() => drawPipStyled(t)});
  ents.sort((a,b) => a.y-b.y).forEach(e => e.f());
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (const p of S.sparks) { if (p.scene!=='isle') continue; const a = 1 - p.t/p.life; circ(p.x, p.y, p.r*(0.6+a), `rgba(${p.c},${a*0.8})`); }
  ctx.restore();
  drawLighthouse(t, true);
  for (const gl of S.gulls) drawGull(gl,t);
  drawMarkers(t);
  drawPops();
  drawTargetRing();
}
function drawIsleMap(t, w){
  const k = w / IW, u = 1/k, R = (w > 200 ? 5.5 : 4.5)*u;
  mctx.setTransform(DPR*k,0,0,DPR*k,0,0);
  mctx.fillStyle = C.sea; mctx.fillRect(0,0,IW,IH);
  const poly = (pts, f) => { mctx.beginPath(); pts.forEach(([x,y],i) => i ? mctx.lineTo(x,y) : mctx.moveTo(x,y)); mctx.closePath(); mctx.fillStyle = f; mctx.fill(); };
  const c = (x,y,r,f) => { mctx.beginPath(); mctx.arc(x,y,r,0,Math.PI*2); mctx.fillStyle=f; mctx.fill(); };
  poly(SHALLOWS, '#bfe6e6'); poly(ISLE_LAND, C.sand); poly(ISLE_GRASS, C.grass);
  mctx.fillStyle = '#8a6a4d'; mctx.fillRect(JETTY.x0, JETTY.y0, JETTY.x1-JETTY.x0, JETTY.y1-JETTY.y0);
  c(NANA_DOOR.x, NANA_DOOR.y, 18, '#c95b45');
  const NC = { puffin:'#2e3138', nana:'#9b7fc4', pebble:'#f08a3c' };
  S.npcs.forEach(n => {
    if (n.scene!=='isle' || n.hiding) return;
    const m = npcMarker(n);
    if (m) { mctx.lineWidth = 2*u; mctx.strokeStyle = m==='ready' ? '#6f9e55' : '#e0904a'; mctx.beginPath(); mctx.arc(n.x, n.y, R+(2.5+Math.sin(t*4)*0.8)*u, 0, Math.PI*2); mctx.stroke(); }
    c(n.x, n.y, R, NC[n.id] || '#fff'); mctx.lineWidth = 1.2*u; mctx.strokeStyle = C.ink; mctx.beginPath(); mctx.arc(n.x, n.y, R, 0, Math.PI*2); mctx.stroke();
  });
  mctx.lineWidth = 1.5*u; mctx.strokeStyle = 'rgba(255,250,240,.9)';
  mctx.strokeRect(cam.x, cam.y, Math.min(cam.vw,IW), Math.min(cam.vh,IH));
  const P = S.player;
  c(P.x, P.y, R*1.6 + Math.sin(t*5)*u, 'rgba(244,184,90,.5)');
  c(P.x, P.y, R*1.05, '#f4b85a');
  mctx.lineWidth = 1.2*u; mctx.strokeStyle = C.ink; mctx.beginPath(); mctx.arc(P.x, P.y, R*1.05, 0, Math.PI*2); mctx.stroke();
}

// ---------- Day 3 setup ----------
function startDay3(quiet){
  startDay2(true);
  Object.values(S.quests).forEach(q => { q.state = 'done'; });
  S.day = 3;
  S.quests.sail = { state:'new' };
  S.quests.eels = { state:'new', have:0 };
  S.quests.hide = { state:'new', found:0 };
  S.hinted = new Set(); S.metOwl = false; S.early = {};
  S.boat = true; S.boatAt = 'cove'; S.boatArmed = false; S.fed = false; S.giggleT = 0;
  S.pools.forEach(p => { p.seen = true; }); S.wood.forEach(w => { w.state = 'taken'; });
  S.visitedCove = true;
  Object.assign(S.npcs.find(n => n.id==='puffin'), { x: PUFF_SPOT.cove[0], y: PUFF_SPOT.cove[1] });
  S.npcs.push({ id:'nana', name:'Nana Puff', x:1180, y:478, near:false, scene:'isle' });
  S.npcs.push({ id:'pebble', name:'Pebble', x:1250, y:470, near:false, scene:'isle', hiding:null });
  S.eels = EEL_SPOTS.map(([x,y],i) => ({ x, y, ph: i*0.85, caught:false }));
  S.decoPuffins = DECO_PUFFINS.map(([x,y,f],i) => ({ x, y, f, i, flap:0, armed:true }));
  for (const k in grids) delete grids[k];
  clearGround(); renderQuests();
  if (!quiet) setTimeout(() => speak('pip.day3.start'), 400);
}
const startDay = n => n >= 5 ? startDay5() : n >= 4 ? startDay4() : n >= 3 ? startDay3() : startDay2();
