// Who says what, and quest progress.
// Bramble suggests friends in this order. Each entry's hint and reminder live in script.json as
// owl.hint.<quest> and owl.remind.<quest>; quest days and owners come from story.json.
const friendsToday = () => STORY.quests.filter(f => f.day === S.day);
const lastOne = () => dayQuests().filter(x => x.state!=='done').length === 1;
const goTell = who => lastOne() ? `${who}.gotell` : null;
function allDone(){ return dayQuests().every(q => q.state==='done'); }

function talk(npc){
  const q = S.quests;
  if (S.day===2 && npc.id!=='owl' && talkDay2(npc)) return;
  if (S.day===3 && npc.id!=='owl' && talkDay3(npc)) return;
  if (npc.id === 'owl') {
    if (allDone()) return speak(`owl.end.d${S.day}`, startEnding);
    // Bramble drip-feeds: one new friend at a time, or a gentle reminder about one already started.
    const first = !S.metOwl;
    S.metOwl = true;
    const next = friendsToday().find(f => q[f.id].state==='new');
    const busy = friendsToday().find(f => q[f.id].state==='active');
    const ids = [];
    if (first) ids.push(`owl.d${S.day}.first`);
    else ids.push(next ? 'owl.again.next' : 'owl.again.busy');
    if (next) { ids.push('owl.hint.' + next.id); S.hinted.add(next.owner); }
    else if (busy) ids.push('owl.remind.' + busy.id);
    if (first) ids.push('owl.close.first');
    else if (next) ids.push('owl.close.next');
    return speak(ids);
  }
  if (npc.id === 'duck') {
    const following = S.ducklings.filter(d => d.state==='follow').length;
    if (q.duck.state==='done') return speak('duck.after');
    if (following===3) return speak(['duck.thanks', goTell('duck')],
      () => { q.duck.state='done'; S.ducklings.forEach((d,i) => { d.state='swim'; d.a = i*2.1; }); chime([523,659,784,1046],0.12); pop(npc.x, npc.y-60, 'Thank you!'); });
    if (q.duck.state==='new') return speak(['duck.ask.open', following ? `duck.ask.already.${following}` : 'duck.ask.hide', 'duck.ask.close'], () => { q.duck.state='active'; });
    return speak(`duck.progress.${following}`);
  }
  if (npc.id === 'hog') {
    if (q.berry.state==='done') return speak('hog.after');
    if (q.berry.have >= 5) return speak(['hog.thanks', goTell('hog')],
      () => { q.berry.state='done'; q.berry.have=5; chime([523,659,784,1046],0.12); pop(npc.x, npc.y-50, 'Yum!'); });
    if (q.berry.state==='new') return speak('hog.ask', () => { q.berry.state='active'; });
    return speak(`hog.progress.${q.berry.have}`);
  }
  if (npc.id === 'crab') {
    if (q.shell.state==='done') return speak('crab.after');
    if (q.shell.have) return speak(['crab.thanks', goTell('crab')], () => { q.shell.state='done'; chime([523,659,784,1046],0.12); pop(npc.x, npc.y-50, 'Click click!'); });
    if (q.shell.state==='new') return speak('crab.ask', () => { q.shell.state='active'; });
    return speak('crab.progress');
  }
  if (npc.id === 'mole') {
    const g = q.glow;
    if (g.state==='done') return speak(npc.digging ? 'mole.digging' : 'mole.after');
    if (g.have >= 4) return speak('mole.thanks', () => { g.state='done'; startLightShow(npc); });
    if (g.state==='new') return speak('mole.ask', () => { g.state='active'; });
    return speak(`mole.progress.${g.have}`);
  }
  if (npc.id === 'mouse') {
    const sg = q.song;
    if (sg.state==='done') return speak('mouse.after');
    if (sg.state==='new') return speak('mouse.ask', () => { sg.state='active'; sg.round=0; playSequence(); });
    return speak('mouse.again', () => playSequence());
  }
}

function talkDay2(npc){
  const q = S.quests;
  if (npc.id==='mole') {
    if (q.dig.state==='done') return speak('mole.d2.after'), true;
    return speak(['mole.d2', goTell('mole')], () => { q.dig.state='done'; chime([523,659,784,1047],0.12); }), true;
  }
  if (npc.id==='seal') {
    const p = q.pools;
    if (p.state==='done') return speak('seal.after'), true;
    if (p.seen >= 4) return speak(['seal.thanks', goTell('seal')], () => { p.state='done'; chime([523,659,784,1046],0.12); pop(npc.x, npc.y-50, 'Arf arf!'); }), true;
    if (p.state==='new') return speak(['seal.ask.open', p.seen ? `seal.ask.already.${p.seen}` : 'seal.ask.pools', 'seal.ask.close'], () => { p.state='active'; }), true;
    return speak(`seal.progress.${p.seen}`), true;
  }
  if (npc.id==='puffin') {
    const w = q.wood;
    if (w.state==='done') return speak('puffin.after'), true;
    if (w.have >= 3) return speak(['puffin.thanks', goTell('puffin')], () => { w.state='done'; S.boat = true; S.boatT = 1.2; chime([392,523,659,784,1047],0.12); pop(1755, 600, 'A boat!'); }), true;
    if (w.state==='new') return speak(['puffin.ask.open', w.have ? `puffin.ask.already.${w.have}` : 'puffin.ask.need', 'puffin.ask.close'], () => { w.state='active'; }), true;
    return speak(`puffin.progress.${w.have}`), true;
  }
  if (['duck','hog','crab','mouse'].includes(npc.id)) return speak(`${npc.id}.d2`), true;
  return false;
}

function pop(x,y,text){ S.pops.push({x,y,text,t:0,scene:S.scene}); }

function startEnding(){
  S.ending = 0.001;
  const spots = { duck:[bigTree.x-120,bigTree.y+110], hog:[bigTree.x+20,bigTree.y+150], crab:[bigTree.x+130,bigTree.y+100], mole:[bigTree.x+200,bigTree.y+40], mouse:[bigTree.x-190,bigTree.y+50], puffin:[bigTree.x+90,bigTree.y+200] };
  S.npcs.forEach(n => { if (n.scene==='cave') { n.scene='island'; n.x = burrow.x; n.y = burrow.y+70; } });
  S.npcs.forEach(n => { if (spots[n.id]) { n.goal = spots[n.id]; sendNpc(n, n.goal[0], n.goal[1], 'island'); } });
  S.ducklings.forEach((d,i) => { d.state='picnic'; d.goal=[bigTree.x-170+i*30, bigTree.y+160+(i%2)*14]; });
  setGoal(bigTree.x-50, bigTree.y+165);
  chime([392,523,659,784,1046],0.18);
  S.endTimer = setTimeout(() => { S.finished = true; showEndCard(); }, 7000);
}
function showEndCard(){
  const more = S.day < LAST_DAY;
  document.getElementById('endText').textContent = STORY.endCards[S.day].text;
  document.getElementById('wake').hidden = !more;
  document.getElementById('wake').textContent = `Wake up for Day ${S.day+1}`;
  document.getElementById('again').textContent = more ? 'Start over' : 'Play from the start';
  document.getElementById('again').classList.toggle('ghost', more);
  document.getElementById('end').hidden = false;
  voiceLine(convo(STORY.endCards[S.day].voice)[0]);
}

