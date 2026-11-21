// Логика уровня: генерация, проверка пути, решатель, геометрия движения. Без DOM — тестируется отдельно.
//
// Поле w×h, grid[y*w+x] — ссылка на фигуру, STONE (камень) или null.
// Фигура (стрелка-«змейка») = { id, dir, cells, len, head, color }:
// cells[0] — голова (нос), дальше тело к хвосту по соседним клеткам (может изгибаться).
// Инварианты: cells[1] = голова − dir (последний отрезок смотрит туда же, куда нос);
// ни одна своя клетка не лежит на луче головы — поэтому тело никогда не мешает себе.
// Замок: p.lock — змейка-ключ (у неё key: true); замок выпускается, только когда ключа на поле нет.
import { DIFFICULTY, GEN_JITTER, RHYTHM, DAILY, STONES, LOCKS } from './config.js';
import { SHAPES, RECT, shapeMask, shapeAspect, shapeFill } from './shapes.js';
import { LANDMARKS } from './landmarks.js';
import { OBJECTS } from './shapes-objects.js';
import { NATURE } from './shapes-nature.js';
import { abstractShape, KINDS } from './abstract.js';

export const DIRS = { U: [0, -1], R: [1, 0], D: [0, 1], L: [-1, 0] };
const DIR_KEYS = Object.keys(DIRS);
export const PALETTE_SIZE = 5;

// Детерминированный ГПСЧ: один номер уровня = одинаковое поле у всех
export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Фигуры: начиная с 3-го уровня узнаваемые и абстрактные чередуются.
// Узнаваемые идут по кругу без повторов (каждый круг — своя перестановка), абстрактные
// генерируются по номеру уровня — каждая своя. На «гигантских» уровнях — достопримечательности.
const RECOGNIZABLE = [...SHAPES, ...OBJECTS, ...NATURE, { ...RECT, name: 'Классика' }];
function permutation(n, seed) {
  const rand = rng(seed);
  const idx = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [idx[i], idx[j]] = [idx[j], idx[i]];
  }
  return idx;
}
const permCache = new Map();
const C = RHYTHM.cycle.length;
const isNamed = (t) => RHYTHM.cycle[t % C].named && !RHYTHM.cycle[t % C].mega;
// перестановка видов абстрактных фигур для круга kr; первый вид круга не совпадает с последним прошлого
function kindPerm(kr) {
  const key = 'k' + kr;
  if (!permCache.has(key)) {
    const p = permutation(KINDS.length, kr * 104729 + 11);
    if (kr > 0) {
      const prev = kindPerm(kr - 1);
      if (p[0] === prev[prev.length - 1]) [p[0], p[1]] = [p[1], p[0]];
    }
    permCache.set(key, p);
  }
  return permCache.get(key);
}

export function shapeFor(levelNum) {
  if (levelNum <= RHYTHM.introLevels) return RECT;
  const k = levelNum - RHYTHM.introLevels - 1;
  const round = Math.floor(k / C);
  const beat = RHYTHM.cycle[k % C];
  if (beat.mega) return LANDMARKS[round % LANDMARKS.length];
  if (!beat.named) {
    // абстрактные виды идут по очереди (каждый круг — новая перестановка): один вид не раньше чем через KINDS.length
    let ai = 0;
    for (let t = 0; t < k; t++) if (!RHYTHM.cycle[t % C].named) ai++;
    const K = KINDS.length;
    const kind = KINDS[kindPerm(Math.floor(ai / K))[ai % K]];
    return abstractShape(levelNum, kind);
  }
  // какой по счёту это узнаваемый слот
  const perRound = RHYTHM.cycle.filter((b) => b.named && !b.mega).length;
  let j = round * perRound;
  for (let t = round * C; t < k; t++) if (isNamed(t)) j++;
  const L = RECOGNIZABLE.length;
  const r = Math.floor(j / L);
  if (!permCache.has(r)) permCache.set(r, permutation(L, r * 7919 + 3));
  return RECOGNIZABLE[permCache.get(r)[j % L]];
}

// Номер дня от DAILY.epoch по местной дате (0, 1, 2…)
export function dayIndex(date) {
  const [y, m, d] = DAILY.epoch;
  return Math.max(0, Math.round((Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) - Date.UTC(y, m, d)) / 864e5));
}

// Ежедневный уровень: «виртуальный» номер уровня на большом такте с узнаваемой фигурой,
// каждый день — новый круг ритма далеко за обычными уровнями
export function dailyLevel(day) {
  const C = RHYTHM.cycle.length;
  const slots = [];
  RHYTHM.cycle.forEach((b, i) => {
    if (b.named && b.tag === 'big') slots.push(i);
  });
  return RHYTHM.introLevels + 1 + (DAILY.firstRound + day) * C + slots[day % slots.length];
}

// Параметры уровня: базовая ступень сложности × «такт» ритма (лёгкий / обычный / сложный / большой)
// × форма поля. Сетка подбирается под пропорции фигуры, площадь — под ступень и такт.
export function params(levelNum) {
  const tier = DIFFICULTY.find((row) => levelNum <= row.upTo);
  if (levelNum <= RHYTHM.introLevels) return { ...tier, shape: RECT, tag: '' };
  const beat = RHYTHM.cycle[(levelNum - RHYTHM.introLevels - 1) % RHYTHM.cycle.length];
  const shape = shapeFor(levelNum);
  const a = shapeAspect(shape);
  const snakes = Math.max(beat.minSnakes || 3, Math.round(tier.snakes * beat.count));
  const box = (snakes * RHYTHM.cellsPerSnake) / shapeFill(shape);
  const boxCells = Math.min(box, beat.maxCells || Infinity);
  let cols = Math.sqrt(boxCells * a);
  let rows = cols / a;
  // фигуру должно быть видно (меньшая сторона ≥ shapeMinSide), но поле не больше экрана
  const up = Math.max(1, (beat.minSide || RHYTHM.shapeMinSide) / Math.min(cols, rows));
  const k = Math.min(up, (beat.maxCols || RHYTHM.maxCols) / cols, (beat.maxRows || RHYTHM.maxRows) / rows);
  cols = Math.max(RHYTHM.minSide, Math.round(cols * k));
  rows = Math.max(RHYTHM.minSide, Math.round(rows * k));
  // длина змеек — из площади фигуры и нужного числа змеек: так сложность задаёт число, а не размер
  const cells = cols * rows * shapeFill(shape) * tier.fill;
  const avg = Math.max(2.5, cells / snakes);
  const minLen = Math.max(2, Math.round(avg * 0.45));
  const maxLen = Math.max(minLen + 2, Math.round(avg * 1.5));
  return { ...tier, cols, rows, minLen, maxLen, shape, tag: beat.tag, snakes };
}

// Сколько свободных клеток до препятствия; blocked = упёрлась ли в стрелку
export function probe(grid, w, h, x, y, dir) {
  const [dx, dy] = DIRS[dir];
  let cx = x + dx;
  let cy = y + dy;
  let free = 0;
  while (cx >= 0 && cy >= 0 && cx < w && cy < h) {
    if (grid[cy * w + cx]) return { blocked: true, free };
    free++;
    cx += dx;
    cy += dy;
  }
  return { blocked: false, free };
}

// Камень: неподвижная клетка-препятствие, одна общая ссылка на все камни поля
export const STONE = Object.freeze({ stone: true, id: -1, cells: [], len: 0 });
export const isPiece = (v) => !!v && !v.stone;
export const pieces = (grid) => [...new Set(grid.filter(isPiece))];
export const cellXY = (c, w) => [c % w, Math.floor(c / w)];
export const headXY = (p, w) => cellXY(p.head, w);
export const probePiece = (grid, w, h, p) => probe(grid, w, h, ...headXY(p, w), p.dir);
// замок закрыт, пока его ключ на поле (клетка головы ключа всё ещё его)
export const isLocked = (grid, p) => !!p.lock && grid[p.lock.head] === p.lock;
export const isFree = (grid, w, h, p) => !isLocked(grid, p) && !probePiece(grid, w, h, p).blocked;
export function removePiece(grid, p) {
  for (const c of p.cells) grid[c] = null;
}

// Строим поле «от решения»: каждая новая змейка ставится только туда,
// откуда у её носа есть свободный путь. Обратный порядок постройки = решение.
// Делаем несколько вариантов и берём самый запутанный.
export function generate(levelNum) {
  const p = params(levelNum);
  const rand = rng(levelNum * 9973 + 17);
  let best = null;
  let bestScore = -Infinity;
  const mask = shapeMask(p.shape, p.cols, p.rows);
  // камни ставятся до змеек: лучи сквозь них не проходят, поэтому решаемость сохраняется
  const stones = levelNum >= STONES.fromLevel ? placeStones(mask, p.cols, p.rows, rng(levelNum * 7919 + 3)) : [];
  for (let t = 0; t < p.tries; t++) {
    const ctx = { grid: new Array(mask.length).fill(null) };
    for (const c of stones) ctx.grid[c] = STONE;
    const grid = p.ringLen ? buildRinged(p, rand, mask, ctx) : buildOnce(p, rand, mask, mask, ctx);
    const s = score(analyze(grid, p.cols, p.rows));
    if (s > bestScore) {
      bestScore = s;
      best = grid;
    }
  }
  if (p.freeTarget) flipFree(best, p.cols, p.rows, p.freeTarget);
  colorize(best, p.cols, p.rows, rand);
  if (levelNum >= LOCKS.fromLevel) addLocks(best, p.cols, p.rows, rng(levelNum * 6151 + 11));
  // пустых точек внутри фигуры не остаётся: незанятые клетки (куда змейку поставить нельзя) убираем из фигуры
  let shown = mask;
  if (levelNum > RHYTHM.introLevels) {
    shown = mask.slice();
    for (let c = 0; c < shown.length; c++) if (!best[c]) shown[c] = 0;
  }
  return { w: p.cols, h: p.rows, grid: best, mask: shown, shape: p.shape, tag: p.tag, stones };
}

// Пары «замок–ключ»: замок — змейка, свободная рано, ключ — уходящая хотя бы на keyLag волн позже.
// Ключ сам замком не бывает; после каждой пары уровень перепроверяется решателем (замок не должен
// загораживать путь своему ключу).
function addLocks(grid, w, h, rand) {
  const wave = new Map();
  const g = grid.slice();
  let left = pieces(g);
  for (let r = 0; left.length; r++) {
    const free = left.filter((p) => isFree(g, w, h, p));
    if (!free.length) break;
    for (const p of free) {
      wave.set(p, r);
      removePiece(g, p);
    }
    left = left.filter((p) => !wave.has(p));
  }
  const all = pieces(grid);
  const want = Math.min(LOCKS.max, Math.max(1, Math.round(all.length / LOCKS.perSnakes)));
  const used = new Set();
  const locks = all.filter((p) => wave.get(p) <= 1).sort(() => rand() - 0.5);
  let made = 0;
  for (const L of locks) {
    if (made >= want) break;
    if (used.has(L)) continue;
    const keys = all
      .filter((K) => !used.has(K) && K !== L && wave.get(K) >= wave.get(L) + LOCKS.keyLag)
      .map((K) => [K, (K.color === L.color ? 0 : 1) + rand()])
      .sort((a, b) => a[1] - b[1]);
    for (const [K] of keys) {
      L.lock = K;
      if (!analyze(grid, w, h).solved) {
        delete L.lock;
        continue;
      }
      K.key = true;
      L.color = K.color;
      used.add(L).add(K);
      made++;
      break;
    }
  }
}

// Камни — во внутренних клетках фигуры (все 8 соседей внутри), не ближе gap друг к другу
function placeStones(mask, W, H, rand) {
  const inner = [];
  let inside = 0;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (!mask[y * W + x]) continue;
      inside++;
      let ok = true;
      for (let dy = -1; dy <= 1 && ok; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const X = x + dx;
          const Y = y + dy;
          if (X < 0 || Y < 0 || X >= W || Y >= H || !mask[Y * W + X]) ok = false;
        }
      }
      if (ok) inner.push(y * W + x);
    }
  }
  const want = Math.min(STONES.max, Math.max(STONES.min, Math.round(inside * STONES.density)));
  for (let i = inner.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [inner[i], inner[j]] = [inner[j], inner[i]];
  }
  const out = [];
  for (const c of inner) {
    if (out.length >= want) break;
    const x = c % W;
    const y = Math.floor(c / W);
    if (out.every((o) => Math.max(Math.abs((o % W) - x), Math.abs(Math.floor(o / W) - y)) >= STONES.gap)) out.push(c);
  }
  return out;
}

// Чем меньше змеек свободно на старте и чем длиннее цепочка — тем сложнее
function score({ count, freeStart, rounds }) {
  return rounds * 2 - (freeStart / count) * RHYTHM.freeWeight;
}

// Постройка в две фазы: сначала внутренность, потом кольцо по краю фигуры длинными змейками.
// Если строить всё сразу от центра, к краю лучи внутрь и вдоль края уже закрыты — краевые змейки
// смотрят наружу и свободны с самого начала (лишние варианты хода). Змейки кольца идут вдоль края
// и закрывают друг друга. Сетка, лучи и нумерация общие — проходимость гарантирована как прежде.
function buildRinged(p, rand, mask, ctx = {}) {
  const { cols: W, rows: H } = p;
  const ring = new Uint8Array(mask.length);
  const inner = mask.slice();
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const c = y * W + x;
      if (!mask[c]) continue;
      let edge = false;
      for (let dy = -1; dy <= 1 && !edge; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const X = x + dx;
          const Y = y + dy;
          if (X < 0 || Y < 0 || X >= W || Y >= H || !mask[Y * W + X]) edge = true;
        }
      }
      if (edge) {
        ring[c] = 1;
        inner[c] = 0;
      }
    }
  }
  buildOnce(p, rand, inner, mask, ctx);
  return buildOnce({ ...p, maxLen: p.ringLen }, rand, ring, mask, ctx);
}

// Свободные на старте змейки (от поставленных последними) разворачиваются: нос — на место хвоста.
// Разворот остаётся, только если уровень решаем и свободных на старте стало меньше.
function flipFree(grid, w, h, target) {
  let st = analyze(grid, w, h);
  const list = pieces(grid).sort((a, b) => b.id - a.id);
  for (const p of list) {
    if (st.freeStart / st.count <= target) break;
    if (p.len < 2 || !isFree(grid, w, h, p)) continue;
    const a = p.cells[p.len - 2];
    const b = p.cells[p.len - 1];
    const dx = (b % w) - (a % w);
    const dy = Math.floor(b / w) - Math.floor(a / w);
    const dir = DIR_KEYS.find((k) => DIRS[k][0] === dx && DIRS[k][1] === dy);
    const old = { cells: p.cells, head: p.head, dir: p.dir };
    Object.assign(p, { cells: p.cells.slice().reverse(), head: b, dir });
    const s = analyze(grid, w, h);
    if (s.solved && s.freeStart < st.freeStart) st = s;
    else Object.assign(p, old);
  }
}

// Узор тела змейки — «руль» на каждом шаге роста от головы к хвосту: 'S' прямо, 'L'/'R' поворот.
// meander — случайные повороты; serp — серпантин (длинный прогон, разворот, прогон обратно);
// hook — крючок/спираль (поворачивает в одну сторону, прогоны укорачиваются);
// zigzag — лесенка (поворот то влево, то вправо через 1–2 шага).
function makePattern(weights, turn, rand) {
  const kinds = Object.keys(weights);
  let total = 0;
  for (const k of kinds) total += weights[k];
  let r = rand() * total;
  let kind = kinds[kinds.length - 1];
  for (const k of kinds) {
    if ((r -= weights[k]) <= 0) {
      kind = k;
      break;
    }
  }
  const side = () => (rand() < 0.5 ? 'L' : 'R');
  let st;
  const init = () => {
    st = { step: 0, side: side(), run: 2 + Math.floor(rand() * 4), phase: 0 };
  };
  init();
  const flip = (sd) => (sd === 'L' ? 'R' : 'L');
  return {
    kind,
    reset: init,
    next(rnd) {
      st.step++;
      switch (kind) {
        case 'serp': // прогон run → поворот → 1 шаг → поворот в ту же сторону → прогон обратно
          if (st.phase === 0) {
            if (st.step < st.run) return 'S';
            st.phase = 1;
            return st.side;
          }
          if (st.phase === 1) {
            st.phase = 2;
            return 'S';
          }
          if (st.phase === 2) {
            st.phase = 0;
            st.step = 0;
            const sd = st.side;
            st.side = flip(sd);
            return sd;
          }
          return 'S';
        case 'hook': // поворот в одну сторону, прогоны укорачиваются — крючок, переходящий в спираль
          if (st.step < st.run) return 'S';
          st.step = 0;
          st.run = Math.max(1, st.run - 1);
          return st.side;
        case 'zigzag': // лесенка
          if (st.step < 2) return 'S';
          st.step = 0;
          st.side = flip(st.side);
          return st.side;
        default: // meander
          return rnd() < turn ? side() : 'S';
      }
    },
  };
}

// mask — где ставить змеек в этой фазе, fmask — вся фигура (для веса лучей), ctx — общее состояние фаз
function buildOnce({ cols: W, rows: H, fill, bias, minLen, maxLen, turn, patterns = { meander: 1 } }, rand, mask, fmask = mask, ctx = {}) {
  const N = W * H;
  let inside = 0;
  for (let i = 0; i < N; i++) inside += mask[i];
  const grid = ctx.grid || (ctx.grid = new Array(N).fill(null));
  // rayMax[c] — наибольший id змейки, чей луч проходит через клетку c
  const rayMax = ctx.rayMax || (ctx.rayMax = new Int32Array(N).fill(-1));
  const target = Math.max(2, Math.round(inside * fill));
  // клетка доступна змейке: внутри фигуры и не занята
  const open = (c) => mask[c] && !grid[c];
  const inb = (x, y) => x >= 0 && y >= 0 && x < W && y < H;
  const cx = (W - 1) / 2;
  const cy = (H - 1) / 2;
  const all = ctx.all || (ctx.all = []);
  let filled = 0;

  // 1) головы: обход пустых клеток от центра наружу; тело растёт случайным блужданием
  for (let pass = 0; pass < RHYTHM.passes && filled < target; pass++) {
    const order = [];
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        if (!open(y * W + x)) continue;
        const d = Math.max(Math.abs(x - cx) / W, Math.abs(y - cy) / H) * 20;
        order.push({ x, y, k: d + rand() * GEN_JITTER });
      }
    }
    order.sort((a, b) => a.k - b.k);

    for (const { x, y } of order) {
      if (filled >= target) break;
      if (grid[y * W + x]) continue;
      // направления: луч до края пуст, клетка позади головы пуста; длинный луч весит больше
      // в последнем проходе разрешены стрелки из одной клетки (одиночные дыры)
      const single = pass === RHYTHM.passes - 1 && turn > 0;
      const options = [];
      let total = 0;
      for (const dir of DIR_KEYS) {
        const [dx, dy] = DIRS[dir];
        const bx = x - dx;
        const by = y - dy;
        if (!single && (!inb(bx, by) || !open(by * W + bx))) continue;
        const pr = probe(grid, W, H, x, y, dir);
        if (pr.blocked) continue;
        // вес — сколько клеток фигуры на луче ещё свободны: их займут следующие змейки и закроют путь.
        // Клетки вне фигуры не считаются — их никто не займёт, такая змейка будет свободна с самого начала
        let fillable = 0;
        for (let ax = x + dx, ay = y + dy; inb(ax, ay); ax += dx, ay += dy) if (fmask[ay * W + ax] && !grid[ay * W + ax]) fillable++;
        const wgt = Math.pow(fillable + 1, bias) * (fillable ? 1 : RHYTHM.outwardK);
        options.push([dir, wgt, fillable]);
        total += wgt;
      }
      if (!options.length) continue;
      // голову, которой некуда смотреть, кроме как сразу наружу, в первых проходах не ставим:
      // клетку займёт хвост соседа, иначе такая змейка свободна с самого начала (лишний вариант хода)
      if (pass < RHYTHM.passes - RHYTHM.outwardLatePasses && options.every((o) => o[2] === 0)) continue;
      let r = rand() * total;
      let dir = options[options.length - 1][0];
      for (const [d, wgt] of options) {
        if ((r -= wgt) <= 0) {
          dir = d;
          break;
        }
      }

      const [dx, dy] = DIRS[dir];
      const id = all.length;
      const ray = new Set();
      for (let ax = x + dx, ay = y + dy; inb(ax, ay); ax += dx, ay += dy) ray.add(ay * W + ax);

      const len = minLen + Math.floor(rand() * (maxLen - minLen + 1));
      const behind = inb(x - dx, y - dy) && open((y - dy) * W + (x - dx));
      const cells = behind ? [y * W + x, (y - dy) * W + (x - dx)] : [y * W + x];
      const used = new Set(cells);
      let px = x - dx;
      let py = y - dy;
      let pdx = -dx;
      let pdy = -dy;
      const pat = makePattern(patterns, turn, rand);
      while (behind && cells.length < len && filled + cells.length < target) {
        const cand = [];
        for (const d of DIR_KEYS) {
          const [ex, ey] = DIRS[d];
          const nx = px + ex;
          const ny = py + ey;
          if (!inb(nx, ny)) continue;
          const c = ny * W + nx;
          if (!open(c) || used.has(c) || ray.has(c)) continue;
          // степень — сколько пустых соседей; поворот к «тесной» клетке не оставляет дыр
          let deg = 0;
          for (const e of DIR_KEYS) {
            const [fx, fy] = DIRS[e];
            const mx = nx + fx;
            const my = ny + fy;
            if (inb(mx, my) && open(my * W + mx) && !used.has(my * W + mx)) deg++;
          }
          cand.push({ nx, ny, c, ex, ey, straight: ex === pdx && ey === pdy, deg, r: rand() });
        }
        if (!cand.length) break;
        let pick = null;
        if (turn === 0) {
          pick = cand.find((c) => c.straight); // обучающие уровни — только прямые
          if (!pick) break;
        } else {
          // узор просит «прямо / налево / направо»; нельзя — берём, что есть
          const want = pat.next(rand);
          const [wx, wy] = want === 'S' ? [pdx, pdy] : want === 'L' ? [pdy, -pdx] : [-pdy, pdx];
          pick = cand.find((c) => c.ex === wx && c.ey === wy);
          if (!pick) {
            pat.reset();
            cand.sort((p1, p2) => p2.straight - p1.straight || p1.deg - p2.deg || p1.r - p2.r);
            pick = cand[0];
          }
        }
        cells.push(pick.c);
        used.add(pick.c);
        px = pick.nx;
        py = pick.ny;
        pdx = pick.ex;
        pdy = pick.ey;
      }

      // короткие «огрызки» в первых проходах не ставим: пустоту потом займут хвосты соседей
      if (pass < RHYTHM.passes - 2 && cells.length < Math.min(minLen, RHYTHM.minStub)) continue;
      const piece = { id, dir, cells, len: 0, head: cells[0], color: 0 };
      all.push(piece);
      for (const c of cells) grid[c] = piece;
      filled += cells.length;
      for (const c of ray) rayMax[c] = Math.max(rayMax[c], id);
    }
    // после каждого прохода хвосты сначала дотягиваются в пустоты — меньше коротких «затычек»
    extendTails(maxLen + 4);
  }
  // последний шанс закрыть пустоты: хвосты тянутся без ограничения длины — змейки закручиваются
  extendTails(Infinity);

  // 2) дотягивание хвостов в пустоты: клетка не на луче своей или более поздней змейки —
  // проходимость сохраняется (более поздние змейки к моменту выпуска этой уже уехали)
  function extendTails(capLen) {
  let changed = true;
  while (changed && filled < target && turn > 0) { // на обучающих уровнях (turn 0) — только прямые
    changed = false;
    for (const p of all) {
      if (p.cells.length >= capLen || filled >= target) continue;
      // голова продвигается в пустую клетку прямо перед носом: новый луч — часть старого,
      // а более поздние змейки (их лучи) через эту клетку не идут — проходимость сохраняется
      const [hx, hy] = cellXY(p.head, W);
      const [fdx, fdy] = DIRS[p.dir];
      const f = (hy + fdy) * W + (hx + fdx);
      if (inb(hx + fdx, hy + fdy) && open(f) && rayMax[f] <= p.id) {
        p.cells.unshift(f);
        p.head = f;
        grid[f] = p;
        filled++;
        changed = true;
        continue;
      }
      const [tx, ty] = cellXY(p.cells[p.cells.length - 1], W);
      for (const d of DIR_KEYS) {
        const [ex, ey] = DIRS[d];
        // у стрелки из одной клетки хвост растёт только назад: последний отрезок смотрит туда же, куда нос
        if (p.cells.length === 1 && (ex !== -fdx || ey !== -fdy)) continue;
        const nx = tx + ex;
        const ny = ty + ey;
        if (!inb(nx, ny)) continue;
        const c = ny * W + nx;
        if (!open(c) || rayMax[c] >= p.id) continue;
        p.cells.push(c);
        grid[c] = p;
        filled++;
        changed = true;
        break;
      }
    }
  }
  }

  for (const p of all) p.len = p.cells.length;
  return grid;
}

// Цвет на змейку: соседи по стороне получают разные цвета, чтобы было видно, где кончается линия
function colorize(grid, W, H, rand) {
  const list = pieces(grid).sort((a, b) => a.id - b.id);
  for (const p of list) {
    const near = new Set();
    for (const c of p.cells) {
      const [x, y] = cellXY(c, W);
      for (const [dx, dy] of Object.values(DIRS)) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
        const q = grid[ny * W + nx];
        if (isPiece(q) && q !== p && q.id < p.id) near.add(q.color);
      }
    }
    const offset = Math.floor(rand() * PALETTE_SIZE);
    p.color = offset;
    for (let k = 0; k < PALETTE_SIZE; k++) {
      const col = (offset + k) % PALETTE_SIZE;
      if (!near.has(col)) {
        p.color = col;
        break;
      }
    }
  }
}

// Сложность поля: сколько змеек свободно сразу и за сколько «волн» оно решается
// (волна = выпустить все свободные одновременно).
// Выпуск свободной змейки никогда не мешает остальным, поэтому solved — точный ответ.
export function analyze(grid, w, h) {
  const g = grid.slice();
  let left = pieces(g);
  const count = left.length;
  let rounds = 0;
  let freeStart = -1;
  for (;;) {
    const free = new Set(left.filter((p) => isFree(g, w, h, p)));
    if (freeStart < 0) freeStart = free.size;
    if (!free.size) break;
    for (const p of free) removePiece(g, p);
    left = left.filter((p) => !free.has(p));
    rounds++;
  }
  return { count, freeStart, rounds, solved: left.length === 0 };
}

export const solve = (grid, w, h) => analyze(grid, w, h);

// Любая змейка, которую можно выпустить прямо сейчас (для подсказки)
export function findFree(grid, w, h) {
  return pieces(grid).find((p) => isFree(grid, w, h, p)) || null;
}

// ---------- геометрия движения ----------
// Путь змейки в координатах клеток: центры от хвоста к голове, дальше прямо по dir на extra клеток.
// Точка с индексом i лежит на расстоянии i от хвоста (шаги единичные).
export function trajectory(p, w, extra) {
  const pts = [];
  for (let k = p.cells.length - 1; k >= 0; k--) pts.push(cellXY(p.cells[k], w));
  const [dx, dy] = DIRS[p.dir];
  const [hx, hy] = cellXY(p.head, w);
  const n = Math.ceil(extra);
  for (let k = 1; k <= n; k++) pts.push([hx + dx * k, hy + dy * k]);
  return pts;
}

function pointAt(P, t) {
  const i = Math.min(Math.max(0, Math.floor(t)), P.length - 2);
  const f = t - i;
  const [ax, ay] = P[i];
  const [bx, by] = P[i + 1];
  return [ax + (bx - ax) * f, ay + (by - ay) * f];
}

// Ломаная, занимающая участок пути [s, s + len − 1]: хвост на s, голова на s + len − 1
export function windowAt(P, s, len) {
  const a = s;
  const b = s + len - 1;
  if (P.length < 2) return [P[0].slice()];
  const out = [pointAt(P, a)];
  for (let i = Math.floor(a) + 1; i < b && i < P.length; i++) out.push(P[i].slice());
  out.push(pointAt(P, b));
  return out;
}
