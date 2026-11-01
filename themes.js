/* ---------- floors: five themes, each with its own floor, walls, rocks, holes, doors, torches and ambient particles ---------- */
const THEMES = [
  { n: 'La Crypte', floor: ['#2b2347', '#251d40'], grout: '#171030', wall: ['#4a3d7a', '#3a2f63', '#6a5aa6'], deco: 'bones', rock: 'stone', hole: 'pit', part: 'dust', pc: '#a99bd6', torch: '#ffb347', glow: '#6a4fb8', rockC: ['#6a5a9a', '#8a78c4', '#3f3366'] },
  { n: 'La Fournaise', floor: ['#3a2420', '#2f1c19'], grout: '#1a0d0b', wall: ['#5a3128', '#472620', '#7a4638'], deco: 'embers', rock: 'obsidian', hole: 'lava', part: 'ember', pc: '#ff9a3c', torch: '#ff7a2a', glow: '#c0391b', rockC: ['#2c2030', '#5a4466', '#150d1a'] },
  { n: 'La Forêt maudite', floor: ['#1f3326', '#1a2c20'], grout: '#0f1a13', wall: ['#3b5a3a', '#2d472e', '#5a8a56'], deco: 'moss', rock: 'stump', hole: 'swamp', part: 'spore', pc: '#9cff7a', torch: '#a8ff6a', glow: '#3c9a4a', rockC: ['#6b4a2a', '#9a7040', '#3e2a16'] },
  { n: 'Les Glaciers', floor: ['#22385a', '#1c2f4d'], grout: '#10203a', wall: ['#4d78a8', '#3b6490', '#8bbbe8'], deco: 'frost', rock: 'ice', hole: 'icewater', part: 'snow', pc: '#e8f6ff', torch: '#9fe8ff', glow: '#4aa8e0', rockC: ['#8fcdf5', '#d8f2ff', '#4f90c4'] },
  { n: "L'Abîme", floor: ['#241437', '#1d102d'], grout: '#0e0618', wall: ['#5a2f7a', '#45235f', '#8a55b8'], deco: 'runes', rock: 'rune', hole: 'void', part: 'wisp', pc: '#ff5ad9', torch: '#ff5ad9', glow: '#b020b0', rockC: ['#4a2a6a', '#7a4aa8', '#25113a'] },
  { n: 'Le Cimetière', floor: ['#26302f', '#202928'], grout: '#121a19', wall: ['#3f4f4c', '#323f3d', '#5f7a75'], deco: 'graves', rock: 'stone', hole: 'pit', part: 'dust', pc: '#9fc4b8', torch: '#9fe8c8', glow: '#3f8f7a', rockC: ['#5f706c', '#8aa39c', '#38443f'] },
  { n: 'Les Marais', floor: ['#2b3319', '#242b15'], grout: '#141a0a', wall: ['#4f5a2a', '#3f4922', '#7a8a3c'], deco: 'moss', rock: 'stump', hole: 'swamp', part: 'spore', pc: '#d4e85a', torch: '#e0ff6a', glow: '#8aa020', rockC: ['#5a4a22', '#8a7436', '#33290f'] },
  { n: 'Le Désert des Pharaons', floor: ['#5a4526', '#4f3b20'], grout: '#2a1e0e', wall: ['#8a6a38', '#6f542c', '#c49a52'], deco: 'sand', rock: 'sandstone', hole: 'quicksand', part: 'dust', pc: '#f0d28a', torch: '#ffc04a', glow: '#d8902a', rockC: ['#b08a4a', '#dab070', '#7a5a2a'] },
  { n: 'Le Temple rouge', floor: ['#3a1f26', '#321a21'], grout: '#1a0b10', wall: ['#7a2a2f', '#5f2025', '#c04a4a'], deco: 'sakura', rock: 'lacquer', hole: 'pit', part: 'snow', pc: '#ffb0c8', torch: '#ff9a6a', glow: '#d83a4a', rockC: ['#8a2a2a', '#c04a3a', '#4a1414'] },
  { n: 'La Cité mécanique', floor: ['#2a2f3a', '#242832'], grout: '#12151c', wall: ['#4a5262', '#3a4150', '#8a96ac'], deco: 'gears', rock: 'iron', hole: 'pit', part: 'ember', pc: '#6ae0ff', torch: '#6ae0ff', glow: '#3a8ac0', rockC: ['#6a7488', '#9aa6bc', '#363d4c'] },
  { n: 'Le Palais de Cristal', floor: ['#2f2a5a', '#272350'], grout: '#14102e', wall: ['#5a4fa0', '#463c88', '#a08aff'], deco: 'frost', rock: 'ice', hole: 'void', part: 'wisp', pc: '#ff9af0', torch: '#b0f0ff', glow: '#8a5aff', rockC: ['#c08aff', '#f0d0ff', '#6a3ab0'] },
  { n: 'Les Cieux', floor: ['#3a4a78', '#324068'], grout: '#1c2644', wall: ['#8aa0d0', '#6f86b8', '#f0f4ff'], deco: 'runes', rock: 'stone', hole: 'sky', part: 'wisp', pc: '#ffe9a0', torch: '#fff0b0', glow: '#ffd060', rockC: ['#c8d4f0', '#f8fcff', '#8a9cc8'] },
];
/* chapters of two floors: each run picks one theme per chapter, so no two descents look alike */
const CHAPTERS = [[0, 5, 6], [2, 1, 7, 6], [3, 8, 9, 10], [4, 11, 12, 10]];
let THEME_SEQ = [0, 1, 2, 3];
function setThemeSeq(seed) { const R = CR.rng((seed ^ 0x7f4a7c15) >>> 0); THEME_SEQ = CHAPTERS.map(c => Math.min(c[Math.floor(R() * c.length)], THEMES.length - 1)); }
const themeOf = f => THEMES[THEME_SEQ[Math.min(THEME_SEQ.length - 1, (f - 1) >> 1)]];
const DOOR_ICON = {   // 7 x 7 emblems above the doors: what is behind
  treasure: ['..yyy..', '.yyyyy.', 'yyoyoyy', 'yyyyyyy', 'yoooooy', 'yyyyyyy', '.yyyyy.'], shop: ['..ggg..', '.gwwwg.', 'gwgggwg', 'gwwwwwg', 'gggwggg', '.gwwwg.', '..ggg..'],
  boss: ['.wwwww.', 'wwwwwww', 'wrwwwrw', 'wwwwwww', '.wwrww.', '.w.w.w.', '.......'], mini: ['r.....r', 'rr...rr', '.rrrrr.', '.rwrwr.', '.rrrrr.', '..rrr..', '.......'],
  wave: ['o.....o', '.o...o.', '..o.o..', '...o...', '..o.o..', '.o...o.', 'o.....o'], start: null, combat: null,
};
const DOOR_ICON_COL = { y: '#ffd45c', o: '#a06a10', g: '#5be37d', w: '#f3eaff', r: '#ff4f6d' };
/* a seeded background for each room: floor, decorations, walls, rocks, holes, spikes, vignette */
function renderBg(room, layout, floor) {
  const th = themeOf(floor), R = CR.rng((room.seed ^ 0xabc123) >>> 0), cv = document.createElement('canvas'); cv.width = CW; cv.height = RH + WALL * 2; const b = cv.getContext('2d');
  const px = (x, y, w, h, c, a = 1) => { b.globalAlpha = a; b.fillStyle = c; b.fillRect(Math.round(x), Math.round(y), w, h); b.globalAlpha = 1; };
  const rr = a => Math.floor(R() * a);
  // floor tiles
  for (let ty = 0; ty < ROWS; ty++) for (let tx = 0; tx < COLS; tx++) {
    const x = WALL + tx * TILE, y = WALL + ty * TILE; px(x, y, TILE, TILE, th.floor[(tx + ty) & 1]);
    px(x, y, TILE, 1, '#fff', .05); px(x, y, 1, TILE, '#fff', .05); px(x, y + TILE - 1, TILE, 1, th.grout, .8); px(x + TILE - 1, y, 1, TILE, th.grout, .8);
    for (let k = 0; k < 7; k++) px(x + 2 + rr(28), y + 2 + rr(28), 1 + rr(2), 1, R() < .5 ? '#000' : '#fff', .08);
    if (th.deco === 'bones' && R() < .13) { let cx = x + 6 + rr(18), cy = y + 6 + rr(18); for (let i = 0; i < 6; i++) { px(cx, cy, 2, 1, th.grout, .9); cx += rr(3) - 1 + 1; cy += rr(3) - 1; } }
    if (th.deco === 'embers' && R() < .2) { let cx = x + 4 + rr(8), cy = y + 4 + rr(8); for (let i = 0; i < 7; i++) { px(cx - 1, cy - 1, 4, 3, '#c0391b', .25); px(cx, cy, 2, 1, '#ff8a2a'); cx += 1 + rr(3); cy += rr(3) - 1; } }
    if (th.deco === 'moss' && R() < .35) { for (let i = 0; i < 3; i++) { const gx = x + 4 + rr(24), gy = y + 8 + rr(20); px(gx, gy, 1, 3, '#3f7a3a'); px(gx + 1, gy + 1, 1, 2, '#58a050'); px(gx - 1, gy + 1, 1, 2, '#2e5c2c'); } }
    if (th.deco === 'frost') { if (R() < .3) { px(x + 3 + rr(10), y + 3 + rr(10), 10, 1, '#fff', .18); px(x + 5 + rr(10), y + 5 + rr(10), 6, 1, '#fff', .12); } if (R() < .12) { let cx = x + 8 + rr(14), cy = y + 8 + rr(14); for (let i = 0; i < 6; i++) { px(cx, cy, 2, 1, '#fff', .35); cx += rr(3) - 1; cy += 1; } } }
    if (th.deco === 'sand' && R() < .3) { const cx = x + 3 + rr(20), cy = y + 6 + rr(20); px(cx, cy, 8, 1, '#fff', .15); px(cx + 2, cy + 2, 6, 1, '#000', .14); }
    if (th.deco === 'gears' && R() < .18) { const cx = x + 8 + rr(12), cy = y + 8 + rr(12); px(cx, cy, 8, 8, '#000', .22); px(cx + 2, cy + 2, 4, 4, th.pc, .25); px(cx + 3, cy - 1, 2, 10, '#000', .22); px(cx - 1, cy + 3, 10, 2, '#000', .22); }
    if (th.deco === 'sakura' && R() < .3) { px(x + 3 + rr(24), y + 3 + rr(24), 2, 2, th.pc, .55); px(x + 3 + rr(24), y + 3 + rr(24), 2, 1, th.pc, .4); }
    if (th.deco === 'runes' && R() < .16) { const gx = x + 9 + rr(8), gy = y + 8 + rr(8); for (let i = 0; i < 6; i++) px(gx + [0, 1, 2, 2, 1, 0][i] * 2, gy + i * 2, 2, 2, th.pc, .22); }
  }
  // scattered decoration
  const props = 8 + rr(8);
  for (let i = 0; i < props; i++) {
    const x = WALL + 6 + rr(RW - 12), y = WALL + 6 + rr(RH - 12), tx = Math.floor((x - WALL) / TILE), ty = Math.floor((y - WALL) / TILE); if (layout[ty]?.[tx]) continue;
    if (th.deco === 'bones') { px(x, y + 2, 7, 2, '#d8d0e8'); px(x - 1, y + 1, 2, 2, '#d8d0e8'); px(x + 6, y + 3, 2, 2, '#d8d0e8'); px(x, y + 4, 8, 1, '#000', .25); if (R() < .3) { px(x + 2, y - 5, 6, 5, '#e8e0f4'); px(x + 3, y - 3, 1, 1, '#1a1030'); px(x + 5, y - 3, 1, 1, '#1a1030'); } }
    else if (th.deco === 'embers') { px(x, y + 2, 6, 3, '#1a0d0b', .5); px(x + 1, y + 1, 4, 2, '#ff8a2a', .7); px(x + 2, y, 2, 1, '#ffe08a'); }
    else if (th.deco === 'moss') { px(x + 2, y + 4, 2, 4, '#e8e0c8'); px(x, y, 6, 4, ['#d84a4a', '#c070ff', '#e8c040'][rr(3)]); px(x + 1, y + 1, 1, 1, '#fff'); px(x + 4, y + 2, 1, 1, '#fff'); px(x - 1, y + 7, 8, 1, '#000', .25); }
    else if (th.deco === 'frost') { px(x, y + 3, 8, 3, '#fff', .55); px(x + 1, y + 2, 5, 1, '#fff', .7); if (R() < .4) { px(x + 3, y - 5, 2, 7, '#bfeaff'); px(x + 2, y - 3, 4, 3, '#9fd8ff'); px(x + 3, y - 5, 1, 2, '#fff'); } }
    else if (th.deco === 'graves') { px(x + 1, y + 2, 7, 8, '#7f938e'); px(x + 2, y, 5, 3, '#7f938e'); px(x + 3, y + 3, 3, 1, '#2c3836'); px(x + 4, y + 5, 1, 3, '#2c3836'); px(x - 1, y + 10, 10, 1, '#000', .3); }
    else if (th.deco === 'sand') { px(x, y + 4, 12, 3, '#c49a52'); px(x + 2, y + 2, 7, 2, '#dab070'); px(x + 3, y + 7, 8, 1, '#000', .2); if (R() < .3) { px(x + 3, y - 4, 2, 7, '#5a8a3c'); px(x + 1, y - 2, 2, 1, '#5a8a3c'); px(x + 5, y - 3, 2, 1, '#5a8a3c'); } }
    else if (th.deco === 'sakura') { px(x, y + 3, 3, 3, th.pc, .8); px(x + 3, y + 1, 3, 3, th.pc, .7); px(x + 2, y + 5, 3, 2, th.pc, .6); if (R() < .25) { px(x + 3, y - 6, 4, 1, '#3a1010'); px(x + 2, y - 5, 6, 5, '#d83a4a'); px(x + 4, y - 4, 2, 3, '#ffd45c'); px(x + 4, y - 1, 2, 3, '#3a1010'); } }
    else if (th.deco === 'gears') { px(x + 1, y + 1, 8, 8, '#4a5262'); px(x + 3, y + 3, 4, 4, '#12151c'); px(x + 4, y - 1, 2, 12, '#4a5262'); px(x - 1, y + 4, 12, 2, '#4a5262'); px(x + 4, y + 4, 2, 2, th.pc, .8); px(x, y + 10, 10, 1, '#000', .3); }
    else { px(x, y, 6, 6, th.pc, .12); px(x + 2, y + 1, 2, 4, th.pc, .55); px(x + 1, y + 2, 4, 2, th.pc, .55); }
  }
  // walls: bricks with a lit top edge, then soft shadows on the floor next to them
  const wallRect = (x, y, w, h) => {
    px(x, y, w, h, th.wall[1]);
    for (let r = 0; r * 8 < h; r++) { const off = (r % 2) * 8; for (let cx = -16; cx < w + 16; cx += 16) { const bx = x + cx + off; if (bx + 15 < x || bx > x + w) continue; const wx = Math.max(bx, x), ww = Math.min(bx + 15, x + w) - wx; if (ww > 0) { px(wx, y + r * 8, ww, 1, th.wall[2], .5); px(wx, y + r * 8 + 7, ww, 1, '#000', .35); if (bx >= x) px(bx, y + r * 8, 1, 8, '#000', .3); } } }
    for (let k = 0; k < Math.floor(w * h / 90); k++) px(x + rr(w), y + rr(h), 2, 1, R() < .5 ? '#000' : '#fff', .09);
  };
  wallRect(0, 0, CW, WALL); wallRect(0, WALL + RH, CW, WALL); wallRect(0, 0, WALL, RH + WALL * 2); wallRect(WALL + RW, 0, WALL, RH + WALL * 2);
  px(0, WALL - 3, CW, 3, th.wall[2], .6); px(WALL - 3, 0, 3, RH + WALL * 2, th.wall[2], .35); px(0, WALL + RH, CW, 3, '#000', .35);
  for (let i = 1; i <= 8; i++) { const a = .3 * (1 - i / 9); px(WALL, WALL + i - 1, RW, 1, '#000', a); px(WALL, WALL + RH - i, RW, 1, '#000', a); px(WALL + i - 1, WALL, 1, RH, '#000', a); px(WALL + RW - i, WALL, 1, RH, '#000', a); }
  for (const [cx, cy] of [[0, 0], [CW - WALL, 0], [0, RH + WALL], [CW - WALL, RH + WALL]]) { px(cx, cy, WALL, WALL, th.wall[0]); px(cx, cy, WALL, 3, th.wall[2], .7); px(cx, cy, 3, WALL, th.wall[2], .5); px(cx + 4, cy + 4, WALL - 8, WALL - 8, '#000', .22); px(cx + 12, cy + 12, 8, 8, th.pc, .35); }
  // sconces on the walls (the flames are drawn each frame)
  for (const [tx, bottom] of [[2, 0], [10, 0], [2, 1], [10, 1]]) { const x = WALL + tx * TILE + 16, y = bottom ? RH + WALL + 10 : 12; px(x - 3, y + 6, 6, 6, '#2a2030'); px(x - 4, y + 5, 8, 2, '#6a6070'); px(x - 1, y + 12, 2, 6, '#2a2030'); }
  // rocks, holes, spikes
  layout.forEach((row, ty) => row.forEach((v, tx) => {
    const x = WALL + tx * TILE, y = WALL + ty * TILE, C = th.rockC; if (!v) return;
    if (v === 1) {
      px(x + 3, y + 26, 26, 5, '#000', .35);
      if ((th.rock === 'stone' || th.rock === 'sandstone')) { px(x + 3, y + 5, 26, 23, C[0]); px(x + 3, y + 5, 26, 4, C[1]); px(x + 3, y + 5, 4, 23, C[1]); px(x + 24, y + 9, 5, 19, C[2]); px(x + 7, y + 24, 22, 4, C[2]); px(x + 9, y + 11, 1, 6, C[2]); px(x + 10, y + 16, 5, 1, C[2]); px(x + 18, y + 14, 1, 7, C[2]); px(x + 1, y + 8, 2, 18, C[0]); }
      else if (th.rock === 'obsidian') { px(x + 4, y + 6, 24, 22, C[0]); px(x + 4, y + 6, 24, 3, C[1]); px(x + 4, y + 6, 3, 22, C[1]); px(x + 22, y + 10, 6, 18, C[2]); px(x + 10, y + 10, 2, 6, '#ff7a2a'); px(x + 11, y + 16, 5, 2, '#ff7a2a'); px(x + 16, y + 18, 2, 6, '#ffb43c'); px(x + 10, y + 10, 1, 1, '#ffe08a'); }
      else if (th.rock === 'stump') { px(x + 5, y + 10, 22, 18, C[0]); px(x + 5, y + 10, 4, 18, C[1]); px(x + 22, y + 10, 5, 18, C[2]); b.fillStyle = C[1]; b.beginPath(); b.ellipse(x + 16, y + 10, 11, 6, 0, 0, 7); b.fill(); b.fillStyle = C[0]; b.beginPath(); b.ellipse(x + 16, y + 10, 7, 3.5, 0, 0, 7); b.fill(); b.fillStyle = C[2]; b.beginPath(); b.ellipse(x + 16, y + 10, 3, 1.5, 0, 0, 7); b.fill(); px(x + 5, y + 14, 8, 3, '#58a050'); px(x + 20, y + 24, 7, 3, '#3f7a3a'); }
      else if (th.rock === 'ice') { px(x + 4, y + 5, 24, 23, C[0]); px(x + 4, y + 5, 24, 3, C[1]); px(x + 4, y + 5, 3, 23, C[1]); px(x + 22, y + 9, 6, 19, C[2]); px(x + 9, y + 9, 2, 10, '#fff', .8); px(x + 12, y + 8, 2, 4, '#fff', .6); px(x + 14, y + 16, 8, 1, '#fff', .35); px(x + 6, y + 22, 18, 2, C[2], .7); }
      else { px(x + 4, y + 5, 24, 23, C[0]); px(x + 4, y + 5, 24, 3, C[1]); px(x + 4, y + 5, 3, 23, C[1]); px(x + 22, y + 9, 6, 19, C[2]); for (let i = 0; i < 7; i++) px(x + 12 + [0, 0, 1, 2, 2, 1, 0][i] * 3, y + 9 + i * 2, 3, 2, th.pc); px(x + 10, y + 17, 12, 2, th.pc, .5); }
    } else if (v === 3) {
      px(x + 1, y + 1, 30, 30, '#000', .55);
      const inner = { pit: '#05010b', lava: '#c0391b', swamp: '#173a26', icewater: '#0a2440', void: '#07020f', quicksand: '#7a5a22', sky: '#2c5ca8' }[th.hole];
      px(x + 3, y + 3, 26, 26, inner); px(x + 3, y + 3, 26, 3, '#000', .45); px(x + 3, y + 3, 3, 26, '#000', .3);
      if (th.hole === 'lava') { for (let i = 0; i < 6; i++) px(x + 6 + rr(18), y + 8 + rr(18), 4 + rr(5), 2, '#ff8a2a'); px(x + 10, y + 12, 6, 2, '#ffe08a'); px(x + 3, y + 26, 26, 3, '#ff6a1a', .55); }
      if (th.hole === 'swamp') { for (let i = 0; i < 4; i++) px(x + 6 + rr(18), y + 8 + rr(16), 5, 3, '#2f7a4a', .8); px(x + 15, y + 12, 2, 2, '#ffd0ff'); }
      if (th.hole === 'icewater') { for (let i = 0; i < 3; i++) px(x + 6 + rr(14), y + 8 + rr(16), 10, 1, '#6ac0ff', .6); px(x + 3, y + 3, 26, 2, '#fff', .55); }
      if (th.hole === 'quicksand') { for (let i = 0; i < 4; i++) px(x + 5 + rr(18), y + 8 + rr(16), 8, 1, '#c49a52', .7); px(x + 3, y + 3, 26, 2, '#000', .3); }
      if (th.hole === 'sky') { for (let i = 0; i < 3; i++) px(x + 5 + rr(16), y + 7 + rr(16), 9, 3, '#fff', .55); }
      if (th.hole === 'void') { for (let i = 0; i < 9; i++) px(x + 5 + rr(22), y + 5 + rr(22), 1, 1, '#fff', .5 + R() * .5); px(x + 9, y + 12, 2, 2, th.pc, .6); }
      px(x + 1, y + 1, 30, 2, th.wall[2], .5); px(x + 1, y + 29, 30, 2, th.wall[0], .8);
    } else if (v === 2) {
      px(x + 3, y + 3, 26, 26, '#150c24'); px(x + 3, y + 3, 26, 26, '#fff', .04);
      for (let k = 0; k < 4; k++) { const sx = x + 6 + (k & 1) * 12, sy = y + 6 + (k >> 1) * 12; px(sx, sy + 7, 6, 3, '#000', .5); px(sx + 1, sy + 2, 4, 6, '#b8b8cc'); px(sx + 2, sy, 2, 3, '#e8e8f4'); px(sx + 1, sy + 2, 1, 6, '#fff', .5); px(sx + 4, sy + 3, 1, 5, '#6a6a80'); }
    }
  }));
  // vignette
  const gr = b.createRadialGradient(CW / 2, (RH + WALL * 2) / 2, 120, CW / 2, (RH + WALL * 2) / 2, 330); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,.5)'); b.fillStyle = gr; b.fillRect(0, 0, CW, RH + WALL * 2);
  return cv;
}
/* torches, doors and particles are drawn each frame */
const TORCHES = [[2, 0], [10, 0], [2, 1], [10, 1]];
function drawTorches(g, th, t, oy) {
  for (const [tx, bottom] of TORCHES) {
    const x = WALL + tx * TILE + 16, y = oy + (bottom ? RH + WALL + 10 : 12), f = Math.floor(t * 9 + tx * 3 + bottom) % 3;
    const gl = g.createRadialGradient(x, y, 2, x, y, 60); gl.addColorStop(0, th.torch + '55'); gl.addColorStop(1, th.torch + '00'); g.fillStyle = gl; g.fillRect(x - 60, y - 60, 120, 120);
    g.fillStyle = th.torch; g.fillRect(x - 2, y - 4 - f, 4, 8 + f); g.fillStyle = '#fff3b0'; g.fillRect(x - 1, y - 2 - f, 2, 5); g.fillStyle = th.torch; g.fillRect(x - 3 + (f === 1 ? 1 : 0), y, 2, 4); g.fillRect(x + 1 - (f === 2 ? 1 : 0), y - 1, 2, 4);
  }
}
const DOOR_POS = i => { const d = DOORS[i]; return { x: WALL + d.x * TILE, y: HUD + WALL + d.y * TILE }; };
function drawDoor(g, th, i, kind, open, t) {
  const { x, y } = DOOR_POS(i), horiz = i % 2 === 0, dir = DIRS[i];
  const px = (a, b2, w, h, c, al = 1) => { g.globalAlpha = al; g.fillStyle = c; g.fillRect(Math.round(a), Math.round(b2), w, h); g.globalAlpha = 1; };
  const seal = { combat: '#ff4f6d', wave: '#ff9a3c', mini: '#ff9a3c', boss: '#ff4f6d', treasure: '#ffd45c', shop: '#5be37d', start: '#9a88c4' }[kind] || '#ff4f6d';
  // passage
  px(x, y, TILE, TILE, '#05010b');
  const gl = g.createLinearGradient(x + 16 + dir[0] * 16, y + 16 + dir[1] * 16, x + 16 - dir[0] * 16, y + 16 - dir[1] * 16);
  gl.addColorStop(0, open ? th.glow + 'aa' : seal + '55'); gl.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gl; g.fillRect(x, y, TILE, TILE);
  // frame
  const fr = th.wall[2], sh = th.wall[0];
  if (horiz) { px(x - 6, y, 6, TILE, fr); px(x + TILE, y, 6, TILE, fr); px(x - 6, y, 2, TILE, '#fff', .15); px(x + TILE + 4, y, 2, TILE, '#000', .3); px(x - 6, i === 0 ? y + TILE - 7 : y, TILE + 12, 7, sh); px(x - 6, i === 0 ? y + TILE - 7 : y + 6, TILE + 12, 1, fr, .8); }
  else { px(x, y - 6, TILE, 6, fr); px(x, y + TILE, TILE, 6, fr); px(x, y - 6, TILE, 2, '#fff', .15); px(x, y + TILE + 4, TILE, 2, '#000', .3); px(i === 1 ? x : x + TILE - 7, y - 6, 7, TILE + 12, sh); }
  if (open) {   // a pulsing chevron pointing out
    const k = Math.floor(t * 3) % 3, cx = x + 16 + dir[0] * (k * 3 - 3), cy = y + 16 + dir[1] * (k * 3 - 3);
    for (let s = 0; s < 3; s++) { const ox = horiz ? (s - 1) * 4 : -dir[0] * Math.abs(s - 1) * 4, oy = horiz ? -dir[1] * Math.abs(s - 1) * 4 : (s - 1) * 4; px(cx + ox - 1, cy + oy - 1, 3, 3, th.pc, .7); }
  } else {      // iron bars and a glowing seal
    for (let k = 0; k < 5; k++) { if (horiz) { px(x + 3 + k * 6, y, 3, TILE, '#3a3646'); px(x + 3 + k * 6, y, 1, TILE, '#8a869a'); } else { px(x, y + 3 + k * 6, TILE, 3, '#3a3646'); px(x, y + 3 + k * 6, TILE, 1, '#8a869a'); } }
    const pulse = .6 + Math.sin(t * 5) * .25; px(x + 11, y + 11, 10, 10, '#000', .7); px(x + 12, y + 12, 8, 8, seal, pulse); px(x + 14, y + 14, 3, 3, '#fff', pulse * .9);
  }
  const art = DOOR_ICON[kind]; if (art) {   // what is behind the door
    const ix = x + (horiz ? 12 : dir[0] > 0 ? -10 : 36), iy = y + (horiz ? (dir[1] < 0 ? 36 : -10) : 12);
    px(ix - 2, iy - 2, 11, 11, '#05010b', .8);
    art.forEach((row, ry) => { for (let rx = 0; rx < 7; rx++) { const ch = row[rx]; if (ch !== '.') px(ix + rx, iy + ry, 1, 1, DOOR_ICON_COL[ch]); } });
  }
}
const PART_N = { dust: 18, ember: 26, spore: 22, snow: 40, wisp: 14 };
function updateParts(parts, th, dt) {
  const kind = th.part;
  while (parts.length < PART_N[kind]) parts.push({ x: Math.random() * RW, y: kind === 'snow' ? -4 : Math.random() * RH, vx: 0, vy: 0, a: Math.random() * 6.28, life: Math.random() * 6 + 3, big: Math.random() < .3 });
  for (const q of parts) {
    q.life -= dt; q.a += dt;
    if (kind === 'dust') { q.x += Math.sin(q.a * .7) * 6 * dt; q.y += 4 * dt; }
    else if (kind === 'ember') { q.x += Math.sin(q.a * 2) * 10 * dt; q.y -= (18 + (q.big ? 14 : 0)) * dt; }
    else if (kind === 'spore') { q.x += Math.sin(q.a * 1.3) * 12 * dt; q.y += Math.cos(q.a) * 8 * dt - 2 * dt; }
    else if (kind === 'snow') { q.x += Math.sin(q.a) * 14 * dt - 4 * dt; q.y += (26 + (q.big ? 14 : 0)) * dt; }
    else { q.x += Math.cos(q.a * .8) * 14 * dt; q.y += Math.sin(q.a * 1.1) * 12 * dt - 3 * dt; }
    if (q.life <= 0 || q.y < -8 || q.y > RH + 8 || q.x < -8 || q.x > RW + 8) { q.x = Math.random() * RW; q.y = kind === 'snow' ? -4 : kind === 'ember' ? RH + 4 : Math.random() * RH; q.life = Math.random() * 6 + 3; }
  }
}
function drawParts(g, parts, th, t, ox, oy) {
  const kind = th.part;
  for (const q of parts) {
    const s = q.big ? 3 : 2, tw = .5 + Math.sin(q.a * 3) * .4; g.globalAlpha = Math.max(0, Math.min(1, q.life)) * (kind === 'ember' || kind === 'wisp' ? .55 + tw * .45 : .6);
    g.fillStyle = kind === 'ember' && tw > .7 ? '#ffe08a' : th.pc; g.fillRect(Math.round(ox + q.x), Math.round(oy + q.y), s, s);
  }
  g.globalAlpha = 1;
}
