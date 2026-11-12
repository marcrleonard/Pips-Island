// Frame drawing and overlays.
function draw(){
  const t = S.t;
  LOOK = lookFor(S.scene);
  ctx.setTransform(1,0,0,1,0,0);
  ctx.fillStyle = S.scene==='cave' ? '#241b18' : (GROUND_EDGE || C.sea); ctx.fillRect(0,0,cvs.width,cvs.height);
  ctx.setTransform(DPR*cam.z,0,0,DPR*cam.z,-cam.x*DPR*cam.z,-cam.y*DPR*cam.z);
  if (S.scene==='cave') drawCave(t); else if (S.scene==='cove') drawCove(t); else if (S.scene==='isle') drawIsle(t); else if (S.scene==='highland') drawHighland(t); else if (S.scene==='deep') drawDeep(t); else drawIsland(t);
  drawOverlays(t);
}
function drawIsland(t){
  blitGround(bakedGround('island:' + S.day, W, H, drawGroundStatic), W, H);
  drawGroundLive(t);
  drawNorthPathGround();

  // tall grass where ducklings hide (the plain tufts are part of the ground image)
  const tuftSpots = S.ducklings.filter(d=>d.state==='hidden').map(d=>({x:d.x,y:d.y,duck:true}));

  // y-sorted entities
  const ents = [];
  trees.forEach((tr,i) => ents.push({y:tr.y, f:() => faded(tr.x, tr.y, treeBox(tr), () => cached('tree'+i, tr.x, tr.y, treeBox(tr), () => drawTree(tr), {shadow:30*tr.s, shy:4, h:(tr.kind==='pine' ? 100 : 110)*tr.s}))}));
  rocks.forEach((r,i) => ents.push({y:r.y, f:() => cached('rock'+i, r.x, r.y, [-r.s-2,-r.s*1.1,r.s+2,r.s*0.45+2], () => drawRock(r), {shadow:r.s, shy:4, h:r.s*0.8})}));
  S.bushes.forEach((b,i) => ents.push({y:b.y, f:() => cached('bush'+i+b.berry, b.x, b.y, [-34,-50,34,6], () => drawBush(b,0), {shadow:28, h:40})}));
  tuftSpots.forEach(s => ents.push({y:s.y, f:() => styled(s.x, s.y, [-40,-50,40,4], () => {
    const wig = (t + s.x*0.01) % 3 < 0.7 ? 1 : 0.15;
    drawTuft(s.x,s.y,t,wig);
    if (wig===1) circ(s.x+4, s.y-36 - Math.sin(t*14)*2, 5, '#f6d55c');
  }, {shadow:20, h:30, key:'tuft:'+s.x, fps:12})}));
  ents.push({y:bigTree.y+20, f:() => faded(bigTree.x, bigTree.y+20, [-122,-222,122,30], () => cached('bigtree', bigTree.x, bigTree.y, [-122,-222,122,30], () => drawBigTree(0), {shadow:70, shy:22, h:260}))});
  ents.push({y:house.y, f:() => { cached('house'+S.quests.berry.state, house.x, house.y, [-62,-114,64,8], () => drawHouse(0), {shadow:56, shy:4, h:110}); drawHouseFx(t); }});
  ents.push({y:burrow.y+50, f:() => { cached('mound', burrow.x, burrow.y, [-92,-60,92,58], () => drawMound(0), {shadow:80, shy:40, h:60}); drawMoundFx(t); }});
  if (!S.ending) drawNest();
  if (!S.shell.taken) ents.push({y:S.shell.y, f:() => styled(S.shell.x, S.shell.y, [-16,-40,34,6], () => drawShell(S.shell,t), {shadow:12, h:10, key:'shell', fps:8})});
  S.ducklings.forEach(d => {
    if (d.state==='follow' || d.state==='picnic') ents.push({y:d.y, f:() => drawDucklingStyled(d,t)});
  });
  S.npcs.forEach(n => {
    if (n.scene!=='island') return;
    if (n.id==='owl') { if (!S.ending) ents.push({y:bigTree.y+21, f:() => drawNpcStyled(n,t)}); return; }
    if (n.id==='duck' && S.day>=2 && !S.ending) return;
    ents.push({y:n.y, f:() => drawNpcStyled(n,t,false)});
  });
  ents.push({y:S.player.y, f:() => drawPipStyled(t)});
  ents.push({y:NORTH_PATH.y-14, f:() => drawNorthMounds(t)});
  ents.push({y:NORTH_PATH.y+NP_SIGN.dy, f:drawNorthSign});
  // swimming ducklings sit on pond, draw before entities sorted (pond is ground)
  S.ducklings.forEach(d => { if (d.state==='swim') styled(d.x, d.y, [-26,-24,26,8], () => drawSwimDuck(d.x,d.y,d.face||1,t, S.day>=2 ? 1.35 : 1), {key:'swim:'+S.ducklings.indexOf(d), fps:12}); });
  if (S.day>=2 && !S.ending) { const m = S.npcs.find(n => n.id==='duck'); styled(m.x, m.y, [-36,-40,36,10], () => drawMamaSwim(m, t), {key:'mamaswim', fps:12}); }
  ents.sort((a,b) => a.y-b.y).forEach(e => e.f());
  if (S.ending) drawNpcStyled({id:'owl', x:bigTree.x+70, y:bigTree.y+150}, t);

  // markers
  drawMarkers(t);

  // butterflies
  for (const b of S.butterflies) {
    const fl = Math.abs(Math.sin(b.p*12));
    ctx.fillStyle = b.c;
    ell(b.x-4*fl, b.y, 5*fl+1, 4, b.c); ell(b.x+4*fl, b.y, 5*fl+1, 4, b.c);
  }
  // drifting cloud shadows and gulls
  for (const c of S.clouds) {
    ctx.fillStyle='rgba(52,67,58,.06)';
    [[0,0,120,50],[-80,14,80,36],[90,10,90,40]].forEach(([dx,dy,rx,ry]) => { ctx.beginPath(); ctx.ellipse(c.x+dx*c.s,c.y+dy*c.s,rx*c.s,ry*c.s,0,0,Math.PI*2); ctx.fill(); });
  }
  for (const g of S.gulls) drawGull(g,t);
  drawPops();
  drawTargetRing();
}
function drawPops(){
  ctx.font = '800 20px Grandstander, system-ui, sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
  for (const p of S.pops) { if (p.scene !== S.scene) continue;
    const a = Math.min(1, 2 - p.t*1.1); ctx.globalAlpha = Math.max(0,a);
    const yy = p.y - p.t*30;
    ctx.lineWidth = 5; ctx.strokeStyle = '#fffaf0'; ctx.strokeText(p.text, p.x, yy);
    ctx.fillStyle = C.ink; ctx.fillText(p.text, p.x, yy);
  }
  ctx.globalAlpha = 1;
}
function drawTargetRing(){
  if (S.player.goal && !S.ending) { const T=S.player.goal; ctx.strokeStyle='rgba(255,250,240,.8)'; ctx.lineWidth=3; ctx.beginPath(); ctx.ellipse(T.x,T.y,12,6,0,0,Math.PI*2); ctx.stroke(); }
}
const MARK_Y = { owl:55, duck:48, hog:52, crab:52, mole:62, mouse:56, seal:50, puffin:70, nana:72, pebble:44, willow:118, juniper:66, pine:62, lark:42, marina:54 };
function drawMarkers(t){
  S.npcs.forEach(n => { if (n.scene!==S.scene) return; const k = npcMarker(n); if (k) marker(n.x, n.y - MARK_Y[n.id], t, k); });
}
function drawOverlays(t){
  // soft storybook vignette
  ctx.setTransform(DPR,0,0,DPR,0,0);
  const vg = ctx.createRadialGradient(innerWidth/2,innerHeight/2,Math.min(innerWidth,innerHeight)*0.45,innerWidth/2,innerHeight/2,Math.max(innerWidth,innerHeight)*0.75);
  vg.addColorStop(0,'rgba(52,67,58,0)'); vg.addColorStop(1,'rgba(52,67,58,.14)');
  ctx.fillStyle = vg; ctx.fillRect(0,0,innerWidth,innerHeight);
  drawGuide(t);
  drawMap(t);
  drawTideGauge(t);
  if (S.trans) {
    const T = S.trans, half = T.half || 0.4, a = Math.max(0, Math.min(1, Math.min(T.t, 2*half - T.t)/0.4));
    ctx.fillStyle = `rgba(20,16,24,${a})`; ctx.fillRect(0,0,innerWidth,innerHeight);
    if (T.label && a > 0.5) {
      // a little boat bobbing across the dark while Captain Puff sails
      ctx.globalAlpha = (a-0.5)*2; ctx.save();
      const bx = innerWidth/2 - 120 + Math.min(1, T.t/(2*half))*240, by = innerHeight/2 - 20;
      ctx.translate(-0.0, 0); drawBoatAt(bx, by, S.t, 0.8); ctx.restore();
      ctx.strokeStyle = 'rgba(140,200,212,.8)'; ctx.lineWidth = 3; ctx.beginPath();
      for (let x = innerWidth/2 - 160; x <= innerWidth/2 + 160; x += 8) ctx.lineTo(x, by + 12 + Math.sin(x*0.08 + S.t*3)*3); ctx.stroke();
      ctx.font = '800 24px Grandstander, system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = '#fffaf0'; ctx.fillText(T.label, innerWidth/2, by + 64);
      ctx.globalAlpha = 1;
    }
  }

  // sunset wash + fireflies for ending
  if (S.ending) {
    const e = S.ending;
    const g = ctx.createLinearGradient(0,0,0,innerHeight);
    g.addColorStop(0, `rgba(244,150,110,${0.35*e})`); g.addColorStop(1, `rgba(120,90,160,${0.3*e})`);
    ctx.fillStyle = g; ctx.fillRect(0,0,innerWidth,innerHeight);
    for (let i=0;i<24;i++){
      const x = (i*137 + Math.sin(t*0.5+i)*40) % innerWidth, y = (i*89 + Math.cos(t*0.4+i*2)*30) % innerHeight;
      ctx.fillStyle = `rgba(255,236,150,${e*(0.4+0.6*Math.abs(Math.sin(t*2+i)))})`;
      ctx.beginPath(); ctx.arc(x,y,2.5,0,Math.PI*2); ctx.fill();
    }
  }
}

