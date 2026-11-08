// Per-frame game logic.
// ---------- Update ----------
function update(dt){
  S.t += dt;
  const P = S.player;
  let vx = 0, vy = 0;
  if (!S.dialog && !S.finished && !S.trans && !S.show) {
    const kx = (keys['arrowright']||keys['d']?1:0) - (keys['arrowleft']||keys['a']?1:0);
    const ky = (keys['arrowdown']||keys['s']?1:0) - (keys['arrowup']||keys['w']?1:0);
    if ((kx||ky) && !S.ending) { const l=Math.hypot(kx,ky); vx=kx/l; vy=ky/l; clearGoal(); }
    else if (P.target) {
      const dx=P.target.x-P.x, dy=P.target.y-P.y, l=Math.hypot(dx,dy);
      if (l < 6) { if (P.path && P.path.length) { P.target = P.path.shift(); const d2x=P.target.x-P.x, d2y=P.target.y-P.y, l2=Math.hypot(d2x,d2y)||1; vx=d2x/l2; vy=d2y/l2; } else clearGoal(); }
      else { vx=dx/l; vy=dy/l; }
    }
  }
  P.swim = isSwimming(P.x, P.y);
  const speed = S.ending ? 110 : P.swim ? 120 : 190;
  P.moving = !!(vx||vy);
  if (P.moving) {
    const nx=P.x+vx*speed*dt, ny=P.y+vy*speed*dt;
    const canWalk = S.scene==='cave' ? caveWalkable : S.scene==='cove' ? coveWalkable : walkable;
    const step = speed*dt;
    let moved = false;
    if (canWalk(nx,ny)) { P.x=nx; P.y=ny; moved = true; }
    else {
      // steer around: try slightly turned directions, then the two axis slides
      const a0 = Math.atan2(vy,vx);
      for (const da of [0.5,-0.5,1.0,-1.0,1.4,-1.4]) {
        const tx2 = P.x+Math.cos(a0+da)*step, ty2 = P.y+Math.sin(a0+da)*step;
        if (canWalk(tx2,ty2)) { P.x=tx2; P.y=ty2; moved = true; break; }
      }
      if (!moved && vx && canWalk(nx,P.y)) { P.x=nx; moved = true; }
      else if (!moved && vy && canWalk(P.x,ny)) { P.y=ny; moved = true; }
    }
    if (!moved && P.goal) { if (!P.repathed) { const g = P.goal; setGoal(g.x, g.y); P.repathed = true; } else clearGoal(); }
    if (Math.abs(vx) > 0.15) P.face = vx>0?1:-1;
    P.walk += dt*12;
    const last = S.trail[S.trail.length-1];
    if (!last || d2(last.x,last.y,P.x,P.y) > 3) { S.trail.push({x:P.x,y:P.y,f:P.face}); if (S.trail.length>220) S.trail.shift(); }
  }

  if (!S.dialog && !S.ending && !S.trans && !S.show) {
    for (const n of S.npcs) {
      if (n.scene !== S.scene) continue;
      const d = d2(P.x,P.y,n.x,n.y + (n.perch?78:0));
      const auto = !(n.id==='mouse' && S.quests.song.state==='active') || n.tapped;
      if (d < 78 && !n.near && auto) { n.near = true; n.tapped = false; talk(n); break; }
      if (d > 120) n.near = false;
    }
  }

  if (S.day>=2 && S.scene==='island') { const m = S.npcs.find(n => n.id==='duck'); if (m && !S.ending) { const nx = 1450 + Math.sin(S.t*0.35)*42; m.face = nx >= m.x ? 1 : -1; m.x = nx; m.y = 724; } }
  // ducklings
  let followIdx = 0;
  for (const dk of S.ducklings) {
    if (S.scene==='island' && dk.state==='hidden' && d2(P.x,P.y,dk.x,dk.y) < 62 && !S.dialog) {
      dk.state='follow'; chime([784,988,1175],0.09); pop(dk.x, dk.y-40, 'Peep peep!'); renderQuests();
      earlyFind('duck','duck','pip.early.duck');
      const n = S.ducklings.filter(d=>d.state==='follow').length;
      if (n===3) setTimeout(() => !S.dialog && speak('pip.ducks.all'), 700);
    }
    if (dk.state==='follow') {
      followIdx++;
      const k = S.trail.length - 1 - followIdx*13;
      const tp = S.trail[Math.max(0,k)] || P;
      dk.x += (tp.x - dk.x)*Math.min(1,dt*8); dk.y += (tp.y + 6 - dk.y)*Math.min(1,dt*8);
      dk.face = tp.f || P.face;
    }
    if (dk.state==='swim' && S.day>=2) {
      const m = S.npcs.find(n => n.id==='duck'), i = S.ducklings.indexOf(dk);
      dk.x = m.x - m.face*(30 + i*24); dk.y = m.y + 4 + Math.sin(S.t*2 + i)*2; dk.face = m.face;
    } else if (dk.state==='swim') { dk.a += dt*0.6; const r = 55 + (S.ducklings.indexOf(dk))*14; dk.x = pond.x + Math.cos(dk.a)*r; dk.y = pond.y + Math.sin(dk.a)*r*0.55; dk.face = -Math.sin(dk.a) > 0 ? 1 : -1; }
    if (dk.state==='picnic') { dk.x += (dk.goal[0]-dk.x)*dt*0.9; dk.y += (dk.goal[1]-dk.y)*dt*0.9; }
  }

  // berries
  for (const b of S.bushes) {
    if (S.scene==='island' && b.berry && S.quests.berry.state!=='done' && S.quests.berry.have < 5 && d2(P.x,P.y,b.x,b.y) < 62) {
      b.berry=false; S.quests.berry.have++; chime([880,1175],0.08); pop(b.x, b.y-46, `${S.quests.berry.have} blueberr${S.quests.berry.have===1?'y':'ies'}`); renderQuests();
      earlyFind('berry','hog','pip.early.berry');
      if (S.quests.berry.have===5 && S.quests.berry.state!=='new') setTimeout(() => !S.dialog && speak('pip.berries.all'), 600);
    }
  }
  // shell
  const sh = S.shell;
  if (S.scene==='island' && !sh.taken && d2(P.x,P.y,sh.x,sh.y) < 55) {
    sh.taken = true; S.quests.shell.have = true; S.hinted.add('crab'); chime([988,1319,1568],0.1); pop(sh.x, sh.y-40, 'A shiny shell!'); renderQuests();
    setTimeout(() => !S.dialog && speak('pip.shell.found'), 600);
  }

  if (S.scene==='cave') updateCave(dt); else if (S.scene==='cove') updateCove(dt); else updateDoor();
  updateTrans(dt);

  // ending walk
  if (S.ending) {
    S.ending = Math.min(1, S.ending + dt/6);
    for (const n of S.npcs) if (n.goal) { n.x += (n.goal[0]-n.x)*dt*0.8; n.y += (n.goal[1]-n.y)*dt*0.8; }
  }

  // footprints on sand
  if (S.scene==='island' && P.moving && onSand(P.x,P.y)) {
    const lp = S.lastPrint;
    if (!lp || d2(lp.x,lp.y,P.x,P.y) > 18) {
      const side = (S.prints.length % 2) ? 1 : -1;
      const ang = Math.atan2(vy, vx);
      S.prints.push({ x: P.x + Math.cos(ang+Math.PI/2)*5*side, y: P.y + Math.sin(ang+Math.PI/2)*5*side, a: ang, t: 0 });
      S.lastPrint = { x:P.x, y:P.y };
      if (S.prints.length > 90) S.prints.shift();
    }
  }
  S.prints.forEach(p => p.t += dt);
  S.prints = S.prints.filter(p => p.t < 9);
  for (const g of S.gulls) { g.x += g.v*dt; g.p += dt; if (g.x > W+200) { g.x = -200; g.y = 200 + Math.random()*1400; } }
  for (const c of S.clouds) { c.x += 14*dt; if (c.x > W+400) c.x = -400; }
  for (const b of S.butterflies) { b.p += dt; b.x += Math.cos(b.p*0.4)*26*dt; b.y += Math.sin(b.p*0.53)*20*dt; }
  S.pops = S.pops.filter(p => (p.t += dt) < 1.8);

  const [SW, SH] = sceneDims(S.scene);
  const showing = !!S.show && S.show.t < 5.0;
  const fitZ = Math.min(innerWidth/(CW*0.95), (innerHeight-90)/(CH*0.95));
  const zT = showing ? Math.min(cam.baseZ, fitZ) : cam.baseZ;
  if (Math.abs(cam.z - zT) > 0.0005) { cam.z += (zT - cam.z)*Math.min(1, dt*2.4); cam.vw = innerWidth/cam.z; cam.vh = innerHeight/cam.z; }
  // When a dialog is open, frame Pip in the space between the top HUD and the dialog card.
  const topPad = S.dialog ? 70 : 0;
  const botPad = S.dialog ? dlg.offsetHeight + 28 : 0;
  const freeH = Math.max(120, innerHeight - topPad - botPad);
  const screenY = S.dialog ? topPad + freeH*0.62 : innerHeight*0.55;
  let tx = Math.max(0, Math.min(SW - cam.vw, P.x - cam.vw/2));
  let ty = Math.max(-topPad/cam.z, Math.min(SH - cam.vh + botPad/cam.z, P.y - screenY/cam.z));
  if (cam.vw > SW) tx = (SW-cam.vw)/2;
  if (cam.vh > SH && !S.dialog) ty = (SH-cam.vh)/2;
  if (showing) { tx = CW/2 - cam.vw/2; ty = CH/2 + 30 - cam.vh/2; }
  if (cam.snap) { cam.x = tx; cam.y = ty; cam.snap = false; }
  else { const k = Math.min(1, dt*7); cam.x += (tx-cam.x)*k; cam.y += (ty-cam.y)*k; }
}

