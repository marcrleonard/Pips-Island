// Quest pills at the top of the screen.
// ---------- Quest HUD ----------
const ICONS = STORY.icons;

function renderQuests(){
  if (!S) return;
  const q = S.quests;
  const following = S.ducklings.filter(d => d.state==='follow' || d.state==='swim' || d.state==='picnic').length;
  const rows = S.day===4 ? [
    ['trail', 'Trail lanterns', `${Math.min(q.trail.lit,3)}/3`, q.trail.state],
    ['bridge', 'Rope bridge', q.bridge.state==='done' ? 'down' : `${Math.min(q.bridge.have,3)}/3`, q.bridge.state],
    ['seeds', 'Thistle seeds', `${Math.min(q.seeds.have,4)}/4`, q.seeds.state],
  ] : S.day===3 ? [
    ['sail', 'Boat trip', q.sail.state==='done' ? 'sailed' : '?', q.sail.state],
    ['eels', 'Sand eels', `${Math.min(q.eels.have,4)}/4`, q.eels.state],
    ['hide', 'Hide and seek', `${q.hide.found||0}/3`, q.hide.state],
  ] : S.day===2 ? [
    ['dig', 'Tunnel', q.dig.state==='done' ? 'open' : '?', q.dig.state],
    ['pools', 'Tide pools', `${q.pools.seen}/4`, q.pools.state],
    ['wood', 'Driftwood', `${Math.min(q.wood.have,3)}/3`, q.wood.state],
  ] : [
    ['duck', 'Ducklings', q.duck.state==='done' ? 'home' : `${following}/3`, q.duck.state],
    ['berry', 'Berries', `${Math.min(q.berry.have,5)}/5`, q.berry.state],
    ['shell', 'Shell', q.shell.state==='done' ? 'given' : (q.shell.have ? 'found' : '0/1'), q.shell.state],
    ['glow', 'Glowcaps', `${Math.min(q.glow.have,4)}/4`, q.glow.state],
    ['song', 'Song', q.song.state==='done' ? 'learned' : `${q.song.round}/2`, q.song.state],
  ];
  document.getElementById('quests').innerHTML = rows.map(([k,label,val,st]) =>
    `<div class="quest ${st==='new'?'locked':''} ${st==='done'?'done':''}"><span class="dot">${ICONS[k]}</span><span class="label">${label}</span><span class="n">${val}</span></div>`).join('');
}

