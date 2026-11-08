// Fresh game state for a new playthrough.
// ---------- State ----------
let S;
function init(){
  cam.snap = true;
  if (typeof songTimers !== 'undefined') { songTimers.forEach(clearTimeout); songTimers.length = 0; }
  S = {
    t: 0,
    player: { x:1150, y:1000, face:1, walk:0, moving:false, target:null },
    trail: [],
    quests: {
      duck: { state:'new', found:0 },
      berry: { state:'new', have:0 },
      shell: { state:'new', have:false },
      glow: { state:'new', have:0 },
      song: { state:'new', round:0, input:[], playing:false },
    },
    hinted: new Set(), metOwl: false, day: 1, early: {}, tideT: 0, pools: [], wood: [], coveDecos: [], boat: false, boatT: 0, coveLadderArmed: false, ladder2Armed: false, visitedCove: false, endTimer: null,
    scene: 'island', trans: null, doorArmed: true, shaftArmed: false, visitedCave: false, lightT: 0,
    lit: LANTERNS.map(() => 0), litOn: LANTERNS.map(() => false), show: null, sparks: [], moths: [], hasLantern: false, moleLantern: false, hop: 0,
    glowcaps: GLOWCAP_SPOTS.map(([x,y]) => ({x,y,taken:false})),
    crystals: CRYSTALS.map(c => ({...c, flash:0, armed:true})),
    ducklings: [ {x:500,y:1300,state:'hidden'}, {x:1250,y:320,state:'hidden'}, {x:1900,y:950,state:'hidden'} ],
    bushes: [[550,800],[920,520],[1030,1130],[1330,1260],[1800,1500],[620,1460]].map(([x,y]) => ({x,y,berry:true})),
    shell: { x:300, y:720, taken:false },
    npcs: [
      { id:'owl', name:'Bramble the Owl', x:bigTree.x+4, y:bigTree.y-78, near:false, perch:true },
      { id:'duck', name:'Mama Duck', x:1450, y:790, near:false },
      { id:'hog', name:'Hazel Hedgehog', x:700, y:1050, near:false },
      { id:'crab', name:'Grandpa Crab', x:2040, y:1250, near:false },
      { id:'mole', name:'Digby Mole', x:930, y:890, near:false, scene:'cave' },
      { id:'mouse', name:'Fern Mouse', x:1215, y:560, near:false, scene:'cave' },
    ],
    pops: [],
    dialog: null,
    ending: 0,
    finished: false,
    prints: [], lastPrint: null,
    gulls: Array.from({length:3}, (_,i) => ({ x: i*900, y: 300 + i*520, v: 70 + i*15, p: i })),
    clouds: Array.from({length:5}, (_,i) => ({ x: i*560, y: 200 + (i*370)%1400, s: 0.8 + (i%3)*0.3 })),
    butterflies: Array.from({length:7}, (_,i) => ({ x: 600+i*230, y: 500 + (i%3)*330, p: i*1.7, c: ['#ffd36e','#f7a9c0','#ffffff','#b9d8ff'][i%4] })),
  };
  S.npcs.forEach(n => { n.scene = n.scene || 'island'; });
  for (const k in grids) delete grids[k];
  clearGround();
  renderQuests();
}

