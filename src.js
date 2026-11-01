// Catacombes : un jeu d'exploration et de tir à la manière de The Binding of Isaac, avec les créatures de la base commune de NeoBase.
// Salles générées à chaque partie, 5 étages, ennemis et boss tirés de la base, 40 objets qui se combinent (synergies), sauvegarde de la partie en cours,
// progression entre les parties (âmes, héros à débloquer, objets à débloquer par succès) et statistiques. Tout est dans le dossier du plugin (sauvegardé par NeoBase).
// Déplacements : Z Q S D (ou W A S D, ou les flèches avec Maj). Tirs : flèches, ou clic de souris. Espace : objet actif. Échap : pause.
/*@CREATURES@*/
const TILE = 32, COLS = 13, ROWS = 7, RW = COLS * TILE, RH = ROWS * TILE, WALL = 32, HUD = 44, CW = RW + WALL * 2, CH = RH + WALL * 2 + HUD;
const FLOORS = 5, HALF = 2;   // hearts are counted in halves
const CSS = `
.ct{display:flex;flex-direction:column;align-items:center;gap:10px;min-height:78vh}
.ct-wrap{position:relative;width:min(100%,calc((100vh - 130px) * ${CW / CH}),${CW * 3}px);aspect-ratio:${CW}/${CH};background:#05010b;box-shadow:0 0 0 3px #3a2a6e,0 0 0 6px #05010b,0 10px 0 6px #05010b}
.ct-wrap canvas{width:100%;height:100%;image-rendering:pixelated;display:block}
.ct-ov{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;background:rgba(8,3,20,.9);padding:14px;overflow:auto;text-align:center}
.ct-ov.clear{background:rgba(8,3,20,.55)}
.ct-ov h2{margin:0;font:16px var(--title,monospace);color:#ff5ad9;line-height:1.5}
.ct-menu{display:flex;flex-direction:column;gap:8px;width:min(320px,90%)}
.ct-menu .cb-btn{padding:12px;font-size:16px}
.ct-heroes{display:grid;grid-template-columns:repeat(auto-fill,minmax(98px,1fr));gap:8px;width:100%;max-height:52%;overflow:auto;padding:6px}
.ct-hero{position:relative;border:0;background:var(--cb-card);padding:6px 4px;display:flex;flex-direction:column;align-items:center;gap:2px;font-size:11px;box-shadow:0 0 0 2px var(--cb-line)}
.ct-hero:hover{box-shadow:0 0 0 2px var(--cb-hi)}.ct-hero.on{box-shadow:0 0 0 3px #fff;background:var(--cb-card2)}.ct-hero.lock{opacity:.75}
.ct-hero .rs{position:absolute;left:0;top:0;bottom:0;width:3px;background:var(--rc)}
.ct-row{display:flex;gap:8px;flex-wrap:wrap;justify-content:center;align-items:center}
.ct-info{max-width:560px;font-size:13px;line-height:1.45;color:#d9cdf6}
.ct-list{display:flex;flex-direction:column;gap:6px;width:min(560px,96%);max-height:56%;overflow:auto;text-align:left}
.ct-it{display:flex;gap:10px;align-items:center;padding:7px 10px;background:var(--cb-card2);box-shadow:inset 0 0 0 2px var(--cb-line);font-size:13px}
.ct-it i{flex:none;width:30px;height:30px;display:grid;place-items:center;font:14px var(--title,monospace);color:#10061c;font-style:normal}
.ct-it.lock{opacity:.5}
.ct-help{font-size:12px;color:var(--cb-sub);text-align:center;max-width:760px}
.ct-ht{position:absolute;left:8px;bottom:8px;display:flex;gap:6px;pointer-events:none}
`;
/* ---------- helpers ---------- */
const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), rnd = (a, b) => a + Math.random() * (b - a), ri = (a, b) => a + Math.floor(Math.random() * (b - a + 1)), dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const pickR = (R, a) => a[Math.floor(R() * a.length)];
const TYPE_FX = { feu: 'burn', eau: 'split', plante: 'poison', foudre: 'chain', glace: 'freeze', roche: 'explode', vent: 'pierce', ombre: 'lifesteal', lumiere: 'homing', poison: 'poison', acier: 'pierce', esprit: 'homing' };
const FX_NAME = { burn: 'Brûlure', freeze: 'Gel', poison: 'Poison', chain: 'Éclair', explode: 'Explosion', split: 'Éclats', bounce: 'Rebond', pierce: 'Perforant', homing: 'Guidé', lifesteal: 'Vol de vie' };
const SOUL_COST = [0, 60, 160, 420, 1000, 2600];
const heroStats = c => ({ hearts: clamp(3 + Math.floor(c.pv / 60), 3, 7), dmg: +(1.6 + c.atq / 55).toFixed(2), delay: +clamp(.46 - c.mag * .0015, .2, .46).toFixed(3), speed: Math.round(clamp(125 + c.vit * .95, 125, 235)), dodge: clamp(c.def / 450, 0, .22) });
const START_HEROES = ['feu', 'eau', 'plante'].map(t => CREATURES.find(c => c.t === t && c.r === 'commun').id);
/* ---------- items ---------- */
const ITEMS = [
  // stats
  { id: 'coeur', n: 'Cœur de pierre', d: '+1 cœur et soigne tout', t: 1, ap: p => { p.maxhp += 2; p.hp = p.maxhp; } },
  { id: 'sang', n: 'Flacon de sang', d: 'Dégâts +1', t: 1, ap: p => p.dmg += 1 },
  { id: 'cafe', n: 'Café noir', d: 'Tire plus vite', t: 1, ap: p => p.delay *= .8 },
  { id: 'bottes', n: 'Bottes ailées', d: 'Vitesse +25', t: 1, ap: p => p.speed += 25 },
  { id: 'lentille', n: 'Lentille', d: 'Portée des tirs +', t: 1, ap: p => p.range += 110 },
  { id: 'trefle', n: 'Trèfle', d: 'Chance +3 (effets plus fréquents)', t: 1, ap: p => p.luck += 3 },
  { id: 'balle', n: 'Balle lourde', d: 'Dégâts +0,6, tirs plus gros', t: 1, ap: p => { p.dmg += .6; p.size *= 1.4; } },
  { id: 'armure', n: 'Armure rapiécée', d: '+2 cœurs, un peu plus lent', t: 2, ap: p => { p.maxhp += 4; p.hp += 4; p.speed -= 10; } },
  { id: 'aimant', n: 'Aimant', d: 'Attire les pièces et les cœurs', t: 1, lock: 'riche', ap: p => p.magnet = 120 },
  { id: 'furie', n: 'Poing furieux', d: 'Dégâts +50 % quand il reste peu de vie', t: 2, ap: p => p.flags.add('furie') },
  { id: 'regen', n: 'Racines', d: 'Soigne un demi-cœur toutes les 2 salles', t: 2, ap: p => p.flags.add('regen') },
  { id: 'jumelles', n: 'Jumelles', d: 'Tire deux projectiles parallèles', t: 2, ap: p => p.shots = Math.max(p.shots, 2) },
  { id: 'trident', n: 'Trident', d: 'Tire trois projectiles en éventail', t: 3, ap: p => p.shots = Math.max(p.shots, 3) },
  // effects (the chance goes up each time)
  { id: 'brasier', n: 'Pierre ardente', d: 'Les tirs peuvent enflammer', t: 1, fx: 'burn' },
  { id: 'givre', n: 'Cristal de givre', d: 'Les tirs peuvent geler', t: 1, fx: 'freeze' },
  { id: 'venin', n: 'Fiole de venin', d: 'Les tirs peuvent empoisonner', t: 1, fx: 'poison' },
  { id: 'foudre', n: 'Bobine', d: 'Les tirs font des éclairs en chaîne', t: 2, fx: 'chain', lock: 'chasseur' },
  { id: 'poudre', n: 'Poudre noire', d: 'Les tirs peuvent exploser', t: 2, fx: 'explode' },
  { id: 'echo', n: 'Éclat d\'écho', d: 'Les tirs se divisent à l\'impact', t: 2, fx: 'split' },
  { id: 'rebond', n: 'Caoutchouc', d: 'Les tirs rebondissent sur les murs', t: 1, fx: 'bounce', sure: 1 },
  { id: 'aiguille', n: 'Aiguille', d: 'Les tirs traversent les ennemis', t: 2, fx: 'pierce', sure: 1 },
  { id: 'chasseur', n: 'Œil du chasseur', d: 'Les tirs sont guidés', t: 2, fx: 'homing', sure: 1, lock: 'boss1' },
  { id: 'croc', n: 'Croc de vampire', d: 'Voler de la vie en frappant', t: 2, fx: 'lifesteal', lock: 'collec' },
  // other
  { id: 'satellite', n: 'Satellite', d: 'Une sphère tourne autour de toi', t: 2, lock: 'etage3', ap: p => p.orbit = Math.min(3, p.orbit + 1) },
  { id: 'ecu', n: 'Écu', d: 'Bloque un coup par salle', t: 2, lock: 'intact', ap: p => p.flags.add('shield') },
  { id: 'epines', n: 'Couronne d\'épines', d: 'Les ennemis qui te touchent se blessent', t: 1, lock: 'premier', ap: p => p.flags.add('thorns') },
  { id: 'fantome', n: 'Voile fantôme', d: 'Invulnérable plus longtemps après un coup', t: 2, ap: p => p.iframes += .5 },
  { id: 'chance', n: 'Pièce porte-bonheur', d: '+10 pièces et plus de butin', t: 1, ap: p => { p.coins += 10; p.loot += .15; } },
  { id: 'banquet', n: 'Banquet', d: 'Soigne 2 cœurs', t: 1, ap: p => { p.hp = Math.min(p.maxhp, p.hp + 4); } },
  { id: 'tourbillon', n: 'Tourbillon', d: 'Tire dans toutes les directions de temps en temps', t: 3, ap: p => p.flags.add('nova2') },
  // active items
  { id: 'eclair', n: 'Éclair de vitesse', d: 'ACTIF · Fonce dans ta direction, invulnérable (2 salles)', t: 2, act: { max: 2, kind: 'dash' } },
  { id: 'nova', n: 'Nova', d: 'ACTIF · Blesse tous les ennemis de la salle (4 salles)', t: 3, act: { max: 4, kind: 'nova' }, lock: 'victoire' },
  { id: 'elixir', n: 'Élixir', d: 'ACTIF · Soigne 2 cœurs (3 salles)', t: 2, act: { max: 3, kind: 'heal' } },
];
const ITEM_BY = Object.fromEntries(ITEMS.map(i => [i.id, i]));
const SYN = [
  { id: 'brasier', n: 'Brasier', d: 'Brûlure + Explosion : les explosions enflamment', f: f => f.burn && f.explode },
  { id: 'toxique', n: 'Toxique inflammable', d: 'Poison + Brûlure : dégâts sur la durée ×1,5', f: f => f.poison && f.burn },
  { id: 'percegel', n: 'Perce-glace', d: 'Gel + Perforant : les ennemis gelés prennent +40 %', f: f => f.freeze && f.pierce },
  { id: 'foudregel', n: 'Foudre givrée', d: 'Éclair + Gel : la chaîne gèle', f: f => f.chain && f.freeze },
  { id: 'guide', n: 'Missile guidé perforant', d: 'Guidé + Perforant : dégâts +25 %', f: f => f.homing && f.pierce },
  { id: 'aegis', n: 'Égide', d: 'Satellite + Écu : les satellites bloquent les tirs ennemis', f: f => f.orbit && f.shield },
  { id: 'sangvicie', n: 'Sang vicié', d: 'Vol de vie + Poison : vol de vie ×2', f: f => f.lifesteal && f.poison },
  { id: 'ricochet', n: 'Ricochet électrique', d: 'Rebond + Éclair : chaque rebond lance un éclair', f: f => f.bounce && f.chain },
  { id: 'frag', n: 'Bombe à fragmentation', d: 'Éclats + Explosion : l\'explosion lance 4 éclats', f: f => f.split && f.explode },
  { id: 'tempete', n: 'Tempête', d: 'Tourbillon + Trident : le tourbillon est plus dense', f: f => f.nova2 && f.shots3 },
];
/* ---------- enemies ---------- */
const AI = { blob: 'hop', biped: 'chase', golem: 'charge', bird: 'flyer', serpent: 'weave', insect: 'swarm', spirit: 'ghost', plant: 'turret', floater: 'tri', beast: 'charge', dragon: 'dash', fish: 'hop' };
const SHOOTS = new Set(['flyer', 'ghost', 'turret', 'tri', 'dash']);
const makeEnemy = (c, floor, x, y, boss) => {
  const k = boss ? 1 : 0, ai = AI[c.plan], hp = Math.round((boss ? 70 + floor * 38 : 5 + floor * 2.4) + c.pv / (boss ? 3.5 : 14));
  return { c, x, y, vx: 0, vy: 0, hp, max: hp, r: boss ? 30 : 11, boss: !!boss, ai, spd: (boss ? 52 : 38) + c.vit * (boss ? .35 : .55), dmg: boss ? 2 : 1, t: Math.random() * 3, cd: rnd(.8, 2), burn: 0, freeze: 0, poison: 0, flash: 0, scale: boss ? 3 : 1, ph: 0, state: '', st: 0, pats: boss ? bossPatterns(c) : null, fly: ai === 'ghost' || ai === 'flyer' || ai === 'tri' || ai === 'swarm', shotCol: CRUI.typeCol(c.t), spawn: .6 };
};
const bossPatterns = c => { const R = CR.rng(c.seed), all = ['radial', 'aimed', 'charge', 'summon', 'spiral', 'rain']; const out = []; while (out.length < 3) { const p = pickR(R, all); if (!out.includes(p)) out.push(p); } return out; };
/* ---------- rooms and floors ---------- */
const DIRS = [[0, -1], [1, 0], [0, 1], [-1, 0]];
function makeFloor(seed, floor) {
  const R = CR.rng(seed * 131 + floor * 7919), G = 9, grid = new Map(), key = (x, y) => x + ',' + y;
  const target = Math.min(9, 5 + floor * 1 + (floor > 2 ? 1 : 0)), rooms = [{ x: 4, y: 4, type: 'start' }]; grid.set(key(4, 4), 0);
  let guard = 0;
  while (rooms.length < target && guard++ < 400) {
    const base = rooms[Math.floor(R() * rooms.length)], d = DIRS[Math.floor(R() * 4)], nx = base.x + d[0], ny = base.y + d[1];
    if (nx < 0 || ny < 0 || nx >= G || ny >= G || grid.has(key(nx, ny))) continue;
    let adj = 0; DIRS.forEach(e => { if (grid.has(key(nx + e[0], ny + e[1]))) adj++; }); if (adj > 1 && R() < .7) continue;
    grid.set(key(nx, ny), rooms.length); rooms.push({ x: nx, y: ny, type: 'combat' });
  }
  rooms.forEach(r => { r.doors = DIRS.map(d => grid.has(key(r.x + d[0], r.y + d[1]))); r.nb = DIRS.map(d => grid.get(key(r.x + d[0], r.y + d[1])) ?? -1); });
  const ends = rooms.map((r, i) => i).filter(i => i && rooms[i].doors.filter(Boolean).length === 1);
  const far = i => Math.abs(rooms[i].x - 4) + Math.abs(rooms[i].y - 4);
  ends.sort((a, b) => far(b) - far(a));
  const take = t => { const i = ends.shift() ?? rooms.map((r, k) => k).filter(k => k && rooms[k].type === 'combat').pop(); if (i != null) rooms[i].type = t; };
  take('boss'); take('treasure'); if (floor >= 2 && R() < .85) take('shop');
  rooms.forEach((r, i) => { r.seed = Math.floor(R() * 1e9); r.visited = i === 0; r.cleared = r.type === 'start' || r.type === 'treasure' || r.type === 'shop'; r.loot = null; });
  return rooms;
}
const DOORS = [{ x: COLS >> 1, y: -1 }, { x: COLS, y: ROWS >> 1 }, { x: COLS >> 1, y: ROWS }, { x: -1, y: ROWS >> 1 }];
function makeLayout(room, floor) {   // 0 empty, 1 rock, 2 spikes, 3 hole (blocks walking, not shots)
  const R = CR.rng(room.seed), g = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
  if (room.type === 'combat' || room.type === 'boss') {
    const n = room.type === 'boss' ? ri2(R, 2, 5) : ri2(R, 3, 11), style = Math.floor(R() * 4);
    for (let i = 0; i < n; i++) {
      let x = ri2(R, 1, COLS - 2), y = ri2(R, 1, ROWS - 2); const v = R() < .75 ? 1 : (R() < .5 ? 2 : 3);
      const sym = [[x, y], [COLS - 1 - x, y], [x, ROWS - 1 - y], [COLS - 1 - x, ROWS - 1 - y]];
      (style === 0 ? [sym[0]] : style === 1 ? [sym[0], sym[1]] : style === 2 ? [sym[0], sym[2]] : sym).forEach(([a, b]) => { if (!(Math.abs(a - (COLS >> 1)) <= 1 && Math.abs(b - (ROWS >> 1)) <= 1)) g[b][a] = v; });
    }
  }
  // keep the doors and the middle open
  DOORS.forEach((d, i) => { if (!room.doors[i]) return; const ix = clamp(d.x, 0, COLS - 1), iy = clamp(d.y, 0, ROWS - 1); for (let k = 0; k < 3; k++) { const x = clamp(ix - DIRS[i][0] * k, 0, COLS - 1), y = clamp(iy - DIRS[i][1] * k, 0, ROWS - 1); g[y][x] = 0; } });
  // every free tile must be reachable from the middle, otherwise remove blocking pieces
  const seen = new Set(), q = [[COLS >> 1, ROWS >> 1]]; seen.add(q[0].join());
  while (q.length) { const [x, y] = q.pop(); DIRS.forEach(([dx, dy]) => { const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= COLS || ny >= ROWS || seen.has(nx + ',' + ny) || g[ny][nx] === 1 || g[ny][nx] === 3) return; seen.add(nx + ',' + ny); q.push([nx, ny]); }); }
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if ((g[y][x] === 1 || g[y][x] === 3) && ![[0, 1], [1, 0], [0, -1], [-1, 0]].some(([dx, dy]) => seen.has((x + dx) + ',' + (y + dy)))) { /* enclosed rock: harmless */ }
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if (!g[y][x] && !seen.has(x + ',' + y)) g[y][x] = 1;   // a free pocket nobody can reach becomes rock
  return g;
}
const ri2 = (R, a, b) => a + Math.floor(R() * (b - a + 1));
/* ---------- sound ---------- */
let audio = null;
const beep = (f, d = .06, type = 'square', v = .035, slide = 0) => { try { audio ||= new (window.AudioContext || window.webkitAudioContext)(); const o = audio.createOscillator(), g = audio.createGain(); o.type = type; o.frequency.value = f; if (slide) o.frequency.linearRampToValueAtTime(Math.max(30, f + slide), audio.currentTime + d); g.gain.value = v; g.gain.linearRampToValueAtTime(0, audio.currentTime + d); o.connect(g).connect(audio.destination); o.start(); o.stop(audio.currentTime + d); } catch {} };
const SFX = { shot: () => beep(520, .05, 'square', .02, -200), hit: () => beep(180, .07, 'sawtooth', .03, -90), kill: () => beep(300, .12, 'square', .04, -220), hurt: () => beep(120, .2, 'sawtooth', .06, -60), pick: () => beep(740, .09, 'triangle', .05, 280), door: () => beep(220, .15, 'triangle', .04, 120), boom: () => beep(90, .25, 'sawtooth', .07, -50), item: () => { beep(520, .12, 'triangle', .05); setTimeout(() => beep(780, .18, 'triangle', .05), 110); } };
/* ---------- main ---------- */
export default async function (ctx) {
  const view = ctx.view;
  const addStyle = css => (ctx.host?.addStyle ? ctx.host.addStyle(css) : (() => { const s = document.createElement('style'); s.textContent = css; document.head.append(s); })());
  CRUI.addStyle(); addStyle(CSS);
  const toast = (m, e) => (ctx.host?.toast || ctx.ui.toast)(m, e);
  const defDoc = () => ({ v: 1, souls: 0, heroes: [...START_HEROES], items: [], ach: {}, stats: { runs: 0, wins: 0, kills: 0, deaths: 0, best: 0, time: 0, bosses: 0, coins: 0, bestItems: 0, rooms: 0 }, hist: [], run: null, mute: false, lastHero: START_HEROES[0] });
  let doc = { ...defDoc(), ...(await ctx.folder.read('catacombes').catch(() => null) || {}) }; doc.stats = { ...defDoc().stats, ...doc.stats }; doc.heroes = [...new Set([...START_HEROES, ...(doc.heroes || []).filter(id => CBYID[id])])];
  let saveT = 0; const save = (now) => { clearTimeout(saveT); const go = () => ctx.folder.write('catacombes', doc).catch(() => {}); if (now) return go(); saveT = setTimeout(go, 500); };
  view.innerHTML = '';
  const root = CRUI.el('div', 'cb ct'); view.append(root);
  const wrap = CRUI.el('div', 'ct-wrap'), cv = document.createElement('canvas'); cv.width = CW; cv.height = CH; wrap.append(cv); root.append(wrap);
  const g = cv.getContext('2d'); g.imageSmoothingEnabled = false;
  root.append(CRUI.el('div', 'ct-help', 'Déplacement : Z Q S D · Tirs : flèches ou clic · Espace : objet actif · Échap : pause · M : son'));
  let G = null, screen = 'menu', raf = 0, last = 0, keys = {}, mouse = { x: 0, y: 0, down: false, on: false }, ov = null, toastq = [], shake = 0;
  const hasSyn = id => G && G.syn.has(id);
  /* ----- overlays ----- */
  const overlay = (cls = '') => { ov?.remove(); ov = CRUI.el('div', 'ct-ov ' + cls); wrap.append(ov); return ov; };
  const closeOv = () => { ov?.remove(); ov = null; };
  const btn = (t, f, cls = '') => { const b = CRUI.el('button', 'cb-btn ' + cls, t); b.onclick = f; return b; };
  /* ----- achievements ----- */
  const ACH = { premier: ['Premier sang', 'Tuer 20 ennemis en tout', () => doc.stats.kills >= 20], boss1: ['Chute du gardien', 'Vaincre le boss de l\'étage 1', () => doc.ach.boss1], riche: ['Fortune', 'Avoir 30 pièces en même temps', () => doc.ach.riche], etage3: ['Plus bas', 'Atteindre l\'étage 3', () => doc.stats.best >= 3], intact: ['Sans une égratignure', 'Finir un étage sans être touché', () => doc.ach.intact], collec: ['Collectionneur', 'Avoir 6 objets dans la même partie', () => doc.stats.bestItems >= 6], victoire: ['Maître des catacombes', 'Gagner une partie', () => doc.stats.wins >= 1], chasseur: ['Chasseur', 'Tuer 300 ennemis en tout', () => doc.stats.kills >= 300] };
  const checkAch = () => { for (const [k, [n, d, f]] of Object.entries(ACH)) { if (!doc.ach['done_' + k] && f()) { doc.ach['done_' + k] = true; const it = ITEMS.find(i => i.lock === k); if (it && !doc.items.includes(it.id)) { doc.items.push(it.id); announce('Succès : ' + n + ' — objet débloqué : ' + it.n); } else announce('Succès : ' + n); SFX.item(); } } };
  const unlocked = it => !it.lock || doc.items.includes(it.id);
  const announce = m => { toastq.push({ m, t: 4 }); if (toastq.length > 4) toastq.shift(); };
  /* ----- starting a run ----- */
  const newRun = heroId => {
    const c = CBYID[heroId], hs = heroStats(c), fx = {}, fxType = TYPE_FX[c.t]; fx[fxType] = .3;
    G = { seed: Math.floor(Math.random() * 1e9), floor: 1, rooms: null, cur: 0, kills: 0, time: 0, t: 0, items: [], hero: heroId, hitFloor: false, over: false, victory: false, syn: new Set(), roomClears: 0, souls: 0,
      p: { x: RW / 2, y: RH / 2, vx: 0, vy: 0, r: 9, hp: hs.hearts * HALF, maxhp: hs.hearts * HALF, dmg: hs.dmg, delay: hs.delay, speed: hs.speed, shotSpd: 250, range: 300, luck: 0, shots: 1, size: 1, coins: 0, fx, flags: new Set(), orbit: 0, magnet: 0, iframes: 0, loot: 0, inv: 0, dodge: hs.dodge, cd: 0, shield: 0, act: null, face: 1, dash: 0, orbAng: 0 },
      e: [], b: [], eb: [], pk: [], fire: [], fl: [], rl: null, door: 0 };
    doc.stats.runs++; save(); enterFloor(1);
    return G;
  };
  const enterFloor = f => {
    G.floor = f; G.rooms = makeFloor(G.seed, f); G.cur = 0; G.hitFloor = false; G.p.x = RW / 2; G.p.y = RH / 2; loadRoom(0, -1);
    announce('Étage ' + f + ' / ' + FLOORS);
  };
  const SYNFLAGS = () => { const p = G.p, f = {}; for (const k of Object.keys(p.fx)) f[k] = p.fx[k] > 0; f.shield = p.flags.has('shield'); f.orbit = p.orbit > 0; f.nova2 = p.flags.has('nova2'); f.shots3 = p.shots >= 3; return f; };
  const recalcSyn = () => { const f = SYNFLAGS(); for (const s of SYN) { if (s.f(f)) { if (!G.syn.has(s.id)) { G.syn.add(s.id); announce('Synergie : ' + s.n + ' — ' + s.d); SFX.item(); } } } };
  /* ----- rooms ----- */
  const loadRoom = (idx, from) => {
    const r = G.rooms[idx]; G.cur = idx; G.rl = makeLayout(r, G.floor); r.visited = true; G.e = []; G.b = []; G.eb = []; G.pk = G.pk.filter(k => k.keep); G.fire = []; G.fl = [];
    G.door = 0;
    const p = G.p; if (from >= 0) { const d = DOORS[from]; p.x = clamp((d.x + .5 - DIRS[from][0] * 1.3) * TILE, TILE, RW - TILE); p.y = clamp((d.y + .5 - DIRS[from][1] * 1.3) * TILE, TILE, RH - TILE); }
    p.shield = p.flags.has('shield') ? 1 : 0;
    const R = CR.rng(r.seed ^ 0x5bd1);
    if (!r.cleared && (r.type === 'combat' || r.type === 'boss')) {
      if (r.type === 'boss') {
        const want = [2, 3, 4, 4, 5][G.floor - 1], pool = CREATURES.filter(c => CR.RK[c.r] === want), c = pool[Math.floor(R() * pool.length)];
        const e = makeEnemy(c, G.floor, RW / 2, RH / 2 - 20, true); e.spawn = 1.4; G.e.push(e); announce('Boss : ' + c.n);
      } else {
        const tierLo = Math.max(0, Math.floor((G.floor - 1) * .9)), tierHi = Math.min(4, tierLo + 1 + (G.floor > 2 ? 1 : 0)), pool = CREATURES.filter(c => CR.RK[c.r] >= tierLo && CR.RK[c.r] <= tierHi), n = ri2(R, 2 + (G.floor > 1 ? 1 : 0), 4 + G.floor);
        for (let i = 0; i < n; i++) { const c = pool[Math.floor(R() * pool.length)]; let x, y, k = 0; do { x = rnd(TILE * 1.5, RW - TILE * 1.5); y = rnd(TILE * 1.5, RH - TILE * 1.5); k++; } while (k < 30 && (Math.hypot(x - p.x, y - p.y) < 130 || solidAt(x, y, 12))); G.e.push(makeEnemy(c, G.floor, x, y)); }
      }
    }
    if (r.type === 'treasure' && !r.loot) { r.loot = 'done'; const pool = ITEMS.filter(i => unlocked(i)), it = pool[Math.floor(R() * pool.length)]; r.item = it.id; }
    if (r.type === 'treasure' && r.item && !r.taken) G.pk.push({ kind: 'item', id: r.item, x: RW / 2, y: RH / 2, keep: false, bob: 0 });
    if (r.type === 'shop') {
      const items = []; const pool = ITEMS.filter(i => unlocked(i)); for (let i = 0; i < 3; i++) items.push(pool[Math.floor(R() * pool.length)]);
      (r.sold ||= {}); items.forEach((it, i) => { if (!r.sold[i]) G.pk.push({ kind: 'item', id: it.id, x: RW / 2 + (i - 1) * 90, y: RH / 2 - 20, price: 8 + it.t * 6, slot: i, keep: false, bob: i }); });
      if (!r.sold.h) G.pk.push({ kind: 'heart', price: 6, slot: 'h', x: RW / 2 - 180, y: RH / 2 + 50, keep: false });
    }
    if (r.type === 'boss' && r.cleared && G.floor < FLOORS && !r.nextTaken) G.pk.push({ kind: 'stairs', x: RW / 2, y: RH / 2, keep: false });
    G.rl.forEach((row, y) => row.forEach((v, x) => { if (v === 2) G.fire.push({ x: (x + .5) * TILE, y: (y + .5) * TILE, spike: true }); }));
    G.roomWasClear = r.cleared; saveRun();
  };
  const solidAt = (x, y, rad = 0) => { if (x - rad < 0 || y - rad < 0 || x + rad > RW || y + rad > RH) return true; for (const [dx, dy] of [[-rad, -rad], [rad, -rad], [-rad, rad], [rad, rad]]) { const tx = Math.floor((x + dx) / TILE), ty = Math.floor((y + dy) / TILE); const v = G.rl[ty]?.[tx]; if (v === 1 || v === 3) return true; } return false; };
  const shotSolid = (x, y) => { const v = G.rl[Math.floor(y / TILE)]?.[Math.floor(x / TILE)]; return v === 1; };
  const doorsOpen = () => G.rooms[G.cur].cleared;
  const saveRun = () => {
    if (!G || G.over) return; const p = G.p;
    doc.run = { seed: G.seed, floor: G.floor, cur: G.cur, hero: G.hero, kills: G.kills, time: Math.round(G.time), hitFloor: G.hitFloor, roomClears: G.roomClears, items: G.items, rooms: G.rooms.map(r => ({ v: r.visited, c: r.cleared, k: r.taken, s: r.sold, n: r.nextTaken })),
      p: { hp: p.hp, maxhp: p.maxhp, dmg: p.dmg, delay: p.delay, speed: p.speed, shotSpd: p.shotSpd, range: p.range, luck: p.luck, shots: p.shots, size: p.size, coins: p.coins, fx: p.fx, flags: [...p.flags], orbit: p.orbit, magnet: p.magnet, iframes: p.iframes, loot: p.loot, dodge: p.dodge, act: p.act } };
    save();
  };
  const resumeRun = () => {
    const s = doc.run; if (!s || !CBYID[s.hero]) return false;
    newRunBare(s.hero, s.seed); const p = G.p, q = s.p; Object.assign(p, q, { flags: new Set(q.flags), fx: { ...q.fx } }); G.floor = s.floor; G.kills = s.kills; G.time = s.time; G.hitFloor = s.hitFloor; G.roomClears = s.roomClears; G.items = s.items.slice();
    G.rooms = makeFloor(G.seed, G.floor); s.rooms.forEach((r, i) => { const o = G.rooms[i]; if (o) { o.visited = r.v; o.cleared = r.c; o.taken = r.k; o.sold = r.s; o.nextTaken = r.n; } });
    G.cur = s.cur; p.x = RW / 2; p.y = RH / 2; loadRoom(G.cur, -1); recalcSyn(); G.syn.forEach(() => {}); toastq = []; return true;
  };
  const newRunBare = (hero, seed) => { const keep = doc.stats.runs; const run = newRun(hero); doc.stats.runs = keep; G.seed = seed; return run; };
  /* ----- player and shots ----- */
  const procChance = (p, fx) => clamp((p.fx[fx] || 0) + p.luck * .02, 0, 1);
  const addFx = (p, fx, sure) => { p.fx[fx] = clamp((p.fx[fx] || 0) + (sure ? 1 : .35), 0, 1); };
  const takeItem = id => {
    const it = ITEM_BY[id], p = G.p; G.items.push(id);
    if (it.fx) addFx(p, it.fx, it.sure); if (it.ap) it.ap(p); if (it.act) p.act = { id, kind: it.act.kind, max: it.act.max, charge: it.act.max };
    doc.stats.bestItems = Math.max(doc.stats.bestItems, G.items.length); recalcSyn(); announce(it.n + ' — ' + it.d); SFX.item(); checkAch(); saveRun();
  };
  const spawnShot = (x, y, ang, extra = {}) => {
    const p = G.p, spd = p.shotSpd, fx = {};
    for (const k of Object.keys(p.fx)) if (p.fx[k] > 0 && (['bounce', 'pierce', 'homing'].includes(k) ? Math.random() < Math.max(procChance(p, k), p.fx[k] >= 1 ? 1 : 0) : Math.random() < procChance(p, k))) fx[k] = 1;
    let dmg = p.dmg * (p.flags.has('furie') && p.hp <= 4 ? 1.5 : 1) * (hasSyn('guide') && fx.homing && fx.pierce ? 1.25 : 1);
    G.b.push({ x, y, vx: Math.cos(ang) * spd + p.vx * .25, vy: Math.sin(ang) * spd + p.vy * .25, dmg, r: 4 * p.size, life: p.range, fx, hit: new Set(), col: fx.burn ? '#ff8a5c' : fx.freeze ? '#9fe8ff' : fx.poison ? '#c070ff' : fx.chain ? '#ffe45c' : fx.explode ? '#ffb43c' : '#ffffff', ...extra, bounced: 0 });
  };
  const shootDir = (dx, dy) => {
    const p = G.p, base = Math.atan2(dy, dx), n = p.shots; SFX.shot();
    const offs = n === 1 ? [0] : n === 2 ? [-.0, 0] : [-.28, 0, .28];
    offs.forEach((o, i) => { if (n === 2) { const px = -Math.sin(base) * (i ? 5 : -5), py = Math.cos(base) * (i ? 5 : -5); spawnShot(p.x + px, p.y + py, base); } else spawnShot(p.x, p.y, base + o); });
  };
  const nova2 = () => { const n = hasSyn('tempete') ? 16 : 8; for (let i = 0; i < n; i++) spawnShot(G.p.x, G.p.y, i / n * Math.PI * 2); SFX.boom(); };
  const hurt = (dmg, src) => {
    const p = G.p; if (p.inv > 0 || p.dash > 0 || G.over) return;
    if (p.shield > 0) { p.shield = 0; p.inv = .8; announce('Écu brisé'); SFX.hit(); return; }
    if (Math.random() < p.dodge) { p.inv = .5; announce('Esquive !'); return; }
    p.hp -= dmg * 1; G.hitFloor = true; p.inv = 1.1 + p.iframes; shake = .25; SFX.hurt(); if (p.flags.has('thorns') && src) { src.hp -= 3; src.flash = .1; }
    if (p.hp <= 0) die();
  };
  const heal = n => { G.p.hp = Math.min(G.p.maxhp, G.p.hp + n); };
  const die = () => { G.over = true; doc.run = null; endRun(false); };
  const endRun = victory => {
    const s = doc.stats, souls = Math.round(G.floor * 12 + G.kills / 4 + (victory ? 120 : 0) + G.items.length * 2);
    s.deaths += victory ? 0 : 1; s.wins += victory ? 1 : 0; s.best = Math.max(s.best, G.floor); s.kills += G.kills; s.time += G.time; s.coins += G.p.coins; doc.souls += souls; G.souls = souls;
    doc.hist.unshift({ id: 'r' + Date.now().toString(36), t: Date.now(), hero: G.hero, floor: G.floor, kills: G.kills, items: G.items.length, victory, time: Math.round(G.time), souls }); doc.hist = doc.hist.slice(0, 30);
    doc.run = null; checkAch(); save(true); G.victory = victory; setTimeout(() => showEnd(victory), victory ? 600 : 900);
  };
  /* ----- update ----- */
  const addPickup = (kind, x, y) => { const a = rnd(0, 6.28); G.pk.push({ kind, x, y, vx: Math.cos(a) * 60, vy: Math.sin(a) * 60, keep: false, t: 0 }); };
  const dropLoot = e => {
    const p = G.p, ch = (e.boss ? 1 : .35) + p.loot;
    if (Math.random() < ch) addPickup('coin', e.x, e.y); if (Math.random() < ch * .45) addPickup('coin', e.x, e.y);
    if (Math.random() < (e.boss ? .5 : .08) + p.loot * .2) addPickup('heart', e.x, e.y);
  };
  const killEnemy = e => {
    e.dead = true; G.kills++; dropLoot(e); SFX.kill();
    G.fl.push({ x: e.x, y: e.y, t: .4, kind: 'puff' });
    if (e.ai === 'hop' && e.c.plan === 'blob' && e.max > 14 && !e.child) for (let i = 0; i < 2; i++) { const k = makeEnemy(e.c, G.floor, e.x + rnd(-14, 14), e.y + rnd(-14, 14)); k.hp = k.max = Math.round(e.max / 3); k.r = 8; k.child = true; k.spawn = .3; G.e.push(k); }
  };
  const damageEnemy = (e, dmg, fx = {}, shot) => {
    if (e.spawn > 0 || e.dead) return;
    const p = G.p; let d = dmg * (e.freeze > 0 && hasSyn('percegel') && shot?.fx?.pierce ? 1.4 : 1);
    e.hp -= d; e.flash = .08; SFX.hit();
    const dur = hasSyn('toxique') ? 1.5 : 1;
    if (fx.burn) e.burn = 3 * dur; if (fx.freeze) e.freeze = 2.2; if (fx.poison) e.poison = 4 * dur;
    if (fx.lifesteal && Math.random() < (hasSyn('sangvicie') ? .16 : .08)) { heal(1); }
    if (fx.chain) { const o = G.e.filter(k => k !== e && !k.dead && dist(k, e) < 95).sort((a, b) => dist(a, e) - dist(b, e))[0]; if (o) { G.fl.push({ x: e.x, y: e.y, x2: o.x, y2: o.y, t: .15, kind: 'zap' }); o.hp -= d * .5; o.flash = .08; if (hasSyn('foudregel')) o.freeze = 1.5; if (o.hp <= 0 && !o.dead) killEnemy(o); } }
    if (fx.explode) explode(e.x, e.y, d * .6, hasSyn('brasier') ? 62 : 46, hasSyn('brasier'), e);
    if (fx.split && shot && !shot.child) for (const a of [-1, 1]) { const ang = Math.atan2(shot.vy, shot.vx) + a * 1.1; G.b.push({ ...shot, x: e.x, y: e.y, vx: Math.cos(ang) * 200, vy: Math.sin(ang) * 200, dmg: d * .45, r: shot.r * .75, life: 130, hit: new Set([e]), child: true, fx: { ...shot.fx, split: 0 } }); }
    if (e.hp <= 0 && !e.dead) killEnemy(e);
  };
  const explode = (x, y, dmg, rad, burn, from) => {
    SFX.boom(); G.fl.push({ x, y, t: .3, kind: 'boom', r: rad });
    for (const k of G.e) if (k !== from && !k.dead && k.spawn <= 0 && Math.hypot(k.x - x, k.y - y) < rad + k.r) { k.hp -= dmg; k.flash = .08; if (burn) k.burn = 3; if (k.hp <= 0) killEnemy(k); }
    if (hasSyn('frag')) for (let i = 0; i < 4; i++) { const a = i * 1.57 + .8; G.b.push({ x, y, vx: Math.cos(a) * 220, vy: Math.sin(a) * 220, dmg: dmg * .4, r: 3, life: 110, fx: {}, hit: new Set(), col: '#ffb43c', child: true }); }
  };
  const enemyShoot = (e, ang, spd = 130, n = 1, spread = 0, r = 4) => { for (let i = 0; i < n; i++) { const a = ang + (n > 1 ? (i - (n - 1) / 2) * spread : 0); G.eb.push({ x: e.x, y: e.y, vx: Math.cos(a) * spd, vy: Math.sin(a) * spd, r, dmg: 1, life: 3.2, col: e.shotCol }); } };
  const moveWithWalls = (o, dx, dy, rad, fly) => { if (fly || !solidAt(o.x + dx, o.y, rad)) o.x += dx; else if (fly) o.x += dx; if (fly || !solidAt(o.x, o.y + dy, rad)) o.y += dy; o.x = clamp(o.x, rad, RW - rad); o.y = clamp(o.y, rad, RH - rad); };
  const updateEnemy = (e, dt) => {
    const p = G.p;
    if (e.spawn > 0) { e.spawn -= dt; return; }
    e.t += dt; if (e.flash > 0) e.flash -= dt;
    if (e.burn > 0) { e.burn -= dt; e.hp -= dt * 1.6 * (hasSyn('toxique') ? 1.5 : 1); if (e.hp <= 0 && !e.dead) { killEnemy(e); return; } }
    if (e.poison > 0) { e.poison -= dt; e.hp -= dt * 1.3 * (hasSyn('toxique') ? 1.5 : 1); if (e.hp <= 0 && !e.dead) { killEnemy(e); return; } }
    const slow = e.freeze > 0 ? (e.freeze -= dt, .45) : 1, sp = e.spd * slow, dx = p.x - e.x, dy = p.y - e.y, d = Math.hypot(dx, dy) || 1, ux = dx / d, uy = dy / d;
    e.cd -= dt * slow;
    let vx = 0, vy = 0;
    switch (e.ai) {
      case 'chase': vx = ux * sp; vy = uy * sp; break;
      case 'hop': { const ph = Math.sin(e.t * 3.2); const k = ph > 0 ? 1.7 : .15; vx = ux * sp * k; vy = uy * sp * k; break; }
      case 'charge': if (e.state === 'wind') { e.st -= dt; vx = vy = 0; if (e.st <= 0) { e.state = 'rush'; e.st = .8; e.dx = ux; e.dy = uy; } } else if (e.state === 'rush') { e.st -= dt; vx = e.dx * sp * 3.4; vy = e.dy * sp * 3.4; if (e.st <= 0 || solidAt(e.x + e.dx * 14, e.y + e.dy * 14, 8)) { e.state = ''; e.cd = rnd(1.2, 2.2); } } else { vx = ux * sp * .55; vy = uy * sp * .55; if (e.cd <= 0) { e.state = 'wind'; e.st = .55; } } break;
      case 'weave': { const s = Math.sin(e.t * 3) * .9; vx = (ux - uy * s) * sp; vy = (uy + ux * s) * sp; break; }
      case 'swarm': { const a = e.t * 3.1 + e.c.seed; vx = (ux * .6 + Math.cos(a) * .9) * sp * 1.1; vy = (uy * .6 + Math.sin(a) * .9) * sp * 1.1; break; }
      case 'flyer': case 'ghost': { const want = e.ai === 'ghost' ? 110 : 130, k = d > want + 25 ? 1 : d < want - 25 ? -1 : 0, s = Math.sin(e.t * 1.7); vx = (ux * k - uy * s * .7) * sp; vy = (uy * k + ux * s * .7) * sp; if (e.cd <= 0) { enemyShoot(e, Math.atan2(dy, dx), 125); e.cd = rnd(1.4, 2.4); } break; }
      case 'turret': if (e.cd <= 0) { enemyShoot(e, Math.atan2(dy, dx), 120, 3, .28); e.cd = rnd(1.8, 2.6); } break;
      case 'tri': { const k = d > 150 ? .8 : d < 90 ? -.8 : 0; vx = ux * k * sp + Math.cos(e.t) * 18; vy = uy * k * sp + Math.sin(e.t * 1.3) * 18; if (e.cd <= 0) { enemyShoot(e, Math.atan2(dy, dx), 135, 3, .35); e.cd = rnd(1.6, 2.4); } break; }
      case 'dash': if (e.state === 'rush') { e.st -= dt; vx = e.dx * sp * 3.2; vy = e.dy * sp * 3.2; if (e.st <= 0) { e.state = ''; e.cd = rnd(1.6, 2.6); enemyShoot(e, Math.atan2(dy, dx), 140, 3, .3); } } else { vx = ux * sp * .5; vy = uy * sp * .5; if (e.cd <= 0) { e.state = 'rush'; e.st = .5; e.dx = ux; e.dy = uy; } } break;
    }
    if (e.boss) updateBoss(e, dt, ux, uy, d, dx, dy); else moveWithWalls(e, vx * dt, vy * dt, e.r - 2, e.fly);
    // enemies push each other apart a little
    for (const o of G.e) if (o !== e && !o.dead && o.spawn <= 0) { const ox = e.x - o.x, oy = e.y - o.y, dd = Math.hypot(ox, oy) || 1, min = e.r + o.r - 4; if (dd < min) { e.x += ox / dd * (min - dd) * .3; e.y += oy / dd * (min - dd) * .3; } }
    if (Math.hypot(p.x - e.x, p.y - e.y) < e.r + p.r - 2) hurt(e.dmg, e);
  };
  const updateBoss = (e, dt, ux, uy, d, dx, dy) => {
    const ph = e.hp < e.max * .5 ? 1 : 0, sp = e.spd * (e.freeze > 0 ? .5 : 1) * (1 + ph * .35);
    if (ph && !e.enraged) { e.enraged = true; announce(e.c.n + ' s\'énerve !'); e.cd = .6; }
    if (e.state === 'rush') { e.st -= dt; moveWithWalls(e, e.dx * sp * 3.3 * dt, e.dy * sp * 3.3 * dt, 24); if (e.st <= 0) { e.state = ''; e.cd = 1.2 - ph * .35; } return; }
    moveWithWalls(e, ux * sp * .5 * dt, uy * sp * .5 * dt, 24);
    if (e.cd > 0) return;
    const pat = e.pats[e.ph % 3]; e.ph++; e.cd = (1.7 - ph * .5) + rnd(0, .5);
    const a = Math.atan2(dy, dx);
    if (pat === 'radial') for (let k = 0; k < 14 + ph * 6; k++) enemyShoot(e, k / (14 + ph * 6) * 6.283 + e.t, 105, 1, 0, 5);
    else if (pat === 'aimed') for (let k = 0; k < 3 + ph * 2; k++) setTimeout(() => { if (G && !e.dead) enemyShoot(e, Math.atan2(G.p.y - e.y, G.p.x - e.x), 170, 3, .22, 5); }, k * 220);
    else if (pat === 'charge') { e.state = 'rush'; e.st = .65; e.dx = ux; e.dy = uy; e.cd = 0; }
    else if (pat === 'summon') { for (let k = 0; k < 2 + ph; k++) { const pool = CREATURES.filter(c => CR.RK[c.r] <= Math.min(2, G.floor)), c = pool[Math.floor(Math.random() * pool.length)], m = makeEnemy(c, G.floor, e.x + rnd(-50, 50), e.y + rnd(30, 60)); m.spawn = .5; G.e.push(m); } }
    else if (pat === 'spiral') for (let k = 0; k < 24; k++) setTimeout(() => { if (G && !e.dead) enemyShoot(e, k * .5 + e.t, 115, 2, 3.14159, 4); }, k * 70);
    else if (pat === 'rain') for (let k = 0; k < 9 + ph * 4; k++) { const x = rnd(TILE, RW - TILE); G.eb.push({ x, y: 8, vx: rnd(-10, 10), vy: rnd(90, 150), r: 5, dmg: 1, life: 3.5, col: e.shotCol }); }
  };
  const roomCleared = () => {
    const r = G.rooms[G.cur]; r.cleared = true; G.roomClears++; doc.stats.rooms++; SFX.door();
    const p = G.p; if (p.act && p.act.charge < p.act.max) p.act.charge++;
    if (p.flags.has('regen') && G.roomClears % 2 === 0) heal(1);
    if (r.type === 'combat' && Math.random() < .25 + p.loot) addPickup(Math.random() < .5 ? 'heart' : 'coin', RW / 2, RH / 2);
    if (r.type === 'boss') {
      doc.stats.bosses++; if (G.floor === 1) doc.ach.boss1 = true;
      if (G.floor >= FLOORS) { G.over = true; endRun(true); return; }
      G.pk.push({ kind: 'stairs', x: RW / 2, y: RH / 2, keep: false });
      const R = CR.rng(r.seed ^ 77), pool = ITEMS.filter(i => unlocked(i)), it = pool[Math.floor(R() * pool.length)]; G.pk.push({ kind: 'item', id: it.id, x: RW / 2 - 70, y: RH / 2, keep: false, bob: 0, boss: true });
    }
    if (G.floor && !G.hitFloor && r.type === 'boss') { doc.ach.intact = true; }
    checkAch(); saveRun();
  };
  const usePlayerAct = () => {
    const p = G.p, a = p.act; if (!a || a.charge < a.max) return;
    a.charge = 0;
    if (a.kind === 'dash') { const k = keys; let dx = (k.KeyD ? 1 : 0) - (k.KeyA ? 1 : 0), dy = (k.KeyS ? 1 : 0) - (k.KeyW ? 1 : 0); if (!dx && !dy) { dx = p.face; } const n = Math.hypot(dx, dy) || 1; p.dashx = dx / n; p.dashy = dy / n; p.dash = .22; SFX.shot(); }
    else if (a.kind === 'nova') { for (const e of G.e) if (!e.dead && e.spawn <= 0) { e.hp -= e.boss ? 25 : 18; e.flash = .15; if (e.hp <= 0) killEnemy(e); } G.fl.push({ x: p.x, y: p.y, t: .4, kind: 'boom', r: 200 }); SFX.boom(); shake = .3; }
    else if (a.kind === 'heal') { heal(4); SFX.pick(); }
    saveRun();
  };
  const update = dt => {
    const p = G.p; G.time += dt; G.t += dt; if (shake > 0) shake -= dt;
    const r = G.rooms[G.cur];
    // movement
    let dx = (keys.KeyD ? 1 : 0) - (keys.KeyA ? 1 : 0), dy = (keys.KeyS ? 1 : 0) - (keys.KeyW ? 1 : 0);
    if (p.dash > 0) { p.dash -= dt; dx = p.dashx; dy = p.dashy; }
    const n = Math.hypot(dx, dy) || 1, sp = p.dash > 0 ? 520 : p.speed;
    const tvx = dx / n * sp * (dx || dy ? 1 : 0), tvy = dy / n * sp * (dx || dy ? 1 : 0);
    p.vx += (tvx - p.vx) * Math.min(1, dt * 14); p.vy += (tvy - p.vy) * Math.min(1, dt * 14);
    moveWithWalls(p, p.vx * dt, p.vy * dt, p.r, false); if (dx) p.face = Math.sign(dx);
    if (p.inv > 0) p.inv -= dt;
    // shooting
    p.cd -= dt;
    let sx = (keys.ArrowRight ? 1 : 0) - (keys.ArrowLeft ? 1 : 0), sy = (keys.ArrowDown ? 1 : 0) - (keys.ArrowUp ? 1 : 0);
    if (!sx && !sy && mouse.down) { sx = mouse.x - p.x; sy = mouse.y - p.y; }
    if ((sx || sy) && p.cd <= 0) { shootDir(sx, sy); p.cd = p.delay; if (p.flags.has('nova2') && Math.random() < .07) nova2(); }
    // orbitals
    p.orbAng += dt * 3.2;
    // doors
    if (r.cleared) {
      for (let i = 0; i < 4; i++) if (r.doors[i]) { const d = DOORS[i], cx = (d.x + .5) * TILE, cy = (d.y + .5) * TILE; const near = i % 2 === 0 ? Math.abs(p.x - cx) < 26 && (i === 0 ? p.y < 14 : p.y > RH - 14) : Math.abs(p.y - cy) < 26 && (i === 1 ? p.x > RW - 14 : p.x < 14); if (near) { const to = r.nb[i], back = (i + 2) % 4; loadRoom(to, back); return; } }
    } else if (!G.e.some(e => !e.dead)) roomCleared();
    // player shots
    for (const b of G.b) {
      if (b.fx.homing) { const t = G.e.filter(e => !e.dead && e.spawn <= 0).sort((a, c) => dist(a, b) - dist(c, b))[0]; if (t) { const a = Math.atan2(t.y - b.y, t.x - b.x), cur = Math.atan2(b.vy, b.vx), sp = Math.hypot(b.vx, b.vy); let da = a - cur; while (da > Math.PI) da -= 6.283; while (da < -Math.PI) da += 6.283; const na = cur + clamp(da, -dt * 4, dt * 4); b.vx = Math.cos(na) * sp; b.vy = Math.sin(na) * sp; } }
      const mx = b.vx * dt, my = b.vy * dt; b.x += mx; b.y += my; b.life -= Math.hypot(mx, my);
      const wallX = b.x < 4 || b.x > RW - 4, wallY = b.y < 4 || b.y > RH - 4, rock = shotSolid(b.x, b.y);
      if (wallX || wallY || rock) { if (b.fx.bounce && b.bounced < 3) { b.bounced++; if (wallX) b.vx *= -1; else if (wallY) b.vy *= -1; else { b.vx *= -1; b.vy *= -1; } b.x = clamp(b.x, 5, RW - 5); b.y = clamp(b.y, 5, RH - 5); if (hasSyn('ricochet')) { const o = G.e.filter(e => !e.dead && dist(e, b) < 120)[0]; if (o) { G.fl.push({ x: b.x, y: b.y, x2: o.x, y2: o.y, t: .15, kind: 'zap' }); damageEnemy(o, b.dmg * .5, {}, null); } } } else b.life = 0; }
      if (b.life <= 0) continue;
      for (const e of G.e) { if (e.dead || e.spawn > 0 || b.hit.has(e) || b.dead) continue; if (Math.hypot(e.x - b.x, e.y - b.y) < e.r + b.r) { b.hit.add(e); damageEnemy(e, b.dmg, b.fx, b); if (b.fx.pierce) b.dmg *= .9; else b.dead = true; } }
    }
    G.b = G.b.filter(b => b.life > 0 && !b.dead);
    // enemies
    for (const e of G.e) if (!e.dead) updateEnemy(e, dt);
    G.e = G.e.filter(e => !e.dead);
    // enemy shots (also blocked by the satellites when the shield synergy is on)
    for (const b of G.eb) {
      b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt; if (b.x < 0 || b.y < 0 || b.x > RW || b.y > RH || shotSolid(b.x, b.y)) b.life = 0;
      if (hasSyn('aegis')) for (let i = 0; i < p.orbit; i++) { const a = p.orbAng + i * 6.283 / p.orbit, ox = p.x + Math.cos(a) * 30, oy = p.y + Math.sin(a) * 30; if (Math.hypot(b.x - ox, b.y - oy) < 9) b.life = 0; }
      if (b.life > 0 && Math.hypot(b.x - p.x, b.y - p.y) < b.r + p.r) { b.life = 0; hurt(b.dmg); }
    }
    G.eb = G.eb.filter(b => b.life > 0);
    // satellites hurt
    for (let i = 0; i < p.orbit; i++) { const a = p.orbAng + i * 6.283 / p.orbit, ox = p.x + Math.cos(a) * 30, oy = p.y + Math.sin(a) * 30; for (const e of G.e) if (!e.dead && e.spawn <= 0 && Math.hypot(e.x - ox, e.y - oy) < e.r + 6 && (!e.orbHit || e.orbHit < G.t)) { e.orbHit = G.t + .35; damageEnemy(e, p.dmg * .8, { }, null); } }
    // spikes
    for (const s of G.fire) if (s.spike && Math.hypot(s.x - p.x, s.y - p.y) < 13 && p.dash <= 0) hurt(1);
    // pickups
    for (const k of G.pk) {
      if (k.vx != null) { k.x += k.vx * dt; k.y += k.vy * dt; k.vx *= .92; k.vy *= .92; k.x = clamp(k.x, 14, RW - 14); k.y = clamp(k.y, 14, RH - 14); }
      if (p.magnet && (k.kind === 'coin' || k.kind === 'heart') && dist(k, p) < p.magnet) { const a = Math.atan2(p.y - k.y, p.x - k.x); k.x += Math.cos(a) * 160 * dt; k.y += Math.sin(a) * 160 * dt; }
      k.t = (k.t || 0) + dt; const d = dist(k, p);
      if (k.kind === 'coin' && d < 16) { k.gone = true; p.coins++; SFX.pick(); if (p.coins >= 30) doc.ach.riche = true; }
      else if (k.kind === 'heart' && d < 16 && !k.price && p.hp < p.maxhp) { k.gone = true; heal(2); SFX.pick(); }
      else if (k.kind === 'heart' && k.price && d < 20 && p.coins >= k.price && p.hp < p.maxhp) { k.gone = true; p.coins -= k.price; heal(2); r.sold.h = 1; SFX.pick(); saveRun(); }
      else if (k.kind === 'item' && d < 20 && (!k.price || p.coins >= k.price)) {
        if (k.price) { p.coins -= k.price; r.sold[k.slot] = 1; } else if (r.type === 'treasure') r.taken = true;
        k.gone = true; takeItem(k.id);
      }
      else if (k.kind === 'stairs' && d < 22) { k.gone = true; doc.run = null; enterFloor(G.floor + 1); if (G.hitFloor === false) {} saveRun(); return; }
    }
    G.pk = G.pk.filter(k => !k.gone);
    for (const f of G.fl) f.t -= dt; G.fl = G.fl.filter(f => f.kind === undefined || f.t > 0 || f.spike);
    if (p.hp > p.maxhp) p.hp = p.maxhp;
  };
  /* ----- drawing ----- */
  const sprites = new Map(), whites = new Map();
  const spr = (c, frame, white) => { if (!white) return CR.sprite(c, frame); const k = c.id + frame; let w = whites.get(k); if (!w) { const s = CR.sprite(c, frame); w = document.createElement('canvas'); w.width = w.height = 32; const x = w.getContext('2d'); x.drawImage(s, 0, 0); x.globalCompositeOperation = 'source-in'; x.fillStyle = '#fff'; x.fillRect(0, 0, 32, 32); whites.set(k, w); } return w; };
  const FLOOR_COL = [['#2a1d52', '#1d1440'], ['#3a2020', '#2a1414'], ['#1c3a2c', '#12281e'], ['#1c2c4a', '#121e36'], ['#3a1c48', '#28123a']];
  const drawRoom = () => {
    const pal = FLOOR_COL[(G.floor - 1) % 5], r = G.rooms[G.cur];
    g.fillStyle = '#0a0418'; g.fillRect(0, HUD, CW, CH - HUD);
    for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) { g.fillStyle = (x + y) & 1 ? pal[0] : pal[1]; g.fillRect(WALL + x * TILE, HUD + WALL + y * TILE, TILE, TILE); }
    // walls
    g.fillStyle = '#3a2a6e'; g.fillRect(0, HUD, CW, WALL); g.fillRect(0, HUD + WALL + RH, CW, WALL); g.fillRect(0, HUD, WALL, RH + WALL * 2); g.fillRect(WALL + RW, HUD, WALL, RH + WALL * 2);
    g.fillStyle = '#1b1238'; g.fillRect(8, HUD + 8, CW - 16, 2); g.fillRect(8, HUD + CH - HUD - 10, CW - 16, 2);
    for (let i = 0; i < 4; i++) if (r.doors[i]) { const d = DOORS[i], x = WALL + d.x * TILE, y = HUD + WALL + d.y * TILE; g.fillStyle = r.cleared ? '#0a0418' : '#6b1d3a'; g.fillRect(x, y, TILE, TILE); g.fillStyle = r.cleared ? '#ffd07a' : '#ff4f6d'; if (i % 2 === 0) { g.fillRect(x, y + (i ? 26 : 0), TILE, 6); } else g.fillRect(x + (i === 1 ? 26 : 0), y, 6, TILE); if (!r.cleared) { g.fillStyle = '#2a0a18'; g.fillRect(x + 6, y + 6, TILE - 12, TILE - 12); } }
    G.rl.forEach((row, y) => row.forEach((v, x) => {
      const px = WALL + x * TILE, py = HUD + WALL + y * TILE;
      if (v === 1) { g.fillStyle = '#5b4a8c'; g.fillRect(px + 2, py + 2, 28, 28); g.fillStyle = '#7d6bb4'; g.fillRect(px + 2, py + 2, 28, 5); g.fillRect(px + 2, py + 2, 5, 28); g.fillStyle = '#3a2a6e'; g.fillRect(px + 25, py + 5, 5, 25); g.fillRect(px + 5, py + 25, 25, 5); }
      else if (v === 3) { g.fillStyle = '#05010b'; g.fillRect(px + 2, py + 2, 28, 28); g.fillStyle = '#1b1238'; g.fillRect(px + 2, py + 2, 28, 4); }
      else if (v === 2) { g.fillStyle = '#251848'; g.fillRect(px + 4, py + 4, 24, 24); g.fillStyle = '#c9c9d8'; for (let k = 0; k < 4; k++) { g.fillRect(px + 7 + (k & 1) * 12, py + 7 + (k >> 1) * 12, 4, 6); } }
    }));
  };
  const drawSprite = (c, x, y, sc, frame, white, flip) => { const s = spr(c, frame, white); g.save(); g.translate(Math.round(WALL + x), Math.round(HUD + WALL + y)); if (flip) g.scale(-1, 1); g.drawImage(s, -16 * sc, -16 * sc - 2, 32 * sc, 32 * sc); g.restore(); };
  const heartIcon = (x, y, fill) => { g.fillStyle = fill ? '#ff4f6d' : '#3a1730'; for (const [px, py, w, h] of [[1, 0, 2, 1], [4, 0, 2, 1], [0, 1, 7, 2], [1, 3, 5, 1], [2, 4, 3, 1], [3, 5, 1, 1]]) g.fillRect(x + px * 2, y + py * 2, w * 2, h * 2); if (fill) { g.fillStyle = '#ffb3c0'; g.fillRect(x + 2, y + 2, 2, 2); } };
  const draw = () => {
    g.save(); if (shake > 0) g.translate(rnd(-2, 2), rnd(-2, 2));
    g.clearRect(0, 0, CW, CH); g.fillStyle = '#0a0418'; g.fillRect(0, 0, CW, CH);
    drawRoom();
    const p = G.p, ox = WALL, oy = HUD + WALL, fr = Math.floor(G.t * 3) & 1;
    // shadows and sprites sorted by y
    const items = [];
    for (const k of G.pk) items.push({ y: k.y, f: () => drawPickup(k) });
    for (const e of G.e) items.push({ y: e.y, f: () => { if (e.spawn > 0) { g.globalAlpha = .4 + (.6 - e.spawn) * .5; } drawSprite(e.c, e.x, e.y, e.scale, fr, e.flash > 0, e.dx < 0 || (G.p.x < e.x)); g.globalAlpha = 1; if (e.freeze > 0) { g.fillStyle = 'rgba(159,232,255,.3)'; g.fillRect(ox + e.x - e.r, oy + e.y - e.r, e.r * 2, e.r * 2); } if (e.burn > 0) { g.fillStyle = '#ff8a5c'; g.fillRect(ox + e.x - 2, oy + e.y - e.r - 6 - (G.t * 20 % 6), 3, 3); } if (e.poison > 0) { g.fillStyle = '#c070ff'; g.fillRect(ox + e.x + 4, oy + e.y - e.r - 4 - (G.t * 15 % 6), 3, 3); } if (e.hp < e.max && !e.boss) { g.fillStyle = '#000'; g.fillRect(ox + e.x - 11, oy + e.y - e.r - 8, 22, 4); g.fillStyle = '#ff4f6d'; g.fillRect(ox + e.x - 10, oy + e.y - e.r - 7, 20 * Math.max(0, e.hp / e.max), 2); } } });
    items.push({ y: p.y, f: () => { if (p.inv > 0 && Math.floor(p.inv * 14) & 1) g.globalAlpha = .35; g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(ox + p.x - 9, oy + p.y + 10, 18, 5); drawSprite(CBYID[G.hero], p.x, p.y, 1, fr, false, p.face < 0); g.globalAlpha = 1; if (p.shield) { g.strokeStyle = '#9fe8ff'; g.lineWidth = 2; g.strokeRect(ox + p.x - 13, oy + p.y - 15, 26, 28); } } });
    items.sort((a, b) => a.y - b.y).forEach(i => i.f());
    for (let i = 0; i < p.orbit; i++) { const a = p.orbAng + i * 6.283 / p.orbit; g.fillStyle = '#9fe8ff'; g.fillRect(ox + p.x + Math.cos(a) * 30 - 4, oy + p.y + Math.sin(a) * 30 - 4, 8, 8); g.fillStyle = '#fff'; g.fillRect(ox + p.x + Math.cos(a) * 30 - 2, oy + p.y + Math.sin(a) * 30 - 2, 3, 3); }
    for (const b of G.b) { g.fillStyle = b.col; g.fillRect(ox + b.x - b.r, oy + b.y - b.r, b.r * 2, b.r * 2); g.fillStyle = '#fff'; g.fillRect(ox + b.x - 1, oy + b.y - 1, 2, 2); }
    for (const b of G.eb) { g.fillStyle = '#10061c'; g.fillRect(ox + b.x - b.r - 1, oy + b.y - b.r - 1, b.r * 2 + 2, b.r * 2 + 2); g.fillStyle = b.col; g.fillRect(ox + b.x - b.r, oy + b.y - b.r, b.r * 2, b.r * 2); g.fillStyle = '#fff'; g.fillRect(ox + b.x - 1, oy + b.y - 1, 2, 2); }
    for (const f of G.fl) { if (f.kind === 'zap') { g.strokeStyle = '#ffe45c'; g.lineWidth = 2; g.beginPath(); g.moveTo(ox + f.x, oy + f.y); g.lineTo(ox + (f.x + f.x2) / 2 + rnd(-6, 6), oy + (f.y + f.y2) / 2 + rnd(-6, 6)); g.lineTo(ox + f.x2, oy + f.y2); g.stroke(); } else if (f.kind === 'boom') { g.strokeStyle = '#ffb43c'; g.lineWidth = 3; g.globalAlpha = f.t * 3; g.strokeRect(ox + f.x - f.r * (1 - f.t), oy + f.y - f.r * (1 - f.t), f.r * 2 * (1 - f.t), f.r * 2 * (1 - f.t)); g.globalAlpha = 1; } else if (f.kind === 'puff') { g.fillStyle = '#fff'; g.globalAlpha = f.t * 2; for (let k = 0; k < 6; k++) g.fillRect(ox + f.x + Math.cos(k) * (.4 - f.t) * 60, oy + f.y + Math.sin(k) * (.4 - f.t) * 60, 4, 4); g.globalAlpha = 1; } }
    // boss bar
    const boss = G.e.find(e => e.boss && !e.dead);
    if (boss) { g.fillStyle = '#05010b'; g.fillRect(WALL + 40, HUD + CH - HUD - 24, RW - 80, 10); g.fillStyle = '#ff4f6d'; g.fillRect(WALL + 42, HUD + CH - HUD - 22, (RW - 84) * Math.max(0, boss.hp / boss.max), 6); g.fillStyle = '#fff'; g.font = '10px monospace'; g.fillText(boss.c.n.toUpperCase(), WALL + 42, HUD + CH - HUD - 28); }
    g.restore();
    drawHud();
  };
  const drawPickup = k => {
    const ox = WALL, oy = HUD + WALL, bob = Math.sin((k.t || 0) * 4 + (k.bob || 0)) * 2;
    if (k.kind === 'coin') { g.fillStyle = '#c98a1d'; g.fillRect(ox + k.x - 5, oy + k.y - 5 + bob, 10, 10); g.fillStyle = '#ffd07a'; g.fillRect(ox + k.x - 4, oy + k.y - 5 + bob, 7, 8); g.fillStyle = '#fff2c4'; g.fillRect(ox + k.x - 3, oy + k.y - 4 + bob, 2, 3); }
    else if (k.kind === 'heart') { heartIcon(ox + k.x - 7, oy + k.y - 6 + bob, true); if (k.price) priceTag(ox + k.x, oy + k.y + 14, k.price); }
    else if (k.kind === 'stairs') { g.fillStyle = '#05010b'; g.fillRect(ox + k.x - 16, oy + k.y - 16, 32, 32); g.fillStyle = '#ffd07a'; for (let i = 0; i < 4; i++) g.fillRect(ox + k.x - 14 + i * 3, oy + k.y - 12 + i * 6, 28 - i * 6, 4); g.fillStyle = '#fff'; g.font = '9px monospace'; g.fillText('SUIVANT', ox + k.x - 21, oy + k.y + 28); }
    else if (k.kind === 'item') { const it = ITEM_BY[k.id]; g.fillStyle = '#251848'; g.fillRect(ox + k.x - 16, oy + k.y + 6, 32, 10); g.fillStyle = '#3a2a6e'; g.fillRect(ox + k.x - 16, oy + k.y + 6, 32, 3);
      g.fillStyle = ['', '#9fe8ff', '#c070ff', '#ffd07a'][it.t]; g.fillRect(ox + k.x - 9, oy + k.y - 14 + bob, 18, 18); g.fillStyle = '#10061c'; g.font = 'bold 12px monospace'; g.fillText(it.n[0], ox + k.x - 4, oy + k.y - 1 + bob); g.strokeStyle = '#fff'; g.lineWidth = 1; g.strokeRect(ox + k.x - 9.5, oy + k.y - 14.5 + bob, 19, 19);
      g.fillStyle = '#fff'; g.font = '10px monospace'; const nm = it.n.length > 16 ? it.n.slice(0, 15) + '…' : it.n; g.fillText(nm, ox + k.x - nm.length * 2.9, oy + k.y - 20); if (k.price) priceTag(ox + k.x, oy + k.y + 28, k.price); }
  };
  const priceTag = (x, y, v) => { g.fillStyle = G.p.coins >= v ? '#ffd07a' : '#ff4f6d'; g.font = 'bold 11px monospace'; g.fillText(v + '¢', x - 8, y); };
  const drawHud = () => {
    const p = G.p; g.fillStyle = '#0d0620'; g.fillRect(0, 0, CW, HUD); g.fillStyle = '#3a2a6e'; g.fillRect(0, HUD - 3, CW, 3);
    const n = Math.ceil(p.maxhp / 2); for (let i = 0; i < n; i++) { const full = p.hp >= i * 2 + 2, half = !full && p.hp > i * 2; heartIcon(10 + (i % 8) * 16, 6 + Math.floor(i / 8) * 14, full); if (half) { g.fillStyle = '#ff4f6d'; g.fillRect(10 + (i % 8) * 16, 6 + Math.floor(i / 8) * 14, 6, 12); } }
    g.fillStyle = '#ffd07a'; g.font = 'bold 12px monospace'; g.fillText('● ' + p.coins, 10, HUD - 8);
    g.fillStyle = '#9a88c4'; g.font = '11px monospace'; g.fillText('Étage ' + G.floor + '/' + FLOORS, 150, 14); g.fillText(CBYID[G.hero].n, 150, 28); g.fillText(Math.floor(G.time / 60) + ':' + String(Math.floor(G.time % 60)).padStart(2, '0') + ' · ' + G.kills + ' tués', 150, 41);
    // stats
    g.fillStyle = '#d9cdf6'; g.font = '10px monospace'; g.fillText('DÉG ' + p.dmg.toFixed(1) + ' CAD ' + (1 / p.delay).toFixed(1) + ' VIT ' + p.speed, 262, 14); g.font = '11px monospace';
    const fx = Object.keys(p.fx).filter(k => p.fx[k] > 0).map(k => FX_NAME[k]).join(' ');
    g.font = '10px monospace'; g.fillStyle = '#c070ff'; g.fillText(fx.slice(0, 22), 262, 28); if (G.syn.size) { g.fillStyle = '#ffd07a'; g.fillText('Syn. ' + [...G.syn].map(id => SYN.find(s => s.id === id).n).join(', ').slice(0, 20), 262, 41); } g.font = '11px monospace';
    if (p.act) { const a = p.act, x = CW - 104; g.fillStyle = '#05010b'; g.fillRect(x, 6, 34, 34); g.fillStyle = a.charge >= a.max ? '#ffd07a' : '#3a2a6e'; g.fillRect(x + 2, 8, 30, 30); g.fillStyle = '#10061c'; g.font = 'bold 14px monospace'; g.fillText(ITEM_BY[a.id].n[0], x + 12, 29); g.fillStyle = '#fff'; g.font = '9px monospace'; g.fillText(a.charge + '/' + a.max, x + 6, 48 - 4); }
    // minimap
    const mx = CW - 60, my = 6; g.fillStyle = '#05010b'; g.fillRect(mx - 2, my - 2, 58, 36);
    for (const [i, r] of G.rooms.entries()) { const known = r.visited || r.nb.some(n => n >= 0 && G.rooms[n].visited); if (!known) continue; const x = mx + (r.x - 4) * 8 + 22, y = my + (r.y - 4) * 6 + 14; g.fillStyle = i === G.cur ? '#fff' : r.visited ? (r.type === 'boss' ? '#ff4f6d' : r.type === 'treasure' ? '#ffd07a' : r.type === 'shop' ? '#5be37d' : '#5b4a8c') : '#251848'; g.fillRect(x, y, 6, 4); }
    // toasts
    let y = HUD + 8; for (const t of toastq) { g.globalAlpha = Math.min(1, t.t); g.fillStyle = 'rgba(5,1,12,.75)'; const w = Math.min(CW - 40, t.m.length * 5.6 + 12); g.fillRect(20, y, w, 15); g.fillStyle = '#fff'; g.font = '10px monospace'; g.fillText(t.m.slice(0, 80), 26, y + 11); y += 17; } g.globalAlpha = 1;
  };
  /* ----- loop ----- */
  const frame = ts => {
    raf = requestAnimationFrame(frame);
    if (!view.isConnected) { cancelAnimationFrame(raf); raf = 0; return; }
    const dt = Math.min(.05, (ts - last) / 1000 || .016); last = ts;
    toastq.forEach(t => t.t -= dt); toastq = toastq.filter(t => t.t > 0);
    if (screen === 'play' && G && !G.over) { try { update(dt); } catch (e) { console.error(e); } }
    if (G && (screen === 'play' || screen === 'pause' || screen === 'end')) draw(); else if (!G) { g.fillStyle = '#0a0418'; g.fillRect(0, 0, CW, CH); }
  };
  /* ----- screens ----- */
  const backMenu = () => { screen = 'menu'; showMenu(); };
  const showMenu = () => {
    screen = 'menu'; const o = overlay(); if (G && G.over) G = null;
    o.append(CRUI.el('h2', null, 'Catacombes'), CRUI.el('div', 'ct-info', `Descends ${FLOORS} étages de salles qui changent à chaque partie, avec les créatures du Bestiaire.<br>Âmes : <b style="color:#c070ff">${doc.souls}</b> · Parties : ${doc.stats.runs} · Victoires : ${doc.stats.wins} · Meilleur étage : ${doc.stats.best}`));
    const m = CRUI.el('div', 'ct-menu');
    if (doc.run && CBYID[doc.run.hero]) m.append(btn('Reprendre la partie (étage ' + doc.run.floor + ')', () => { closeOv(); resumeRun(); screen = 'play'; }, 'main'));
    m.append(btn('Nouvelle partie', showHeroSelect, doc.run ? '' : 'main'), btn('Sanctuaire (héros)', () => showSanctuary()), btn('Objets et synergies', showCodex), btn('Succès', showAch), btn('Statistiques', showStats), btn(doc.mute ? 'Son : coupé' : 'Son : activé', () => { doc.mute = !doc.mute; save(); showMenu(); }));
    o.append(m);
  };
  const heroCard = (c, o = {}) => { const hs = heroStats(c), b = CRUI.el('button', 'ct-hero' + (o.on ? ' on' : '') + (o.lock ? ' lock' : '')); b.style.setProperty('--rc', CR.RARITIES[CR.RK[c.r]].col); b.append(CRUI.el('i', 'rs'), CRUI.img(c, 2), CRUI.el('b', null, CRUI.esc(c.n)), CRUI.el('span', 'cb-sub', o.lock ? SOUL_COST[CR.RK[c.r]] + ' âmes' : '♥' + hs.hearts + ' ⚔' + hs.dmg.toFixed(1))); return b; };
  const showHeroSelect = () => {
    let sel = doc.heroes.includes(doc.lastHero) ? doc.lastHero : doc.heroes[0], filter = '';
    const o = overlay(); o.append(CRUI.el('h2', null, 'Choisis ton héros'));
    const info = CRUI.el('div', 'ct-info'), list = CRUI.el('div', 'ct-heroes'), q = CRUI.el('input', 'cb-in'); q.placeholder = 'Chercher un héros…'; q.oninput = () => { filter = q.value.toLowerCase(); draw2(); };
    const upd = () => { const c = CBYID[sel], hs = heroStats(c); info.innerHTML = `<b>${CRUI.esc(c.n)}</b> ${CRUI.typeChips(c)} ${CRUI.rarBadge(c.r)}<br>${hs.hearts} cœurs · dégâts ${hs.dmg.toFixed(1)} · cadence ${(1 / hs.delay).toFixed(1)}/s · vitesse ${hs.speed} · esquive ${Math.round(hs.dodge * 100)} %<br>Départ : <b>${FX_NAME[TYPE_FX[c.t]]}</b> (tirs ${FX_NAME[TYPE_FX[c.t]].toLowerCase()}).`; };
    const draw2 = () => { list.innerHTML = ''; const l = doc.heroes.map(id => CBYID[id]).filter(c => !filter || c.n.toLowerCase().includes(filter)).sort((a, b) => a.id.localeCompare(b.id)); l.forEach(c => { const b = heroCard(c, { on: c.id === sel }); b.onclick = () => { sel = c.id; doc.lastHero = sel; upd(); draw2(); }; list.append(b); }); };
    const go = btn('Commencer', () => { doc.lastHero = sel; closeOv(); newRun(sel); screen = 'play'; }, 'main'), back = btn('Retour', showMenu), san = btn('Débloquer d\'autres héros', () => showSanctuary());
    o.append(q, list, info, CRUI.el('div', 'ct-row')); o.lastChild.append(go, san, back); upd(); draw2();
  };
  const showSanctuary = () => {
    const o = overlay(); let filter = '', rar = '';
    o.append(CRUI.el('h2', null, 'Sanctuaire'), CRUI.el('div', 'ct-info', `Dépense tes âmes pour débloquer des créatures comme héros. Âmes : <b style="color:#c070ff" id="ctSouls">${doc.souls}</b>`));
    const q = CRUI.el('input', 'cb-in'); q.placeholder = 'Chercher…'; q.oninput = () => { filter = q.value.toLowerCase(); draw2(); };
    const sel = CRUI.el('select', 'cb-in'); [['', 'Toutes les raretés'], ...CR.RARITIES.map(r => [r.k, r.n + ' · ' + SOUL_COST[CR.RK[r.k]] + ' âmes'])].forEach(([v, t]) => { const x = document.createElement('option'); x.value = v; x.textContent = t; sel.append(x); }); sel.onchange = () => { rar = sel.value; draw2(); };
    const row = CRUI.el('div', 'ct-row'); row.append(q, sel);
    const list = CRUI.el('div', 'ct-heroes'); list.style.maxHeight = '56%';
    const draw2 = () => { list.innerHTML = ''; CREATURES.filter(c => (!rar || c.r === rar) && (!filter || c.n.toLowerCase().includes(filter))).slice(0, 220).forEach(c => { const own = doc.heroes.includes(c.id), cost = SOUL_COST[CR.RK[c.r]], b = heroCard(c, { lock: !own }); if (own) b.lastChild.textContent = 'débloqué'; b.onclick = () => { if (own) return; if (doc.souls < cost) { toast('Pas assez d\'âmes (' + cost + ' nécessaires).', true); return; } doc.souls -= cost; doc.heroes.push(c.id); save(true); toast(c.n + ' rejoint ton équipe !'); showSanctuary(); }; list.append(b); }); };
    o.append(row, list, btn('Retour', showMenu)); draw2();
  };
  const showCodex = () => {
    const o = overlay(); o.append(CRUI.el('h2', null, 'Objets et synergies')); const l = CRUI.el('div', 'ct-list');
    ITEMS.forEach(it => { const un = unlocked(it), r = CRUI.el('div', 'ct-it' + (un ? '' : ' lock')); r.innerHTML = `<i style="background:${['', '#9fe8ff', '#c070ff', '#ffd07a'][it.t]}">${un ? it.n[0] : '?'}</i><div><b>${un ? CRUI.esc(it.n) : '???'}</b><br><span class="cb-sub">${un ? CRUI.esc(it.d) : 'Débloqué par un succès : ' + (ACH[it.lock]?.[0] || '')}</span></div>`; l.append(r); });
    const h = CRUI.el('div', 'cb-h', 'Synergies'); h.style.margin = '8px 0 2px'; l.append(h);
    SYN.forEach(s => { const r = CRUI.el('div', 'ct-it'); r.innerHTML = `<i style="background:#ff5ad9">+</i><div><b>${CRUI.esc(s.n)}</b><br><span class="cb-sub">${CRUI.esc(s.d)}</span></div>`; l.append(r); });
    o.append(l, btn('Retour', showMenu));
  };
  const showAch = () => {
    const o = overlay(); o.append(CRUI.el('h2', null, 'Succès')); const l = CRUI.el('div', 'ct-list');
    Object.entries(ACH).forEach(([k, [n, d]]) => { const done = doc.ach['done_' + k], it = ITEMS.find(i => i.lock === k), r = CRUI.el('div', 'ct-it' + (done ? '' : ' lock')); r.innerHTML = `<i style="background:${done ? '#5be37d' : '#3a2a6e'}">${done ? '✓' : '·'}</i><div><b>${CRUI.esc(n)}</b><br><span class="cb-sub">${CRUI.esc(d)}${it ? ' · récompense : ' + CRUI.esc(it.n) : ''}</span></div>`; l.append(r); });
    o.append(l, btn('Retour', showMenu));
  };
  const showStats = () => {
    const o = overlay(), s = doc.stats; o.append(CRUI.el('h2', null, 'Statistiques'));
    const l = CRUI.el('div', 'ct-list'); [['Parties jouées', s.runs], ['Victoires', s.wins], ['Défaites', s.deaths], ['Meilleur étage', s.best], ['Ennemis vaincus', s.kills], ['Boss vaincus', s.bosses], ['Salles nettoyées', s.rooms], ['Pièces ramassées', s.coins], ['Temps de jeu', Math.floor(s.time / 3600) + ' h ' + Math.floor(s.time % 3600 / 60) + ' min'], ['Plus d\'objets en une partie', s.bestItems], ['Âmes', doc.souls]].forEach(([a, b]) => { const r = CRUI.el('div', 'ct-it'); r.innerHTML = `<span>${a}</span><b style="margin-left:auto">${b}</b>`; l.append(r); });
    const h = CRUI.el('div', 'cb-h', 'Dernières parties'); h.style.margin = '8px 0 2px'; l.append(h);
    if (!doc.hist.length) l.append(CRUI.el('div', 'cb-sub', 'Aucune partie terminée.'));
    doc.hist.slice(0, 12).forEach(h => { const c = CBYID[h.hero], r = CRUI.el('div', 'ct-it'); r.innerHTML = `<span>${c ? CRUI.esc(c.n) : '?'}</span><span class="cb-sub">étage ${h.floor} · ${h.kills} tués · ${h.items} objets · ${Math.floor(h.time / 60)} min</span><b style="margin-left:auto;color:${h.victory ? '#5be37d' : '#ff6b6b'}">${h.victory ? 'Victoire' : 'Défaite'}</b>`; l.append(r); });
    o.append(l, btn('Retour', showMenu));
  };
  const showEnd = victory => {
    screen = 'end'; const o = overlay(); o.append(CRUI.el('h2', null, victory ? 'Victoire !' : 'Tu es tombé…'));
    o.append(CRUI.el('div', 'ct-info', `${CRUI.esc(CBYID[G.hero].n)} · étage ${G.floor}/${FLOORS} · ${G.kills} ennemis · ${G.items.length} objets · ${Math.floor(G.time / 60)} min<br><b style="color:#c070ff">+${G.souls} âmes</b> (total ${doc.souls})`));
    const items = CRUI.el('div', 'ct-row'); G.items.forEach(id => { const i = CRUI.el('span', 'cb-badge', CRUI.esc(ITEM_BY[id].n)); i.style.background = ['', '#9fe8ff', '#c070ff', '#ffd07a'][ITEM_BY[id].t]; items.append(i); }); o.append(items);
    const m = CRUI.el('div', 'ct-menu'); m.append(btn('Rejouer', () => { closeOv(); newRun(G.hero); screen = 'play'; }, 'main'), btn('Menu', () => { G = null; showMenu(); })); o.append(m);
  };
  const pause = () => { if (screen !== 'play') return; screen = 'pause'; const o = overlay('clear'); o.append(CRUI.el('h2', null, 'Pause')); const m = CRUI.el('div', 'ct-menu'); m.append(btn('Reprendre', () => { closeOv(); screen = 'play'; }, 'main'), btn('Sauvegarder et quitter', () => { saveRun(); save(true); G = null; showMenu(); }), btn('Abandonner la partie', () => { G.over = true; endRun(false); })); o.append(m); };
  /* ----- inputs ----- */
  const onKey = (e, down) => {
    if (!view.isConnected) return; const t = e.target; if (/INPUT|SELECT|TEXTAREA/.test(t.tagName)) return;
    const map = { KeyW: 'KeyW', KeyA: 'KeyA', KeyS: 'KeyS', KeyD: 'KeyD', ArrowUp: 'ArrowUp', ArrowDown: 'ArrowDown', ArrowLeft: 'ArrowLeft', ArrowRight: 'ArrowRight' };
    if (map[e.code]) { if (!down || screen === 'play') keys[map[e.code]] = down; if (screen === 'play') e.preventDefault(); }
    if (down && e.code === 'Space' && screen === 'play') { e.preventDefault(); usePlayerAct(); }
    if (down && e.code === 'Escape') { if (screen === 'play') pause(); else if (screen === 'pause') { closeOv(); screen = 'play'; } }
    if (down && e.code === 'KeyM') { doc.mute = !doc.mute; save(); announce(doc.mute ? 'Son coupé' : 'Son activé'); }
    if (!down && !Object.keys(map).includes(e.code)) return;
  };
  const kd = e => onKey(e, true), ku = e => onKey(e, false);
  document.addEventListener('keydown', kd); document.addEventListener('keyup', ku);
  const mp = e => { const r = cv.getBoundingClientRect(); mouse.x = (e.clientX - r.left) / r.width * CW - WALL; mouse.y = (e.clientY - r.top) / r.height * CH - HUD - WALL; };
  cv.onmousemove = mp; cv.onmousedown = e => { mp(e); mouse.down = true; }; window.addEventListener('mouseup', () => mouse.down = false);
  cv.oncontextmenu = e => e.preventDefault();
  const blur = () => { for (const k of Object.keys(keys)) delete keys[k]; mouse.down = false; if (screen === 'play') pause(); }; window.addEventListener('blur', blur);
  ctx.onClose?.(() => { document.removeEventListener('keydown', kd); document.removeEventListener('keyup', ku); window.removeEventListener('blur', blur); cancelAnimationFrame(raf); raf = 0; if (G && !G.over) saveRun(); save(true); });
  // the sound switch is checked at each beep
  const _b = SFX; for (const k of Object.keys(_b)) { const f = _b[k]; _b[k] = (...a) => { if (!doc.mute) f(...a); }; }
  if (globalThis.__catTest) globalThis.__catTest = { get G() { return G; }, doc, newRun, update, draw, enterFloor, loadRoom, takeItem, ITEMS, SYN, makeFloor, makeLayout, killEnemy, hurt, set screen(v) { screen = v; }, get screen() { return screen; }, resumeRun, saveRun, CBYID, roomCleared, usePlayerAct, heroStats, checkAch, keys, solidAt };
  raf = requestAnimationFrame(frame);
  showMenu();
}
