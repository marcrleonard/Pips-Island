// Canvas, shared helpers.
const cvs = document.getElementById('game');
const mainCtx = cvs.getContext('2d');
let ctx = mainCtx;
let SPRITE_MODE = false;
const W = 2400, H = 1800;
const C = { sea:'#8cc8d4', seaDeep:'#79b9c8', foam:'rgba(255,255,255,.45)', sand:'#f2e2b8', grass:'#a8cf7f', grass2:'#97c36e', moss:'#6f9e55', ink:'#34433a', pond:'#7cbccb', pondRim:'#b9dfe3' };

function rng(seed){ return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const d2 = (ax,ay,bx,by) => Math.hypot(ax-bx, ay-by);
