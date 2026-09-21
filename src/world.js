'use strict';
// Mundo do jogo: mapa em tiles inspirado em Guanambi (BA) e arredores.
const TS = 32, MW = 96, MH = 72;
const T = { GRASS: 0, ROAD: 1, PLAZA: 2, ROOF: 3, WALL: 4, DOOR: 5, TREE: 6, CROP: 7, FENCE: 8,
  ROCK: 9, MOUNT: 10, WATER: 11, DIRT: 12, HILL: 13, CHURCH: 14, SIDEWALK: 15 };
const SOLID = new Set([T.ROOF, T.WALL, T.DOOR, T.TREE, T.FENCE, T.ROCK, T.MOUNT, T.WATER, T.CHURCH]);

const tiles = new Uint8Array(MW * MH);
const vari = new Uint8Array(MW * MH);

let _seed = 20240917;
function rnd() { _seed = (_seed * 1664525 + 1013904223) >>> 0; return _seed / 4294967296; }
const inb = (x, y) => x >= 0 && y >= 0 && x < MW && y < MH;
function setT(x, y, t, v) {
  if (!inb(x, y)) return;
  tiles[y * MW + x] = t;
  vari[y * MW + x] = v === undefined ? (rnd() * 4 | 0) : v;
}
function fill(x0, y0, x1, y1, t) {
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) setT(x, y, t);
}
const tileAt = (x, y) => inb(x, y) ? tiles[y * MW + x] : T.ROCK;
const isSolidTile = (x, y) => SOLID.has(tileAt(x, y));

function house(x, y, w) {
  w = w || 3;
  const v = rnd() * 4 | 0;
  for (let i = 0; i < w; i++) {
    setT(x + i, y, T.ROOF, v);
    setT(x + i, y + 1, T.ROOF, v);
    setT(x + i, y + 2, i === (w >> 1) ? T.DOOR : T.WALL, v);
  }
}

function blockRanges(rs, hi) {
  const out = [];
  for (let i = 0; i < rs.length; i++) {
    const a = rs[i] + 2, b = i + 1 < rs.length ? rs[i + 1] - 1 : hi - 1;
    if (b - a >= 3) out.push([a, b]);
  }
  return out;
}

// Cidade em grade: ruas a cada 8 tiles, quarteirões com casas e quintais.
function buildTown(x0, y0, x1, y1) {
  fill(x0, y0, x1, y1, T.SIDEWALK);
  const xs = [], ys = [];
  for (let x = x0 + 2; x <= x1 - 3; x += 8) xs.push(x);
  for (let y = y0 + 2; y <= y1 - 3; y += 8) ys.push(y);
  xs.forEach(x => fill(x, y0, x + 1, y1, T.ROAD));
  ys.forEach(y => fill(x0, y, x1, y + 1, T.ROAD));
  for (const [bx0, bx1] of blockRanges(xs, x1)) {
    for (const [by0, by1] of blockRanges(ys, y1)) {
      for (let hx = bx0; hx + 2 <= bx1; hx += 3) {
        house(hx, by0);
        if (by1 - by0 >= 7) house(hx, by1 - 2);
      }
      for (let y = by0 + 3; y <= by1 - (by1 - by0 >= 7 ? 3 : 0); y++)
        for (let x = bx0; x <= bx1; x++) if (rnd() < 0.09) setT(x, y, T.TREE);
    }
  }
}

function field(x0, y0, x1, y1) {
  fill(x0, y0, x1, y1, T.FENCE);
  fill(x0 + 1, y0 + 1, x1 - 1, y1 - 1, T.CROP);
  const gx = (x0 + x1) >> 1;
  setT(gx, y0, T.DIRT); setT(gx + 1, y0, T.DIRT);
  setT(gx, y1, T.DIRT); setT(gx + 1, y1, T.DIRT);
}

function buildWorld() {
  // Caatinga de base, com árvores, pedras e manchas de terra.
  for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
    const r = rnd();
    setT(x, y, r < 0.05 ? T.TREE : r < 0.065 ? T.ROCK : r < 0.12 ? T.DIRT : T.GRASS);
  }

  // Serra de Mutans (cadeia ao norte/nordeste).
  for (let x = 60; x < MW; x++) {
    const h = 20 + Math.round(2 * Math.sin(x * 0.4));
    for (let y = 0; y <= h; y++) setT(x, y, T.MOUNT);
  }
  // Trilha até a Serra da Mandiroba e o platô do Guardião.
  fill(72, 9, 73, 23, T.DIRT);
  fill(72, 8, 80, 9, T.DIRT);
  fill(80, 3, 92, 11, T.DIRT);
  for (let y = 3; y <= 11; y++) for (let x = 80; x <= 92; x++) if (rnd() < 0.06) setT(x, y, T.ROCK);
  fill(85, 6, 87, 8, T.DIRT); // arena livre

  // Guanambi (urbana).
  buildTown(28, 24, 62, 52);
  fill(40, 36, 45, 41, T.PLAZA);           // praça central
  fill(41, 36, 44, 38, T.CHURCH);          // igreja
  setT(42, 36, T.CHURCH, 1);
  setT(40, 41, T.TREE); setT(45, 41, T.TREE); setT(40, 39, T.TREE); setT(45, 39, T.TREE);
  fill(56, 28, 61, 33, T.HILL);            // Monte Pascoal
  [[56, 29], [56, 31], [61, 29], [61, 32], [58, 33], [60, 33], [57, 28], [60, 28]].forEach(([x, y]) => setT(x, y, T.ROCK));

  // Mutans (distrito), Caetité e Palmas de Monte Alta.
  fill(62, 26, 66, 27, T.ROAD);
  buildTown(66, 24, 78, 34);
  fill(62, 42, 80, 43, T.ROAD);
  buildTown(78, 40, 94, 58);
  fill(20, 34, 28, 35, T.ROAD);
  buildTown(4, 32, 20, 44);
  // Igrejas de Caetité e Palmas.
  fill(82, 44, 87, 49, T.SIDEWALK); fill(83, 44, 86, 46, T.CHURCH); setT(84, 44, T.CHURCH, 1);
  fill(8, 36, 13, 41, T.SIDEWALK); fill(9, 36, 12, 38, T.CHURCH); setT(10, 36, T.CHURCH, 1);

  // Zona rural: roças, açude, sítios e trilhas.
  [[30, 56, 44, 66], [8, 50, 22, 60], [48, 56, 64, 66], [76, 64, 92, 70], [10, 8, 26, 20], [36, 6, 52, 16]].forEach(f => field(...f));
  fill(69, 60, 75, 65, T.WATER);
  fill(45, 12, 46, 23, T.DIRT);
  fill(45, 53, 46, 69, T.DIRT);
  fill(20, 46, 21, 49, T.DIRT);
  [[24, 62], [66, 48], [14, 26], [8, 64], [4, 22]].forEach(([x, y]) => house(x, y));

  // Bordas do mapa.
  for (let i = 0; i < MW; i++) [0, 1, MH - 2, MH - 1].forEach(y => setT(i, y, T.TREE));
  for (let j = 0; j < MH; j++) [0, 1, MW - 2, MW - 1].forEach(x => setT(x, j, T.TREE));
  // Início de Link: garante espaço livre.
  fill(33, 42, 36, 43, T.ROAD);
}

// Regiões (primeira que contiver o ponto vence).
const REGIONS = [
  { name: 'Monte Pascoal', x0: 56, y0: 28, x1: 61, y1: 33 },
  { name: 'Serra da Mandiroba', x0: 78, y0: 2, x1: 94, y1: 13 },
  { name: 'Mutans (distrito)', x0: 66, y0: 24, x1: 78, y1: 34 },
  { name: 'Serra de Mutans', x0: 60, y0: 0, x1: 95, y1: 23 },
  { name: 'Caetité', x0: 78, y0: 40, x1: 94, y1: 58 },
  { name: 'Palmas de Monte Alta', x0: 4, y0: 32, x1: 20, y1: 44 },
  { name: 'Guanambi — Área Urbana', x0: 28, y0: 24, x1: 62, y1: 52 },
];
function regionAt(tx, ty) {
  for (const r of REGIONS) if (tx >= r.x0 && tx <= r.x1 && ty >= r.y0 && ty <= r.y1) return r.name;
  return 'Zona Rural de Guanambi';
}

buildWorld();
