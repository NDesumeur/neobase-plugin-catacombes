// Catacombes : un jeu d'exploration et de tir à la manière de The Binding of Isaac, avec les créatures de la base commune de NeoBase.
// Salles générées à chaque partie, 5 étages (chacun son décor), ennemis et boss tirés de la base avec chacun son déplacement, son attaque et son trait,
// 500 objets qui se combinent (synergies), sauvegarde de la partie en cours, progression entre les parties (âmes, héros, objets à débloquer) et statistiques.
// Déplacements : Z Q S D (ou W A S D). Tirs : flèches, ou clic de souris. Maj : esquive. Espace : objet actif. Échap : pause. Manette : sticks, A, X/B, Start.
/*@CREATURES@*/
const TILE = 32, COLS = 13, ROWS = 7, RW = COLS * TILE, RH = ROWS * TILE, WALL = 32, HUD = 44, CW = RW + WALL * 2, CH = RH + WALL * 2 + HUD;
const HALF = 2;   // hearts are counted in halves
const CSS = `
.ct{display:flex;flex-direction:column;align-items:center;gap:8px;height:calc(100vh - 118px);min-height:440px}
.ct-stage{flex:1;min-height:0;width:100%;display:grid;grid-template-columns:200px auto 200px;gap:10px;justify-content:center;align-items:center}
.ct-stage.nosides{grid-template-columns:auto}.ct-stage.nosides .ct-side{display:none}
.ct-wrap{position:relative;background:#05010b;box-shadow:0 0 0 3px #3a2a6e,0 0 0 6px #05010b,0 10px 0 6px #05010b}
.ct-wrap canvas{width:100%;height:100%;image-rendering:pixelated;display:block}
.ct-side{position:relative;align-self:stretch;min-height:0;background:var(--cb-card,#1b1238);box-shadow:0 0 0 2px var(--cb-line,#3a2a6e),0 4px 0 2px #05010b}
.ct-sidein{position:absolute;inset:0;overflow:auto;padding:8px;display:flex;flex-direction:column;gap:6px;font-size:12px;line-height:1.35;scrollbar-width:thin}
.ct-side h4{margin:4px 0 0;font:9px var(--title,monospace);letter-spacing:1px;color:#ff5ad9;text-transform:uppercase}
.ct-hd{display:flex;gap:8px;align-items:center}.ct-hd img{width:48px;height:48px;image-rendering:auto;background:#0b0520;box-shadow:0 0 0 2px #3a2a6e}
.ct-st{display:grid;grid-template-columns:1fr auto;gap:2px 8px}.ct-st span{color:#9a88c4}.ct-st b{color:#fff;text-align:right}
.ct-fx{display:flex;flex-wrap:wrap;gap:4px}.ct-fx i{font-style:normal;padding:1px 6px;background:#241a52;box-shadow:inset 0 0 0 1px #3a2a6e;font-size:11px}
.ct-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(34px,1fr));gap:4px}
.ct-ic{width:100%;aspect-ratio:1;image-rendering:pixelated;background:#0b0520;box-shadow:0 0 0 2px #3a2a6e;display:block}
.ct-ov{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;background:rgba(8,3,20,.92);padding:14px;overflow:auto;text-align:center}
.ct-ov.clear{background:rgba(8,3,20,.55)}
.ct-ov h2{margin:0;font:16px var(--title,monospace);color:#ff5ad9;line-height:1.5}
.ct-menu{display:flex;flex-direction:column;gap:8px;width:min(320px,90%)}
.ct-menu .cb-btn{padding:10px;font-size:15px}
.ct-ov .padfocus{outline:3px solid #ffd45c;outline-offset:2px}
.ct-heroes{display:grid;grid-template-columns:repeat(auto-fill,minmax(98px,1fr));gap:8px;width:100%;max-height:52%;overflow:auto;padding:6px}
.ct-hero{position:relative;border:0;background:var(--cb-card);padding:6px 4px;display:flex;flex-direction:column;align-items:center;gap:2px;font-size:11px;box-shadow:0 0 0 2px var(--cb-line)}
.ct-hero:hover{box-shadow:0 0 0 2px var(--cb-hi)}.ct-hero.on{box-shadow:0 0 0 3px #fff;background:var(--cb-card2)}.ct-hero.lock{opacity:.75}
.ct-hero .rs{position:absolute;left:0;top:0;bottom:0;width:3px;background:var(--rc)}
.ct-row{display:flex;gap:8px;flex-wrap:wrap;justify-content:center;align-items:center}
.ct-info{max-width:560px;font-size:13px;line-height:1.45;color:#d9cdf6}
.ct-list{display:flex;flex-direction:column;gap:6px;width:min(600px,96%);max-height:56%;overflow:auto;text-align:left}
.ct-it{display:flex;gap:10px;align-items:center;padding:6px 10px;background:var(--cb-card2);box-shadow:inset 0 0 0 2px var(--cb-line);font-size:13px}
.ct-it i{flex:none;width:30px;height:30px;display:grid;place-items:center;font:14px var(--title,monospace);color:#10061c;font-style:normal}
.ct-it img{flex:none;width:36px;height:36px;image-rendering:pixelated;background:#0b0520}
.ct-it.lock{opacity:.5}
.ct-help{position:absolute;left:0;right:0;bottom:0;font-size:11px;color:#cfc4ee;text-align:center;line-height:1.3;padding:3px 8px;background:#0b0520cc;pointer-events:none}
`;
/* ---------- helpers ---------- */
const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), rnd = (a, b) => a + Math.random() * (b - a), ri = (a, b) => a + Math.floor(Math.random() * (b - a + 1)), dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const pickR = (R, a) => a[Math.floor(R() * a.length)];
const ri2 = (R, a, b) => a + Math.floor(R() * (b - a + 1));
const hash2 = (s, k) => { let h = Math.imul((s | 0) ^ Math.imul(k + 1, 0x9e3779b1), 0x85ebca6b); h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
const TYPE_FX = { feu: 'burn', eau: 'split', plante: 'poison', foudre: 'chain', glace: 'freeze', roche: 'explode', vent: 'pierce', ombre: 'lifesteal', lumiere: 'homing', poison: 'poison', acier: 'pierce', esprit: 'homing' };
const FX_NAME = { burn: 'Brûlure', freeze: 'Gel', poison: 'Poison', chain: 'Éclair', explode: 'Explosion', split: 'Éclats', bounce: 'Rebond', pierce: 'Perforant', homing: 'Guidé', lifesteal: 'Vol de vie' };
const SOUL_COST = [0, 60, 160, 420, 1000, 2600];
const heroStats = c => ({ hearts: clamp(4 + Math.floor(c.pv / 80), 4, 7), dmg: +(1.6 + c.atq / 55).toFixed(2), delay: +clamp(.46 - c.mag * .0015, .2, .46).toFixed(3), speed: Math.round(clamp(125 + c.vit * .95, 125, 235)), dodge: clamp(c.def / 450, 0, .22) });
const START_HEROES = ['feu', 'eau', 'plante'].map(t => CREATURES.find(c => c.t === t && c.r === 'commun').id);
/*@INCLUDE items.js@*/
/* ---------- items ---------- */
const HAND = [
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
  { id: 'ruche', n: 'Ruche', d: 'Un satellite de plus', t: 2, ap: p => p.orbit = Math.min(3, p.orbit + 1) },
  { id: 'tonneau', n: 'Tonneau de poudre', d: 'Tous les tirs explosent', t: 3, fx: 'explode', sure: 1 },
  { id: 'phare', n: 'Phare', d: 'Portée +150, tirs plus rapides', t: 2, ap: p => { p.range += 150; p.shotSpd += 60; } },
  { id: 'pacte', n: 'Pacte de sang', d: 'Dégâts +2, mais −1 cœur', t: 3, ap: p => { p.dmg += 2; p.maxhp = Math.max(2, p.maxhp - 2); p.hp = Math.min(p.hp, p.maxhp); } },
  // active items
  { id: 'eclair', n: 'Éclair de vitesse', d: 'ACTIF · Fonce dans ta direction, invulnérable (2 salles)', t: 2, act: { max: 2, kind: 'dash' } },
  { id: 'nova', n: 'Nova', d: 'ACTIF · Blesse tous les ennemis de la salle (4 salles)', t: 3, act: { max: 4, kind: 'nova' }, lock: 'victoire' },
  { id: 'elixir', n: 'Élixir', d: 'ACTIF · Soigne 2 cœurs (3 salles)', t: 2, act: { max: 3, kind: 'heal' } },
  { id: 'sablier', n: 'Sablier', d: 'ACTIF · Gèle tous les ennemis 4 s (3 salles)', t: 2, act: { max: 3, kind: 'freezeall' } },
];
HAND_ICO.ruche = ['orb', 48, 'ghost']; HAND_ICO.tonneau = ['bell', 28, 'burst']; HAND_ICO.phare = ['lantern', 200, 'range']; HAND_ICO.pacte = ['heart', 355, 'sword']; HAND_ICO.sablier = ['potion', 190, 'clock'];
HAND.push(
  // communs
  { id: 'pomme', n: 'Pomme ridée', d: 'Soigne 1 cœur', t: 1, ap: p => { p.hp = Math.min(p.maxhp, p.hp + 2); } },
  { id: 'ressort', n: 'Ressort', d: 'Vitesse +15, tirs plus vifs', t: 1, ap: p => { p.speed += 15; p.shotSpd += 40; } },
  { id: 'cloche', n: 'Cloche fêlée', d: 'Chance +2', t: 1, ap: p => p.luck += 2 },
  { id: 'osselet', n: 'Osselet', d: 'Dégâts +0,4', t: 1, ap: p => p.dmg += .4 },
  { id: 'corde', n: 'Corde tendue', d: 'Portée +70, dégâts +0,2', t: 1, ap: p => { p.range += 70; p.dmg += .2; } },
  { id: 'plume', n: 'Plume', d: 'Vitesse +20, tire un peu plus vite', t: 1, ap: p => { p.speed += 20; p.delay *= .93; } },
  { id: 'bourse', n: 'Bourse de cuir', d: '+15 pièces', t: 1, ap: p => p.coins += 15 },
  { id: 'braise', n: 'Braise', d: 'Les tirs peuvent enflammer', t: 1, fx: 'burn' },
  { id: 'sel', n: 'Sel noir', d: 'Les tirs peuvent empoisonner', t: 1, fx: 'poison' },
  { id: 'verglas', n: 'Éclat de verglas', d: 'Les tirs peuvent geler', t: 1, fx: 'freeze' },
  // rares
  { id: 'targe', n: 'Targe', d: '+1 cœur, invulnérable un peu plus longtemps', t: 2, ap: p => { p.maxhp += 2; p.hp += 2; p.iframes += .15; } },
  { id: 'pelle', n: 'Pelle de fossoyeur', d: 'Dégâts +0,8, un peu plus lent', t: 2, ap: p => { p.dmg += .8; p.speed -= 8; } },
  { id: 'cape', n: 'Cape de brume', d: 'Esquive des coups (+6 %)', t: 2, ap: p => p.dodge = Math.min(.4, (p.dodge || 0) + .06) },
  { id: 'sangsue', n: 'Sangsue', d: 'Voler de la vie en frappant', t: 2, fx: 'lifesteal' },
  { id: 'etincelle', n: 'Éclat de foudre', d: 'Les tirs font des éclairs en chaîne', t: 2, fx: 'chain' },
  { id: 'arc', n: 'Arc court', d: 'Tire bien plus vite, dégâts −0,2', t: 2, ap: p => { p.delay *= .72; p.dmg = Math.max(.6, p.dmg - .2); } },
  { id: 'bocal', n: 'Bocal de lucioles', d: 'Un satellite de plus', t: 2, ap: p => p.orbit = Math.min(3, p.orbit + 1) },
  { id: 'lunette', n: 'Lunette', d: 'Les tirs sont guidés', t: 2, fx: 'homing', sure: 1 },
  { id: 'masse', n: 'Masse d\'armes', d: 'Dégâts +1,2, tire plus lentement', t: 2, ap: p => { p.dmg += 1.2; p.delay *= 1.15; } },
  { id: 'collier', n: 'Collier d\'épines', d: 'Les ennemis qui te touchent se blessent, +1 cœur', t: 2, ap: p => { p.flags.add('thorns'); p.maxhp += 2; p.hp += 2; } },
  { id: 'mortier', n: 'Mortier', d: 'Les tirs peuvent exploser', t: 2, fx: 'explode' },
  { id: 'bague_r', n: 'Bague rebondissante', d: 'Les tirs rebondissent sur les murs', t: 2, fx: 'bounce', sure: 1 },
  // légendaires
  { id: 'couronne', n: 'Couronne maudite', d: 'Dégâts +1,5 et tire plus vite, mais −1 cœur', t: 3, ap: p => { p.dmg += 1.5; p.delay *= .85; p.maxhp = Math.max(2, p.maxhp - 2); p.hp = Math.min(p.hp, p.maxhp); } },
  { id: 'orbe_or', n: 'Orbe d\'or', d: 'Chance +4, bien plus de butin', t: 3, ap: p => { p.luck += 4; p.loot += .25; } },
  { id: 'calice', n: 'Calice', d: '+2 cœurs et soigne tout', t: 3, ap: p => { p.maxhp += 4; p.hp = p.maxhp; } },
  { id: 'faux', n: 'Faux du faucheur', d: 'Dégâts +2, les tirs traversent les ennemis', t: 3, fx: 'pierce', sure: 1, ap: p => p.dmg += 2 },
);
Object.assign(HAND_ICO, { pomme: ['mushroom', 5, 'plus'], ressort: ['boot', 100, 'bounce'], cloche: ['bell', 50, 'clover'], osselet: ['tooth', 40, 'sword'], corde: ['lantern', 30, 'range'], plume: ['boot', 190, 'wing'], bourse: ['ring', 45, 'coin'], braise: ['gem', 20, 'flame'], sel: ['potion', 150, 'drop'], verglas: ['gem', 195, 'snow'],
  targe: ['shield', 30, 'plus'], pelle: ['dagger', 40, 'sword'], cape: ['mask', 220, 'ghost'], sangsue: ['tooth', 345, 'fang'], etincelle: ['orb', 60, 'bolt'], arc: ['dagger', 120, 'arrow'], bocal: ['lantern', 80, 'ghost'], lunette: ['eye', 250, 'target'], masse: ['orb', 10, 'sword'], collier: ['crown', 160, 'sword'], mortier: ['orb', 25, 'burst'], bague_r: ['ring', 140, 'bounce'],
  couronne: ['crown', 350, 'flame'], orbe_or: ['orb', 48, 'coin'], calice: ['potion', 350, 'plus'], faux: ['dagger', 280, 'arrow'] });
const ITEMS = buildItems(HAND);
// réserves : 'shop' (seulement en boutique), 'vault' (coffres, élites, boss), 'any' (partout) ; raretés : poids par palier, qui monte avec l'étage
const hashS = k => { let h = 2166136261; for (const ch of k) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); return (h >>> 0) / 4294967296; };
for (const it of ITEMS) it.pool = it.gen ? (hashS(it.id) < .26 ? 'shop' : hashS(it.id + 'v') < .5 ? 'vault' : 'any') : (it.t === 3 || it.act ? 'vault' : hashS(it.id) < .3 ? 'shop' : 'any');
const ITEM_BY = Object.fromEntries(ITEMS.map(i => [i.id, i]));
const TIERC = ['', '#9fe8ff', '#c070ff', '#ffd07a'];
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
/* ---------- enemies: a movement (from the body plan, sometimes swapped by the creature's seed), an attack per type, a trait ---------- */
const MOVE_MAIN = { blob: 'hop', biped: 'chase', golem: 'charge', bird: 'flyer', serpent: 'weave', insect: 'swarm', spirit: 'ghost', plant: 'turret', floater: 'orbit', beast: 'sprint', dragon: 'dash', fish: 'hop' };
const MOVE_ALT = { blob: ['burrow', 'skitter'], biped: ['skitter', 'guard', 'patrol'], golem: ['patrol', 'guard'], bird: ['swoop', 'orbit'], serpent: ['burrow', 'skitter'], insect: ['skitter', 'swoop'], spirit: ['teleport', 'orbit'], plant: ['guard', 'turret'], floater: ['tri', 'teleport'], beast: ['charge', 'patrol', 'skitter'], dragon: ['swoop', 'sprint'], fish: ['skitter', 'burrow'] };
const FLYERS = new Set(['ghost', 'flyer', 'tri', 'swarm', 'swoop', 'orbit']);
const TRAITS = { armor: ['Blindé', '#9aa4b8'], swift: ['Véloce', '#5cd8ff'], regen: ['Régénère', '#5be37d'], splitter: ['Se divise', '#ff9ac8'], bomber: ['Explose', '#ff9a3c'], berserk: ['Enragé', '#ff4f6d'], summoner: ['Invocateur', '#c070ff'] };
const TRAIT_KEYS = Object.keys(TRAITS);
const ATK_NAME = { feu: 'Boules de feu', eau: 'Jet d\'eau', plante: 'Graines épineuses', foudre: 'Foudre', glace: 'Anneau de givre', roche: 'Rocher', vent: 'Tourbillon', ombre: 'Éclipse', lumiere: 'Rayon', poison: 'Nuages toxiques', acier: 'Balles rebondissantes', esprit: 'Orbes errants' };
const behaviour = c => {
  const k = hash2(c.seed, 1), alt = MOVE_ALT[c.plan] || [], move = k < .38 && alt.length ? alt[Math.floor(hash2(c.seed, 2) * alt.length)] : MOVE_MAIN[c.plan];
  const atk = [c.t]; if (c.t2) atk.push(c.t2); else if (hash2(c.seed, 3) < .3) atk.push(TYPE_KEYS_ALL[Math.floor(hash2(c.seed, 4) * TYPE_KEYS_ALL.length)]);
  const shoots = ['plant', 'floater', 'spirit', 'bird'].includes(c.plan) || hash2(c.seed, 5) < .7;
  const trk = hash2(c.seed, 6), trait = trk < .42 ? null : TRAIT_KEYS[Math.floor(hash2(c.seed, 7) * TRAIT_KEYS.length)];
  if (shoots || hash2(c.seed, 8) < .5) { atk.push(STYLES[Math.floor(hash2(c.seed, 8) * STYLES.length)]); if (hash2(c.seed, 9) < .4) atk.push(STYLES[Math.floor(hash2(c.seed, 10) * STYLES.length)]); }
  return { move: move === 'turret' && !shoots ? 'guard' : move, atk: [...new Set(atk)], shoots, trait };
};
const TYPE_KEYS_ALL = Object.keys(CR.TYPES);
const STYLES = ['fan', 'cross', 'snipe', 'wave', 'mines', 'ring2', 'pulse'];   // un style propre à chaque ennemi, en plus de son élément
const BOSS_SIG = ['sweep', 'cage', 'meteors', 'leap', 'orbitals', 'wall', 'chain', 'tentacles', 'fanrev', 'shockwave', 'crush'];   // attaques de boss : chaque boss en reçoit trois, selon sa graine
const STYLE_NAME = { fan: 'Éventail', cross: 'Croix', snipe: 'Tir de précision', wave: 'Onde', mines: 'Mines', ring2: 'Double anneau', pulse: 'Pulsation',
  sweep: 'Balayage', cage: 'Cage', meteors: 'Météores', leap: 'Bond écrasant', orbitals: 'Orbes', wall: 'Mur de projectiles', chain: 'Enchaînement', tentacles: 'Tentacules', fanrev: 'Double éventail', shockwave: 'Onde de choc', crush: 'Écrasement' };
const makeEnemy = (c, floor, x, y, kind) => {
  const boss = kind === 'boss', mini = kind === 'mini', b = behaviour(c);
  const hp = Math.round((boss ? 55 + floor * 32 : mini ? 26 + floor * 11 : 5 + floor * 2.4) + c.pv / (boss ? 3.5 : mini ? 6 : 14));
  const tr = boss ? null : b.trait;
  return { c, x, y, vx: 0, vy: 0, hp: tr === 'armor' ? Math.round(hp * 1.15) : hp, max: tr === 'armor' ? Math.round(hp * 1.15) : hp, r: boss ? 30 : mini ? 17 : 11, boss, mini, ai: b.move, atk: b.atk, shoots: b.shoots || boss || mini, tr, spd: (boss ? 52 : mini ? 44 : 38) + c.vit * (boss ? .35 : .5), dmg: boss && floor > 2 ? 2 : 1, t: Math.random() * 3, cd: rnd(.8, 2), ai_i: 0, burn: 0, freeze: 0, poison: 0, flash: 0, scale: boss ? 3 : mini ? 1.7 : 1, ph: 0, state: '', st: 0, hx: x, hy: y, sum: rnd(3, 6), pats: boss ? bossPatterns(c) : null, fly: FLYERS.has(b.move), shotCol: CRUI.typeCol(c.t), spawn: .6, rage: 1 };
};
const bossPatterns = c => {   // éléments du boss + trois attaques de signature tirées de sa graine (deux boss n'ont presque jamais le même jeu) + une attaque de base
  const R = CR.rng(c.seed), t2 = c.t2 || pickR(R, TYPE_KEYS_ALL.filter(t => t !== c.t)), sig = [], bag = [...BOSS_SIG];
  while (sig.length < 3) sig.push(bag.splice(Math.floor(R() * bag.length), 1)[0]);
  return [sig[0], c.t, sig[1], t2, sig[2], pickR(R, ['radial', 'aimed', 'spiral', 'rain', 'summon'])];
};
/* ---------- rooms and floors ---------- */
const DIRS = [[0, -1], [1, 0], [0, 1], [-1, 0]];
function makeFloor(seed, floor) {
  const R = CR.rng(seed * 131 + floor * 7919), G = 9, grid = new Map(), key = (x, y) => x + ',' + y;
  const target = Math.min(14, 6 + floor + (floor > 2 ? 1 : 0) + ri2(R, 0, 1)), rooms = [{ x: 4, y: 4, type: 'start' }]; grid.set(key(4, 4), 0);
  let guard = 0;
  while (rooms.length < target && guard++ < 600) {
    const base = rooms[Math.floor(R() * rooms.length)], d = DIRS[Math.floor(R() * 4)], nx = base.x + d[0], ny = base.y + d[1];
    if (nx < 1 || ny < 1 || nx >= G - 1 || ny >= G - 1 || grid.has(key(nx, ny))) continue;
    let adj = 0; DIRS.forEach(e => { if (grid.has(key(nx + e[0], ny + e[1]))) adj++; }); if (adj > 1 && R() < .75) continue;
    if (base === rooms[0] && rooms.filter(r => Math.abs(r.x - 4) + Math.abs(r.y - 4) === 1).length >= 3 && R() < .6) continue;
    grid.set(key(nx, ny), rooms.length); rooms.push({ x: nx, y: ny, type: 'combat' });
  }
  rooms.forEach(r => { r.doors = DIRS.map(d => grid.has(key(r.x + d[0], r.y + d[1]))); r.nb = DIRS.map(d => grid.get(key(r.x + d[0], r.y + d[1])) ?? -1); });
  // distance from the start by walking through the doors
  const dd = rooms.map(() => -1); dd[0] = 0; const q = [0]; while (q.length) { const i = q.shift(); rooms[i].nb.forEach(n => { if (n >= 0 && dd[n] < 0) { dd[n] = dd[i] + 1; q.push(n); } }); }
  rooms.forEach((r, i) => r.dist = dd[i]);
  const ends = rooms.map((r, i) => i).filter(i => i && rooms[i].doors.filter(Boolean).length === 1).sort((a, b) => dd[b] - dd[a]);
  const take = t => { const i = ends.shift() ?? rooms.map((r, k) => k).filter(k => k && rooms[k].type === 'combat').sort((a, b) => dd[b] - dd[a])[0]; if (i != null) rooms[i].type = t; };
  take('boss'); if (floor === 1 || R() < .72) take('treasure'); if (floor >= 2 && R() < .85) take('shop');
  if (floor >= 2) { const cand = rooms.map((r, i) => i).filter(i => rooms[i].type === 'combat' && dd[i] >= 2); if (cand.length && R() < .75) rooms[cand[Math.floor(R() * cand.length)]].type = 'mini'; }
  rooms.forEach((r, i) => { if (r.type === 'combat' && i && R() < .22 + floor * .02) r.type = 'wave'; });
  rooms.forEach((r, i) => { r.seed = Math.floor(R() * 1e9); r.visited = i === 0; r.cleared = ['start', 'treasure', 'shop'].includes(r.type); r.loot = null; });
  return rooms;
}
const DOORS = [{ x: COLS >> 1, y: -1 }, { x: COLS, y: ROWS >> 1 }, { x: COLS >> 1, y: ROWS }, { x: -1, y: ROWS >> 1 }];
/*@INCLUDE themes.js@*/
/* room layouts: 0 empty, 1 rock, 2 spikes, 3 hole (blocks walking, not shots). A template draws one shape, the rest is mirrored and checked. */
const TEMPLATES = [
  (g, R, v) => { },   // open
  (g, R, v) => { for (const y of [1, 3, 5]) for (const x of [2, 4, 8, 10]) g[y][x] = v; },   // pillars
  (g, R, v) => { for (let k = 2; k <= 4; k++) { g[3][k] = v; g[3][COLS - 1 - k] = v; } g[1][6] = v; g[5][6] = v; },   // cross arms
  (g, R, v) => { for (const [x, y] of [[1, 1], [2, 1], [1, 2], [COLS - 2, 1], [COLS - 3, 1], [COLS - 2, 2], [1, ROWS - 2], [2, ROWS - 2], [1, ROWS - 3], [COLS - 2, ROWS - 2], [COLS - 3, ROWS - 2], [COLS - 2, ROWS - 3]]) g[y][x] = v; },   // corners
  (g, R, v) => { for (let x = 3; x <= COLS - 4; x++) { if (x !== 6) { g[1][x] = v; g[ROWS - 2][x] = v; } } },   // two walls
  (g, R, v) => { for (let y = 1; y < ROWS - 1; y++) { if (y !== 3) { g[y][4] = v; g[y][COLS - 5] = v; } } },   // two columns
  (g, R, v) => { for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if ((x + y) % 4 === 0 && Math.abs(x - 6) + Math.abs(y - 3) > 3) g[y][x] = v; },   // diagonals
  (g, R, v) => { for (const [x, y] of [[4, 2], [4, 4], [8, 2], [8, 4], [6, 1], [6, 5]]) g[y][x] = v; },   // islands
  (g, R, v) => { for (let x = 2; x <= COLS - 3; x++) { g[2][x] = v; g[4][x] = v; } for (const x of [2, 6, 10]) { g[2][x] = 0; g[4][x] = 0; } },   // corridors
  (g, R, v) => { for (let a = 0; a < 8; a++) { const x = 3 + Math.floor(R() * (COLS - 6)), y = 1 + Math.floor(R() * (ROWS - 2)); g[y][x] = v; } },   // scatter
  (g, R, v) => { for (let y = 2; y <= 4; y++) for (let x = 4; x <= 8; x++) if (x === 4 || x === 8 || y === 2 || y === 4) g[y][x] = v; g[3][6] = 0; },   // arena ring
  (g, R, v) => { for (let x = 1; x < COLS - 1; x++) if (x % 3 === 1) for (let y = 0; y < ROWS; y++) if (y !== 3 && y !== 2 && y !== 4) g[y][x] = v; },   // slats
  (g, R, v) => { for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) { const d = Math.abs(x - 6) + Math.abs(y - 3); if (d === 4 && y !== 3 && x !== 6) g[y][x] = v; } },   // diamond
  (g, R, v) => { for (let k = 0; k < 4; k++) { g[1 + (k % 2) * 4][1 + k * 3] = v; g[1 + ((k + 1) % 2) * 4][1 + k * 3] = v; } },   // zigzag
  (g, R, v) => { for (let x = 1; x <= 3; x++) { g[0][x] = v; g[ROWS - 1][COLS - 1 - x] = v; } for (let y = 1; y <= 2; y++) { g[y][0] = v; g[ROWS - 1 - y][COLS - 1] = v; } g[2][2] = g[ROWS - 3][COLS - 3] = v; },   // opposite bastions
  (g, R, v) => { g[2][6] = g[4][6] = g[3][4] = g[3][8] = v === 3 ? 1 : v; for (const [x, y] of [[3, 1], [9, 1], [3, 5], [9, 5]]) g[y][x] = 2; },   // altar with spike corners
  (g, R, v) => { for (const y of [1, 5]) for (let x = 2; x <= COLS - 3; x += 2) g[y][x] = v; for (const y of [2, 4]) { g[y][1] = v; g[y][COLS - 2] = v; } },   // alcoves
  (g, R, v) => { for (let y = 1; y < ROWS - 1; y++) { const x = 3 + (y % 2) * 6; g[y][x] = v; g[y][x + 0 === 3 ? 4 : 8] = y % 3 ? 0 : v; } },   // staggered columns
];
function makeLayout(room, floor) {
  const R = CR.rng(room.seed), g = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
  if (room.type === 'combat' || room.type === 'boss' || room.type === 'wave' || room.type === 'mini') {
    const hazard = floor === 2 || floor === 4 ? .4 : .22, v = R() < .65 ? 1 : (R() < .5 ? 2 : (R() < hazard + .3 ? 3 : 1));
    if (room.type === 'boss') TEMPLATES[pickR(R, [0, 0, 3, 7, 10])](g, R, R() < .6 ? 1 : 2);
    else { TEMPLATES[Math.floor(R() * TEMPLATES.length)](g, R, v); if (R() < .45) TEMPLATES[Math.floor(R() * TEMPLATES.length)](g, R, v === 2 ? 1 : v); }
    if (R() < .5) for (let i = 0; i < ri2(R, 1, 3); i++) { const x = ri2(R, 1, COLS - 2), y = ri2(R, 1, ROWS - 2); if (!g[y][x] && Math.abs(x - 6) + Math.abs(y - 3) > 2) g[y][x] = 1; }
  }
  // keep the doors and the middle open
  g[3][5] = g[3][6] = g[3][7] = 0;
  DOORS.forEach((d, i) => { if (!room.doors[i]) return; const ix = clamp(d.x, 0, COLS - 1), iy = clamp(d.y, 0, ROWS - 1); for (let k = 0; k < 3; k++) { const x = clamp(ix - DIRS[i][0] * k, 0, COLS - 1), y = clamp(iy - DIRS[i][1] * k, 0, ROWS - 1); g[y][x] = 0; } });
  // every free tile must be reachable from the middle, otherwise it becomes rock
  const seen = new Set(), q = [[COLS >> 1, ROWS >> 1]]; seen.add(q[0].join());
  while (q.length) { const [x, y] = q.pop(); DIRS.forEach(([dx, dy]) => { const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= COLS || ny >= ROWS || seen.has(nx + ',' + ny) || g[ny][nx] === 1 || g[ny][nx] === 3) return; seen.add(nx + ',' + ny); q.push([nx, ny]); }); }
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if (!g[y][x] && !seen.has(x + ',' + y)) g[y][x] = 1;
  return g;
}
/* ---------- sound ---------- */
let audio = null;
const beep = (f, d = .06, type = 'square', v = .035, slide = 0) => { try { audio ||= new (window.AudioContext || window.webkitAudioContext)(); const o = audio.createOscillator(), g = audio.createGain(); o.type = type; o.frequency.value = f; if (slide) o.frequency.linearRampToValueAtTime(Math.max(30, f + slide), audio.currentTime + d); g.gain.value = v; g.gain.linearRampToValueAtTime(0, audio.currentTime + d); o.connect(g).connect(audio.destination); o.start(); o.stop(audio.currentTime + d); } catch {} };
const SFX = { shot: () => beep(520, .05, 'square', .02, -200), hit: () => beep(180, .07, 'sawtooth', .03, -90), kill: () => beep(300, .12, 'square', .04, -220), hurt: () => beep(120, .2, 'sawtooth', .06, -60), pick: () => beep(740, .09, 'triangle', .05, 280), door: () => beep(220, .15, 'triangle', .04, 120), boom: () => beep(90, .25, 'sawtooth', .07, -50), item: () => { beep(520, .12, 'triangle', .05); setTimeout(() => beep(780, .18, 'triangle', .05), 110); }, warn: () => beep(330, .08, 'triangle', .025, 60) };
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
  const stage = CRUI.el('div', 'ct-stage'), sideL = CRUI.el('div', 'ct-side'), sideR = CRUI.el('div', 'ct-side'), inL = CRUI.el('div', 'ct-sidein'), inR = CRUI.el('div', 'ct-sidein'); sideL.append(inL); sideR.append(inR);
  const wrap = CRUI.el('div', 'ct-wrap'), cv = document.createElement('canvas'); cv.width = CW; cv.height = CH; wrap.append(cv); stage.append(sideL, wrap, sideR); root.append(stage);
  const g = cv.getContext('2d'); g.imageSmoothingEnabled = false;
  const help = CRUI.el('div', 'ct-help'); wrap.append(help);
  const setHelp = () => { help.textContent = 'Déplacement : Z Q S D · Tirs : flèches ou clic · Maj : esquive · Espace : objet actif · Échap : pause · M : son' + (padOn ? ' · Manette : sticks (déplacement / tirs), A objet, X ou B esquive, Start pause' : ' · Manette compatible'); };
  const fit = () => { const aw = stage.clientWidth, ah = stage.clientHeight, ratio = CW / CH, sides = aw >= 900; stage.classList.toggle('nosides', !sides); const maxW = sides ? aw - 440 : aw; const w = Math.max(200, Math.floor(Math.min(maxW, ah * ratio, CW * 3))); wrap.style.width = w + 'px'; wrap.style.height = Math.round(w / ratio) + 'px'; };
  new ResizeObserver(fit).observe(stage); window.addEventListener('resize', fit); setTimeout(fit, 0);
  let G = null, screen = 'menu', raf = 0, last = 0, keys = {}, mouse = { x: 0, y: 0, down: false, on: false }, ov = null, toastq = [], shake = 0, padOn = false, pd = null, pdPrev = {}, sideSig = '';
  const hasSyn = id => G && G.syn.has(id);
  /* ----- overlays ----- */
  const overlay = (cls = '') => { ov?.remove(); ov = CRUI.el('div', 'ct-ov ' + cls); wrap.append(ov); ov._fi = -1; return ov; };
  const closeOv = () => { ov?.remove(); ov = null; };
  const btn = (t, f, cls = '') => { const b = CRUI.el('button', 'cb-btn ' + cls, t); b.onclick = f; return b; };
  /* ----- achievements ----- */
  const ACH = { premier: ['Premier sang', 'Tuer 20 ennemis en tout', () => doc.stats.kills >= 20], boss1: ['Chute du gardien', 'Vaincre le boss de l\'étage 1', () => doc.ach.boss1], riche: ['Fortune', 'Avoir 30 pièces en même temps', () => doc.ach.riche], etage3: ['Plus bas', 'Atteindre l\'étage 3', () => doc.stats.best >= 3], intact: ['Sans une égratignure', 'Finir un étage sans être touché', () => doc.ach.intact], collec: ['Collectionneur', 'Avoir 6 objets dans la même partie', () => doc.stats.bestItems >= 6], victoire: ['Maître des catacombes', 'Gagner une partie', () => doc.stats.wins >= 1], chasseur: ['Chasseur', 'Tuer 300 ennemis en tout', () => doc.stats.kills >= 300] };
  const checkAch = () => { for (const [k, [n, d, f]] of Object.entries(ACH)) { if (!doc.ach['done_' + k] && f()) { doc.ach['done_' + k] = true; const it = ITEMS.find(i => i.lock === k); if (it && !doc.items.includes(it.id)) { doc.items.push(it.id); announce('Succès : ' + n + ' — objet débloqué : ' + it.n); } else announce('Succès : ' + n); SFX.item(); } } };
  const unlocked = it => !it.lock || doc.items.includes(it.id);
  const announce = m => { toastq.push({ m, t: 4 }); if (toastq.length > 3) toastq.shift(); };
  const later = (sec, fn) => G.tm.push({ t: sec, fn });
  /* ----- starting a run ----- */
  const newRun = heroId => {
    const c = CBYID[heroId], hs = heroStats(c), fx = {}, fxType = TYPE_FX[c.t]; fx[fxType] = .3;
    G = { seed: Math.floor(Math.random() * 1e9), floor: 1, len: 6, rooms: null, cur: 0, kills: 0, time: 0, t: 0, items: [], hero: heroId, hitFloor: false, over: false, victory: false, syn: new Set(), roomClears: 0, souls: 0, wave: 1, card: null, parts: [],
      p: { x: RW / 2, y: RH / 2, vx: 0, vy: 0, r: 9, hp: hs.hearts * HALF, maxhp: hs.hearts * HALF, dmg: hs.dmg, delay: hs.delay, speed: hs.speed, shotSpd: 250, range: 300, luck: 0, shots: 1, size: 1, coins: 0, fx, flags: new Set(), orbit: 0, magnet: 0, iframes: 0, loot: 0, inv: 0, dodge: hs.dodge, cd: 0, shield: 0, act: null, face: 1, dash: 0, orbAng: 0, dashCd: 0, slow: 0, poolCd: 0, aim: [1, 0] },
      e: [], b: [], eb: [], pk: [], fire: [], fl: [], hz: [], tm: [], rl: null, door: 0 };
    G.len = 6 + G.seed % 3; setThemeSeq(G.seed); doc.stats.runs++; save(); enterFloor(1);
    return G;
  };
  const enterFloor = f => {
    G.floor = f; G.rooms = makeFloor(G.seed, f); G.cur = 0; G.hitFloor = false; G.p.x = RW / 2; G.p.y = RH / 2; loadRoom(0, -1);
    G.card = { t: 3.2, n: f, name: themeOf(f).n + (f % 2 ? '' : ' II') }; G.parts = [];
  };
  const SYNFLAGS = () => { const p = G.p, f = {}; for (const k of Object.keys(p.fx)) f[k] = p.fx[k] > 0; f.shield = p.flags.has('shield'); f.orbit = p.orbit > 0; f.nova2 = p.flags.has('nova2'); f.shots3 = p.shots >= 3; return f; };
  const recalcSyn = () => { const f = SYNFLAGS(); for (const s of SYN) { if (s.f(f)) { if (!G.syn.has(s.id)) { G.syn.add(s.id); announce('Synergie : ' + s.n + ' — ' + s.d); SFX.item(); } } } };
  /* ----- rooms ----- */
  const freeSpot = (R, minFromPlayer = 130) => { const p = G.p; let x, y, k = 0; do { x = TILE * 1.5 + R() * (RW - TILE * 3); y = TILE * 1.5 + R() * (RH - TILE * 3); k++; } while (k < 40 && (Math.hypot(x - p.x, y - p.y) < minFromPlayer || solidAt(x, y, 14))); return [x, y]; };
  const tierPool = (lo, hi) => CREATURES.filter(c => CR.RK[c.r] >= lo && CR.RK[c.r] <= hi);
  /* An encounter is composed, not drawn at random: one element, a pattern of roles (melee front, ranged back line, guards), and a formation facing the door the player came through. */
  const ROLE = m => ['turret', 'flyer', 'orbit', 'tri', 'teleport', 'ghost'].includes(m) ? 'range' : ['guard', 'patrol'].includes(m) ? 'guard' : 'melee';
  const PATTERNS = [['melee', 'melee', 'melee', 'range'], ['range', 'range', 'melee', 'melee'], ['guard', 'range', 'melee', 'range'], ['melee', 'range', 'melee'], ['range', 'guard', 'guard'], ['melee', 'melee', 'guard']];
  const snapFree = (x, y) => { for (let r = 0; r < 7; r++) for (let k = 0; k < 8; k++) { const a = k * .785 + r, px = clamp(x + Math.cos(a) * r * TILE * .7, 28, RW - 28), py = clamp(y + Math.sin(a) * r * TILE * .7, 28, RH - 28); if (!solidAt(px, py, 14) && Math.hypot(px - G.p.x, py - G.p.y) > 120) return [px, py]; } return freeSpot(Math.random); };
  // who lives on which floor: the elements of the decor, a handful of species picked once per floor (3 melee, 2 ranged, 1 guard), the same ones in every room
  const THEME_EL = { 'La Crypte': ['ombre', 'esprit', 'poison'], 'La Fournaise': ['feu', 'roche', 'acier'], 'La Forêt maudite': ['plante', 'poison', 'vent'], 'Les Glaciers': ['glace', 'eau', 'vent'], "L'Abîme": ['ombre', 'esprit', 'foudre'], 'Le Cimetière': ['ombre', 'poison', 'esprit'],
    'Les Marais': ['poison', 'eau', 'plante'], 'Le Désert des Pharaons': ['roche', 'feu', 'vent'], 'Le Temple rouge': ['feu', 'lumiere', 'esprit'], 'La Cité mécanique': ['acier', 'foudre', 'roche'], 'Le Palais de Cristal': ['glace', 'lumiere', 'esprit'], 'Les Cieux': ['lumiere', 'vent', 'foudre'] };
  const floorRoster = (lo, hi, mini) => {
    const key = G.floor + ':' + (mini ? 1 : 0); G.rost = G.rost || {}; if (G.rost[key]) return G.rost[key];
    const el = THEME_EL[themeOf(G.floor).n] || [], R = CR.rng((G.seed ^ (G.floor * 7919) ^ (mini ? 55 : 0)) >>> 0);
    let pool = tierPool(lo, hi).filter(c => el.includes(c.t) || el.includes(c.t2)); if (pool.length < 12) pool = tierPool(lo, hi);
    const by = { melee: [], range: [], guard: [] }; pool.forEach(c => by[ROLE(behaviour(c).move)].push(c));
    const take = (a, n) => { const o = [], b = a.slice(); while (o.length < n && b.length) o.push(b.splice(Math.floor(R() * b.length), 1)[0]); return o; };
    const all = [...take(by.melee, mini ? 2 : 4), ...take(by.range, mini ? 2 : 3), ...take(by.guard, 1)]; return G.rost[key] = all.length ? all : take(pool, 5);
  };
  const spawnGroup = (R, n, mini, from = G.entry ?? -1) => {
    const lo = Math.min(3, Math.max(0, Math.floor((G.floor - 1) * .9))), hi = Math.min(4, lo + 1 + (G.floor > 2 ? 1 : 0)), pool = tierPool(mini ? Math.min(4, lo + 1) : lo, mini ? Math.min(5, hi + 1) : hi);
    const tp = floorRoster(lo, hi, mini), pat = PATTERNS[((G.rooms[G.cur]?.dist ?? 0) + (mini ? 3 : 0)) % PATTERNS.length], plan = pickR(R, tp).plan, used = new Set(), list = []; void pool;
    for (let i = 0; i < n; i++) {
      const role = pat[i % pat.length]; let c = tp.filter(c => ROLE(behaviour(c).move) === role && !used.has(c.id)); if (role === 'melee' && c.some(k => k.plan === plan)) c = c.filter(k => k.plan === plan);
      c = pickR(R, c.length ? c : tp); used.add(c.id); list.push({ c, role });
    }
    const far = from >= 0 ? [-DIRS[from][0], -DIRS[from][1]] : [0, 1], lat = [-far[1], far[0]], horiz = far[0] !== 0, ext = horiz ? RW / 2 : RH / 2, ctr = [RW / 2, RH / 2];
    const slots = { range: [], guard: [], melee: [] }; list.forEach(l => slots[l.role].push(l));
    const place = (arr, depth, gap) => arr.forEach((l, i) => { const o = (i - (arr.length - 1) / 2) * gap, [x, y] = snapFree(ctr[0] + far[0] * (ext - 40) * depth + lat[0] * o, ctr[1] + far[1] * (ext - 40) * depth + lat[1] * o); const e = makeEnemy(l.c, G.floor, x, y, mini && l === list[0] ? 'mini' : ''); e.spawn = .6 + Math.random() * .3; G.e.push(e); });
    place(slots.range, .95, horiz ? 110 : 150); place(slots.guard, .55, horiz ? 130 : 170); place(slots.melee, .2, horiz ? 90 : 120);
  };
  const pickItem = (R, src = 'vault', not = []) => {   // tirage pondéré : commun ≫ rare ≫ légendaire, les objets faits main pèsent plus que les générés
    const lv = Math.min(G.floor, 6), W = it => [0, 60, 12 + lv * 3, 2 + lv * 1.5][it.t] * (it.gen ? 1 : 6) * (it.t === 3 ? 1 + G.p.luck * .04 : 1);
    let pool = ITEMS.filter(i => unlocked(i) && !G.items.includes(i.id) && !not.includes(i.id) && (i.pool === 'any' || i.pool === src));
    if (!pool.length) pool = ITEMS.filter(i => unlocked(i) && !not.includes(i.id));
    let x = R() * pool.reduce((a, i) => a + W(i), 0); for (const i of pool) { x -= W(i); if (x <= 0) return i; } return pool[pool.length - 1];
  };
  const loadRoom = (idx, from) => {
    const r = G.rooms[idx]; G.cur = idx; G.rl = makeLayout(r, G.floor); r.visited = true; G.e = []; G.b = []; G.eb = []; G.pk = G.pk.filter(k => k.keep); G.fire = []; G.fl = []; G.hz = []; G.tm = []; G.wave = 1;
    G.door = 0; G.entry = from; G.bg = renderBg(r, G.rl, G.floor);
    const p = G.p; if (from >= 0) { const d = DOORS[from]; p.x = clamp((d.x + .5 - DIRS[from][0] * 1.3) * TILE, TILE, RW - TILE); p.y = clamp((d.y + .5 - DIRS[from][1] * 1.3) * TILE, TILE, RH - TILE); }
    p.shield = p.flags.has('shield') ? 1 : 0;
    const R = CR.rng(r.seed ^ 0x5bd1);
    if (!r.cleared && ['combat', 'wave', 'mini', 'boss'].includes(r.type)) {
      if (r.type === 'boss') {
        const want = G.floor >= G.len ? 5 : [2, 3, 3, 4, 4, 4, 4][G.floor - 1], pool = CREATURES.filter(c => CR.RK[c.r] === want), c = pool[Math.floor(R() * pool.length)];
        const e = makeEnemy(c, G.floor, RW / 2, RH / 2 - 20, 'boss'); e.spawn = 1.4; G.e.push(e); announce('Boss : ' + c.n + ' — ' + e.pats.filter(t => BOSS_SIG.includes(t)).map(t => ATK_NAME[t] || t).join(', '));
      } else if (r.type === 'mini') { spawnGroup(R, 1, true); spawnGroup(R, 2 + (G.floor > 3 ? 1 : 0), false); announce('Salle d\'élite : ' + G.e[0].c.n); }
      else spawnGroup(R, ri2(R, 2 + (G.floor > 2 ? 1 : 0), 3 + Math.ceil(Math.min(G.floor, 6) * .7)) - (r.type === 'wave' ? 1 : 0));
    }
    if (r.type === 'treasure' && !r.loot) { r.loot = 'done'; r.item = pickItem(R).id; }
    if (r.type === 'treasure' && r.item && !r.taken) G.pk.push({ kind: 'item', id: r.item, x: RW / 2, y: RH / 2, keep: false, bob: 0 });
    if (r.type === 'shop') {
      const items = []; for (let i = 0; i < 3; i++) items.push(pickItem(R, 'shop', items.map(k => k.id)));
      (r.sold ||= {}); items.forEach((it, i) => { if (!r.sold[i]) G.pk.push({ kind: 'item', id: it.id, x: RW / 2 + (i - 1) * 90, y: RH / 2 - 20, price: 10 + it.t * 7, slot: i, keep: false, bob: i }); });
      if (!r.sold.h) G.pk.push({ kind: 'heart', price: 6, slot: 'h', x: RW / 2 - 180, y: RH / 2 + 50, keep: false });
    }
    if (r.type === 'boss' && r.cleared && G.floor < G.len && !r.nextTaken) G.pk.push({ kind: 'stairs', x: RW / 2, y: RH / 2, keep: false });
    G.rl.forEach((row, y) => row.forEach((v, x) => { if (v === 2) G.fire.push({ x: (x + .5) * TILE, y: (y + .5) * TILE, spike: true }); }));
    G.roomWasClear = r.cleared; saveRun();
  };
  const solidAt = (x, y, rad = 0) => { if (x - rad < 0 || y - rad < 0 || x + rad > RW || y + rad > RH) return true; for (const [dx, dy] of [[-rad, -rad], [rad, -rad], [-rad, rad], [rad, rad]]) { const tx = Math.floor((x + dx) / TILE), ty = Math.floor((y + dy) / TILE); const v = G.rl[ty]?.[tx]; if (v === 1 || v === 3) return true; } return false; };
  const shotSolid = (x, y) => { const v = G.rl[Math.floor(y / TILE)]?.[Math.floor(x / TILE)]; return v === 1; };
  const saveRun = () => {
    if (!G || G.over) return; const p = G.p;
    doc.run = { ver: 2, seed: G.seed, floor: G.floor, cur: G.cur, hero: G.hero, kills: G.kills, time: Math.round(G.time), hitFloor: G.hitFloor, roomClears: G.roomClears, items: G.items, rooms: G.rooms.map(r => ({ v: r.visited, c: r.cleared, k: r.taken, s: r.sold, n: r.nextTaken })),
      p: { hp: p.hp, maxhp: p.maxhp, dmg: p.dmg, delay: p.delay, speed: p.speed, shotSpd: p.shotSpd, range: p.range, luck: p.luck, shots: p.shots, size: p.size, coins: p.coins, fx: p.fx, flags: [...p.flags], orbit: p.orbit, magnet: p.magnet, iframes: p.iframes, loot: p.loot, dodge: p.dodge, act: p.act } };
    save();
  };
  const resumeRun = () => {
    const s = doc.run; if (!s || s.ver !== 2 || !CBYID[s.hero]) { doc.run = null; return false; }
    newRunBare(s.hero, s.seed); const p = G.p, q = s.p; Object.assign(p, q, { flags: new Set(q.flags), fx: { ...q.fx } }); G.floor = s.floor; G.kills = s.kills; G.time = s.time; G.hitFloor = s.hitFloor; G.roomClears = s.roomClears; G.items = s.items.filter(id => ITEM_BY[id]);
    G.rooms = makeFloor(G.seed, G.floor); s.rooms.forEach((r, i) => { const o = G.rooms[i]; if (o) { o.visited = r.v; o.cleared = r.c; o.taken = r.k; o.sold = r.s; o.nextTaken = r.n; } });
    if (p.act && !ITEM_BY[p.act.id]) p.act = null;
    G.cur = s.cur; p.x = RW / 2; p.y = RH / 2; loadRoom(G.cur, -1); recalcSyn(); toastq = []; G.card = null; return true;
  };
  const newRunBare = (hero, seed) => { const keep = doc.stats.runs; const run = newRun(hero); doc.stats.runs = keep; G.seed = seed; G.len = 6 + seed % 3; setThemeSeq(seed); return run; };
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
    const p = G.p, base = Math.atan2(dy, dx), n = p.shots; SFX.shot(); p.aim = [Math.cos(base), Math.sin(base)];
    const offs = n === 1 ? [0] : n === 2 ? [-.0, 0] : [-.28, 0, .28];
    offs.forEach((o, i) => { if (n === 2) { const px = -Math.sin(base) * (i ? 5 : -5), py = Math.cos(base) * (i ? 5 : -5); spawnShot(p.x + px, p.y + py, base); } else spawnShot(p.x, p.y, base + o); });
  };
  const nova2 = () => { const n = hasSyn('tempete') ? 16 : 8; for (let i = 0; i < n; i++) spawnShot(G.p.x, G.p.y, i / n * Math.PI * 2); SFX.boom(); };
  const rumble = (d = 120, s = .5) => { try { const gp = [...(navigator.getGamepads?.() || [])].find(x => x && x.connected); gp?.vibrationActuator?.playEffect?.('dual-rumble', { duration: d, strongMagnitude: s, weakMagnitude: s * .5 }); } catch {} };
  const hurt = (dmg, src) => {
    const p = G.p; if (p.inv > 0 || p.dash > 0 || G.over) return;
    if (p.shield > 0) { p.shield = 0; p.inv = .8; announce('Écu brisé'); SFX.hit(); return; }
    if (Math.random() < p.dodge) { p.inv = .5; announce('Esquive !'); return; }
    p.hp -= dmg * 1; G.hitFloor = true; p.inv = 1.3 + p.iframes; shake = .25; SFX.hurt(); rumble(); if (p.flags.has('thorns') && src) { src.hp -= 3; src.flash = .1; }
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
    const p = G.p, ch = (e.boss ? 1 : e.mini ? .9 : .35) + p.loot;
    if (Math.random() < ch) addPickup('coin', e.x, e.y); if (Math.random() < ch * .45) addPickup('coin', e.x, e.y);
    if (Math.random() < (e.boss ? .5 : e.mini ? .35 : .1) + p.loot * .2 + (p.hp <= 2 ? .12 : 0)) addPickup('heart', e.x, e.y);
  };
  const killEnemy = e => {
    if (e.dead) return; e.dead = true; G.kills++; dropLoot(e); SFX.kill();
    G.fl.push({ x: e.x, y: e.y, t: .4, kind: 'puff' });
    if (e.tr === 'splitter' && !e.child) for (let i = 0; i < 2; i++) { const k = makeEnemy(e.c, G.floor, e.x + rnd(-14, 14), e.y + rnd(-14, 14)); k.hp = k.max = Math.max(3, Math.round(e.max / 3)); k.r = 8; k.child = true; k.tr = null; k.spawn = .3; k.spd *= 1.1; G.e.push(k); }
    else if (e.ai === 'hop' && e.c.plan === 'blob' && e.max > 14 && !e.child && !e.mini) for (let i = 0; i < 2; i++) { const k = makeEnemy(e.c, G.floor, e.x + rnd(-14, 14), e.y + rnd(-14, 14)); k.hp = k.max = Math.round(e.max / 3); k.r = 8; k.child = true; k.tr = null; k.spawn = .3; G.e.push(k); }
    if (e.tr === 'bomber') G.hz.push({ k: 'warn', x: e.x, y: e.y, r: 44, t: 0, dur: .7, then: 'burst' });
  };
  const damageEnemy = (e, dmg, fx = {}, shot) => {
    if (e.spawn > 0 || e.dead || e.hidden) return;
    const p = G.p; let d = dmg * (e.freeze > 0 && hasSyn('percegel') && shot?.fx?.pierce ? 1.4 : 1) * (e.tr === 'armor' ? .65 : 1);
    e.hp -= d; e.flash = .08; SFX.hit();
    const dur = hasSyn('toxique') ? 1.5 : 1;
    if (fx.burn) e.burn = 3 * dur; if (fx.freeze) e.freeze = 2.2; if (fx.poison) e.poison = 4 * dur;
    if (fx.lifesteal && Math.random() < (hasSyn('sangvicie') ? .16 : .08)) { heal(1); }
    if (fx.chain) { const o = G.e.filter(k => k !== e && !k.dead && !k.hidden && dist(k, e) < 95).sort((a, b) => dist(a, e) - dist(b, e))[0]; if (o) { G.fl.push({ x: e.x, y: e.y, x2: o.x, y2: o.y, t: .15, kind: 'zap' }); o.hp -= d * .5; o.flash = .08; if (hasSyn('foudregel')) o.freeze = 1.5; if (o.hp <= 0 && !o.dead) killEnemy(o); } }
    if (fx.explode) explode(e.x, e.y, d * .6, hasSyn('brasier') ? 62 : 46, hasSyn('brasier'), e);
    if (fx.split && shot && !shot.child) for (const a of [-1, 1]) { const ang = Math.atan2(shot.vy, shot.vx) + a * 1.1; G.b.push({ ...shot, x: e.x, y: e.y, vx: Math.cos(ang) * 200, vy: Math.sin(ang) * 200, dmg: d * .45, r: shot.r * .75, life: 130, hit: new Set([e]), child: true, fx: { ...shot.fx, split: 0 } }); }
    if (e.hp <= 0 && !e.dead) killEnemy(e);
  };
  const explode = (x, y, dmg, rad, burn, from) => {
    SFX.boom(); G.fl.push({ x, y, t: .3, kind: 'boom', r: rad });
    for (const k of G.e) if (k !== from && !k.dead && !k.hidden && k.spawn <= 0 && Math.hypot(k.x - x, k.y - y) < rad + k.r) { k.hp -= dmg; k.flash = .08; if (burn) k.burn = 3; if (k.hp <= 0) killEnemy(k); }
    if (hasSyn('frag')) for (let i = 0; i < 4; i++) { const a = i * 1.57 + .8; G.b.push({ x, y, vx: Math.cos(a) * 220, vy: Math.sin(a) * 220, dmg: dmg * .4, r: 3, life: 110, fx: {}, hit: new Set(), col: '#ffb43c', child: true }); }
  };
  /* --- enemy attacks: one per type, scaled by the creature's own numbers (atq: more shots, mag: faster) --- */
  const enemyShoot = (e, ang, spd = 130, n = 1, spread = 0, r = 4, o = {}) => { spd *= .78 + Math.min(G.floor, 6) * .06; for (let i = 0; i < n; i++) { const a = ang + (n > 1 ? (i - (n - 1) / 2) * spread : 0); G.eb.push({ x: e.x, y: e.y, vx: Math.cos(a) * spd, vy: Math.sin(a) * spd, r, dmg: 1, life: o.life || 3.2, col: o.col || e.shotCol, home: o.home || 0, bounce: o.bounce || 0, slow: o.slow || 0, drop: o.drop || null, sh: SHAPE[e.curKind] || 'circle' }); } };
  const aimAng = e => Math.atan2(G.p.y - e.y, G.p.x - e.x);
  const ATTACKS = {
    feu: (e, a, P) => enemyShoot(e, a, 105, 3 + (P > 1.4 ? 2 : 0), .3, 5, { drop: 'fire', col: '#ff8a2a' }),
    eau: (e, a, P) => { for (let k = 0; k < 4 + Math.round(P * 2); k++) later(k * .09, () => { if (!e.dead) enemyShoot(e, aimAng(e) + rnd(-.14, .14), 160, 1, 0, 3, { col: '#5cb8ff' }); }); },
    plante: (e, a, P) => enemyShoot(e, a, 85, 2 + (P > 1.4 ? 1 : 0), .5, 5, { drop: 'thorn', col: '#6bd05a' }),
    foudre: (e, a, P) => { const n = 2 + (P > 1.4 ? 1 : 0); for (let k = 0; k < n; k++) G.hz.push({ k: 'bolt', x: clamp(G.p.x + (k ? rnd(-70, 70) : 0), 20, RW - 20), t: -k * .25, dur: .75 }); SFX.warn(); },
    glace: (e, a, P) => { const n = 9 + Math.round(P * 2), o = rnd(0, 6); for (let k = 0; k < n; k++) enemyShoot(e, k / n * 6.283 + o, 85, 1, 0, 5, { slow: 1, col: '#9fe8ff' }); },
    roche: (e, a, P) => { G.hz.push({ k: 'warn', x: G.p.x, y: G.p.y, r: 28, t: 0, dur: 1, then: 'boulder' }); if (P > 1.4) G.hz.push({ k: 'warn', x: clamp(G.p.x + rnd(-80, 80), 30, RW - 30), y: clamp(G.p.y + rnd(-60, 60), 30, RH - 30), r: 26, t: -.3, dur: 1, then: 'boulder' }); SFX.warn(); },
    vent: (e, a, P) => { const n = 14 + Math.round(P * 4), o = rnd(0, 6); for (let k = 0; k < n; k++) later(k * .06, () => { if (!e.dead) enemyShoot(e, k * .55 + o, 120, 2, 3.1416, 4, { col: '#9cf0c8' }); }); },
    ombre: (e, a, P) => { G.fl.push({ x: e.x, y: e.y, t: .3, kind: 'puff' }); later(.25, () => { if (e.dead) return; enemyShoot(e, aimAng(e), 150, 3 + (P > 1.4 ? 2 : 0), .22, 4, { col: '#b08aff' }); enemyShoot(e, aimAng(e) + 3.1416, 105, 2, .6, 4, { col: '#b08aff' }); }); },
    lumiere: (e, a, P) => { G.hz.push({ k: 'line', x: e.x, y: e.y, ang: a, t: 0, dur: .65, fn: () => { for (let k = 0; k < 5 + Math.round(P); k++) later(k * .06, () => { if (!e.dead) enemyShoot(e, a, 300, 1, 0, 4, { col: '#fff3b0' }); }); } }); SFX.warn(); },
    poison: (e, a, P) => { for (let k = 0; k < 2 + (P > 1.4 ? 1 : 0); k++) G.hz.push({ k: 'warn', x: clamp(G.p.x + rnd(-70, 70), 30, RW - 30), y: clamp(G.p.y + rnd(-50, 50), 30, RH - 30), r: 22, t: -k * .2, dur: .7, then: 'pool', col: '#a050e0' }); enemyShoot(e, a, 90, 1, 0, 5, { col: '#c070ff', drop: 'poison' }); },
    acier: (e, a, P) => enemyShoot(e, a, 190, 2 + (P > 1.4 ? 1 : 0), .35, 4, { bounce: 3, col: '#cfd8e8' }),
    esprit: (e, a, P) => enemyShoot(e, a, 70, 2 + (P > 1.4 ? 1 : 0), .9, 5, { home: 1.4, life: 4.6, col: '#ff9ac8' }),
    // styles d'attaque propres à chaque ennemi
    fan: (e, a, P) => enemyShoot(e, a, 115, 5 + (P > 1.4 ? 2 : 0), .28, 4),
    cross: (e, a, P) => { for (let w = 0; w < 2; w++) later(w * .35, () => { if (!e.dead) for (let k = 0; k < 4; k++) enemyShoot(e, e.t + w * .785 + k * 1.5708, 120, 1, 0, 4); }); },
    snipe: (e, a, P) => { G.hz.push({ k: 'line', x: e.x, y: e.y, ang: a, t: 0, dur: .55, fn: () => { if (!e.dead) enemyShoot(e, a, 330, 1, 0, 4, { col: '#ffffff' }); } }); SFX.warn(); },
    wave: (e, a, P) => { for (let k = 0; k < 6; k++) later(k * .12, () => { if (!e.dead) enemyShoot(e, aimAng(e) + Math.sin(k * 1.3) * .5, 140, 2, .5, 4); }); },
    mines: (e, a, P) => { for (let k = 1; k <= 3; k++) G.hz.push({ k: 'warn', x: clamp(e.x + (G.p.x - e.x) * k / 3.5 + rnd(-30, 30), 30, RW - 30), y: clamp(e.y + (G.p.y - e.y) * k / 3.5 + rnd(-30, 30), 30, RH - 30), r: 22, t: -k * .15, dur: .9, then: k === 3 ? 'boulder' : null }); SFX.warn(); },
    ring2: (e, a, P) => { for (let w = 0; w < 2; w++) later(w * .4, () => { if (!e.dead) for (let k = 0; k < 9; k++) enemyShoot(e, k / 9 * 6.283 + w * .35, 95 + w * 35, 1, 0, 4); }); },
    pulse: (e, a, P) => { for (let w = 0; w < 4; w++) later(w * .25, () => { if (!e.dead) for (let k = 0; k < 6; k++) enemyShoot(e, k / 6 * 6.283 + w * .5, 105, 1, 0, 4); }); },
    // attaques de signature des boss
    sweep: (e, a, P) => { for (let k = 0; k < 22; k++) later(k * .07, () => { if (!e.dead) enemyShoot(e, a - 1.3 + k * .124, 140, 1, 0, 4); }); },
    cage: (e, a, P) => { const gap = Math.floor(rnd(0, 18)), px = G.p.x, py = G.p.y; for (let k = 0; k < 18; k++) { if (k === gap || k === (gap + 1) % 18) continue; const an = k / 18 * 6.283; G.eb.push({ x: clamp(px + Math.cos(an) * 150, 10, RW - 10), y: clamp(py + Math.sin(an) * 150, 10, RH - 10), vx: -Math.cos(an) * 70, vy: -Math.sin(an) * 70, r: 4, dmg: 1, life: 2.8, col: e.shotCol, home: 0, bounce: 0, slow: 0, drop: null }); } SFX.warn(); },
    meteors: (e, a, P) => { for (let k = 0; k < Math.round(5 * P); k++) G.hz.push({ k: 'warn', x: clamp(G.p.x + (k ? rnd(-130, 130) : 0), 30, RW - 30), y: clamp(G.p.y + (k ? rnd(-90, 90) : 0), 30, RH - 30), r: 28, t: -k * .22, dur: .9 }); SFX.warn(); },
    leap: (e, a, P) => { const tx = clamp(G.p.x, 50, RW - 50), ty = clamp(G.p.y, 50, RH - 50); G.hz.push({ k: 'warn', x: tx, y: ty, r: 50, t: 0, dur: .9 }); SFX.warn(); later(.9, () => { if (e.dead) return; G.fl.push({ x: e.x, y: e.y, t: .3, kind: 'puff' }); e.x = tx; e.y = ty; for (let k = 0; k < 12; k++) enemyShoot(e, k / 12 * 6.283, 120, 1, 0, 5); }); },
    orbitals: (e, a, P) => { for (let k = 0; k < 8; k++) later(k * .1, () => { if (!e.dead) enemyShoot(e, k * .785 + e.t, 80, 1, 0, 6, { bounce: 2, life: 5 }); }); },
    wall: (e, a, P) => { const gap = Math.floor(rnd(1, 11)); for (let k = 0; k < 13; k++) { if (Math.abs(k - gap) < 2) continue; G.eb.push({ x: (k + .5) * RW / 13, y: 10, vx: 0, vy: 85, r: 5, dmg: 1, life: 4.5, col: e.shotCol, home: 0, bounce: 0, slow: 0, drop: null }); } SFX.warn(); },
    chain: (e, a, P) => { for (let k = 0; k < 3; k++) later(k * .35, () => { if (!e.dead) enemyShoot(e, aimAng(e), 120 + k * 40, 3, .2, 5); }); later(1.1, () => { if (!e.dead) for (let k = 0; k < 8; k++) enemyShoot(e, k * .785, 110, 1, 0, 5); }); },
    tentacles: (e, a, P) => { for (let k = 1; k <= 6; k++) G.hz.push({ k: 'warn', x: clamp(e.x + (G.p.x - e.x) * k / 5, 30, RW - 30), y: clamp(e.y + (G.p.y - e.y) * k / 5, 30, RH - 30), r: 24, t: -k * .12, dur: .6 }); SFX.warn(); },
    fanrev: (e, a, P) => { enemyShoot(e, a, 100, 7, .3, 4); later(.5, () => { if (!e.dead) enemyShoot(e, aimAng(e), 150, 7, .3, 4); }); },
    shockwave: (e, a, P) => { G.hz.push({ k: 'warn', x: e.x, y: e.y, r: 62, t: 0, dur: .5 }); SFX.warn(); later(.5, () => { if (!e.dead) for (let k = 0; k < 24; k++) enemyShoot(e, k / 24 * 6.283, 150, 1, 0, 4); }); },
    crush: (e, a, P) => { e.state = 'rush'; e.st = .8; e.dx = Math.cos(a); e.dy = Math.sin(a); e.cd = 0; later(.85, () => { if (!e.dead) for (let k = 0; k < 12; k++) enemyShoot(e, k / 12 * 6.283, 125, 1, 0, 5); }); },
    // generic boss patterns
    radial: (e, a, P) => { const n = Math.round(14 * P); for (let k = 0; k < n; k++) enemyShoot(e, k / n * 6.283 + e.t, 105, 1, 0, 5); },
    aimed: (e, a, P) => { for (let k = 0; k < Math.round(3 * P); k++) later(k * .22, () => { if (!e.dead) enemyShoot(e, aimAng(e), 170, 3, .22, 5); }); },
    spiral: (e, a, P) => { for (let k = 0; k < 24; k++) later(k * .07, () => { if (!e.dead) enemyShoot(e, k * .5 + e.t, 115, 2, 3.14159, 4); }); },
    rain: (e, a, P) => { for (let k = 0; k < Math.round(9 * P); k++) { const x = rnd(TILE, RW - TILE); G.eb.push({ x, y: 8, vx: rnd(-10, 10), vy: rnd(90, 150), r: 5, dmg: 1, life: 3.5, col: e.shotCol }); } },
    summon: (e, a, P) => { for (let k = 0; k < Math.round(2 * P); k++) { const pool = CREATURES.filter(c => CR.RK[c.r] <= Math.min(2, G.floor)), c = pool[Math.floor(Math.random() * pool.length)], m = makeEnemy(c, G.floor, e.x + rnd(-50, 50), e.y + rnd(30, 60)); m.spawn = .5; m.tr = null; G.e.push(m); } },
    charge: (e, a) => { e.state = 'rush'; e.st = .65; e.dx = Math.cos(a); e.dy = Math.sin(a); e.cd = 0; },
  };
  // every attack is announced: the enemy stops, a ring fills in its element's colour and the attack's name floats above it (0.6 s), then it fires
  const TELE = .6, SHAPE = { feu: 'fire', eau: 'drop', plante: 'seed', glace: 'diamond', roche: 'rock', ombre: 'dark', lumiere: 'star', poison: 'bubble', acier: 'diamond', esprit: 'orb' };
  const telegraph = (e, kind, run) => { e.tele = { t: TELE, k: kind, ang: aimAng(e) }; e.cd = 99; later(TELE, () => { if (e.dead) return; e.tele = null; e.curKind = kind; run(); }); };
  const doAttack = e => {
    const kind = e.atk[e.ai_i++ % e.atk.length], P = 1 + (e.c.atq > 72 ? .5 : 0) + (e.mini ? .5 : 0);
    telegraph(e, kind, () => { ATTACKS[kind]?.(e, aimAng(e), P); e.cd = clamp(2.9 - e.c.mag * .012, 1.5, 3) + rnd(0, .7) - (e.mini ? .4 : 0); });
  };
  const ejectFromWalls = (o, rad) => { for (let r = 3; r <= 70; r += 3) for (let k = 0; k < 12; k++) { const a = k * .5236, x = clamp(o.x + Math.cos(a) * r, rad, RW - rad), y = clamp(o.y + Math.sin(a) * r, rad, RH - rad); if (!solidAt(x, y, rad)) { o.x = x; o.y = y; return; } } o.x = RW / 2; o.y = RH / 2; };
  const moveWithWalls = (o, dx, dy, rad, fly) => {
    if (!fly && solidAt(o.x, o.y, rad)) ejectFromWalls(o, rad);
    if (!fly && o !== G.p && o.det > 0) { o.det--; [dx, dy] = [-dy * o.ds, dx * o.ds]; }   // a detour: enemies only walk sideways round a rock for a moment
    const ox = o.x, oy = o.y, steps = Math.max(1, Math.ceil(Math.hypot(dx, dy) / 6)), sx = dx / steps, sy = dy / steps;
    for (let i = 0; i < steps; i++) {   // small steps, one axis at a time: slides along walls, never tunnels
      if (fly || !solidAt(o.x + sx, o.y, rad)) o.x += sx; else { const k = [-5, 5].find(k => !solidAt(o.x + sx, o.y + k, rad)); if (k) o.y += Math.sign(k) * Math.min(Math.abs(sx), 2); }   // corner assist: a few px of slide when only a rock corner blocks
      if (fly || !solidAt(o.x, o.y + sy, rad)) o.y += sy; else { const k = [-5, 5].find(k => !solidAt(o.x + k, o.y + sy, rad)); if (k) o.x += Math.sign(k) * Math.min(Math.abs(sy), 2); }
    }
    o.x = clamp(o.x, rad, RW - rad); o.y = clamp(o.y, rad, RH - rad);
    if (!fly && o !== G.p && (dx || dy)) { if (Math.hypot(o.x - ox, o.y - oy) < Math.hypot(dx, dy) * .3) { if ((o.blk = (o.blk || 0) + 1) > 8) { o.blk = 0; o.det = 36; o.ds = Math.random() < .5 ? 1 : -1; } } else o.blk = 0; }
  };
  const updateEnemy = (e, dt) => {
    const p = G.p;
    if (e.spawn > 0) { e.spawn -= dt; return; }
    const x0 = e.x; e.t += dt; if (e.flash > 0) e.flash -= dt;
    if (e.burn > 0) { e.burn -= dt; e.hp -= dt * 1.6 * (hasSyn('toxique') ? 1.5 : 1); if (e.hp <= 0 && !e.dead) { killEnemy(e); return; } }
    if (e.poison > 0) { e.poison -= dt; e.hp -= dt * 1.3 * (hasSyn('toxique') ? 1.5 : 1); if (e.hp <= 0 && !e.dead) { killEnemy(e); return; } }
    if (e.tr === 'regen' && e.hp < e.max) e.hp = Math.min(e.max, e.hp + dt * e.max * .02);
    e.rage = e.tr === 'berserk' && e.hp < e.max * .4 ? 1.55 : 1;
    if (e.rec > 0) e.rec -= dt;
    const slow = e.freeze > 0 ? (e.freeze -= dt, .45) : 1, sp = e.spd * slow * (e.tele ? .15 : 1) * (e.rec > 0 ? .1 : 1) * (.76 + Math.min(G.floor, 6) * .065) * e.rage * (e.tr === 'swift' ? 1.3 : 1) * (!e.shoots && !e.boss ? 1.2 : 1), dx = p.x - e.x, dy = p.y - e.y, d = Math.hypot(dx, dy) || 1, ux = dx / d, uy = dy / d;
    e.cd -= dt * slow * e.rage; if (e.tele) e.tele.t -= dt;
    if (e.boss) { updateBoss(e, dt, ux, uy, d, dx, dy); }
    else {
      let vx = 0, vy = 0; e.hidden = false;
      switch (e.ai) {
        case 'chase': vx = ux * sp; vy = uy * sp; break;
        case 'hop': { const ph = Math.sin(e.t * 3.2); const k = ph > 0 ? 1.7 : .15; vx = ux * sp * k; vy = uy * sp * k; break; }
        case 'charge': if (e.state === 'wind') { e.st -= dt; if (e.st <= 0) { e.state = 'rush'; e.st = .8; e.dx = ux; e.dy = uy; } } else if (e.state === 'rush') { e.st -= dt; vx = e.dx * sp * 3.4; vy = e.dy * sp * 3.4; if (e.st <= 0 || solidAt(e.x + e.dx * 14, e.y + e.dy * 14, 8)) { e.state = ''; e.cd = rnd(1.2, 2.2); } } else { vx = ux * sp * .55; vy = uy * sp * .55; if (e.cd <= 0) { e.state = 'wind'; e.st = .55; } } break;
        case 'weave': { const s = Math.sin(e.t * 3) * .9; vx = (ux - uy * s) * sp; vy = (uy + ux * s) * sp; break; }
        case 'swarm': { const a = e.t * 3.1 + e.c.seed; vx = (ux * .6 + Math.cos(a) * .9) * sp * 1.1; vy = (uy * .6 + Math.sin(a) * .9) * sp * 1.1; break; }
        case 'flyer': case 'ghost': { const want = e.ai === 'ghost' ? 110 : 130, k = d > want + 25 ? 1 : d < want - 25 ? -1 : 0, s = Math.sin(e.t * 1.7); vx = (ux * k - uy * s * .7) * sp; vy = (uy * k + ux * s * .7) * sp; break; }
        case 'turret': break;
        case 'tri': { const k = d > 150 ? .8 : d < 90 ? -.8 : 0; vx = ux * k * sp + Math.cos(e.t) * 18; vy = uy * k * sp + Math.sin(e.t * 1.3) * 18; break; }
        case 'dash': if (e.state === 'rush') { e.st -= dt; vx = e.dx * sp * 3.2; vy = e.dy * sp * 3.2; if (e.st <= 0) { e.state = ''; e.cd = rnd(1.2, 2); } } else { vx = ux * sp * .5; vy = uy * sp * .5; if (e.cd <= 0 && d < 260) { e.state = 'rush'; e.st = .5; e.dx = ux; e.dy = uy; } } break;
        case 'orbit': { const want = 120, rad = (d - want) * .02, tx = -uy, ty = ux; vx = (ux * rad + tx * .9) * sp; vy = (uy * rad + ty * .9) * sp; break; }
        case 'skitter': { if ((e.st -= dt) <= 0) { e.st = rnd(.25, .6); const a = Math.random() < .45 ? Math.atan2(dy, dx) : rnd(0, 6.28); e.dx = Math.cos(a); e.dy = Math.sin(a); } vx = e.dx * sp * 1.7; vy = e.dy * sp * 1.7; break; }
        case 'patrol': { if (!e.dx && !e.dy) { const a = rnd(0, 6.28); e.dx = Math.cos(a); e.dy = Math.sin(a); } if (d < 120) { e.dx += (ux - e.dx) * dt * 2; e.dy += (uy - e.dy) * dt * 2; } const n = Math.hypot(e.dx, e.dy) || 1; e.dx /= n; e.dy /= n; if (solidAt(e.x + e.dx * 14, e.y, 9)) e.dx *= -1; if (solidAt(e.x, e.y + e.dy * 14, 9)) e.dy *= -1; vx = e.dx * sp * 1.1; vy = e.dy * sp * 1.1; break; }
        case 'guard': { const hd = Math.hypot(e.hx - e.x, e.hy - e.y); if (d < 150) { vx = ux * sp * .9; vy = uy * sp * .9; } else if (hd > 12) { vx = (e.hx - e.x) / hd * sp * .6; vy = (e.hy - e.y) / hd * sp * .6; } break; }
        case 'sprint': if (e.state === 'go') { e.st -= dt; vx = e.dx * sp * 3; vy = e.dy * sp * 3; if (e.st <= 0 || solidAt(e.x + e.dx * 14, e.y + e.dy * 14, 8)) { e.state = 'stop'; e.st = rnd(.4, .9); } } else { e.st = (e.st || .5) - dt; vx = ux * sp * .15; vy = uy * sp * .15; if (e.st <= 0) { e.state = 'go'; e.st = .55; e.dx = ux; e.dy = uy; } } break;
        case 'swoop': if (e.state === 'dive') { e.st -= dt; vx = e.dx * sp * 3.4; vy = e.dy * sp * 3.4; if (e.st <= 0) { e.state = ''; e.cd = rnd(1, 1.8); } } else { const a = e.t * 1.2, tx = p.x + Math.cos(a) * 130 - e.x, ty = p.y + Math.sin(a) * 100 - 40 - e.y, n = Math.hypot(tx, ty) || 1; vx = tx / n * sp * 1.2; vy = ty / n * sp * 1.2; if (e.cd <= 0) { e.state = 'dive'; e.st = .55; e.dx = ux; e.dy = uy; } } break;
        case 'teleport': {  // flotte à distance ; ne disparaît que pour fuir quand on est collé à lui (fumée annoncée avant)
          const k = d > 170 ? .7 : d < 110 ? -.7 : 0, s2 = Math.sin(e.t * 1.4); vx = (ux * k - uy * s2 * .5) * sp; vy = (uy * k + ux * s2 * .5) * sp;
          e.st -= dt; if (d < 60 && e.st <= 0) { e.st = 3.5; G.fl.push({ x: e.x, y: e.y, t: .3, kind: 'puff' }); const [nx, ny] = freeSpot(Math.random, 150); e.x = nx; e.y = ny; G.fl.push({ x: e.x, y: e.y, t: .3, kind: 'puff' }); }
          break; }
        case 'burrow': {
          if (e.state === 'under') { e.hidden = true; e.st -= dt; vx = ux * sp * 2.4; vy = uy * sp * 2.4; if (e.st <= 0) { e.state = 'pop'; e.st = .6; G.hz.push({ k: 'warn', x: e.x, y: e.y, r: 30, t: 0, dur: .5, then: 'burst' }); e.hidden = false; } }
          else if (e.state === 'pop') { e.st -= dt; if (e.st <= 0) { e.state = ''; e.cd = rnd(2, 3.2); } }
          else { vx = ux * sp * .7; vy = uy * sp * .7; if (e.cd <= 0) { e.state = 'under'; e.st = 1.1; e.hidden = true; } }
          break; }
      }
      // ranged attack, or a ground slam for those that do not shoot
      if (e.cd <= 0 && !e.hidden && !e.state.match(/wind|rush|go|dive|under/)) {
        if (e.shoots) { if (e.ai !== 'charge' && e.ai !== 'sprint' || d < 320) doAttack(e); else e.cd = .5; }
        else if (d < 85) { G.hz.push({ k: 'warn', x: e.x, y: e.y, r: 46, t: 0, dur: .55, then: 'burst' }); e.cd = rnd(1.6, 2.4); SFX.warn(); }
        else e.cd = .3;
      }
      if (e.tr === 'summoner' && (e.sum -= dt) <= 0) { e.sum = rnd(5, 7); if (G.e.filter(k => k.child2).length < 2) { const pool = tierPool(0, 1), c = pool[Math.floor(Math.random() * pool.length)], m = makeEnemy(c, G.floor, e.x + rnd(-20, 20), e.y + 18); m.child2 = true; m.hp = m.max = Math.max(3, Math.round(m.max * .5)); m.tr = null; m.spawn = .5; G.e.push(m); G.fl.push({ x: e.x, y: e.y, t: .3, kind: 'puff' }); } }
      moveWithWalls(e, vx * dt, vy * dt, e.r - 2, e.fly);
    }
    // enemies push each other apart a little
    for (const o of G.e) if (o !== e && !o.dead && o.spawn <= 0) { const ox = e.x - o.x, oy = e.y - o.y, dd = Math.hypot(ox, oy) || 1, min = e.r + o.r - 4; if (dd < min) { e.x += ox / dd * (min - dd) * .3; e.y += oy / dd * (min - dd) * .3; } }
    { const mv = e.x - x0, want = Math.abs(mv) > 5 * dt ? Math.sign(mv) : (p.x < e.x ? -1 : 1);   // le demi-tour ne se fait qu'après 0,2 s dans l'autre sens : pas de clignotement
      if (!e.face) e.face = want; else if (want !== e.face) { if ((e.fchg = (e.fchg || 0) + dt) > .2) { e.face = want; e.fchg = 0; } } else e.fchg = 0; }
    if (!e.hidden && Math.hypot(p.x - e.x, p.y - e.y) < e.r + p.r - 2) { const before = p.hp; hurt(e.dmg, e); if (p.hp < before) { const a = Math.atan2(e.y - p.y, e.x - p.x); if (!e.boss) { e.rec = .6; moveWithWalls(e, Math.cos(a) * 26, Math.sin(a) * 26, e.r - 2, e.fly); } moveWithWalls(p, -Math.cos(a) * 34, -Math.sin(a) * 34, p.r, false); p.vx = -Math.cos(a) * 200; p.vy = -Math.sin(a) * 200; } }
  };
  const updateBoss = (e, dt, ux, uy, d, dx, dy) => {
    const ph = e.hp < e.max * .5 ? 1 : 0, sp = e.spd * (e.freeze > 0 ? .5 : 1) * (1 + ph * .35);
    if (ph && !e.enraged) { e.enraged = true; announce(e.c.n + ' s\'énerve !'); e.cd = .6; }
    if (e.state === 'rush') { e.st -= dt; moveWithWalls(e, e.dx * sp * 3.3 * dt, e.dy * sp * 3.3 * dt, 24); if (e.st <= 0) { e.state = ''; e.cd = 1.2 - ph * .35; } return; }
    moveWithWalls(e, ux * sp * (e.tele ? .1 : .5) * dt, uy * sp * (e.tele ? .1 : .5) * dt, 24);
    if (e.cd > 0) return;
    const pat = e.pats[e.ph % e.pats.length]; e.ph++;
    telegraph(e, pat, () => { ATTACKS[pat]?.(e, aimAng(e), .85 + Math.min(G.floor, 6) * .12 + ph * .5); if (e.state !== 'rush') e.cd = (2.3 - ph * .6) + rnd(0, .5); });
  };
  const roomCleared = () => {
    const r = G.rooms[G.cur]; r.cleared = true; G.roomClears++; doc.stats.rooms++; SFX.door();
    const p = G.p; if (p.act && p.act.charge < p.act.max) p.act.charge++;
    if (p.flags.has('regen') && G.roomClears % 2 === 0) heal(1);
    if ((r.type === 'combat' || r.type === 'wave') && (Math.random() < .3 + p.loot + (r.type === 'wave' ? .25 : 0) || p.hp <= 2)) addPickup(p.hp <= 2 || Math.random() < .5 ? 'heart' : 'coin', RW / 2, RH / 2);
    if (r.type === 'mini') { const R = CR.rng(r.seed ^ 91); if (R() < .5) { const it = pickItem(R); G.pk.push({ kind: 'item', id: it.id, x: RW / 2, y: RH / 2, keep: false, bob: 0, boss: true }); } else { addPickup('coin', RW / 2 - 25, RH / 2); addPickup('coin', RW / 2 + 5, RH / 2 - 15); } addPickup('heart', RW / 2 + 30, RH / 2); announce('Récompense de la salle d\'élite !'); }
    if (r.type === 'boss') {
      doc.stats.bosses++; if (G.floor === 1) doc.ach.boss1 = true;
      if (G.floor >= G.len) { G.over = true; endRun(true); return; }
      G.pk.push({ kind: 'stairs', x: RW / 2, y: RH / 2, keep: false });
      const R = CR.rng(r.seed ^ 77), it = pickItem(R); G.pk.push({ kind: 'item', id: it.id, x: RW / 2 - 70, y: RH / 2, keep: false, bob: 0, boss: true });
    }
    if (G.floor && !G.hitFloor && r.type === 'boss') { doc.ach.intact = true; }
    checkAch(); saveRun();
  };
  const playerDash = () => { const p = G.p; if (p.dashCd > 0 || p.dash > 0) return; const m = moveVec(); let dx = m[0], dy = m[1]; if (!dx && !dy) { dx = p.face; } const n = Math.hypot(dx, dy) || 1; p.dashx = dx / n; p.dashy = dy / n; p.dash = .18; p.dashCd = 1.8; SFX.shot(); };
  const usePlayerAct = () => {
    const p = G.p, a = p.act; if (!a || a.charge < a.max) return;
    a.charge = 0;
    if (a.kind === 'dash') { const m = moveVec(); let dx = m[0], dy = m[1]; if (!dx && !dy) { dx = p.face; } const n = Math.hypot(dx, dy) || 1; p.dashx = dx / n; p.dashy = dy / n; p.dash = .22; SFX.shot(); }
    else if (a.kind === 'nova') { for (const e of G.e) if (!e.dead && e.spawn <= 0 && !e.hidden) { e.hp -= e.boss ? 25 : 18; e.flash = .15; if (e.hp <= 0) killEnemy(e); } G.fl.push({ x: p.x, y: p.y, t: .4, kind: 'boom', r: 200 }); SFX.boom(); shake = .3; }
    else if (a.kind === 'heal') { heal(4); SFX.pick(); }
    else if (a.kind === 'freezeall') { for (const e of G.e) if (!e.dead) e.freeze = 4; G.eb.forEach(b => { b.vx *= .3; b.vy *= .3; }); SFX.item(); }
    saveRun();
  };
  /* ----- input (keyboard, mouse, gamepad) ----- */
  const moveVec = () => { let dx = (keys.KeyD ? 1 : 0) - (keys.KeyA ? 1 : 0), dy = (keys.KeyS ? 1 : 0) - (keys.KeyW ? 1 : 0); if (pd && (pd.mx || pd.my)) { dx += pd.mx; dy += pd.my; } return [clamp(dx, -1, 1), clamp(dy, -1, 1)]; };
  const pollPad = () => {
    const gp = [...(navigator.getGamepads?.() || [])].find(x => x && x.connected);
    if (!gp) { if (padOn) { padOn = false; setHelp(); } pd = null; return; }
    if (!padOn) { padOn = true; setHelp(); announce('Manette détectée'); }
    const dz = v => Math.abs(v) < .25 ? 0 : v, b = i => !!gp.buttons[i]?.pressed;
    const cur = { mx: dz(gp.axes[0] || 0), my: dz(gp.axes[1] || 0), sx: dz(gp.axes[2] || 0), sy: dz(gp.axes[3] || 0), a: b(0), bb: b(1), x: b(2), y: b(3), lb: b(4), rb: b(5), lt: b(6), rt: b(7), start: b(9), up: b(12), down: b(13), left: b(14), right: b(15) };
    if (!cur.mx && !cur.my) { cur.mx = (cur.right ? 1 : 0) - (cur.left ? 1 : 0); cur.my = (cur.down ? 1 : 0) - (cur.up ? 1 : 0); }
    for (const k of ['a', 'bb', 'x', 'y', 'start', 'up', 'down', 'left', 'right']) cur['p' + k] = cur[k] && !pdPrev[k];
    pdPrev = { ...cur }; pd = cur;
  };
  const padMenu = () => {   // the d-pad / left stick moves between the buttons of the open screen, A presses, B goes back
    if (!ov || !pd) return;
    const items = [...ov.querySelectorAll('button, select, input')].filter(x => x.offsetParent);
    if (!items.length) return;
    let dir = 0; if (pd.pdown || pd.pright) dir = 1; if (pd.pup || pd.pleft) dir = -1;
    if (!dir && (Math.abs(pd.my) > .6 || Math.abs(pd.mx) > .6)) { pd._rep = (pd._rep || 0); }
    const stick = (pad => { const s = (Math.abs(pad.my) > .6 ? Math.sign(pad.my) : 0) || (Math.abs(pad.mx) > .6 ? Math.sign(pad.mx) : 0); const t = performance.now(); if (s && t - (padMenu.t || 0) > 220) { padMenu.t = t; return s; } if (!s) padMenu.t = 0; return 0; })(pd);
    if (stick && !dir) dir = stick;
    if (dir || ov._fi < 0) { ov._fi = clamp(ov._fi < 0 ? 0 : ov._fi + dir, 0, items.length - 1); items.forEach(x => x.classList.remove('padfocus')); items[ov._fi].classList.add('padfocus'); items[ov._fi].scrollIntoView?.({ block: 'nearest' }); }
    const cur = items[ov._fi];
    if (pd.pa && cur) { cur.tagName === 'INPUT' || cur.tagName === 'SELECT' ? cur.focus() : cur.click(); }
    if (pd.pbb) { const back = items.find(x => /^(Retour|Reprendre|Menu)$/.test(x.textContent)); back?.click(); }
  };
  const update = dt => {
    const p = G.p; G.time += dt; G.t += dt; if (shake > 0) shake -= dt; if (G.card) { G.card.t -= dt; if (G.card.t <= 0) G.card = null; }
    const r = G.rooms[G.cur], th = themeOf(G.floor);
    updateParts(G.parts, th, dt);
    for (const t of G.tm) t.t -= dt; const due = G.tm.filter(t => t.t <= 0); G.tm = G.tm.filter(t => t.t > 0); due.forEach(t => { try { t.fn(); } catch (e) { console.error(e); } });
    // movement
    let [dx, dy] = moveVec();
    if (p.dash > 0) { p.dash -= dt; dx = p.dashx; dy = p.dashy; }
    if (p.dashCd > 0) p.dashCd -= dt; if (p.slow > 0) p.slow -= dt; if (p.poolCd > 0) p.poolCd -= dt;
    const n = Math.hypot(dx, dy) || 1, mag = Math.min(1, n), sp = (p.dash > 0 ? 520 : p.speed) * (p.slow > 0 ? .6 : 1);
    const tvx = dx / n * sp * (dx || dy ? mag : 0), tvy = dy / n * sp * (dx || dy ? mag : 0);
    p.vx += (tvx - p.vx) * Math.min(1, dt * 14); p.vy += (tvy - p.vy) * Math.min(1, dt * 14);
    moveWithWalls(p, p.vx * dt, p.vy * dt, p.r, false); if (dx) p.face = Math.sign(dx);
    if (p.inv > 0) p.inv -= dt;
    // shooting
    p.cd -= dt;
    let sx = (keys.ArrowRight ? 1 : 0) - (keys.ArrowLeft ? 1 : 0), sy = (keys.ArrowDown ? 1 : 0) - (keys.ArrowUp ? 1 : 0);
    if (!sx && !sy && pd && (Math.abs(pd.sx) > .3 || Math.abs(pd.sy) > .3)) { if (Math.abs(pd.sx) >= Math.abs(pd.sy)) { sx = Math.sign(pd.sx); sy = 0; } else { sx = 0; sy = Math.sign(pd.sy); } p.padAim = [sx, sy]; }
    if (!sx && !sy && pd && (pd.rt || pd.rb)) { sx = p.aim[0]; sy = p.aim[1]; if (dx || dy) { sx = dx; sy = dy; } }
    if (!sx && !sy && keys.AimX) { sx = keys.AimX; sy = keys.AimY; }   // used by the balance bot (exact aim)
    if (!sx && !sy && mouse.down) { sx = mouse.x - p.x; sy = mouse.y - p.y; }
    if ((sx || sy) && p.cd <= 0) { shootDir(sx, sy); p.cd = p.delay; if (p.flags.has('nova2') && Math.random() < .07) nova2(); }
    if (pd) { if (pd.pa) usePlayerAct(); if (pd.px || pd.pbb || pd.lb) playerDash(); }
    p.orbAng += dt * 3.2;
    // doors
    if (r.cleared) {
      for (let i = 0; i < 4; i++) if (r.doors[i]) { const d = DOORS[i], cx = (d.x + .5) * TILE, cy = (d.y + .5) * TILE; const near = i % 2 === 0 ? Math.abs(p.x - cx) < 26 && (i === 0 ? p.y < 14 : p.y > RH - 14) : Math.abs(p.y - cy) < 26 && (i === 1 ? p.x > RW - 14 : p.x < 14); if (near) { const to = r.nb[i], back = (i + 2) % 4; loadRoom(to, back); return; } }
    } else if (!G.e.some(e => !e.dead)) {
      if (r.type === 'wave' && G.wave < 2) { G.wave++; announce('Vague 2 !'); SFX.door(); spawnGroup(CR.rng(r.seed ^ 0x777), ri2(Math.random, 3, 3 + G.floor)); } else roomCleared();
    }
    // player shots
    for (const b of G.b) {
      if (b.fx.homing) { const t = G.e.filter(e => !e.dead && e.spawn <= 0 && !e.hidden).sort((a, c) => dist(a, b) - dist(c, b))[0]; if (t) { const a = Math.atan2(t.y - b.y, t.x - b.x), cur = Math.atan2(b.vy, b.vx), sp2 = Math.hypot(b.vx, b.vy); let da = a - cur; while (da > Math.PI) da -= 6.283; while (da < -Math.PI) da += 6.283; const na = cur + clamp(da, -dt * 4, dt * 4); b.vx = Math.cos(na) * sp2; b.vy = Math.sin(na) * sp2; } }
      const mx = b.vx * dt, my = b.vy * dt; b.x += mx; b.y += my; b.life -= Math.hypot(mx, my);
      const wallX = b.x < 4 || b.x > RW - 4, wallY = b.y < 4 || b.y > RH - 4, rock = shotSolid(b.x, b.y);
      if (wallX || wallY || rock) { if (b.fx.bounce && b.bounced < 3) { b.bounced++; if (wallX) b.vx *= -1; else if (wallY) b.vy *= -1; else { b.vx *= -1; b.vy *= -1; } b.x = clamp(b.x, 5, RW - 5); b.y = clamp(b.y, 5, RH - 5); if (hasSyn('ricochet')) { const o = G.e.filter(e => !e.dead && dist(e, b) < 120)[0]; if (o) { G.fl.push({ x: b.x, y: b.y, x2: o.x, y2: o.y, t: .15, kind: 'zap' }); damageEnemy(o, b.dmg * .5, {}, null); } } } else b.life = 0; }
      if (b.life <= 0) continue;
      for (const e of G.e) { if (e.dead || e.spawn > 0 || e.hidden || b.hit.has(e) || b.dead) continue; if (Math.hypot(e.x - b.x, e.y - b.y) < e.r + b.r) { b.hit.add(e); damageEnemy(e, b.dmg, b.fx, b); if (b.fx.pierce) b.dmg *= .9; else b.dead = true; } }
    }
    G.b = G.b.filter(b => b.life > 0 && !b.dead);
    // enemies
    for (const e of G.e) if (!e.dead) updateEnemy(e, dt);
    G.e = G.e.filter(e => !e.dead);
    // enemy shots (also blocked by the satellites when the shield synergy is on)
    for (const b of G.eb) {
      if (b.home) { const a = Math.atan2(p.y - b.y, p.x - b.x), cur = Math.atan2(b.vy, b.vx), sp2 = Math.hypot(b.vx, b.vy); let da = a - cur; while (da > Math.PI) da -= 6.283; while (da < -Math.PI) da += 6.283; const na = cur + clamp(da, -dt * b.home, dt * b.home); b.vx = Math.cos(na) * sp2; b.vy = Math.sin(na) * sp2; }
      b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt;
      const wx = b.x < 0 || b.x > RW, wy = b.y < 0 || b.y > RH, rk = shotSolid(b.x, b.y);
      if (wx || wy || rk) { if (b.bounce > 0) { b.bounce--; if (wx) b.vx *= -1; else if (wy) b.vy *= -1; else { b.vx *= -1; b.vy *= -1; } b.x = clamp(b.x, 1, RW - 1); b.y = clamp(b.y, 1, RH - 1); } else b.life = 0; }
      if (hasSyn('aegis')) for (let i = 0; i < p.orbit; i++) { const a = p.orbAng + i * 6.283 / p.orbit, ox = p.x + Math.cos(a) * 30, oy = p.y + Math.sin(a) * 30; if (Math.hypot(b.x - ox, b.y - oy) < 9) b.life = 0; }
      if (b.life > 0 && Math.hypot(b.x - p.x, b.y - p.y) < b.r + p.r) { b.life = 0; b.hit = 1; if (b.slow) p.slow = 1.6; hurt(b.dmg); }
      if (b.life <= 0 && b.drop && !b.hit) G.hz.push({ k: 'pool', x: b.x, y: b.y, r: 15, t: 0, life: 4.5, col: { fire: '#ff7a2a', thorn: '#4aa84a', poison: '#a050e0' }[b.drop] || '#a050e0', tick: 0, kind: b.drop });
    }
    G.eb = G.eb.filter(b => b.life > 0);
    // hazards
    for (const h of G.hz) {
      h.t += dt; if (h.t < 0) continue;
      if (h.k === 'warn' && h.t >= h.dur) {
        h.done = true; G.fl.push({ x: h.x, y: h.y, t: .35, kind: 'boom', r: h.r }); SFX.boom(); if (dist(h, p) < h.r + p.r - 2) hurt(1);
        if (h.then === 'pool') G.hz.push({ k: 'pool', x: h.x, y: h.y, r: h.r, t: 0, life: 5.5, col: h.col, tick: 0 });
        if (h.then === 'boulder') for (let k = 0; k < 5; k++) G.eb.push({ x: h.x, y: h.y, vx: Math.cos(k * 1.257 + .4) * 110, vy: Math.sin(k * 1.257 + .4) * 110, r: 4, dmg: 1, life: .9, col: '#b89a7a', home: 0, bounce: 0, slow: 0, drop: null });
      } else if (h.k === 'bolt') { if (h.t >= h.dur && !h.struck) { h.struck = true; SFX.boom(); shake = .15; if (Math.abs(p.x - h.x) < 16) hurt(1); } if (h.t >= h.dur + .2) h.done = true; }
      else if (h.k === 'line' && h.t >= h.dur) { h.done = true; h.fn?.(); }
      else if (h.k === 'pool') { h.tick = Math.max(0, h.tick - dt); if (h.t >= h.life) h.done = true; else if (dist(h, p) < h.r + 3 && h.tick <= 0 && p.dash <= 0) { h.tick = .9; hurt(1); } }
    }
    G.hz = G.hz.filter(h => !h.done);
    // satellites hurt
    for (let i = 0; i < p.orbit; i++) { const a = p.orbAng + i * 6.283 / p.orbit, ox = p.x + Math.cos(a) * 30, oy = p.y + Math.sin(a) * 30; for (const e of G.e) if (!e.dead && e.spawn <= 0 && !e.hidden && Math.hypot(e.x - ox, e.y - oy) < e.r + 6 && (!e.orbHit || e.orbHit < G.t)) { e.orbHit = G.t + .35; damageEnemy(e, p.dmg * .8, {}, null); } }
    // spikes
    for (const s of G.fire) if (s.spike && Math.hypot(s.x - p.x, s.y - p.y) < 13 && p.dash <= 0) hurt(1);
    // pickups
    for (const k of G.pk) {
      if (k.vx != null) { k.x += k.vx * dt; k.y += k.vy * dt; k.vx *= .92; k.vy *= .92; k.x = clamp(k.x, 14, RW - 14); k.y = clamp(k.y, 14, RH - 14); if (solidAt(k.x, k.y, 2)) { k.x += (RW / 2 - k.x) * .08; k.y += (RH / 2 - k.y) * .08; k.vx = k.vy = 0; } }
      if (p.magnet && (k.kind === 'coin' || k.kind === 'heart') && dist(k, p) < p.magnet) { const a = Math.atan2(p.y - k.y, p.x - k.x); k.x += Math.cos(a) * 160 * dt; k.y += Math.sin(a) * 160 * dt; }
      k.t = (k.t || 0) + dt; const d = dist(k, p);
      if (k.kind === 'coin' && d < 16) { k.gone = true; p.coins++; SFX.pick(); if (p.coins >= 30) doc.ach.riche = true; }
      else if (k.kind === 'heart' && d < 16 && !k.price && p.hp < p.maxhp) { k.gone = true; heal(2); SFX.pick(); }
      else if (k.kind === 'heart' && k.price && d < 20 && p.coins >= k.price && p.hp < p.maxhp) { k.gone = true; p.coins -= k.price; heal(2); r.sold.h = 1; SFX.pick(); saveRun(); }
      else if (k.kind === 'item' && d < 20 && (!k.price || p.coins >= k.price)) {
        if (k.price) { p.coins -= k.price; r.sold[k.slot] = 1; } else if (r.type === 'treasure') r.taken = true;
        k.gone = true; takeItem(k.id);
      }
      else if (k.kind === 'stairs' && d < 22) { k.gone = true; doc.run = null; enterFloor(G.floor + 1); saveRun(); return; }
    }
    G.pk = G.pk.filter(k => !k.gone);
    for (const f of G.fl) f.t -= dt; G.fl = G.fl.filter(f => f.kind === undefined || f.t > 0 || f.spike);
    if (p.hp > p.maxhp) p.hp = p.maxhp;
  };
  /* ----- drawing ----- */
  const whites = new Map();
  const spr = (c, frame, white) => { if (!white) return CR.sprite(c, frame, 4); const k = c.id + frame; let w = whites.get(k); if (!w) { const s = CR.sprite(c, frame, 4); w = document.createElement('canvas'); w.width = w.height = s.width; const x = w.getContext('2d'); x.drawImage(s, 0, 0); x.globalCompositeOperation = 'source-in'; x.fillStyle = '#fff'; x.fillRect(0, 0, s.width, s.width); whites.set(k, w); } return w; };
  const drawSprite = (c, x, y, sc, frame, white, flip) => { const s = spr(c, frame, white); g.save(); g.translate(Math.round(WALL + x), Math.round(HUD + WALL + y)); if (flip) g.scale(-1, 1); g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high'; g.drawImage(s, -20 * sc, -20 * sc - 3, 40 * sc, 40 * sc); g.imageSmoothingEnabled = false; g.restore(); };
  const heartIcon = (x, y, fill) => { g.fillStyle = fill ? '#ff4f6d' : '#3a1730'; for (const [px, py, w, h] of [[1, 0, 2, 1], [4, 0, 2, 1], [0, 1, 7, 2], [1, 3, 5, 1], [2, 4, 3, 1], [3, 5, 1, 1]]) g.fillRect(x + px * 2, y + py * 2, w * 2, h * 2); if (fill) { g.fillStyle = '#ffb3c0'; g.fillRect(x + 2, y + 2, 2, 2); } };
  const drawItemIcon = (it, x, y, size) => { g.imageSmoothingEnabled = false; g.drawImage(itemIcon(it), Math.round(x), Math.round(y), size, size); };
  // enemy shots: a distinct silhouette per element, always a dark outline and a bright core so they stand out on every floor
  const drawEB = (b, ox, oy) => {
    const x = ox + b.x, y = oy + b.y, r = b.r + (b.home ? Math.sin(G.t * 10) * .6 : 0), s = b.sh, fo = '#10061c', ang = Math.atan2(b.vy, b.vx);
    g.save(); g.translate(x, y);
    const poly = (pts, fill) => { g.beginPath(); pts.forEach(([a, c], i) => i ? g.lineTo(a, c) : g.moveTo(a, c)); g.closePath(); g.fillStyle = fill; g.fill(); };
    const circ = (rr, fill) => { g.beginPath(); g.arc(0, 0, rr, 0, 6.283); g.fillStyle = fill; g.fill(); };
    if (s === 'diamond') { poly([[0, -r - 3], [r + 2, 0], [0, r + 3], [-r - 2, 0]], fo); poly([[0, -r - 1], [r, 0], [0, r + 1], [-r, 0]], b.col); poly([[0, -r + 1], [2, 0], [0, 1], [-2, 0]], '#fff'); }
    else if (s === 'rock') { g.fillStyle = fo; g.fillRect(-r - 2, -r - 2, r * 2 + 4, r * 2 + 4); g.fillStyle = b.col; g.fillRect(-r, -r, r * 2, r * 2); g.fillStyle = '#e8d8c0'; g.fillRect(-r, -r, r, 2); g.fillStyle = '#6a5440'; g.fillRect(0, 1, r, r - 1); }
    else if (s === 'star') { poly([[0, -r - 4], [2, -2], [r + 4, 0], [2, 2], [0, r + 4], [-2, 2], [-r - 4, 0], [-2, -2]], fo); poly([[0, -r - 2], [1.5, -1.5], [r + 2, 0], [1.5, 1.5], [0, r + 2], [-1.5, 1.5], [-r - 2, 0], [-1.5, -1.5]], b.col); circ(1.5, '#fff'); }
    else if (s === 'drop') { g.rotate(ang); g.beginPath(); g.ellipse(-2, 0, r + 4, r, 0, 0, 6.283); g.fillStyle = fo; g.fill(); g.beginPath(); g.ellipse(-1, 0, r + 3, r - 1, 0, 0, 6.283); g.fillStyle = b.col; g.fill(); circ(1.6, '#fff'); }
    else if (s === 'fire') { g.fillStyle = b.col; g.globalAlpha = .6; for (let k = 1; k <= 3; k++) { g.beginPath(); g.arc(-Math.cos(ang) * k * 4, -Math.sin(ang) * k * 4, r * (1 - k * .2), 0, 6.283); g.fill(); } g.globalAlpha = 1; circ(r + 2, fo); circ(r + 1, b.col); circ(r - 1, '#ffe08a'); }
    else if (s === 'seed') { g.rotate(ang); poly([[r + 5, 0], [0, -r - 1], [-r - 1, 0], [0, r + 1]], fo); poly([[r + 3, 0], [0, -r + 1], [-r + 1, 0], [0, r - 1]], b.col); g.fillStyle = '#d9ffc8'; g.fillRect(-1, -1, 3, 2); }
    else if (s === 'bubble') { circ(r + 2, fo); circ(r + 1, b.col); g.globalAlpha = .6; circ(r - 1, '#e8b8ff'); g.globalAlpha = 1; g.fillStyle = '#fff'; g.fillRect(-r + 1, -r + 1, 2, 2); }
    else if (s === 'dark') { circ(r + 3, '#05010b'); circ(r + 1, b.col); circ(r - 1, '#2a1048'); g.fillStyle = '#e6d0ff'; g.fillRect(-1, -1, 2, 2); }
    else if (s === 'orb') { g.globalAlpha = .35; circ(r + 4, b.col); g.globalAlpha = 1; circ(r + 2, fo); circ(r + 1, b.col); circ(r - 1, '#fff'); }
    else { circ(r + 2, fo); circ(r + 1, b.col); circ(Math.max(1, r - 2), '#fff'); }
    g.restore();
  };
  const drawHazards = () => {
    const ox = WALL, oy = HUD + WALL;
    for (const h of G.hz) {
      if (h.t < 0) continue;
      if (h.k === 'warn') { const f = h.t / h.dur; g.fillStyle = h.then === 'pool' ? 'rgba(160,80,224,' + (.12 + f * .25) + ')' : 'rgba(255,79,109,' + (.1 + f * .28) + ')'; g.beginPath(); g.arc(ox + h.x, oy + h.y, h.r, 0, 6.283); g.fill(); g.strokeStyle = h.then === 'pool' ? '#c070ff' : '#ff4f6d'; g.lineWidth = 2; g.beginPath(); g.arc(ox + h.x, oy + h.y, h.r * (1 - f * .15), 0, 6.283); g.stroke(); g.fillStyle = 'rgba(255,255,255,' + f * .5 + ')'; g.beginPath(); g.arc(ox + h.x, oy + h.y, h.r * f, 0, 6.283); g.fill(); }
      else if (h.k === 'bolt') { const f = Math.min(1, h.t / h.dur); if (!h.struck) { g.fillStyle = 'rgba(255,228,92,' + (.12 + f * .2) + ')'; g.fillRect(ox + h.x - 14, oy, 28, RH); g.strokeStyle = '#ffe45c'; g.setLineDash([6, 6]); g.lineWidth = 1; g.strokeRect(ox + h.x - 14, oy, 28, RH); g.setLineDash([]); } else { g.fillStyle = '#fff'; g.fillRect(ox + h.x - 8, oy, 16, RH); g.fillStyle = '#ffe45c'; g.fillRect(ox + h.x - 14, oy, 28, RH); g.globalAlpha = .5; g.fillStyle = '#fff'; g.fillRect(ox + h.x - 3, oy, 6, RH); g.globalAlpha = 1; } }
      else if (h.k === 'line') { const f = h.t / h.dur; g.strokeStyle = 'rgba(255,243,176,' + (.3 + f * .6) + ')'; g.lineWidth = 1 + f * 3; g.beginPath(); g.moveTo(ox + h.x, oy + h.y); g.lineTo(ox + h.x + Math.cos(h.ang) * 520, oy + h.y + Math.sin(h.ang) * 520); g.stroke(); }
      else if (h.k === 'pool') { const a = Math.min(1, (h.life - h.t) * 1.2); g.globalAlpha = .55 * a; g.fillStyle = h.col; g.beginPath(); g.ellipse(ox + h.x, oy + h.y, h.r, h.r * .75, 0, 0, 6.283); g.fill(); g.globalAlpha = .9 * a; g.fillStyle = '#fff'; for (let k = 0; k < 3; k++) g.fillRect(ox + h.x + Math.cos(h.t * 2 + k * 2.1) * h.r * .5, oy + h.y - ((h.t * 14 + k * 5) % 12) + 4, 2, 2); if (h.kind === 'fire') { g.fillStyle = '#ffe08a'; g.fillRect(ox + h.x - 1, oy + h.y - 6 - Math.sin(h.t * 12) * 2, 3, 6); } g.globalAlpha = 1; }
    }
  };
  const draw = () => {
    g.save(); if (shake > 0) g.translate(rnd(-2, 2), rnd(-2, 2));
    g.clearRect(0, 0, CW, CH); g.fillStyle = '#0a0418'; g.fillRect(0, 0, CW, CH);
    const th = themeOf(G.floor), r = G.rooms[G.cur];
    g.drawImage(G.bg, 0, HUD);
    drawTorches(g, th, G.t, HUD);
    for (let i = 0; i < 4; i++) if (r.doors[i]) { const to = G.rooms[r.nb[i]]; drawDoor(g, th, i, to.type === 'combat' && !to.visited ? 'combat' : to.type, r.cleared, G.t); }
    const p = G.p, ox = WALL, oy = HUD + WALL, fr = Math.floor(G.t * 3) & 1;
    drawHazards();
    const items = [];
    for (const k of G.pk) items.push({ y: k.y, f: () => drawPickup(k) });
    for (const e of G.e) items.push({ y: e.y, f: () => {
      if (e.hidden) { g.fillStyle = 'rgba(0,0,0,.35)'; g.beginPath(); g.ellipse(ox + e.x, oy + e.y + 8, 12, 5, 0, 0, 6.283); g.fill(); for (let k = 0; k < 4; k++) { g.fillStyle = '#6b5a4a'; g.fillRect(ox + e.x + Math.cos(G.t * 9 + k * 1.6) * 10, oy + e.y + 6 + Math.sin(G.t * 9 + k * 1.6) * 4, 3, 3); } return; }
      g.fillStyle = 'rgba(0,0,0,.35)'; g.beginPath(); g.ellipse(ox + e.x, oy + e.y + e.r * .8, e.r * .95, e.r * .4, 0, 0, 6.283); g.fill();
      if (e.spawn > 0) { g.globalAlpha = .4 + (.6 - e.spawn) * .5; }
      if (e.state === 'wind' || (e.state === 'go' && false)) { g.globalAlpha = .6 + Math.sin(G.t * 40) * .3; }
      drawSprite(e.c, e.x, e.y, e.scale, fr, e.flash > 0, (e.face || (G.p.x < e.x ? -1 : 1)) < 0); g.globalAlpha = 1;
      if (e.tele) { const f = 1 - Math.max(0, e.tele.t) / TELE, col = e.boss ? '#ff4f6d' : e.shotCol, x = ox + e.x, y = oy + e.y, rr = e.r + 5;
        g.strokeStyle = col; g.lineWidth = 2; g.globalAlpha = .9; g.beginPath(); g.arc(x, y, rr, -1.571, -1.571 + f * 6.283); g.stroke(); g.globalAlpha = .25 + f * .25; g.fillStyle = col; g.beginPath(); g.arc(x, y, rr * f, 0, 6.283); g.fill(); g.globalAlpha = 1;
        if (['feu', 'eau', 'plante', 'ombre', 'acier', 'esprit', 'aimed', 'charge'].includes(e.tele.k)) { g.strokeStyle = col; g.globalAlpha = .55; g.setLineDash([5, 5]); g.lineWidth = 1; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(e.tele.ang) * 170, y + Math.sin(e.tele.ang) * 170); g.stroke(); g.setLineDash([]); g.globalAlpha = 1; }
        const nm = (ATK_NAME[e.tele.k] || STYLE_NAME[e.tele.k] || { radial: 'Anneau', aimed: 'Salve', spiral: 'Spirale', rain: 'Pluie', summon: 'Renforts', charge: 'Charge' }[e.tele.k] || '').toUpperCase(); g.font = 'bold 9px monospace'; g.textAlign = 'center'; g.fillStyle = '#05010b'; g.fillText(nm, x + 1, y - e.r - 15); g.fillStyle = '#fff'; g.fillText(nm, x, y - e.r - 16); g.textAlign = 'left'; }
      if (e.tr) { g.fillStyle = TRAITS[e.tr][1]; g.globalAlpha = .55; g.fillRect(ox + e.x - e.r, oy + e.y + e.r - 3, e.r * 2, 2); g.globalAlpha = 1; }
      if (e.freeze > 0) { g.fillStyle = 'rgba(159,232,255,.3)'; g.fillRect(ox + e.x - e.r, oy + e.y - e.r, e.r * 2, e.r * 2); } if (e.burn > 0) { g.fillStyle = '#ff8a5c'; g.fillRect(ox + e.x - 2, oy + e.y - e.r - 6 - (G.t * 20 % 6), 3, 3); } if (e.poison > 0) { g.fillStyle = '#c070ff'; g.fillRect(ox + e.x + 4, oy + e.y - e.r - 4 - (G.t * 15 % 6), 3, 3); }
      if (e.hp < e.max && !e.boss) { g.fillStyle = '#000'; g.fillRect(ox + e.x - 11, oy + e.y - e.r - 8, 22, 4); g.fillStyle = e.tr ? TRAITS[e.tr][1] : '#ff4f6d'; g.fillRect(ox + e.x - 10, oy + e.y - e.r - 7, 20 * Math.max(0, e.hp / e.max), 2); }
      if (e.mini) { g.fillStyle = '#ff9a3c'; g.font = 'bold 9px monospace'; g.fillText('ÉLITE', ox + e.x - 14, oy + e.y - e.r - 12); } } });
    items.push({ y: p.y, f: () => { if (p.inv > 0 && Math.floor(p.inv * 14) & 1) g.globalAlpha = .35; g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(ox + p.x - 9, oy + p.y + 10, 18, 5); drawSprite(CBYID[G.hero], p.x, p.y, 1, fr, false, p.face < 0); g.globalAlpha = 1; if (p.shield) { g.strokeStyle = '#9fe8ff'; g.lineWidth = 2; g.strokeRect(ox + p.x - 13, oy + p.y - 15, 26, 28); } if (p.slow > 0) { g.fillStyle = '#9fe8ff'; g.fillRect(ox + p.x - 8, oy + p.y - 20, 16, 2); } if (padOn && p.padAim) { const [ax, ay] = p.padAim, cx = ox + p.x + ax * 24, cy = oy + p.y + ay * 24; g.fillStyle = 'rgba(255,255,255,.85)'; for (let k = 0; k < 3; k++) { const w = 3 - k; g.fillRect(Math.round(cx + ax * k * 3 - (ay ? w : 1)), Math.round(cy + ay * k * 3 - (ax ? w : 1)), ay ? w * 2 : 2, ax ? w * 2 : 2); } } } });
    items.sort((a, b) => a.y - b.y).forEach(i => i.f());
    for (let i = 0; i < p.orbit; i++) { const a = p.orbAng + i * 6.283 / p.orbit; g.fillStyle = '#9fe8ff'; g.fillRect(ox + p.x + Math.cos(a) * 30 - 4, oy + p.y + Math.sin(a) * 30 - 4, 8, 8); g.fillStyle = '#fff'; g.fillRect(ox + p.x + Math.cos(a) * 30 - 2, oy + p.y + Math.sin(a) * 30 - 2, 3, 3); }
    for (const b of G.b) { g.fillStyle = b.col; g.fillRect(ox + b.x - b.r, oy + b.y - b.r, b.r * 2, b.r * 2); g.fillStyle = '#fff'; g.fillRect(ox + b.x - 1, oy + b.y - 1, 2, 2); }
    for (const b of G.eb) drawEB(b, ox, oy);
    drawParts(g, G.parts, th, G.t, ox, oy);
    for (const f of G.fl) { if (f.kind === 'zap') { g.strokeStyle = '#ffe45c'; g.lineWidth = 2; g.beginPath(); g.moveTo(ox + f.x, oy + f.y); g.lineTo(ox + (f.x + f.x2) / 2 + rnd(-6, 6), oy + (f.y + f.y2) / 2 + rnd(-6, 6)); g.lineTo(ox + f.x2, oy + f.y2); g.stroke(); } else if (f.kind === 'boom') { g.strokeStyle = '#ffb43c'; g.lineWidth = 3; g.globalAlpha = f.t * 3; g.strokeRect(ox + f.x - f.r * (1 - f.t), oy + f.y - f.r * (1 - f.t), f.r * 2 * (1 - f.t), f.r * 2 * (1 - f.t)); g.globalAlpha = 1; } else if (f.kind === 'puff') { g.fillStyle = '#fff'; g.globalAlpha = f.t * 2; for (let k = 0; k < 6; k++) g.fillRect(ox + f.x + Math.cos(k) * (.4 - f.t) * 60, oy + f.y + Math.sin(k) * (.4 - f.t) * 60, 4, 4); g.globalAlpha = 1; } }
    // boss bar
    const boss = G.e.find(e => e.boss && !e.dead);
    if (boss) { g.fillStyle = '#05010b'; g.fillRect(WALL + 40, HUD + CH - HUD - 24, RW - 80, 10); g.fillStyle = '#ff4f6d'; g.fillRect(WALL + 42, HUD + CH - HUD - 22, (RW - 84) * Math.max(0, boss.hp / boss.max), 6); g.fillStyle = '#fff'; g.font = '10px monospace'; g.fillText(boss.c.n.toUpperCase(), WALL + 42, HUD + CH - HUD - 28); }
    // floor title card
    if (G.card) { const a = Math.min(1, G.card.t, (3.2 - G.card.t) * 3); g.globalAlpha = a * .85; g.fillStyle = '#05010b'; g.fillRect(0, HUD + CH / 2 - 60, CW, 70); g.globalAlpha = a; g.fillStyle = th.pc; g.font = 'bold 10px monospace'; g.textAlign = 'center'; g.fillText('ÉTAGE ' + G.card.n + ' / ' + G.len, CW / 2, HUD + CH / 2 - 36); g.fillStyle = '#fff'; g.font = 'bold 22px monospace'; g.fillText(G.card.name.toUpperCase(), CW / 2, HUD + CH / 2 - 10); g.textAlign = 'left'; g.globalAlpha = 1; }
    g.restore();
    drawHud();
  };
  const drawPickup = k => {
    const ox = WALL, oy = HUD + WALL, bob = Math.sin((k.t || 0) * 4 + (k.bob || 0)) * 2;
    if (k.kind === 'coin') { g.fillStyle = '#c98a1d'; g.fillRect(ox + k.x - 5, oy + k.y - 5 + bob, 10, 10); g.fillStyle = '#ffd07a'; g.fillRect(ox + k.x - 4, oy + k.y - 5 + bob, 7, 8); g.fillStyle = '#fff2c4'; g.fillRect(ox + k.x - 3, oy + k.y - 4 + bob, 2, 3); }
    else if (k.kind === 'heart') { heartIcon(ox + k.x - 7, oy + k.y - 6 + bob, true); if (k.price) priceTag(ox + k.x, oy + k.y + 14, k.price); }
    else if (k.kind === 'stairs') { const th = themeOf(G.floor), x = ox + k.x, y = oy + k.y, pulse = .5 + Math.sin(G.t * 4) * .25; const gl = g.createRadialGradient(x, y, 4, x, y, 40); gl.addColorStop(0, th.pc + '88'); gl.addColorStop(1, th.pc + '00'); g.fillStyle = gl; g.fillRect(x - 40, y - 40, 80, 80); g.fillStyle = '#05010b'; g.fillRect(x - 17, y - 17, 34, 34); g.fillStyle = '#2a2040'; g.fillRect(x - 17, y - 17, 34, 3); for (let i = 0; i < 4; i++) { g.fillStyle = ['#d8c8a0', '#b8a880', '#988860', '#786840'][i]; g.fillRect(x - 15 + i * 2, y - 12 + i * 7, 30 - i * 4, 5); g.fillStyle = 'rgba(0,0,0,.4)'; g.fillRect(x - 15 + i * 2, y - 8 + i * 7, 30 - i * 4, 1); } g.fillStyle = th.pc; g.globalAlpha = pulse; g.fillRect(x - 17, y + 17, 34, 2); g.globalAlpha = 1; g.fillStyle = '#fff'; g.font = '9px monospace'; g.fillText('SUIVANT', x - 21, y + 31); }
    else if (k.kind === 'item') { const it = ITEM_BY[k.id], x = ox + k.x, y = oy + k.y;
      g.fillStyle = 'rgba(0,0,0,.4)'; g.beginPath(); g.ellipse(x, y + 12, 14, 4, 0, 0, 6.283); g.fill(); g.fillStyle = '#251848'; g.fillRect(x - 17, y + 6, 34, 10); g.fillStyle = '#3a2a6e'; g.fillRect(x - 17, y + 6, 34, 3);
      g.fillStyle = TIERC[it.t] + '33'; g.beginPath(); g.arc(x, y - 6 + bob, 20, 0, 6.283); g.fill();
      drawItemIcon(it, x - 14, y - 20 + bob, 28);
      g.fillStyle = '#fff'; g.font = '10px monospace'; const nm = it.n.length > 18 ? it.n.slice(0, 17) + '…' : it.n; g.textAlign = 'center'; g.fillText(nm, x, y - 26); g.textAlign = 'left'; if (k.price) priceTag(x, y + 28, k.price); }
  };
  const priceTag = (x, y, v) => { g.fillStyle = G.p.coins >= v ? '#ffd07a' : '#ff4f6d'; g.font = 'bold 11px monospace'; g.fillText(v + '¢', x - 8, y); };
  const drawHud = () => {
    const p = G.p, th = themeOf(G.floor); g.fillStyle = '#0d0620'; g.fillRect(0, 0, CW, HUD); g.fillStyle = '#3a2a6e'; g.fillRect(0, HUD - 3, CW, 3);
    const n = Math.min(16, Math.ceil(p.maxhp / 2)); for (let i = 0; i < n; i++) { const full = p.hp >= i * 2 + 2, half = !full && p.hp > i * 2; heartIcon(10 + (i % 8) * 16, 6 + Math.floor(i / 8) * 14, full); if (half) { g.fillStyle = '#ff4f6d'; g.fillRect(10 + (i % 8) * 16, 6 + Math.floor(i / 8) * 14, 6, 12); } }
    g.fillStyle = '#ffd07a'; g.font = 'bold 12px monospace'; g.fillText('● ' + p.coins, 10, HUD - 8);
    g.fillStyle = th.pc; g.font = 'bold 11px monospace'; g.fillText(th.n.toUpperCase(), 150, 15); g.fillStyle = '#9a88c4'; g.font = '11px monospace'; g.fillText('Étage ' + G.floor + '/' + G.len + ' · ' + CBYID[G.hero].n, 150, 29); g.fillText(Math.floor(G.time / 60) + ':' + String(Math.floor(G.time % 60)).padStart(2, '0') + ' · ' + G.kills + ' tués', 150, 41);
    // dash gauge and active item
    g.fillStyle = '#05010b'; g.fillRect(330, 12, 60, 8); g.fillStyle = p.dashCd > 0 ? '#5b4a8c' : '#5be37d'; g.fillRect(331, 13, 58 * (p.dashCd > 0 ? 1 - p.dashCd / 1.8 : 1), 6); g.fillStyle = '#9a88c4'; g.font = '9px monospace'; g.fillText('ESQUIVE', 330, 32);
    if (p.act) { const a = p.act, x = CW - 104, ready = a.charge >= a.max; g.fillStyle = '#05010b'; g.fillRect(x, 4, 38, 38); g.fillStyle = ready ? '#ffd07a' : '#3a2a6e'; g.fillRect(x + 2, 6, 34, 34); g.globalAlpha = ready ? 1 : .5; drawItemIcon(ITEM_BY[a.id], x + 5, 9, 28); g.globalAlpha = 1; g.fillStyle = '#fff'; g.font = '9px monospace'; g.fillText(a.charge + '/' + a.max, x + 44 - 2, 38); }
    // minimap
    const mx = CW - 60, my = 6; g.fillStyle = '#05010b'; g.fillRect(mx - 2, my - 2, 58, 36);
    for (const [i, r] of G.rooms.entries()) { const known = r.visited || r.nb.some(n => n >= 0 && G.rooms[n].visited); if (!known) continue; const x = mx + (r.x - 4) * 8 + 22, y = my + (r.y - 4) * 6 + 14; g.fillStyle = i === G.cur ? '#fff' : r.visited ? (r.type === 'boss' ? '#ff4f6d' : r.type === 'treasure' ? '#ffd07a' : r.type === 'shop' ? '#5be37d' : r.type === 'mini' ? '#ff9a3c' : '#5b4a8c') : '#251848'; g.fillRect(x, y, 6, 4); }
    // toasts
    let y = HUD + 8; for (const t of toastq) { g.globalAlpha = Math.min(1, t.t); g.fillStyle = 'rgba(5,1,12,.75)'; const w = Math.min(CW - 40, t.m.length * 5.6 + 12); g.fillRect(20, y, w, 15); g.fillStyle = '#fff'; g.font = '10px monospace'; g.fillText(t.m.slice(0, 80), 26, y + 11); y += 17; } g.globalAlpha = 1;
  };
  /* ----- side panels (html: crisp text) ----- */
  const esc = CRUI.esc;
  const renderSides = () => {
    if (!G || !G.p) return; const p = G.p, c = CBYID[G.hero], fxs = Object.keys(p.fx).filter(k => p.fx[k] > 0);
    const left = `<div class="ct-hd"><img src="${CR.spriteUrl(c)}"><div><b>${esc(c.n)}</b><br><span class="cb-sub">${esc(themeOf(G.floor).n)} · ét. ${G.floor}/${G.len}</span></div></div>`
      + `<h4>Statistiques</h4><div class="ct-st"><span>Vie</span><b>${(p.hp / 2).toFixed(1).replace('.0', '')} / ${p.maxhp / 2}</b><span>Dégâts</span><b>${p.dmg.toFixed(1)}</b><span>Cadence</span><b>${(1 / p.delay).toFixed(1)} /s</b><span>Vitesse</span><b>${Math.round(p.speed)}</b><span>Portée</span><b>${Math.round(p.range)}</b><span>Vit. des tirs</span><b>${Math.round(p.shotSpd)}</b><span>Chance</span><b>${p.luck}</b><span>Esquive</span><b>${Math.round(p.dodge * 100)} %</b><span>Tirs</span><b>${p.shots}</b><span>Satellites</span><b>${p.orbit}</b><span>Pièces</span><b>${p.coins}</b></div>`
      + `<h4>Effets des tirs</h4><div class="ct-fx">${fxs.length ? fxs.map(k => `<i>${FX_NAME[k]} ${Math.round(procChance(p, k) * 100)} %</i>`).join('') : '<span class="cb-sub">aucun</span>'}</div>`
      + `<h4>Synergies</h4><div class="ct-fx">${G.syn.size ? [...G.syn].map(id => { const s = SYN.find(x => x.id === id); return `<i title="${esc(s.d)}" style="color:#ffd07a">${esc(s.n)}</i>`; }).join('') : '<span class="cb-sub">aucune</span>'}</div>`
      + (p.act ? `<h4>Objet actif</h4><div class="ct-hd"><img src="${itemIconUrl(ITEM_BY[p.act.id])}" style="width:36px;height:36px"><div><b>${esc(ITEM_BY[p.act.id].n)}</b><br><span class="cb-sub">${p.act.charge}/${p.act.max} · Espace${padOn ? ' / A' : ''}</span></div></div>` : '');
    const right = `<h4>Objets (${G.items.length})</h4><div class="ct-grid">${G.items.map(id => { const it = ITEM_BY[id]; return `<img class="ct-ic" src="${itemIconUrl(it)}" title="${esc(it.n + ' — ' + it.d)}">`; }).join('') || '<span class="cb-sub" style="grid-column:1/-1">Aucun objet pour l\'instant</span>'}</div>`
      + `<h4>Partie</h4><div class="ct-st"><span>Ennemis tués</span><b>${G.kills}</b><span>Salles vidées</span><b>${G.roomClears}</b><span>Temps</span><b>${Math.floor(G.time / 60)}:${String(Math.floor(G.time % 60)).padStart(2, '0')}</b></div>`
      + (() => { const e = G.e.filter(k => !k.dead && !k.hidden).slice(0, 4); return e.length ? `<h4>Ennemis</h4>` + e.map(k => `<div class="cb-sub"><b style="color:#fff">${esc(k.c.n)}</b> · ${esc((ATK_NAME[k.atk[0]] || ''))}${k.tr ? ' · <span style="color:' + TRAITS[k.tr][1] + '">' + TRAITS[k.tr][0] + '</span>' : ''}</div>`).join('') : ''; })();
    const sig = left + '|' + right; if (sig === sideSig) return; sideSig = sig; inL.innerHTML = left; inR.innerHTML = right;
  };
  let sideT = 0;
  /* ----- loop ----- */
  const frame = ts => {
    raf = requestAnimationFrame(frame);
    if (!view.isConnected) { cancelAnimationFrame(raf); raf = 0; return; }
    const dt = Math.min(.05, (ts - last) / 1000 || .016); last = ts;
    pollPad();
    if (pd && pd.pstart) { if (screen === 'play') pause(); else if (screen === 'pause') { closeOv(); screen = 'play'; } }
    if (ov && pd) padMenu();
    toastq.forEach(t => t.t -= dt); toastq = toastq.filter(t => t.t > 0);
    if (screen === 'play' && G && !G.over) { try { update(dt); } catch (e) { console.error(e); } }
    if (G && (screen === 'play' || screen === 'pause' || screen === 'end')) draw(); else if (!G) { g.fillStyle = '#0a0418'; g.fillRect(0, 0, CW, CH); }
    sideT -= dt; if (sideT <= 0) { sideT = .15; if (G && screen !== 'menu') renderSides(); else if (!G && sideSig) { sideSig = ''; inL.innerHTML = inR.innerHTML = ''; } }
  };
  /* ----- screens ----- */
  const backMenu = () => { screen = 'menu'; showMenu(); };
  const showMenu = () => {
    screen = 'menu'; const o = overlay(); if (G && G.over) G = null;
    o.append(CRUI.el('h2', null, 'Catacombes'), CRUI.el('div', 'ct-info', `Descends 6 à 8 étages dont les décors changent à chaque partie (cimetière, marais, désert, sanctuaire, cité mécanique, cristal, cieux…) avec les créatures du Bestiaire : chacune a son déplacement, son attaque et parfois un trait.<br>Âmes : <b style="color:#c070ff">${doc.souls}</b> · Parties : ${doc.stats.runs} · Victoires : ${doc.stats.wins} · Meilleur étage : ${doc.stats.best}`));
    const m = CRUI.el('div', 'ct-menu'), canResume = doc.run && doc.run.ver === 2 && CBYID[doc.run.hero];
    if (canResume) m.append(btn('Reprendre la partie (étage ' + doc.run.floor + ')', () => { closeOv(); resumeRun(); screen = 'play'; }, 'main'));
    m.append(btn('Nouvelle partie', showHeroSelect, canResume ? '' : 'main'), btn('Sanctuaire (héros)', () => showSanctuary()), btn('Objets et synergies', showCodex), btn('Bestiaire des attaques', showAttacks), btn('Succès', showAch), btn('Statistiques', showStats), btn(doc.mute ? 'Son : coupé' : 'Son : activé', () => { doc.mute = !doc.mute; save(); showMenu(); }));
    o.append(m);
  };
  const heroCard = (c, o = {}) => { const hs = heroStats(c), b = CRUI.el('button', 'ct-hero' + (o.on ? ' on' : '') + (o.lock ? ' lock' : '')); b.style.setProperty('--rc', CR.RARITIES[CR.RK[c.r]].col); b.append(CRUI.el('i', 'rs'), CRUI.img(c, 2), CRUI.el('b', null, CRUI.esc(c.n)), CRUI.el('span', 'cb-sub', o.lock ? SOUL_COST[CR.RK[c.r]] + ' âmes' : '♥' + hs.hearts + ' ⚔' + hs.dmg.toFixed(1))); return b; };
  const showHeroSelect = () => {
    let sel = doc.heroes.includes(doc.lastHero) ? doc.lastHero : doc.heroes[0], filter = '';
    const o = overlay(); o.append(CRUI.el('h2', null, 'Choisis ton héros'));
    const info = CRUI.el('div', 'ct-info'), list = CRUI.el('div', 'ct-heroes'), q = CRUI.el('input', 'cb-in'); q.placeholder = 'Chercher un héros…'; q.oninput = () => { filter = q.value.toLowerCase(); draw2(); };
    const upd = () => { const c = CBYID[sel], hs = heroStats(c), bh = behaviour(c); info.innerHTML = `<b>${CRUI.esc(c.n)}</b> ${CRUI.typeChips(c)} ${CRUI.rarBadge(c.r)}<br>${hs.hearts} cœurs · dégâts ${hs.dmg.toFixed(1)} · cadence ${(1 / hs.delay).toFixed(1)}/s · vitesse ${hs.speed} · esquive ${Math.round(hs.dodge * 100)} %<br>Départ : <b>${FX_NAME[TYPE_FX[c.t]]}</b> (tirs ${FX_NAME[TYPE_FX[c.t]].toLowerCase()}).`; };
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
    const o = overlay(); o.append(CRUI.el('h2', null, 'Objets et synergies (' + ITEMS.length + ')'));
    const q = CRUI.el('input', 'cb-in'); q.placeholder = 'Chercher un objet…'; const l = CRUI.el('div', 'ct-list');
    const draw2 = () => { l.innerHTML = ''; const f = q.value.toLowerCase(); ITEMS.filter(it => !f || it.n.toLowerCase().includes(f) || it.d.toLowerCase().includes(f)).slice(0, 120).forEach(it => { const un = unlocked(it), r = CRUI.el('div', 'ct-it' + (un ? '' : ' lock')); r.innerHTML = `<img src="${itemIconUrl(it)}" style="${un ? '' : 'filter:brightness(0)'}"><div><b>${un ? CRUI.esc(it.n) : '???'}</b><br><span class="cb-sub">${un ? CRUI.esc(it.d) : 'Débloqué par un succès : ' + (ACH[it.lock]?.[0] || '')}</span></div>`; l.append(r); });
      const h = CRUI.el('div', 'cb-h', 'Synergies'); h.style.margin = '8px 0 2px'; l.append(h);
      SYN.forEach(s => { const r = CRUI.el('div', 'ct-it'); r.innerHTML = `<i style="background:#ff5ad9">+</i><div><b>${CRUI.esc(s.n)}</b><br><span class="cb-sub">${CRUI.esc(s.d)}</span></div>`; l.append(r); }); };
    q.oninput = draw2; draw2(); o.append(q, l, btn('Retour', showMenu));
  };
  const showAttacks = () => {
    const o = overlay(); o.append(CRUI.el('h2', null, 'Attaques et traits des ennemis')); const l = CRUI.el('div', 'ct-list');
    const desc = { feu: 'Éventail de boules de feu qui laissent des flammes', eau: 'Rafale rapide d\'éclaboussures', plante: 'Graines lentes qui font pousser des épines', foudre: 'Colonnes de foudre annoncées au sol', glace: 'Anneau de glace qui ralentit', roche: 'Rocher qui tombe sur toi après un avertissement', vent: 'Tourbillon de tirs en spirale', ombre: 'Disparaît, réapparaît près de toi et tire', lumiere: 'Rayon annoncé puis salve ultra rapide', poison: 'Nuages toxiques qui persistent', acier: 'Balles rapides qui rebondissent', esprit: 'Orbes lents qui te suivent' };
    Object.entries(ATK_NAME).forEach(([k, n]) => { const r = CRUI.el('div', 'ct-it'); r.innerHTML = `<i style="background:${CRUI.typeCol(k)}">${CR.TYPES[k].icon}</i><div><b>${CRUI.esc(n)}</b> · ${CR.TYPES[k].n}<br><span class="cb-sub">${CRUI.esc(desc[k])}</span></div>`; l.append(r); });
    const h = CRUI.el('div', 'cb-h', 'Traits'); h.style.margin = '8px 0 2px'; l.append(h);
    const td = { armor: 'Subit 35 % de dégâts en moins', swift: 'Se déplace plus vite', regen: 'Récupère de la vie', splitter: 'Se divise en deux à sa mort', bomber: 'Explose à sa mort', berserk: 'Plus rapide et plus agressif sous 40 % de vie', summoner: 'Invoque de petits renforts' };
    Object.entries(TRAITS).forEach(([k, [n, c]]) => { const r = CRUI.el('div', 'ct-it'); r.innerHTML = `<i style="background:${c}">!</i><div><b>${n}</b><br><span class="cb-sub">${td[k]}</span></div>`; l.append(r); });
    const h2 = CRUI.el('div', 'cb-h', 'Déplacements'); h2.style.margin = '8px 0 2px'; l.append(h2);
    [['hop', 'Bonds'], ['chase', 'Poursuite'], ['charge', 'Charge après préparation'], ['flyer', 'Vol à distance'], ['weave', 'Ondulation'], ['swarm', 'Essaim'], ['ghost', 'Fantôme (traverse les murs)'], ['turret', 'Tourelle'], ['orbit', 'Tourne autour de toi'], ['sprint', 'Arrêts et sprints'], ['dash', 'Fonce puis tire'], ['skitter', 'Mouvements erratiques'], ['patrol', 'Patrouille et rebondit'], ['guard', 'Garde son territoire'], ['swoop', 'Pique depuis les airs'], ['teleport', 'Se téléporte'], ['burrow', 'Creuse et surgit sous tes pieds'], ['tri', 'Garde ses distances']].forEach(([k, n]) => { const r = CRUI.el('div', 'ct-it'); r.innerHTML = `<i style="background:#5b4a8c;color:#fff">→</i><div><b>${n}</b></div>`; l.append(r); });
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
    o.append(CRUI.el('div', 'ct-info', `${CRUI.esc(CBYID[G.hero].n)} · étage ${G.floor}/${G.len} · ${G.kills} ennemis · ${G.items.length} objets · ${Math.floor(G.time / 60)} min<br><b style="color:#c070ff">+${G.souls} âmes</b> (total ${doc.souls})`));
    const items = CRUI.el('div', 'ct-row'); items.style.maxWidth = '560px'; G.items.forEach(id => { const i = document.createElement('img'); i.src = itemIconUrl(ITEM_BY[id]); i.title = ITEM_BY[id].n; i.style.cssText = 'width:30px;height:30px;image-rendering:pixelated'; items.append(i); }); o.append(items);
    const m = CRUI.el('div', 'ct-menu'); m.append(btn('Rejouer', () => { closeOv(); newRun(G.hero); screen = 'play'; }, 'main'), btn('Menu', () => { G = null; showMenu(); })); o.append(m);
  };
  const pause = () => { if (screen !== 'play') return; screen = 'pause'; const o = overlay('clear'); o.append(CRUI.el('h2', null, 'Pause')); const m = CRUI.el('div', 'ct-menu'); m.append(btn('Reprendre', () => { closeOv(); screen = 'play'; }, 'main'), btn('Sauvegarder et quitter', () => { saveRun(); save(true); G = null; showMenu(); }), btn('Abandonner la partie', () => { G.over = true; endRun(false); })); o.append(m); };
  /* ----- inputs ----- */
  const onKey = (e, down) => {
    if (!view.isConnected) return; const t = e.target; if (/INPUT|SELECT|TEXTAREA/.test(t.tagName)) return;
    const map = { KeyW: 'KeyW', KeyA: 'KeyA', KeyS: 'KeyS', KeyD: 'KeyD', ArrowUp: 'ArrowUp', ArrowDown: 'ArrowDown', ArrowLeft: 'ArrowLeft', ArrowRight: 'ArrowRight' };
    if (map[e.code]) { if (!down || screen === 'play') keys[map[e.code]] = down; if (screen === 'play') e.preventDefault(); }
    if (down && e.code === 'Space' && screen === 'play') { e.preventDefault(); usePlayerAct(); }
    if (down && (e.code === 'ShiftLeft' || e.code === 'ShiftRight') && screen === 'play' && !e.repeat) { e.preventDefault(); playerDash(); }
    if (down && e.code === 'Escape') { if (screen === 'play') pause(); else if (screen === 'pause') { closeOv(); screen = 'play'; } }
    if (down && e.code === 'KeyM') { doc.mute = !doc.mute; save(); announce(doc.mute ? 'Son coupé' : 'Son activé'); }
  };
  const kd = e => onKey(e, true), ku = e => onKey(e, false);
  document.addEventListener('keydown', kd); document.addEventListener('keyup', ku);
  const mp = e => { const r = cv.getBoundingClientRect(); mouse.x = (e.clientX - r.left) / r.width * CW - WALL; mouse.y = (e.clientY - r.top) / r.height * CH - HUD - WALL; };
  cv.onmousemove = mp; cv.onmousedown = e => { mp(e); mouse.down = true; }; window.addEventListener('mouseup', () => mouse.down = false);
  cv.oncontextmenu = e => e.preventDefault();
  const blur = () => { for (const k of Object.keys(keys)) delete keys[k]; mouse.down = false; if (screen === 'play') pause(); }; window.addEventListener('blur', blur);
  ctx.onClose?.(() => { document.removeEventListener('keydown', kd); document.removeEventListener('keyup', ku); window.removeEventListener('blur', blur); window.removeEventListener('resize', fit); cancelAnimationFrame(raf); raf = 0; if (G && !G.over) saveRun(); save(true); });
  // the sound switch is checked at each beep
  const _b = SFX; for (const k of Object.keys(_b)) { const f = _b[k]; _b[k] = (...a) => { if (!doc.mute) f(...a); }; }
  if (globalThis.__catTest) globalThis.__catTest = { get G() { return G; }, setSeq: a => { THEME_SEQ = a; }, nThemes: THEMES.length, doc, newRun, update, draw, enterFloor, loadRoom, takeItem, ITEMS, SYN, makeFloor, makeLayout, killEnemy, hurt, set screen(v) { screen = v; }, get screen() { return screen; }, resumeRun, saveRun, CBYID, roomCleared, usePlayerAct, heroStats, checkAch, keys, solidAt, behaviour, makeEnemy, ATTACKS, THEMES, renderBg, itemIcon, renderSides, doAttack, playerDash, spawnGroup, TEMPLATES };
  setHelp(); raf = requestAnimationFrame(frame);
  showMenu();
}
