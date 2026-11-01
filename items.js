/* ---------- items: 38 hand-made ones + 22 objects x 21 qualities = about 500, each with its own pixel icon ---------- */
// 12 x 12 pixel art: o outline, b base, h highlight, d shade, a accent, w white
const ICON_ART = {
  potion: ['....oooo....', '....oaao....', '.....oo.....', '....obbo....', '...obhbbo...', '..obhbbbbo..', '..obbbbbdo..', '..obbbbbdo..', '..obbbbddo..', '...obddddo..', '....oooo....', '............'],
  ring: ['....oooo....', '...oaaaao...', '...oahho....', '..ob....bo..', '.obh....dbo.', '.ob......do.', '.ob......do.', '.obb....ddo.', '..obb..ddo..', '...obbddo...', '....oooo....', '............'],
  gem: ['............', '...oooooo...', '..ohhbbbbo..', '.ohhwbbbddo.', '.obbbbbbddo.', '..obbbbddo..', '...obbddo...', '....obdo....', '.....oo.....', '............', '............', '............'],
  star: ['.....oo.....', '.....oo.....', '....obbo....', 'oooobhbboooo', 'obhhbbbbbddo', '.obbbbbbddo.', '..obbbbddo..', '..obbbbddo..', '.obbdoobddo.', '.obdo..obdo.', '..oo....oo..', '............'],
  orb: ['....oooo....', '..ooabbaoo..', '.oahhbbbbdo.', '.ohwbbbbbdo.', 'obbbbbbbbddo', 'obbbbbbbbddo', 'obbbbbbbdddo', '.obbbbbbddo.', '.oddbbbdddo.', '..oodddddoo.', '....oooo....', '...oddddo...'],
  book: ['..oooooooo..', '.obbbbbbbbdo', '.obaaaabbbdo', '.obaooabbbdo', '.obaaaabbbdo', '.obbbbbbbbdo', '.obbbbbbbbdo', '.obbbbbbbbdo', '.obbbbbbbbdo', '.owwwwwwwwdo', '..oooooooo..', '............'],
  scroll: ['.oooooooooo.', 'obwwwwwwwwdo', 'obdoooooooo.', '.owwwwwwwdo.', '.owdddddwdo.', '.owwwwwwwdo.', '.owdddddwdo.', '.owwwwwwwdo.', '.owddddwwdo.', 'oooooooodwbo', 'obwwwwwwwwdo', '.oooooooooo.'],
  dagger: ['.........oo.', '........ohbo', '.......ohbdo', '......ohbdo.', '.....ohbdo..', '....ohbdo...', '..oohbdo....', '..obodo.....', '.obaoo......', 'obado.......', 'oaoo........', '.oo.........'],
  shield: ['.oooooooooo.', 'obbbbhhbbbdo', 'obbbhhbbbbdo', 'obbhaaaabbdo', 'obbaaaaaabdo', 'obbhaaaabbdo', '.obbbhhbbbdo', '.obbbbbbbdo.', '..obbbbbddo.', '...obbbddo..', '....obddo...', '.....oo.....'],
  boot: ['..oooooo....', '.obbbbbdo...', '.obhbbbdo...', '.obbbbbdo...', '.obbbbbdo...', '.obbbbbdoooo', '.obbbbbbbbbo', 'oobbbbbbbbdo', 'obbbbbbbbddo', 'oaaaaaaaaaao', 'oooooooooooo', '............'],
  crown: ['............', 'o...o..o...o', 'oo.obo.obo.o', 'oboobbo.oobo', 'obbbbbbbbbdo', 'obhhbbbbbbdo', 'obbbaabaabdo', 'obbbbbbbbbdo', 'obbbbbbbbddo', '.oooooooooo.', '............', '............'],
  feather: ['.........oo.', '........oboo', '.......ohbbo', '......ohbbdo', '.....ohbbdo.', '....ohbbdo..', '...ohbbdo...', '..ohbbdo....', '.obbdoo.....', 'oadoo.......', 'oo..........', '............'],
  tooth: ['.oooooooooo.', 'owwwwwwwwwwo', 'owwhwwwwwddo', '.owwwwwwwdo.', '.owwwwwwwdo.', '.owwwwwwddo.', '..owwwwwddo.', '..owwwwddo..', '...owwwddo..', '...owwddo...', '....owdo....', '.....oo.....'],
  eye: ['............', '...oooooo...', '.ooaaaaaaoo.', 'oawwwwwwwwao', 'owwwbbbbwwdo', 'owwbbooobwdo', 'owwbboowbwdo', 'owwwbbbbwwdo', 'oadwwwwwwdao', '.ooaaaaaaoo.', '...oooooo...', '............'],
  heart: ['............', '..oooo.oooo.', '.ohhbboobbdo', 'ohhwbbbbbbdo', 'obbbbbbbbbdo', 'obbbbbbbbddo', '.obbbbbbbdo.', '..obbbbbddo.', '...obbbddo..', '....obddo...', '.....odo....', '......o.....'],
  key: ['..oooo......', '.obhhbo.....', 'obo..obo....', 'obo..obo....', '.obbbbo.....', '...obdo.....', '...obdo.....', '...obdooo...', '...obdbdo...', '...obdoo....', '...obdbdo...', '....oooo....'],
  bell: ['.....oo.....', '....oaao....', '...obhbbo...', '..obhbbbdo..', '..obbbbbdo..', '..obbbbbdo..', '.obbbbbbbdo.', '.obbbbbbbdo.', 'obbbbbbbbddo', 'oooooooooooo', '....oaao....', '.....oo.....'],
  mask: ['.oooooooooo.', 'obhhbbbbbbdo', 'obbbbbbbbbdo', 'obooooobooo.', 'obowwoowwodo', 'obooooobooo.', 'obbbbbbbbbdo', '.obbbaabbdo.', '..obbaabbdo.', '...obbbddo..', '....oooooo..', '............'],
  lantern: ['....oooo....', '...obaao....', '..oooooooo..', '.obbhhhhbdo.', '.obhyyyyhdo.', '.obyywwyydo.', '.obyywwyydo.', '.obhyyyyhdo.', '.obbhhhhbdo.', '..oooooooo..', '...obaabdo..', '....oooo....'],
  mushroom: ['...oooooo...', '..obhhhhbo..', '.obwhbbwbbdo', 'obbbbbbbbbdo', 'obwwbbbwwbdo', 'obbbbbbbbddo', '.oooowwoooo.', '....owwdo...', '....owwdo...', '....owwdo...', '...owwwwdo..', '...oooooo...'],
  bone: ['.oo......oo.', 'owwo....owwo', 'owwwo..owwwo', '.owwwoowwwo.', '..owwwwwwo..', '...owwwwdo..', '..owwwwwwdo.', '.owwwoowwwdo', 'owwwo..owwdo', 'owwo....odwo', '.oo......oo.', '............'],
  rune: ['..oooooooo..', '.obbbbbbbbdo', 'obbbhaabbbdo', 'obbbhaabbbdo', 'obbhaaaabbdo', 'obbbhaabbbdo', 'obbbaaaaabdo', 'obbaabbaabdo', 'obbbbbbbbbdo', 'obbbbbbbbddo', '.oddddddddo.', '..oooooooo..'],
};
// 5 x 5 emblems, drawn at the bottom right of the icon
const EMB_ART = {
  flame: ['..a..', '.aaa.', 'aaaaa', 'awaaa', '.aaa.'], snow: ['a.a.a', '.aaa.', 'aaaaa', '.aaa.', 'a.a.a'], drop: ['..a..', '.aaa.', 'aaaaa', 'aaaaa', '.aaa.'],
  bolt: ['..aa.', '.aa..', 'aaaaa', '..aa.', '.aa..'], burst: ['a.a.a', '.aaa.', 'aawaa', '.aaa.', 'a.a.a'], fork: ['a...a', '.a.a.', '..a..', '..a..', '..a..'],
  bounce: ['aaa..', 'a..a.', '...a.', '.aaa.', 'a.a..'], arrow: ['..a..', '.aaa.', 'a.a.a', '..a..', '..a..'], target: ['.aaa.', 'a...a', 'a.w.a', 'a...a', '.aaa.'],
  fang: ['a...a', 'aa.aa', 'aaaaa', '.aaa.', '..a..'], sword: ['....a', '...aa', 'a.aa.', '.aa..', 'aa...'], clock: ['.aaa.', 'a.a.a', 'a.aaa', 'a...a', '.aaa.'],
  wing: ['aa...', 'aaaa.', 'aaaaa', '.aaaa', '..aa.'], plus: ['..a..', '..a..', 'aaaaa', '..a..', '..a..'], range: ['a...a', '.a.a.', '..a..', '.a.a.', 'a...a'],
  clover: ['.a.a.', 'aaaaa', '..a..', 'aaaaa', '.a.a.'], dots: ['aa.aa', 'aa.aa', '.....', 'aa.aa', 'aa.aa'], chevron: ['a.a.a', '.a.a.', 'a.a.a', '.a.a.', 'a.a.a'],
  ghost: ['.aaa.', 'aaaaa', 'a.a.a', 'aaaaa', 'a.a.a'], coin: ['.aaa.', 'aawaa', 'aaaaa', 'aaaaa', '.aaa.'], magnet: ['aa.aa', 'aa.aa', 'aa.aa', 'aaaaa', '.aaa.'],
};
const hsl2 = (h, s, l) => { h = ((h % 360) + 360) % 360; s /= 100; l /= 100; const k = n => (n + h / 30) % 12, a = s * Math.min(l, 1 - l), f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1))); return '#' + [f(0), f(8), f(4)].map(v => Math.round(v * 255).toString(16).padStart(2, '0')).join(''); };
const iconCache = new Map();
const itemIcon = it => {   // a 12 x 12 canvas, shown scaled with image-rendering:pixelated
  const k = it.id; let cv = iconCache.get(k); if (cv) return cv;
  const { shape, hue, emb } = it.ico, art = ICON_ART[shape] || ICON_ART.gem;
  // 16 x 16: a plate (frame colour = tier) holding the 12 x 12 object, a particle aura in the accent colour, sparkles on the best ones
  cv = document.createElement('canvas'); cv.width = cv.height = 16; const g2 = cv.getContext('2d'), tier = it.t || 1, OFF = 2;
  const frame = ['', '#6f9fb8', '#b070f0', '#ffcf6a'][tier], dk = hsl2(hue, 35, 11), lt = hsl2(hue, 38, 20);
  g2.fillStyle = frame; g2.fillRect(0, 0, 16, 16); g2.fillStyle = dk; g2.fillRect(1, 1, 14, 14); g2.fillStyle = lt; g2.fillRect(1, 1, 14, 2); g2.fillRect(1, 1, 2, 14);
  g2.clearRect(0, 0, 1, 1); g2.clearRect(15, 0, 1, 1); g2.clearRect(0, 15, 1, 1); g2.clearRect(15, 15, 1, 1);
  g2.fillStyle = hsl2(hue, 40, 7); g2.fillRect(2, 13, 12, 1); g2.fillRect(13, 2, 1, 12);
  let h = 0; for (const ch of it.id) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const acc = hsl2(hue + 30, 90, 64); g2.fillStyle = acc;
  for (let i = 0; i < 4; i++) { h = (h * 1103515245 + 12345) >>> 0; g2.globalAlpha = .55; g2.fillRect(2 + (h >> 8) % 12, 2 + (h >> 16) % 12, 1, 1); } g2.globalAlpha = 1;
  const col = { o: hsl2(hue, 40, 9), b: hsl2(hue, 62, 50), h: hsl2(hue, 70, 74), d: hsl2(hue, 58, 30), a: hsl2(hue + 150, 72, 60), w: '#f6f0ff', y: '#ffe08a' };
  art.forEach((row, y) => { for (let x = 0; x < 12; x++) { const ch = (row[x] || '.'); if (ch !== '.') { g2.fillStyle = col[ch] || col.b; g2.fillRect(x + OFF, y + OFF, 1, 1); } } });
  const e = EMB_ART[emb];
  if (e) { g2.fillStyle = hsl2(hue, 40, 9); g2.fillRect(OFF + 6, OFF + 6, 6, 6); const ec = { a: hsl2(hue + 30, 90, 62), w: '#fff' }; e.forEach((row, y) => { for (let x = 0; x < 5; x++) { const ch = row[x]; if (ch !== '.') { g2.fillStyle = ec[ch]; g2.fillRect(OFF + 6 + x, OFF + 6 + y, 1, 1); } } }); }
  if (tier === 3) { g2.fillStyle = '#fff'; for (const [x, y] of [[2, 2], [13, 3], [3, 12]]) { g2.fillRect(x, y, 1, 1); g2.fillRect(x - 1, y, 1, 1); g2.fillRect(x + 1, y, 1, 1); g2.fillRect(x, y - 1, 1, 1); g2.fillRect(x, y + 1, 1, 1); } }
  iconCache.set(k, cv); return cv;
};
const itemIconUrl = it => { const cv = itemIcon(it); return cv._u ||= cv.toDataURL(); };
/* qualities (21): the first ten give a shot effect, the others a stat */
const QUAL = [
  { k: 'ardent', m: 'ardent', f: 'ardente', hue: 14, emb: 'flame', d: 'Tirs enflammés', fx: 'burn' },
  { k: 'givre', m: 'givré', f: 'givrée', hue: 190, emb: 'snow', d: 'Tirs gelants', fx: 'freeze' },
  { k: 'venin', m: 'venimeux', f: 'venimeuse', hue: 285, emb: 'drop', d: 'Tirs empoisonnés', fx: 'poison' },
  { k: 'foudre', m: 'foudroyant', f: 'foudroyante', hue: 52, emb: 'bolt', d: 'Éclairs en chaîne', fx: 'chain' },
  { k: 'bombe', m: 'explosif', f: 'explosive', hue: 30, emb: 'burst', d: 'Tirs explosifs', fx: 'explode' },
  { k: 'eclat', m: 'fragmenté', f: 'fragmentée', hue: 330, emb: 'fork', d: 'Tirs qui se divisent', fx: 'split' },
  { k: 'elastique', m: 'élastique', f: 'élastique', hue: 130, emb: 'bounce', d: 'Tirs rebondissants', fx: 'bounce' },
  { k: 'perce', m: 'perçant', f: 'perçante', hue: 210, emb: 'arrow', d: 'Tirs perforants', fx: 'pierce' },
  { k: 'traque', m: 'traqueur', f: 'traqueuse', hue: 270, emb: 'target', d: 'Tirs guidés', fx: 'homing' },
  { k: 'vampire', m: 'vampirique', f: 'vampirique', hue: 350, emb: 'fang', d: 'Vol de vie', fx: 'lifesteal' },
  { k: 'feroce', m: 'féroce', f: 'féroce', hue: 4, emb: 'sword', d: 'Dégâts +0,8', ap: p => p.dmg += .8 },
  { k: 'hatif', m: 'hâtif', f: 'hâtive', hue: 48, emb: 'clock', d: 'Tire plus vite', ap: p => p.delay *= .88 },
  { k: 'leger', m: 'léger', f: 'légère', hue: 160, emb: 'wing', d: 'Vitesse +18', ap: p => p.speed += 18 },
  { k: 'robuste', m: 'robuste', f: 'robuste', hue: 340, emb: 'plus', d: '+1 cœur', ap: p => { p.maxhp += 2; p.hp += 2; } },
  { k: 'lointain', m: 'lointain', f: 'lointaine', hue: 225, emb: 'range', d: 'Portée +80', ap: p => p.range += 80 },
  { k: 'chanceux', m: 'chanceux', f: 'chanceuse', hue: 120, emb: 'clover', d: 'Chance +2', ap: p => p.luck += 2 },
  { k: 'massif', m: 'massif', f: 'massive', hue: 25, emb: 'dots', d: 'Tirs plus gros, dégâts +0,4', ap: p => { p.size *= 1.18; p.dmg += .4; } },
  { k: 'vif', m: 'vif', f: 'vive', hue: 175, emb: 'chevron', d: 'Tirs plus rapides', ap: p => p.shotSpd += 70 },
  { k: 'spectral', m: 'spectral', f: 'spectrale', hue: 250, emb: 'ghost', d: 'Invulnérable plus longtemps après un coup', ap: p => p.iframes += .3 },
  { k: 'prospere', m: 'prospère', f: 'prospère', hue: 44, emb: 'coin', d: 'Plus de butin', ap: p => p.loot += .1 },
  { k: 'magnet', m: 'magnétique', f: 'magnétique', hue: 300, emb: 'magnet', d: 'Attire les pièces et les cœurs', ap: p => p.magnet = Math.max(p.magnet, 90) },
];
const NOUN = [
  ['fiole', 'Fiole', 'f', 'potion', 1, 'soigne ½ cœur', p => { p.hp = Math.min(p.maxhp, p.hp + 1); }],
  ['bague', 'Bague', 'f', 'ring', 1, 'chance +1', p => p.luck += 1],
  ['amulette', 'Amulette', 'f', 'gem', 2, 'esquive +2 %', p => p.dodge += .02],
  ['talisman', 'Talisman', 'm', 'star', 2, 'chance +1, dégâts +0,1', p => { p.luck += 1; p.dmg += .1; }],
  ['cristal', 'Cristal', 'm', 'gem', 1, 'dégâts +0,2', p => p.dmg += .2],
  ['orbe', 'Orbe', 'm', 'orb', 2, 'tirs plus rapides', p => p.shotSpd += 30],
  ['grimoire', 'Grimoire', 'm', 'book', 3, 'dégâts +0,3', p => p.dmg += .3],
  ['parchemin', 'Parchemin', 'm', 'scroll', 1, 'portée +40', p => p.range += 40],
  ['dague', 'Dague', 'f', 'dagger', 2, 'dégâts +0,25', p => p.dmg += .25],
  ['bouclier', 'Bouclier', 'm', 'shield', 2, '+½ cœur', p => { p.maxhp += 1; p.hp += 1; }],
  ['botte', 'Botte', 'f', 'boot', 1, 'vitesse +10', p => p.speed += 10],
  ['couronne', 'Couronne', 'f', 'crown', 3, 'butin +5 %', p => p.loot += .05],
  ['plume', 'Plume', 'f', 'feather', 1, 'cadence +3 %', p => p.delay *= .97],
  ['croc', 'Croc', 'm', 'tooth', 1, 'dégâts +0,15', p => p.dmg += .15],
  ['oeil', 'Œil', 'm', 'eye', 2, 'portée +30', p => p.range += 30],
  ['cle', 'Clé', 'f', 'key', 1, 'invulnérabilité +0,05 s', p => p.iframes += .05],
  ['cloche', 'Cloche', 'f', 'bell', 1, 'aimant +20', p => p.magnet += 20],
  ['masque', 'Masque', 'm', 'mask', 2, 'esquive +1 %, dégâts +0,1', p => { p.dodge += .01; p.dmg += .1; }],
  ['lanterne', 'Lanterne', 'f', 'lantern', 2, 'portée +50', p => p.range += 50],
  ['champignon', 'Champignon', 'm', 'mushroom', 1, '+½ cœur, vitesse −3', p => { p.maxhp += 1; p.hp += 1; p.speed -= 3; }],
  ['os', 'Os', 'm', 'bone', 1, 'dégâts +0,1, cadence +2 %', p => { p.dmg += .1; p.delay *= .98; }],
  ['rune', 'Rune', 'f', 'rune', 3, 'chance +1, butin +3 %', p => { p.luck += 1; p.loot += .03; }],
];
/* hand-made items: icons */
const HAND_ICO = { coeur: ['heart', 350, 'plus'], sang: ['potion', 0, 'sword'], cafe: ['potion', 28, 'clock'], bottes: ['boot', 160, 'wing'], lentille: ['eye', 210, 'range'], trefle: ['rune', 120, 'clover'], balle: ['orb', 25, 'dots'], armure: ['shield', 200, 'plus'], aimant: ['bell', 300, 'magnet'], furie: ['tooth', 4, 'flame'], regen: ['mushroom', 130, 'plus'], jumelles: ['eye', 200, 'dots'], trident: ['dagger', 185, 'chevron'],
  brasier: ['gem', 14, 'flame'], givre: ['gem', 190, 'snow'], venin: ['potion', 285, 'drop'], foudre: ['orb', 52, 'bolt'], poudre: ['orb', 30, 'burst'], echo: ['star', 330, 'fork'], rebond: ['orb', 130, 'bounce'], aiguille: ['dagger', 210, 'arrow'], chasseur: ['eye', 270, 'target'], croc: ['tooth', 350, 'fang'],
  satellite: ['orb', 190, 'ghost'], ecu: ['shield', 45, 'plus'], epines: ['crown', 100, 'sword'], fantome: ['mask', 250, 'ghost'], chance: ['ring', 44, 'coin'], banquet: ['mushroom', 20, 'plus'], tourbillon: ['star', 160, 'burst'], eclair: ['boot', 55, 'bolt'], nova: ['star', 30, 'burst'], elixir: ['potion', 340, 'plus'] };
const buildItems = hand => {
  const items = hand.map(i => { const h = HAND_ICO[i.id] || ['gem', 270, null]; return { ...i, ico: { shape: h[0], hue: h[1], emb: h[2] } }; });
  for (const q of QUAL) for (const nn of NOUN) {
    const [nk, nm, ng, shape, tier, nd, nap] = nn, name = nm + ' ' + (ng === 'f' ? q.f : q.m);
    const it = { id: 'g_' + nk + '_' + q.k, n: name, d: q.d + ' · ' + nd, t: tier, gen: 1, ico: { shape, hue: q.hue, emb: q.emb } };
    if (q.fx) it.fx = q.fx;
    it.ap = p => { q.ap?.(p); nap(p); };
    items.push(it);
  }
  return items;
};
