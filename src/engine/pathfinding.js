// Tap-to-walk routing.
// ---------- Pathfinding (tap-to-walk goes around trees, ponds and corners) ----------
const GRID = 20;
const grids = {};
function getGrid(scene){
  const key = scene==='cave' ? 'cave'+digStage() : scene;
  if (grids[key]) return grids[key];
  const [SW,SH] = sceneDims(scene);
  const fn = scene==='cave' ? caveWalkable : scene==='cove' ? coveWalkable : scene==='isle' ? isleWalkable : walkable;
  const gw = Math.ceil(SW/GRID), gh = Math.ceil(SH/GRID), ok = new Uint8Array(gw*gh);
  const m = 9; // keep a little clearance so paths don't scrape obstacles
  for (let y=0;y<gh;y++) for (let x=0;x<gw;x++) {
    const cx = (x+0.5)*GRID, cy = (y+0.5)*GRID;
    ok[y*gw+x] = fn(cx,cy) && fn(cx+m,cy) && fn(cx-m,cy) && fn(cx,cy+m) && fn(cx,cy-m) ? 1 : 0;
  }
  return grids[key] = { gw, gh, ok, fn };
}
function cellOf(G,x,y){ return [Math.max(0,Math.min(G.gw-1,Math.floor(x/GRID))), Math.max(0,Math.min(G.gh-1,Math.floor(y/GRID)))]; }
function nearestOpen(G,cx,cy){
  if (G.ok[cy*G.gw+cx]) return [cx,cy];
  for (let r=1;r<30;r++){ let best=null, bd=1e9;
    for (let dy=-r;dy<=r;dy++) for (let dx=-r;dx<=r;dx++){
      if (Math.max(Math.abs(dx),Math.abs(dy))!==r) continue;
      const x=cx+dx, y=cy+dy; if (x<0||y<0||x>=G.gw||y>=G.gh||!G.ok[y*G.gw+x]) continue;
      const d=dx*dx+dy*dy; if (d<bd){ bd=d; best=[x,y]; } }
    if (best) return best; }
  return null;
}
function lineClear(G,ax,ay,bx,by){
  const l = Math.hypot(bx-ax,by-ay); if (l < 1) return true;
  // coarse pass on the grid, then the exact collision shape with a little side clearance
  let n = Math.ceil(l/8);
  for (let i=1;i<=n;i++){ const t=i/n, [x,y]=cellOf(G, ax+(bx-ax)*t, ay+(by-ay)*t); if (!G.ok[y*G.gw+x]) return false; }
  const px = -(by-ay)/l*7, py = (bx-ax)/l*7;
  n = Math.ceil(l/4);
  for (let i=1;i<=n;i++){ const t=i/n, x=ax+(bx-ax)*t, y=ay+(by-ay)*t;
    if (!G.fn(x,y) || !G.fn(x+px,y+py) || !G.fn(x-px,y-py)) return false; }
  return true;
}
function findPath(scene, sx, sy, tx, ty){
  const G = getGrid(scene);
  let [ax,ay] = cellOf(G,sx,sy), [bx,by] = cellOf(G,tx,ty);
  const st = nearestOpen(G,ax,ay), en = nearestOpen(G,bx,by);
  if (!st || !en) return null;
  [ax,ay] = st; [bx,by] = en;
  const N = G.gw*G.gh, start = ay*G.gw+ax, goal = by*G.gw+bx;
  const gS = new Float32Array(N).fill(Infinity), from = new Int32Array(N).fill(-1), closed = new Uint8Array(N);
  const heap = []; const push = (f,i) => { heap.push([f,i]); let k=heap.length-1; while(k>0){ const p=(k-1)>>1; if (heap[p][0]<=heap[k][0]) break; [heap[p],heap[k]]=[heap[k],heap[p]]; k=p; } };
  const popMin = () => { const top=heap[0], last=heap.pop(); if (heap.length){ heap[0]=last; let k=0; for(;;){ const l=2*k+1, r=l+1; let m=k; if (l<heap.length&&heap[l][0]<heap[m][0]) m=l; if (r<heap.length&&heap[r][0]<heap[m][0]) m=r; if (m===k) break; [heap[m],heap[k]]=[heap[k],heap[m]]; k=m; } } return top; };
  const h = i => { const x=i%G.gw, y=(i/G.gw)|0, dx=Math.abs(x-bx), dy=Math.abs(y-by); return Math.max(dx,dy)+0.414*Math.min(dx,dy); };
  gS[start]=0; push(h(start), start);
  const D = [[1,0,1],[-1,0,1],[0,1,1],[0,-1,1],[1,1,1.414],[1,-1,1.414],[-1,1,1.414],[-1,-1,1.414]];
  let found = false, guard = 0;
  while (heap.length && guard++ < N*8) {
    const [,i] = popMin(); if (closed[i]) continue; closed[i]=1;
    if (i===goal) { found = true; break; }
    const x=i%G.gw, y=(i/G.gw)|0;
    for (const [dx,dy,c] of D) {
      const nx=x+dx, ny=y+dy; if (nx<0||ny<0||nx>=G.gw||ny>=G.gh) continue;
      const j=ny*G.gw+nx; if (!G.ok[j] || closed[j]) continue;
      if (dx && dy && (!G.ok[y*G.gw+nx] || !G.ok[ny*G.gw+x])) continue; // no corner cutting
      const ng = gS[i]+c; if (ng < gS[j]) { gS[j]=ng; from[j]=i; push(ng+h(j), j); }
    }
  }
  if (!found) return null;
  const cells = []; for (let i=goal; i!==-1; i=from[i]) cells.push(i);
  cells.reverse();
  const pts = cells.map(i => ({ x:(i%G.gw+0.5)*GRID, y:(((i/G.gw)|0)+0.5)*GRID }));
  // the exact tap point is the last stop when it's open ground, otherwise the nearest open cell
  const end = G.fn(tx,ty) && lineClear(G, pts[pts.length-1].x, pts[pts.length-1].y, tx, ty) ? {x:tx,y:ty} : pts[pts.length-1];
  pts[pts.length-1] = end;
  // string-pull: keep only the turns
  const out = []; let cx = sx, cy = sy, k = 0;
  while (k < pts.length) {
    let far = k;
    while (far+1 < pts.length && lineClear(G, cx, cy, pts[far+1].x, pts[far+1].y)) far++;
    out.push(pts[far]); cx = pts[far].x; cy = pts[far].y; k = far+1;
  }
  return out;
}
function setGoal(x, y){
  const P = S.player;
  const path = findPath(S.scene, P.x, P.y, x, y);
  P.repathed = false;
  if (!path || !path.length) { P.goal = {x,y}; P.path = []; P.target = {x,y}; return; }
  P.goal = path[path.length-1]; P.path = path; P.target = P.path.shift();
}
function clearGoal(){ const P = S.player; P.target = null; P.path = []; P.goal = null; }


// Friends walk too: send one along a path, then step it each frame at a steady pace.
function sendNpc(n, x, y, scene){
  const path = findPath(scene || n.scene, n.x, n.y, x, y) || [];
  const end = path[path.length-1];
  if (!end || d2(end.x, end.y, x, y) > 2) path.push({ x, y });   // finish the last bit (e.g. into a fresh tunnel)
  n.route = path; n.moving = true;
}
function stepNpc(n, dt, speed = 90){
  const T = n.route && n.route[0];
  if (!T) { n.route = null; n.moving = false; return true; }
  const dx = T.x - n.x, dy = T.y - n.y, d = Math.hypot(dx, dy), s = speed*dt;
  if (Math.abs(dx) > 1) n.face = dx < 0 ? -1 : 1;
  n.walkT = (n.walkT || 0) + dt*11;
  if (d <= s) { n.x = T.x; n.y = T.y; n.route.shift(); if (!n.route.length) { n.route = null; n.moving = false; return true; } }
  else { n.x += dx/d*s; n.y += dy/d*s; }
  return false;
}
