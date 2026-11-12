// Island layout: land shape, pond, paths, scattered trees and decor.
// ---------- World ----------
// The island was laid out with these circles. Its outline is traced around them once and smoothed, so the
// coast is one soft curve (no scallops) and nothing is ever drawn along the inner circle edges.
const land = [[1200,900,620],[700,700,380],[1700,700,400],[800,1250,380],[1650,1250,380],[1200,450,330],[1200,1400,300]];
const ISLAND = (() => {
  const cx = 1200, cy = 900, N = 40, rs = [];
  for (let i=0;i<N;i++){ const a = i/N*Math.PI*2; let r = 1200;
    while (r > 0 && !land.some(([x,y,rr]) => d2(cx+Math.cos(a)*r, cy+Math.sin(a)*r, x, y) < rr)) r -= 4;
    rs.push(r); }
  // fill the notches between the circles, then add a gentle uneven wobble so it reads as a real coast
  const avg = i => { let s = 0; for (let k=-4;k<=4;k++) s += rs[(i+k+N)%N]; return s/9; };
  const pts = rs.map((r,i) => { const a = i/N*Math.PI*2, rr = Math.max(r, avg(i)) + 10 + Math.sin(a*3 + 1.3)*18 + Math.sin(a*7 + 0.4)*9;
    return [cx + Math.cos(a)*rr, cy + Math.sin(a)*rr]; });
  return smoothPts(pts, 7);
})();
// signed distance to the grass edge: positive inside the grass, negative out on the sand and sea
const edgeD = (x,y) => inPoly(ISLAND,x,y) ? polyEdgeD(ISLAND,x,y) : -polyEdgeD(ISLAND,x,y);
const pond = { x:1450, y:640, r:115 };
// A point on a small loop well inside the pond (water is r wide, 0.6r tall), facing the way it travels.
function pondLoop(a){ return { x: pond.x + Math.cos(a)*62, y: pond.y + 6 + Math.sin(a)*24, face: Math.sin(a) > 0 ? -1 : 1 }; }
const bigTree = { x:1180, y:860 };
const house = { x: 590, y: 990 };
const nest = { x: 1505, y: 805 };
const sealRock = { x: 2255, y: 560 };
const burrow = { x: 1820, y: 455 };
// The North Path: a trail at the island's north edge up into the highlands. Walled by mist on Days 1-3,
// it opens on Day 4 (see highland.js). The signpost blocks a small circle so Pip walks around it.
const NORTH_PATH = { x: 1080, y: 232 };
const PATHS = [
  [[bigTree.x+10,bigTree.y+40],[1330,880],[1430,840]],
  [[bigTree.x-20,bigTree.y+40],[950,1040],[740,1060]],
  [[bigTree.x+30,bigTree.y+50],[1650,1150],[1990,1260]],
  [[bigTree.x-40,bigTree.y+20],[700,880],[380,730]],
  [[1440,850],[1700,770],[1820,540]],
];
const pathPts = [];
PATHS.forEach(([a,c,b]) => { for (let i=0;i<=48;i++){ const t=i/48, u=1-t; pathPts.push([u*u*a[0]+2*u*t*c[0]+t*t*b[0], u*u*a[1]+2*u*t*c[1]+t*t*b[1]]); } });
const nearPath = (x,y,m) => pathPts.some(([px,py]) => d2(x,y,px,py) < m);
function onSand(x,y){ const e = edgeD(x,y); return e <= -6 && e > -38; }
const POIS = [[1150,1000],[1820,470],[house.x,house.y],[nest.x,nest.y],[1450,790],[700,1050],[2040,1250],[300,720],[500,1300],[1250,320],[1900,950],bigTree.x?[bigTree.x,bigTree.y]:[0,0],
  [550,800],[920,520],[1030,1130],[1330,1260],[1800,1500],[620,1460],[pond.x,pond.y],[NORTH_PATH.x,NORTH_PATH.y]];
function grassAt(x,y,m=0){ return edgeD(x,y) > m; }
function walkable(x,y){
  if (edgeD(x,y) < -32) return false;
  if (d2(x,y,pond.x,pond.y) < pond.r + 14) return false;
  if (d2(x,y,bigTree.x,bigTree.y+20) < 46) return false;
  if (d2(x,y,house.x,house.y-12) < 52) return false;
  if (d2(x,y,burrow.x,burrow.y) < 52) return false;
  if (northPathBlocked(x,y)) return false;   // the trailhead mounds and signpost
  for (const t of trees) if (d2(x,y,t.x,t.y) < 26) return false;
  for (const r of rocks) if (d2(x,y,r.x,r.y) < r.s*0.8) return false;
  return true;
}

const trees = [], rocks = [], flowers = [], specks = [], patches = [], decos = [], tallDecos = [];
(function scatter(){
  const R = rng(7);
  let tries = 0;
  while (trees.length < 30 && tries++ < 3000) {
    const x = 300 + R()*1800, y = 250 + R()*1400;
    if (!grassAt(x,y,70)) continue;
    if (d2(x,y,pond.x,pond.y) < pond.r+90) continue;
    if (POIS.some(([px,py]) => d2(x,y,px,py) < 140)) continue;
    if (nearPath(x,y,70)) continue;
    if (trees.some(t => d2(x,y,t.x,t.y) < 105)) continue;
    const k = R();
    trees.push({ x, y, s: 0.8 + R()*0.45, hue: R(), kind: k < 0.3 ? 'pine' : k < 0.45 ? 'birch' : 'round' });
  }
  for (let i=0;i<70;i++){ const x=300+R()*1800, y=200+R()*1450; if (grassAt(x,y,60)) patches.push({x,y,rx:50+R()*90,ry:30+R()*50,c:R()<0.5?'#b3d68b':'#9dc774',a:R()*Math.PI}); }
  const place = (n, test, make) => { let c=0, t=0; while (c<n && t++<3000){ const x=250+R()*1900, y=200+R()*1450; if (!test(x,y)) continue; if (POIS.some(([px,py]) => d2(x,y,px,py) < 70)) continue; make(x,y); c++; } };
  const meadow = (x,y) => grassAt(x,y,40) && !nearPath(x,y,30) && d2(x,y,pond.x,pond.y) > pond.r+40;
  place(16, meadow, (x,y) => decos.push({k:'mush', x, y, v:R()}));
  place(22, meadow, (x,y) => decos.push({k:'fern', x, y, v:R()}));
  place(14, meadow, (x,y) => decos.push({k:'bloom', x, y, v:R()}));
  place(10, onSand, (x,y) => decos.push({k:'star', x, y, v:R()}));
  place(14, onSand, (x,y) => decos.push({k:'pebble', x, y, v:R()}));
  place(6, onSand, (x,y) => decos.push({k:'drift', x, y, v:R()}));
  place(10, onSand, (x,y) => decos.push({k:'weed', x, y, v:R()}));
  for (let i=0;i<22;i++){ const a = i/22*Math.PI*2; if (Math.abs(a-Math.PI/2) < 0.5) continue; const rr = pond.r+6+R()*10;
    tallDecos.push({k:'cattail', x: pond.x+Math.cos(a)*rr, y: pond.y+Math.sin(a)*rr*0.62+4, v:R()}); }
  tries = 0;
  while (rocks.length < 9 && tries++ < 2000) {
    const x = 250 + R()*1900, y = 200 + R()*1500;
    const e = edgeD(x,y), onSand = e > -30 && e <= -10;
    if (!onSand) continue;
    if (POIS.some(([px,py]) => d2(x,y,px,py) < 120)) continue;
    rocks.push({ x, y, s: 16 + R()*16 });
  }
  for (let i=0;i<260;i++){ const x=R()*W, y=R()*H; if (grassAt(x,y,30)&&d2(x,y,pond.x,pond.y)>pond.r+20) flowers.push({x,y,c:['#fff6e8','#f6c6d0','#ffe08a','#d9c8f2'][i%4]}); }
  for (let i=0;i<500;i++){ const x=R()*W, y=R()*H; if (grassAt(x,y,10)) specks.push({x,y}); }
})();
