// What Pip's Island remembers between visits. The engine (src/engine/save.js) stores it; this file decides
// what goes in and how to put it back. Only progress is saved: positions of moving things and effects are rebuilt.
// ---------- Save data ----------
const LAST_DAY = Math.max(...STORY.quests.map(q => q.day));

function saveSnapshot(){
  // A finished day saves as the start of the next one (the last day starts over from its morning).
  if (S.ending || S.finished) return { day: Math.min(S.day + 1, LAST_DAY), progress: null };
  // Skip busy moments (talking, scene fades, the light show, Fern playing her tune); the next calm moment saves.
  if (S.dialog || S.trans || S.show || (S.quests.song && S.quests.song.playing)) return null;
  const P = S.player, q = S.quests;
  const quests = {};
  for (const id in q) { const { input, playing, ...rest } = q[id]; quests[id] = rest; }
  return {
    day: S.day,
    progress: {
      scene: S.scene,
      player: { x: Math.round(P.x), y: Math.round(P.y), face: P.face },
      quests,
      flags: {
        metOwl: S.metOwl, hinted: [...S.hinted], early: { ...S.early },
        visitedCave: S.visitedCave, visitedCove: S.visitedCove,
        hasLantern: S.hasLantern, moleLantern: S.moleLantern, boat: S.boat, boatAt: S.boatAt || null, fed: !!S.fed,
      },
      world: {
        ducklings: S.ducklings.map(d => ({ state: d.state, x: Math.round(d.x), y: Math.round(d.y), a: d.a || 0 })),
        berries: S.bushes.map(b => b.berry),
        shellTaken: S.shell.taken,
        glowcaps: S.glowcaps.map(g => g.taken),
        lanterns: S.litOn.slice(),
        pools: S.pools.map(p => p.seen),
        wood: S.wood.map(w => w.state),
        tide: +S.tideT.toFixed(2),
        eels: (S.eels || []).map(e => e.caught),
      },
      npcs: Object.fromEntries(S.npcs.map(n => {
        const at = n.walk || n;   // a friend mid-walk is saved where they were heading
        return [n.id, { x: Math.round(at.x), y: Math.round(at.y), scene: n.scene, digging: !!(n.digging || n.walk), hiding: n.hiding || null }];
      })),
    },
  };
}

function restoreSave(d){
  init();
  if (d.day >= 3) startDay3(true); else if (d.day >= 2) startDay2(true);
  const p = d.progress;
  if (!p) return;
  const P = S.player, f = p.flags, w = p.world;
  for (const id in p.quests) S.quests[id] = { ...S.quests[id], ...p.quests[id] };
  S.metOwl = f.metOwl; S.hinted = new Set(f.hinted); S.early = f.early;
  S.visitedCave = f.visitedCave; S.visitedCove = f.visitedCove;
  S.hasLantern = f.hasLantern; S.moleLantern = f.moleLantern; S.boat = f.boat; S.boatAt = f.boatAt || S.boatAt; S.fed = !!f.fed;
  w.ducklings.forEach((s, i) => Object.assign(S.ducklings[i], s));
  w.berries.forEach((b, i) => { S.bushes[i].berry = b; });
  S.shell.taken = w.shellTaken;
  w.glowcaps.forEach((t, i) => { S.glowcaps[i].taken = t; });
  w.lanterns.forEach((on, i) => { S.litOn[i] = on; S.lit[i] = on ? 1 : 0; });
  S.lightT = S.lit.reduce((a, b) => a + b, 0) / S.lit.length;
  w.pools.forEach((seen, i) => { if (S.pools[i]) S.pools[i].seen = seen; });
  w.wood.forEach((st, i) => { if (S.wood[i]) S.wood[i].state = st; });
  S.tideT = w.tide;
  (w.eels || []).forEach((c, i) => { if (S.eels && S.eels[i]) S.eels[i].caught = c; });
  for (const n of S.npcs) {
    const s = p.npcs[n.id]; if (!s) continue;
    n.x = s.x; n.y = s.y; n.scene = s.scene; n.digging = s.digging; if ('hiding' in s) n.hiding = s.hiding;
  }
  S.scene = p.scene; P.x = p.player.x; P.y = p.player.y; P.face = p.player.face;
  // Don't start a conversation or a scene change the moment the game opens.
  for (const n of S.npcs) n.near = n.scene === S.scene && d2(P.x, P.y, n.x, n.y + (n.perch ? 78 : 0)) < 120;
  S.doorArmed = S.shaftArmed = S.coveLadderArmed = S.ladder2Armed = false;
  cam.snap = true;
  for (const k in grids) delete grids[k];
  clearGround();
  renderQuests();
}
