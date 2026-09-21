'use strict';
const VW = 800, VH = 576;
const cv = document.getElementById('c');
const ctx = cv.getContext('2d');
cv.width = VW; cv.height = VH;

// ---------- Áudio simples ----------
let ac;
function beep(f, d, type, vol) {
  try {
    ac = ac || new AudioContext();
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = type || 'square'; o.frequency.value = f; g.gain.value = vol || 0.04;
    o.connect(g); g.connect(ac.destination); o.start();
    g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + d);
    o.stop(ac.currentTime + d);
  } catch (e) { /* sem áudio */ }
}

// ---------- Entrada ----------
const down = new Set(), pressedKeys = new Set();
addEventListener('keydown', e => {
  const k = e.key.toLowerCase();
  if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k)) e.preventDefault();
  if (!down.has(k)) pressedKeys.add(k);
  down.add(k);
});
addEventListener('keyup', e => down.delete(e.key.toLowerCase()));
addEventListener('blur', () => down.clear());
const held = (...ks) => ks.some(k => down.has(k));
const pressed = (...ks) => ks.some(k => pressedKeys.has(k));

// ---------- Cores por tile ----------
const ROOFS = ['#b5482f', '#c26a3a', '#8a3a2a', '#a84f3b'];
const WALLS = ['#f0e2c0', '#cfe3d4', '#f2d0d8', '#d3d9f0'];
const hash = (x, y) => ((x * 73856093) ^ (y * 19349663)) >>> 0;

function drawTile(g, t, px, py, v, x, y) {
  const h = hash(x, y), r = (n) => ((h >> n) & 15) / 15;
  const grass = () => {
    g.fillStyle = '#b3aa57'; g.fillRect(px, py, TS, TS);
    g.fillStyle = '#9aa04a';
    for (let i = 0; i < 4; i++) g.fillRect(px + ((h >> (i * 5)) & 31), py + ((h >> (i * 3 + 2)) & 31), 3, 2);
    g.fillStyle = '#c9bd68';
    g.fillRect(px + (h & 27), py + ((h >> 8) & 27), 2, 3);
  };
  switch (t) {
    case T.GRASS: grass(); break;
    case T.ROAD:
      g.fillStyle = '#4b4b55'; g.fillRect(px, py, TS, TS);
      g.fillStyle = '#5a5a65'; g.fillRect(px + (h & 23), py + ((h >> 6) & 23), 4, 2);
      break;
    case T.SIDEWALK:
      g.fillStyle = '#cbc4b2'; g.fillRect(px, py, TS, TS);
      g.fillStyle = '#b9b19d'; g.fillRect(px, py + 15, TS, 1); g.fillRect(px + 15, py, 1, TS);
      break;
    case T.PLAZA:
      g.fillStyle = (x + y) % 2 ? '#e6cf9f' : '#dcc18c'; g.fillRect(px, py, TS, TS);
      break;
    case T.DIRT:
      g.fillStyle = '#b98d5a'; g.fillRect(px, py, TS, TS);
      g.fillStyle = '#a57a4a'; g.fillRect(px + (h & 23), py + ((h >> 5) & 23), 5, 3);
      break;
    case T.HILL:
      g.fillStyle = (x + y) % 2 ? '#a3a05c' : '#98965a'; g.fillRect(px, py, TS, TS);
      g.fillStyle = '#7d8250'; g.fillRect(px + (h & 23), py + ((h >> 5) & 23), 6, 2);
      break;
    case T.ROOF:
      g.fillStyle = ROOFS[v]; g.fillRect(px, py, TS, TS);
      g.fillStyle = 'rgba(0,0,0,.18)';
      for (let i = 0; i < 4; i++) g.fillRect(px, py + i * 8 + 6, TS, 2);
      break;
    case T.WALL:
      g.fillStyle = WALLS[v]; g.fillRect(px, py, TS, TS);
      g.fillStyle = '#6fa7d6'; g.fillRect(px + 4, py + 7, 9, 10);
      g.fillStyle = '#4a7fae'; g.fillRect(px + 8, py + 7, 1, 10);
      g.fillStyle = 'rgba(0,0,0,.12)'; g.fillRect(px, py + 28, TS, 4);
      break;
    case T.DOOR:
      g.fillStyle = WALLS[v]; g.fillRect(px, py, TS, TS);
      g.fillStyle = '#6b4226'; g.fillRect(px + 8, py + 4, 16, 28);
      g.fillStyle = '#f5d142'; g.fillRect(px + 20, py + 18, 2, 2);
      break;
    case T.CHURCH:
      g.fillStyle = '#f4f0e6'; g.fillRect(px, py, TS, TS);
      g.fillStyle = '#3d6bb3'; g.fillRect(px + 12, py + 8, 8, 14);
      g.fillStyle = 'rgba(0,0,0,.1)'; g.fillRect(px, py + 28, TS, 4);
      if (v === 1) {
        g.fillStyle = '#d4a84a'; g.fillRect(px + 14, py + 2, 4, 14); g.fillRect(px + 10, py + 6, 12, 4);
      }
      break;
    case T.TREE:
      grass();
      g.fillStyle = '#5b3d22'; g.fillRect(px + 14, py + 18, 5, 12);
      g.fillStyle = '#4f7a3a'; g.beginPath(); g.arc(px + 16, py + 14, 13, 0, 7); g.fill();
      g.fillStyle = '#5f8f45'; g.beginPath(); g.arc(px + 12, py + 11, 6, 0, 7); g.fill();
      break;
    case T.ROCK:
      grass();
      g.fillStyle = '#7d7d82'; g.beginPath(); g.ellipse(px + 16, py + 20, 13, 10, 0, 0, 7); g.fill();
      g.fillStyle = '#a0a0a6'; g.beginPath(); g.ellipse(px + 12, py + 16, 6, 4, 0, 0, 7); g.fill();
      break;
    case T.CROP:
      g.fillStyle = '#7a5a33'; g.fillRect(px, py, TS, TS);
      g.fillStyle = '#5c8a3a';
      for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) g.fillRect(px + 3 + i * 8, py + 4 + j * 10, 4, 6);
      break;
    case T.FENCE:
      grass();
      g.fillStyle = '#8b6a3d'; g.fillRect(px, py + 12, TS, 3); g.fillRect(px, py + 20, TS, 3);
      g.fillRect(px + 2, py + 8, 4, 18); g.fillRect(px + 26, py + 8, 4, 18);
      break;
    case T.WATER:
      g.fillStyle = '#3a7bbf'; g.fillRect(px, py, TS, TS);
      g.fillStyle = '#6aa3dc'; g.fillRect(px + (h & 15), py + ((h >> 4) & 23), 10, 2);
      break;
    case T.MOUNT:
      g.fillStyle = r(0) > 0.5 ? '#7a6a58' : '#6f6050'; g.fillRect(px, py, TS, TS);
      g.fillStyle = '#5a4c3e'; g.beginPath(); g.moveTo(px, py + TS); g.lineTo(px + 16, py + 4); g.lineTo(px + TS, py + TS); g.fill();
      g.fillStyle = '#9a8a76'; g.beginPath(); g.moveTo(px + 16, py + 4); g.lineTo(px + 22, py + 16); g.lineTo(px + 16, py + 14); g.fill();
      break;
  }
}

const mapCv = document.createElement('canvas');
mapCv.width = MW * TS; mapCv.height = MH * TS;
const miniCv = document.createElement('canvas');
miniCv.width = MW * 2; miniCv.height = MH * 2;
(function bake() {
  const g = mapCv.getContext('2d'), m = miniCv.getContext('2d');
  const mc = { 0: '#b3aa57', 1: '#4b4b55', 2: '#e6cf9f', 3: '#b5482f', 4: '#f0e2c0', 5: '#6b4226', 6: '#4f7a3a', 7: '#7a5a33',
    8: '#8b6a3d', 9: '#7d7d82', 10: '#6f6050', 11: '#3a7bbf', 12: '#b98d5a', 13: '#98965a', 14: '#f4f0e6', 15: '#cbc4b2' };
  for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
    const t = tiles[y * MW + x];
    drawTile(g, t, x * TS, y * TS, vari[y * MW + x], x, y);
    m.fillStyle = mc[t]; m.fillRect(x * 2, y * 2, 2, 2);
  }
})();

// ---------- Estado ----------
const START = { x: 34.5 * TS, y: 42.5 * TS };
const DIRS = [[0, 1], [0, -1], [-1, 0], [1, 0]]; // baixo, cima, esquerda, direita
let S;
function newState(saved) {
  S = {
    mode: 'play', paused: false, time: 0, showMap: true,
    p: { x: START.x, y: START.y, dir: 0, hp: 12, maxhp: 12, swing: 0, swingId: 0, inv: 0, kx: 0, ky: 0, kt: 0, moving: false, shield: false },
    enemies: [], pickups: [], dialog: null,
    coins: 0, quest: 0, hasCrystal: false, done: false, bossDead: false,
    region: '', banner: '', bannerT: 0,
  };
  if (saved) {
    Object.assign(S.p, { x: saved.x, y: saved.y, hp: saved.hp });
    Object.assign(S, { coins: saved.coins, quest: saved.quest, hasCrystal: saved.hasCrystal, done: saved.done, bossDead: saved.bossDead });
  }
  spawnEnemies();
  if (S.bossDead && !S.hasCrystal) S.pickups.push({ x: 86.5 * TS, y: 7.5 * TS, type: 'crystal' });
}

function getSave() { try { return JSON.parse(localStorage.getItem('zeldaGBI')); } catch (e) { return null; } }
function save() {
  try {
    const { p } = S;
    localStorage.setItem('zeldaGBI', JSON.stringify({ x: p.x, y: p.y, hp: p.hp, coins: S.coins, quest: S.quest,
      hasCrystal: S.hasCrystal, done: S.done, bossDead: S.bossDead }));
  } catch (e) { /* sem storage */ }
}

// ---------- Colisão ----------
const solidPx = (x, y) => isSolidTile(Math.floor(x / TS), Math.floor(y / TS));
const blocked = (x, y, h) => solidPx(x - h, y - h) || solidPx(x + h, y - h) || solidPx(x - h, y + h) || solidPx(x + h, y + h);

// ---------- NPCs ----------
function findWalkable(tx, ty) {
  for (let r = 0; r < 6; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++)
    if (!isSolidTile(tx + dx, ty + dy)) return { x: (tx + dx + 0.5) * TS, y: (ty + dy + 0.5) * TS };
  return { x: (tx + 0.5) * TS, y: (ty + 0.5) * TS };
}
const NPCS = [
  { name: 'Seu Zé', tx: 42, ty: 40, color: '#8e5bb5', talk: seuZe },
  { name: 'Mãe do Link', tx: 34, ty: 45, color: '#e07aa0', talk: () => ['Link! Quando o celular tiver 100%, me avisa. Sério.', 'Mas antes de voltar pra casa, vai falar com o Seu Zé na praça. Ele parecia preocupado.'] },
  { name: 'Jovem do Mirante', tx: 59, ty: 30, color: '#3aa0a0', talk: () => ['Do Monte Pascoal dá pra ver Guanambi inteira!', 'Lá embaixo, a praça com a igreja. Pra leste, a estrada leva a Mutans e a Caetité. Pra oeste, Palmas de Monte Alta.'] },
  { name: 'Mestre Nilo', tx: 72, ty: 30, color: '#c99a3b', talk: () => ['Aqui é Mutans, meu jovem. A Serra de Mutans protege a gente.', 'Mas o Guardião da Mandiroba anda inquieto. Sobe a trilha pelo norte, e segura o escudo firme (X)!'] },
  { name: 'Tio Caetano', tx: 84, ty: 48, color: '#5d8f4a', talk: () => ['Caetité é terra de história, viu? Esse casario tem muito o que contar.', 'Dizem que a Serra da Mandiroba guarda um cristal antigo.'] },
  { name: 'Dona Lúcia', tx: 10, ty: 40, color: '#d0604a', talk: () => ['Bem-vindo a Palmas de Monte Alta! Aqui o povo é acolhedor.', 'Cuidado na estrada, tem cobra na beira do mato.'] },
  { name: 'Raimundo', tx: 36, ty: 54, color: '#8a6b3c', talk: () => ['Nessa seca a caatinga judia da gente. Cuidado com os escorpiões!', 'Se ficar ferido, coração solto por aí ajuda.'] },
].map(n => Object.assign(n, findWalkable(n.tx, n.ty)));

function seuZe() {
  if (S.done) return ['Você salvou a Serra, Link! Guanambi inteira agradece.'];
  if (S.hasCrystal) {
    S.done = true; S.p.hp = S.p.maxhp; save(); beep(660, .4, 'triangle', .06);
    return ['Meu Deus... o Cristal da Mandiroba! Você é fera demais, rapaz!', 'A Serra de Mutans volta a ficar em paz. Toma um fôlego: recuperou toda a vida!', '★ FIM DA MISSÃO ★ Continue explorando Guanambi e região.'];
  }
  if (S.quest === 1) return ['Ainda procurando? O Guardião fica lá em cima, na Serra da Mandiroba, depois de Mutans.', 'Segue a estrada leste e pega a trilha ao norte da vila!'];
  S.quest = 1; save();
  return ['Eita, Link! Ainda bem que apareceu.', 'Um Guardião de pedra roubou o Cristal da Mandiroba, e bicho perigoso desceu a serra.', 'Vai pela estrada até Mutans, sobe a trilha da Serra da Mandiroba e traz o cristal de volta.', 'Espada no Z, escudo no X. E cuidado com os cachorros de rua!'];
}

// ---------- Inimigos ----------
const ETYPES = {
  dog: { name: 'Vira-lata', hp: 2, spd: 70, dmg: 1, r: 12, sight: 200 },
  scorpion: { name: 'Escorpião', hp: 2, spd: 55, dmg: 1, r: 11, sight: 170 },
  snake: { name: 'Cobra', hp: 3, spd: 45, dmg: 1, r: 12, sight: 150 },
  bat: { name: 'Morcego', hp: 1, spd: 95, dmg: 1, r: 10, sight: 260, fly: true },
  boss: { name: 'Guardião da Mandiroba', hp: 16, spd: 60, dmg: 2, r: 24, sight: 420 },
};
function addEnemy(type, x, y) {
  const d = ETYPES[type];
  S.enemies.push({ type, x, y, hp: d.hp, maxhp: d.hp, spd: d.spd, dmg: d.dmg, r: d.r, sight: d.sight, fly: !!d.fly,
    t: rnd() * 10, wx: 0, wy: 0, wt: 0, kx: 0, ky: 0, kt: 0, flash: 0, hit: -1, fx: 1 });
}
function spawn(type, count, filter) {
  let n = 0, tries = 0;
  while (n < count && tries++ < 4000) {
    const tx = 2 + (rnd() * (MW - 4) | 0), ty = 2 + (rnd() * (MH - 4) | 0);
    if (isSolidTile(tx, ty) || !filter(tx, ty, tileAt(tx, ty))) continue;
    if (Math.hypot((tx + .5) * TS - START.x, (ty + .5) * TS - START.y) < 300) continue;
    addEnemy(type, (tx + .5) * TS, (ty + .5) * TS); n++;
  }
}
function spawnEnemies() {
  const inR = n => (x, y) => regionAt(x, y) === n;
  spawn('dog', 8, (x, y, t) => inR('Guanambi — Área Urbana')(x, y) && (t === T.ROAD || t === T.SIDEWALK));
  spawn('dog', 4, (x, y, t) => inR('Caetité')(x, y) && (t === T.ROAD || t === T.SIDEWALK));
  spawn('dog', 3, (x, y, t) => inR('Palmas de Monte Alta')(x, y) && (t === T.ROAD || t === T.SIDEWALK));
  spawn('scorpion', 14, (x, y, t) => inR('Zona Rural de Guanambi')(x, y) && (t === T.GRASS || t === T.DIRT));
  spawn('snake', 12, (x, y, t) => inR('Zona Rural de Guanambi')(x, y) && (t === T.GRASS || t === T.CROP));
  spawn('bat', 9, (x, y) => x >= 60 && y <= 24 && regionAt(x, y).startsWith('Serra'));
  if (!S.bossDead) addEnemy('boss', 86.5 * TS, 7.5 * TS);
}

function hurtPlayer(e, dmg) {
  const p = S.p;
  if (p.inv > 0) return;
  let ax = p.x - e.x, ay = p.y - e.y; const l = Math.hypot(ax, ay) || 1; ax /= l; ay /= l;
  const f = DIRS[p.dir];
  if (p.shield && p.swing <= 0 && f[0] * -ax + f[1] * -ay > 0.3) { // bloqueou
    e.kx = -ax * 260; e.ky = -ay * 260; e.kt = 0.2; p.inv = 0.3; beep(220, .08, 'square', .05); return;
  }
  p.hp -= dmg; p.inv = 1; p.kx = ax * 260; p.ky = ay * 260; p.kt = 0.15; beep(120, .2, 'sawtooth', .06);
  if (p.hp <= 0) { p.hp = 0; S.mode = 'dead'; }
}
function killEnemy(e) {
  S.enemies.splice(S.enemies.indexOf(e), 1);
  beep(500, .12, 'triangle', .05);
  if (e.type === 'boss') { S.bossDead = true; S.pickups.push({ x: e.x, y: e.y, type: 'crystal' }); save(); return; }
  const r = rnd();
  if (r < 0.3) S.pickups.push({ x: e.x, y: e.y, type: 'heart' });
  else if (r < 0.65) S.pickups.push({ x: e.x, y: e.y, type: 'coin' });
}

// ---------- Atualização ----------
function update(dt) {
  S.time += dt;
  const p = S.p;

  if (S.dialog) {
    if (pressed('enter', ' ', 'z')) {
      S.dialog.i++;
      if (S.dialog.i >= S.dialog.lines.length) S.dialog = null; else beep(440, .04, 'square', .03);
    }
    return;
  }

  // Movimento
  let mx = (held('arrowright', 'd') ? 1 : 0) - (held('arrowleft', 'a') ? 1 : 0);
  let my = (held('arrowdown', 's') ? 1 : 0) - (held('arrowup', 'w') ? 1 : 0);
  p.shield = held('x', 'k');
  if (pressed('z', 'j') && p.swing <= 0) { p.swing = 0.28; p.swingId++; beep(300, .08, 'triangle', .04); }
  if (p.swing > 0) p.swing -= dt;
  if (p.inv > 0) p.inv -= dt;
  p.moving = !!(mx || my);
  if (p.moving) {
    if (Math.abs(mx) >= Math.abs(my) && mx) p.dir = mx > 0 ? 3 : 2; else if (my) p.dir = my > 0 ? 0 : 1;
    const l = Math.hypot(mx, my);
    const spd = 150 * (p.shield ? 0.6 : 1) * (p.swing > 0 ? 0.5 : 1);
    moveBox(p, mx / l * spd * dt, my / l * spd * dt, 10, true);
  }
  if (p.kt > 0) { p.kt -= dt; moveBox(p, p.kx * dt, p.ky * dt, 10, true); }

  // Golpe de espada
  if (p.swing > 0.05) {
    const f = DIRS[p.dir];
    for (const e of [...S.enemies]) {
      if (e.hit === p.swingId) continue;
      const dx = e.x - p.x, dy = e.y - p.y, d = Math.hypot(dx, dy);
      if (d < 44 + e.r * 0.6 && (d < 14 || (dx * f[0] + dy * f[1]) / d > 0.25)) {
        e.hit = p.swingId; e.hp--; e.flash = 0.15; e.kx = dx / d * 280; e.ky = dy / d * 280; e.kt = e.type === 'boss' ? 0.08 : 0.2;
        beep(700, .06, 'square', .05);
        if (e.hp <= 0) killEnemy(e);
      }
    }
  }

  // Inimigos
  for (const e of S.enemies) {
    e.t += dt; if (e.flash > 0) e.flash -= dt;
    const dx = p.x - e.x, dy = p.y - e.y, d = Math.hypot(dx, dy);
    if (e.kt > 0) { e.kt -= dt; moveBox(e, e.kx * dt, e.ky * dt, e.r * 0.6, false, e.fly); }
    else {
      let vx, vy, s = e.spd;
      if (d < e.sight) { vx = dx / d; vy = dy / d; if (e.type === 'snake') s *= 0.8 + 0.4 * Math.sin(e.t * 6); }
      else {
        e.wt -= dt;
        if (e.wt <= 0) { e.wt = 1 + rnd() * 2; const a = rnd() * 6.283; e.wx = Math.cos(a) * (rnd() < .4 ? 0 : 1); e.wy = Math.sin(a) * (e.wx === 0 ? 0 : 1); }
        vx = e.wx; vy = e.wy; s *= 0.5;
      }
      if (e.type === 'bat') { vx += Math.cos(e.t * 5) * 0.5; vy += Math.sin(e.t * 7) * 0.5; }
      if (vx) e.fx = vx > 0 ? 1 : -1;
      moveBox(e, vx * s * dt, vy * s * dt, e.r * 0.6, false, e.fly);
    }
    if (d < e.r + 10) hurtPlayer(e, e.dmg);
    if (S.mode === 'dead') return;
  }

  // Itens
  for (const it of [...S.pickups]) {
    if (Math.hypot(it.x - p.x, it.y - p.y) < 22) {
      if (it.type === 'heart') { if (p.hp >= p.maxhp) continue; p.hp = Math.min(p.maxhp, p.hp + 2); beep(880, .12, 'triangle', .05); }
      else if (it.type === 'coin') { S.coins++; beep(1000, .06, 'square', .04); }
      else { S.hasCrystal = true; beep(1200, .4, 'triangle', .06); save(); S.dialog = { name: 'Link', lines: ['Você pegou o Cristal da Mandiroba! Hora de voltar pra praça, falar com o Seu Zé.'], i: 0 }; }
      S.pickups.splice(S.pickups.indexOf(it), 1);
    }
  }

  // Falar com NPC
  if (pressed('enter', 'e')) {
    const f = DIRS[p.dir];
    let best = null, bd = 50;
    for (const n of NPCS) {
      const d = Math.hypot(n.x - p.x, n.y - p.y);
      if (d < bd && ((n.x - p.x) * f[0] + (n.y - p.y) * f[1] > -6 || d < 30)) { best = n; bd = d; }
    }
    if (best) { S.dialog = { name: best.name, lines: best.talk(), i: 0 }; beep(440, .05, 'square', .03); }
  }

  // Região
  const reg = regionAt(Math.floor(p.x / TS), Math.floor(p.y / TS));
  if (reg !== S.region) { S.region = reg; S.banner = reg; S.bannerT = 2.6; save(); }
  if (S.bannerT > 0) S.bannerT -= dt;
}

function moveBox(e, dx, dy, h, isPlayer, fly) {
  const bl = (x, y) => (!fly && blocked(x, y, h)) || (isPlayer && npcBlock(x, y));
  if (!bl(e.x + dx, e.y)) e.x += dx;
  if (!bl(e.x, e.y + dy)) e.y += dy;
}
const npcBlock = (x, y) => NPCS.some(n => Math.abs(n.x - x) < 20 && Math.abs(n.y - y) < 20);

// ---------- Desenho ----------
function heart(x, y, s, col) {
  ctx.fillStyle = col; ctx.beginPath();
  ctx.moveTo(x + s / 2, y + s);
  ctx.bezierCurveTo(x - s * .2, y + s * .5, x + s * .1, y - s * .2, x + s / 2, y + s * .3);
  ctx.bezierCurveTo(x + s * .9, y - s * .2, x + s * 1.2, y + s * .5, x + s / 2, y + s);
  ctx.fill();
}
function rect(c, x, y, w, h) { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), w, h); }

function shadow(x, y, rx) { ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.beginPath(); ctx.ellipse(x, y, rx, rx * 0.4, 0, 0, 7); ctx.fill(); }

function drawShield(x, y, w, h) {
  ctx.fillStyle = '#f5d142'; ctx.beginPath(); ctx.ellipse(x, y, w / 2 + 1.5, h / 2 + 1.5, 0, 0, 7); ctx.fill();
  ctx.fillStyle = '#2b5fd9'; ctx.beginPath(); ctx.ellipse(x, y, w / 2, h / 2, 0, 0, 7); ctx.fill();
  ctx.fillStyle = '#f5d142'; ctx.fillRect(x - 1, y - h / 3, 2, h * 0.66); ctx.fillRect(x - w / 3, y - 1, w * 0.66, 2);
}

function drawLink(p) {
  if (p.inv > 0 && Math.floor(S.time * 14) % 2) return;
  const x = p.x, y = p.y, d = p.dir;
  const step = p.moving ? Math.sin(S.time * 14) * 2 : 0;
  shadow(x, y + 13, 11);
  // pernas (jeans) e tênis brancos
  rect('#3a56a0', x - 6, y + 3, 5, 8 + step); rect('#3a56a0', x + 1, y + 3, 5, 8 - step);
  rect('#f4f4f4', x - 7, y + 10 + step, 6, 3); rect('#f4f4f4', x + 1, y + 10 - step, 6, 3);
  // mochila (atrás)
  if (d === 1) rect('#c0392b', x - 7, y - 6, 14, 12);
  if (d === 2) rect('#c0392b', x + 3, y - 4, 6, 10);
  if (d === 3) rect('#c0392b', x - 9, y - 4, 6, 10);
  // camiseta verde
  rect('#3fae5a', x - 8, y - 6, 16, 11);
  rect('#2f8a45', x - 8, y + 2, 16, 3);
  if (d === 0) { rect('#7b2a20', x - 6, y - 6, 2, 10); rect('#7b2a20', x + 4, y - 6, 2, 10); }
  // braços
  rect('#f2c9a0', x - 11, y - 5, 3, 8); rect('#f2c9a0', x + 8, y - 5, 3, 8);
  // cabeça
  rect('#f2c9a0', x - 7, y - 17, 14, 12);
  rect('#e8c34a', x - 8, y - 15, 2, 6); rect('#e8c34a', x + 6, y - 15, 2, 6);
  if (d === 1) rect('#e8c34a', x - 7, y - 17, 14, 12);
  // boné vermelho
  rect('#d33a3a', x - 7, y - 19, 14, 5);
  if (d === 0) rect('#a82a2a', x - 7, y - 15, 14, 2);
  if (d === 2) rect('#a82a2a', x - 11, y - 15, 5, 2);
  if (d === 3) rect('#a82a2a', x + 6, y - 15, 5, 2);
  if (d === 1) rect('#f4f4f4', x - 2, y - 19, 4, 5);
  // olhos
  if (d === 0) { rect('#222', x - 4, y - 11, 2, 3); rect('#222', x + 2, y - 11, 2, 3); }
  if (d === 2) rect('#222', x - 5, y - 11, 2, 3);
  if (d === 3) rect('#222', x + 3, y - 11, 2, 3);
  // escudo
  const f = DIRS[d];
  if (p.shield && p.swing <= 0) {
    if (d === 0 || d === 1) drawShield(x + f[0] * 0, y + f[1] * 15, 20, 15);
    else drawShield(x + f[0] * 14, y + 1, 12, 20);
  } else {
    const sx = d === 0 ? x + 12 : d === 1 ? x - 12 : d === 2 ? x - 5 : x + 5;
    drawShield(sx, y + 1, 8, 11);
  }
  // espada
  if (p.swing > 0) {
    const prog = 1 - p.swing / 0.28, base = Math.atan2(f[1], f[0]);
    const a = base - 1.2 + 2.4 * prog;
    ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 6;
    ctx.beginPath(); ctx.arc(x, y, 30, base - 1.2, a); ctx.stroke();
    ctx.lineWidth = 4; ctx.strokeStyle = '#7a4b25';
    ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * 6, y + Math.sin(a) * 6); ctx.lineTo(x + Math.cos(a) * 12, y + Math.sin(a) * 12); ctx.stroke();
    ctx.strokeStyle = '#eef3f8'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * 12, y + Math.sin(a) * 12); ctx.lineTo(x + Math.cos(a) * 38, y + Math.sin(a) * 38); ctx.stroke();
    ctx.strokeStyle = '#f5d142'; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(x + Math.cos(a + 1.57) * 5 + Math.cos(a) * 11, y + Math.sin(a + 1.57) * 5 + Math.sin(a) * 11);
    ctx.lineTo(x + Math.cos(a - 1.57) * 5 + Math.cos(a) * 11, y + Math.sin(a - 1.57) * 5 + Math.sin(a) * 11); ctx.stroke();
  } else {
    rect('#dfe6ee', x + (d === 2 ? 4 : -6), y - 10, 2, 14); // espada embainhada nas costas
  }
}

function drawEnemy(e) {
  const x = e.x, y = e.y, fl = e.flash > 0;
  const c = (a, b) => fl ? '#fff' : a;
  if (e.type === 'dog') {
    shadow(x, y + 9, 12);
    rect(c('#8a5a34'), x - 11, y - 5, 22, 12);
    rect(c('#6e4526'), x + e.fx * 8 - 5, y - 10, 10, 10);
    rect('#222', x + e.fx * 11 - 1, y - 7, 2, 2);
    rect(c('#6e4526'), x - e.fx * 13, y - 6, 4, 3);
    rect(c('#8a5a34'), x - 9, y + 6, 3, 5); rect(c('#8a5a34'), x + 6, y + 6, 3, 5);
  } else if (e.type === 'scorpion') {
    shadow(x, y + 7, 11);
    rect(c('#a23b1f'), x - 8, y - 4, 16, 10);
    rect(c('#a23b1f'), x - e.fx * 2 - 2, y - 12, 4, 9); rect(c('#d86a3a'), x - e.fx * 2 - 3, y - 15, 6, 4);
    rect(c('#d86a3a'), x + e.fx * 8 - 3, y - 5, 6, 4);
    rect('#111', x + e.fx * 4, y - 2, 2, 2);
  } else if (e.type === 'snake') {
    shadow(x, y + 7, 12);
    for (let i = 0; i < 5; i++) {
      const sx = x - e.fx * (i * 5 - 8) , sy = y + Math.sin(e.t * 8 + i) * 3;
      ctx.fillStyle = fl ? '#fff' : i % 2 ? '#3b7a3a' : '#5da24a'; ctx.beginPath(); ctx.arc(sx, sy, 5 - (i > 3 ? 1 : 0), 0, 7); ctx.fill();
    }
    rect('#d33', x + e.fx * 9, y - 1, 3, 2);
  } else if (e.type === 'bat') {
    const wing = Math.sin(e.t * 20) * 5;
    ctx.fillStyle = fl ? '#fff' : '#3b2d4d';
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 14, y - 4 - wing); ctx.lineTo(x - 8, y + 5); ctx.fill();
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 14, y - 4 - wing); ctx.lineTo(x + 8, y + 5); ctx.fill();
    ctx.beginPath(); ctx.arc(x, y, 6, 0, 7); ctx.fill();
    rect('#f44', x - 3, y - 2, 2, 2); rect('#f44', x + 1, y - 2, 2, 2);
  } else if (e.type === 'boss') {
    shadow(x, y + 24, 30);
    rect(c('#6b5b7a'), x - 22, y - 16, 44, 40);
    rect(c('#857596'), x - 16, y - 34, 32, 22);
    rect(c('#57496a'), x - 32, y - 12, 10, 26); rect(c('#57496a'), x + 22, y - 12, 10, 26);
    const glow = 200 + Math.sin(S.time * 6) * 55 | 0;
    rect(`rgb(${glow},40,40)`, x - 10, y - 27, 6, 5); rect(`rgb(${glow},40,40)`, x + 4, y - 27, 6, 5);
    rect('#3d3350', x - 12, y + 24, 10, 6); rect('#3d3350', x + 2, y + 24, 10, 6);
    rect('#000', x - 26, y - 46, 52, 6); rect('#e33', x - 25, y - 45, 50 * e.hp / e.maxhp, 4);
  }
}

function drawNPC(n) {
  const x = n.x, y = n.y;
  shadow(x, y + 13, 10);
  rect('#444a5a', x - 6, y + 3, 5, 9); rect('#444a5a', x + 1, y + 3, 5, 9);
  rect(n.color, x - 8, y - 7, 16, 12);
  rect('#f2c9a0', x - 6, y - 17, 12, 11);
  rect('#4a3324', x - 7, y - 19, 14, 5);
  rect('#222', x - 4, y - 12, 2, 3); rect('#222', x + 2, y - 12, 2, 3);
  if (Math.hypot(n.x - S.p.x, n.y - S.p.y) < 50 && !S.dialog) {
    ctx.fillStyle = '#fff'; ctx.font = 'bold 14px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('Enter', x, y - 26);
  }
}

function drawPickup(it) {
  const bob = Math.sin(S.time * 5) * 2;
  if (it.type === 'heart') heart(it.x - 8, it.y - 8 + bob, 16, '#e33');
  else if (it.type === 'coin') { ctx.fillStyle = '#f5d142'; ctx.beginPath(); ctx.arc(it.x, it.y + bob, 6, 0, 7); ctx.fill(); ctx.fillStyle = '#c99a1e'; ctx.fillRect(it.x - 1, it.y - 3 + bob, 2, 6); }
  else {
    const g = 0.5 + 0.5 * Math.sin(S.time * 4);
    ctx.fillStyle = `rgba(120,240,255,${0.25 + 0.25 * g})`; ctx.beginPath(); ctx.arc(it.x, it.y + bob, 22, 0, 7); ctx.fill();
    ctx.fillStyle = '#7ff3ff'; ctx.beginPath(); ctx.moveTo(it.x, it.y - 13 + bob); ctx.lineTo(it.x + 9, it.y + bob); ctx.lineTo(it.x, it.y + 13 + bob); ctx.lineTo(it.x - 9, it.y + bob); ctx.fill();
    ctx.fillStyle = '#e6ffff'; ctx.fillRect(it.x - 2, it.y - 8 + bob, 3, 8);
  }
}

function textBox(lines, x, y, w, h) {
  ctx.fillStyle = 'rgba(10,10,30,.88)'; ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = '#f5d142'; ctx.lineWidth = 3; ctx.strokeRect(x + 1.5, y + 1.5, w - 3, h - 3);
}
function wrap(text, maxW) {
  const words = text.split(' '), out = []; let line = '';
  for (const w of words) { const t = line ? line + ' ' + w : w; if (ctx.measureText(t).width > maxW) { out.push(line); line = w; } else line = t; }
  out.push(line); return out;
}

function draw() {
  ctx.imageSmoothingEnabled = false;
  if (S.mode === 'title') return drawTitle();
  const p = S.p;
  const cx = Math.max(0, Math.min(MW * TS - VW, Math.round(p.x - VW / 2)));
  const cy = Math.max(0, Math.min(MH * TS - VH, Math.round(p.y - VH / 2)));
  ctx.drawImage(mapCv, cx, cy, VW, VH, 0, 0, VW, VH);
  ctx.save(); ctx.translate(-cx, -cy);
  S.pickups.forEach(drawPickup);
  const ents = [...S.enemies.map(e => ({ y: e.y, f: () => drawEnemy(e) })), ...NPCS.map(n => ({ y: n.y, f: () => drawNPC(n) })), { y: p.y, f: () => drawLink(p) }];
  ents.sort((a, b) => a.y - b.y).forEach(o => o.f());
  ctx.restore();

  // HUD: corações e moedas
  for (let i = 0; i < p.maxhp / 2; i++) {
    const hx = 14 + i * 26, hy = 12;
    heart(hx, hy, 22, '#3a1a1a');
    ctx.save(); ctx.beginPath();
    ctx.rect(hx, hy, p.hp >= (i + 1) * 2 ? 30 : p.hp === i * 2 + 1 ? 11 : 0, 40); ctx.clip();
    heart(hx, hy, 22, '#e33'); ctx.restore();
  }
  ctx.fillStyle = '#f5d142'; ctx.beginPath(); ctx.arc(24, 54, 7, 0, 7); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.font = 'bold 18px sans-serif'; ctx.textAlign = 'left';
  ctx.strokeStyle = '#000'; ctx.lineWidth = 3; ctx.strokeText('x ' + S.coins, 38, 61); ctx.fillText('x ' + S.coins, 38, 61);
  const q = S.done ? '✔ Cristal devolvido!' : S.hasCrystal ? 'Leve o cristal ao Seu Zé (praça)' : S.quest ? 'Missão: Cristal da Mandiroba' : 'Fale com o Seu Zé na praça';
  ctx.font = '14px sans-serif'; ctx.strokeText(q, 14, VH - 14); ctx.fillText(q, 14, VH - 14);
  if (S.showMap) {
    ctx.globalAlpha = 0.85; ctx.drawImage(miniCv, VW - MW * 2 - 10, 10); ctx.globalAlpha = 1;
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.strokeRect(VW - MW * 2 - 10, 10, MW * 2, MH * 2);
    if (Math.floor(S.time * 3) % 2) { ctx.fillStyle = '#f22'; ctx.fillRect(VW - MW * 2 - 10 + p.x / TS * 2 - 2, 10 + p.y / TS * 2 - 2, 5, 5); }
  }
  if (S.bannerT > 0) {
    ctx.globalAlpha = Math.min(1, S.bannerT); ctx.textAlign = 'center';
    ctx.font = 'bold 30px Georgia, serif'; ctx.strokeStyle = '#000'; ctx.lineWidth = 6;
    ctx.strokeText(S.banner, VW / 2, 110); ctx.fillStyle = '#fff5c8'; ctx.fillText(S.banner, VW / 2, 110); ctx.globalAlpha = 1;
  }
  if (S.dialog) {
    textBox(null, 30, VH - 170, VW - 60, 150);
    ctx.textAlign = 'left'; ctx.fillStyle = '#f5d142'; ctx.font = 'bold 18px sans-serif'; ctx.fillText(S.dialog.name, 50, VH - 140);
    ctx.fillStyle = '#fff'; ctx.font = '18px sans-serif';
    wrap(S.dialog.lines[S.dialog.i], VW - 120).forEach((l, i) => ctx.fillText(l, 50, VH - 110 + i * 24));
    ctx.fillStyle = '#aaa'; ctx.font = '13px sans-serif'; ctx.textAlign = 'right'; ctx.fillText('Enter ▶', VW - 50, VH - 32);
  }
  if (S.paused) overlay('PAUSADO', 'P ou Esc para continuar');
  if (S.mode === 'dead') overlay('Você desmaiou de calor...', 'Enter para tentar de novo');
}
function overlay(t, s) {
  ctx.fillStyle = 'rgba(0,0,0,.65)'; ctx.fillRect(0, 0, VW, VH);
  ctx.textAlign = 'center'; ctx.fillStyle = '#fff'; ctx.font = 'bold 40px Georgia, serif'; ctx.fillText(t, VW / 2, VH / 2 - 10);
  ctx.font = '20px sans-serif'; ctx.fillStyle = '#ccc'; ctx.fillText(s, VW / 2, VH / 2 + 30);
}
function drawTitle() {
  const cx = 34 * TS - VW / 2, cy = 30 * TS - VH / 2;
  ctx.drawImage(mapCv, cx, cy, VW, VH, 0, 0, VW, VH);
  ctx.fillStyle = 'rgba(10,20,40,.72)'; ctx.fillRect(0, 0, VW, VH);
  ctx.textAlign = 'center';
  ctx.font = 'bold 64px Georgia, serif'; ctx.fillStyle = '#f5d142'; ctx.strokeStyle = '#000'; ctx.lineWidth = 8;
  ctx.strokeText('ZELDA GBI', VW / 2, 150); ctx.fillText('ZELDA GBI', VW / 2, 150);
  ctx.font = 'italic 24px Georgia, serif'; ctx.fillStyle = '#fff'; ctx.fillText('A Lenda da Serra da Mandiroba', VW / 2, 190);
  ctx.font = '18px sans-serif'; ctx.fillStyle = '#ddd';
  ['Setas / WASD: andar', 'Z ou J: espada   ·   X ou K (segurar): escudo', 'Enter ou E: falar   ·   M: minimapa   ·   P: pausa'].forEach((l, i) => ctx.fillText(l, VW / 2, 260 + i * 28));
  ctx.font = 'bold 24px sans-serif'; ctx.fillStyle = '#fff';
  if (Math.floor(performance.now() / 500) % 2) ctx.fillText('Enter: Novo jogo' + (getSave() ? '   ·   C: Continuar' : ''), VW / 2, 440);
}

// ---------- Loop ----------
S = { mode: 'title' };
let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  if (S.mode === 'title') {
    if (pressed('enter', ' ')) newState();
    else if (pressed('c') && getSave()) newState(getSave());
  } else {
    if (pressed('p', 'escape') && S.mode === 'play') S.paused = !S.paused;
    if (pressed('m')) S.showMap = !S.showMap;
    if (S.mode === 'dead') { if (pressed('enter')) { const { coins, quest, hasCrystal, done, bossDead } = S; newState({ x: START.x, y: START.y, hp: 12, coins, quest, hasCrystal, done, bossDead }); } }
    else if (!S.paused) update(dt);
  }
  draw();
  pressedKeys.clear();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
