// Отрисовка поля на Canvas. Только рисует: состояние не меняет.
// Змейка — одна линия по центрам клеток со скруглёнными изгибами и наконечником на голове.
import { ANIM, LAYOUT, COLORS, SNAKE, CAMERA, BOOSTERS } from './config.js';
import { DIRS, cellXY, trajectory, windowAt } from './level.js';
import { shapeAspect, shapeMask } from './shapes.js';

// отступы безопасной зоны экрана (вырез iPhone) в px; main.js обновляет при resize
export const safe = { top: 0, bottom: 0 };
export const hudTop = () => LAYOUT.hudTop + safe.top;
export const hudBottom = () => LAYOUT.hudBottom + safe.bottom;

// Силуэт фигуры для альбома: клетки маски одним цветом в квадратном холсте size×size (css px)
export function drawSilhouette(cv, shape, color, size, cellsLong) {
  const a = shapeAspect(shape);
  const cols = Math.max(4, Math.round(a >= 1 ? cellsLong : cellsLong * a));
  const rows = Math.max(4, Math.round(a >= 1 ? cellsLong / a : cellsLong));
  const m = shapeMask(shape, cols, rows);
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  cv.width = Math.round(size * dpr);
  cv.height = Math.round(size * dpr);
  cv.style.width = cv.style.height = size + 'px';
  const g = cv.getContext('2d');
  g.scale(dpr, dpr);
  const c = size / Math.max(cols, rows);
  const ox = (size - c * cols) / 2;
  const oy = (size - c * rows) / 2;
  g.fillStyle = color;
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      // +0.5 px — без щелей между клетками
      if (m[y * cols + x]) g.fillRect(ox + x * c, oy + y * c, c + 0.5, c + 0.5);
    }
  }
}

// cols×rows клеток; extraTop — дополнительное место сверху (текст обучения)
export function layout(w, h, cols, rows, extraTop = 0) {
  const top = hudTop() + extraTop;
  const availH = Math.max(0, h - top - hudBottom() - LAYOUT.pad * 2);
  const availW = Math.max(0, Math.min(w - LAYOUT.pad * 2 - ANIM.shakePx * 2, LAYOUT.maxBoard));
  // подложка выступает за поле — учитываем её, чтобы ничего не обрезалось
  const b = 2 * LAYOUT.backing;
  const cell = Math.min(availW / (cols + b), availH / (rows + b), LAYOUT.maxCell);
  const bw = cell * cols;
  const bh = cell * rows;
  return { x: (w - bw) / 2, y: top + LAYOUT.pad + (availH - bh) / 2, bw, bh, cell };
}

// Поле с учётом камеры: zoom 1 — всё поле видно; ox/oy — сдвиг левого верхнего угла поля в px
export function view(w, h, st) {
  const base = layout(w, h, st.w, st.h, st.tutorial ? LAYOUT.tutorialH : 0);
  const c = st.cam || { z: 1, ox: 0, oy: 0 };
  return {
    base,
    zoom: c.z,
    x: base.x + c.ox,
    y: base.y + c.oy,
    cell: base.cell * c.z,
    bw: base.bw * c.z,
    bh: base.bh * c.z,
    // видимая область между HUD (для обрезки и ограничения сдвига)
    top: hudTop(),
    bottom: h - hudBottom(),
  };
}

const lineWidth = (cell) => Math.min(SNAKE.maxWidthPx, Math.max(SNAKE.minWidthPx, cell * SNAKE.width));

// easing back-out: 0→1 с перелётом за 1
function backOut(t, s) {
  const u = t - 1;
  return 1 + (s + 1) * u * u * u + s * u * u;
}

// pts — ломаная в координатах клеток (от хвоста к голове), dir — куда смотрит наконечник
function drawSnake(ctx, L, pts, dir, color, width, alpha) {
  if (alpha <= 0) return;
  const { cell } = L;
  const px = [];
  for (const [x, y] of pts) {
    const X = L.x + (x + 0.5) * cell;
    const Y = L.y + (y + 0.5) * cell;
    const last = px[px.length - 1];
    if (!last || Math.abs(last[0] - X) > 0.01 || Math.abs(last[1] - Y) > 0.01) px.push([X, Y]);
  }
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // тело
  if (px.length > 1) {
    ctx.beginPath();
    ctx.moveTo(px[0][0], px[0][1]);
    for (let i = 1; i < px.length - 1; i++) {
      const [ax, ay] = px[i - 1];
      const [bx, by] = px[i];
      const [cx, cy] = px[i + 1];
      const r = Math.min(SNAKE.bendRadius * cell, Math.hypot(bx - ax, by - ay) / 2, Math.hypot(cx - bx, cy - by) / 2);
      ctx.arcTo(bx, by, cx, cy, r);
    }
    ctx.lineTo(px[px.length - 1][0], px[px.length - 1][1]);
    ctx.stroke();
  }

  // наконечник: треугольник по направлению, кончик впереди центра головы
  const [hx, hy] = px[px.length - 1];
  const [dx, dy] = DIRS[dir];
  const tip = SNAKE.headAhead * cell;
  const base = tip - SNAKE.headLen * cell;
  const half = (SNAKE.headWidth * cell) / 2;
  ctx.beginPath();
  ctx.moveTo(hx + dx * tip, hy + dy * tip);
  ctx.lineTo(hx + dx * base - dy * half, hy + dy * base + dx * half);
  ctx.lineTo(hx + dx * base + dy * half, hy + dy * base - dx * half);
  ctx.closePath();
  ctx.lineWidth = width * 0.35;
  ctx.fill();
  ctx.stroke();
  ctx.globalAlpha = 1;
}

// мягкое облачко там, где был хвост: несколько полупрозрачных кругов
// расплываются и чуть сносятся назад, против хода хвоста
function drawPuff(ctx, L, f, now, color, w) {
  const t = (now - f.t0) / ANIM.puffMs;
  if (t >= 1) return;
  const { cell } = L;
  const p = f.piece;
  const [tx, ty] = cellXY(p.cells[p.len - 1], w);
  // «назад» = от предпоследней клетки к хвосту; у стрелки из одной клетки — против направления
  const [qx, qy] = p.len > 1 ? cellXY(p.cells[p.len - 2], w) : [tx + DIRS[p.dir][0], ty + DIRS[p.dir][1]];
  const dx = tx - qx;
  const dy = ty - qy;
  const e = 1 - (1 - t) * (1 - t); // ease-out
  const ox = L.x + (tx + 0.5) * cell;
  const oy = L.y + (ty + 0.5) * cell;
  ctx.fillStyle = color;
  ctx.globalAlpha = ANIM.puffAlpha * (1 - t);
  for (let i = 0; i < ANIM.puffCount; i++) {
    const side = ANIM.puffCount > 1 ? (i / (ANIM.puffCount - 1)) * 2 - 1 : 0;
    const along = ANIM.puffDist * e * (1 - 0.4 * Math.abs(side));
    const x = ox + (dx * along - dy * side * 0.35 * e) * cell;
    const y = oy + (dy * along + dx * side * 0.35 * e) * cell;
    const r = ANIM.puffSize * cell * (0.6 + 0.8 * e) * (1 - 0.3 * Math.abs(side));
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

// Фон уровня: силуэт фигуры (скруглённые клетки сливаются в одно пятно) и точки в центрах клеток.
// Точки под змейками не видны (линия проходит через центр), поэтому фон от хода игры не зависит.
let bgCache = { key: '', canvas: null };
// Холст строится в масштабе «всё поле видно» (L.base), с плотностью под текущее приближение
// (ступенями по 0.5, не больше CAMERA.maxTexture px) и рисуется растянутым на zoom.
function background(ctx, st, L) {
  const dpr = ctx.getTransform().a || 1;
  const z = L.zoom;
  const cell = L.base.cell;
  const pad = cell * LAYOUT.backing;
  const cw = L.base.bw + pad * 2;
  const ch = L.base.bh + pad * 2;
  if (!(cw >= 1 && ch >= 1)) return null; // окно ещё без размера (скрыто/сворачивается)
  const zq = Math.ceil(z * 2) / 2;
  const dens = Math.min(dpr * zq, CAMERA.maxTexture / cw, CAMERA.maxTexture / ch);
  const key = `${st.level}|${st.w}x${st.h}|${cell.toFixed(3)}|${dens.toFixed(2)}`;
  if (bgCache.key !== key) {
    const cv = document.createElement('canvas');
    cv.width = Math.ceil(cw * dens);
    cv.height = Math.ceil(ch * dens);
    const g = cv.getContext('2d');
    g.scale(dens, dens);
    g.fillStyle = COLORS.board;
    g.beginPath();
    const r = Math.min(pad * 2, cell * 0.5);
    for (let y = 0; y < st.h; y++) {
      for (let x = 0; x < st.w; x++) {
        if (st.mask && !st.mask[y * st.w + x]) continue;
        g.roundRect(x * cell, y * cell, cell + pad * 2, cell + pad * 2, r);
      }
    }
    g.fill();
    g.fillStyle = COLORS.dot;
    g.beginPath();
    const dr = Math.max(1, cell * SNAKE.dotR);
    for (let y = 0; y < st.h; y++) {
      for (let x = 0; x < st.w; x++) {
        if (st.mask && !st.mask[y * st.w + x]) continue;
        const X = pad + (x + 0.5) * cell;
        const Y = pad + (y + 0.5) * cell;
        g.moveTo(X + dr, Y);
        g.arc(X, Y, dr, 0, Math.PI * 2);
      }
    }
    g.fill();
    bgCache = { key, canvas: cv };
  }
  return { canvas: bgCache.canvas, pad, cw, ch };
}

// неподвижная змейка — её клетки от хвоста к голове; клетки не меняются, считаем один раз
function bodyPts(p, w) {
  if (!p.pts) {
    p.pts = [];
    for (let k = p.len - 1; k >= 0; k--) p.pts.push(cellXY(p.cells[k], w));
  }
  return p.pts;
}

// рамка змейки в клетках — для отсечения невидимых при приближении
function bodyBox(p, w) {
  if (!p.box) {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const [x, y] of bodyPts(p, w)) {
      x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y);
    }
    p.box = [x0, y0, x1, y1];
  }
  return p.box;
}

// Слой неподвижных змеек: холст размером с экран (+ запас на тряску по бокам) для каждого ctx.
// Ключ — набор змеек на поле (st.list меняется целиком при каждом вылете), «живые» змейки и камера.
const layers = new WeakMap();
function snakeLayer(ctx, st, L, w, h, lw, live) {
  const dpr = ctx.getTransform().a || 1;
  const m = ANIM.shakePx;
  const cw = Math.ceil((w + m * 2) * dpr);
  const ch = Math.ceil(h * dpr);
  if (!(cw >= 1 && ch >= 1)) return null;
  const key = `${st.level}|${st.bornT}|${cw}x${ch}|${dpr}|${L.x}|${L.y}|${L.cell}|${live.map((p) => p.id).join(',')}`;
  let c = layers.get(ctx);
  if (c && c.key === key && c.list === st.list) return c.canvas;
  if (!c || c.canvas.width !== cw || c.canvas.height !== ch) {
    const cv = document.createElement('canvas');
    cv.width = cw;
    cv.height = ch;
    c = { canvas: cv, g: cv.getContext('2d') };
    layers.set(ctx, c);
  }
  const { g } = c;
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.clearRect(0, 0, cw, ch);
  g.setTransform(dpr, 0, 0, dpr, m * dpr, 0);
  const { cell } = L;
  const liveIds = new Set(live.map((p) => p.id));
  for (const p of st.list) {
    if (liveIds.has(p.id)) continue;
    const [x0, y0, x1, y1] = bodyBox(p, st.w);
    // за краем экрана (с запасом в клетку на наконечник и толщину) — не рисуем
    if (L.x + (x1 + 2) * cell < -m || L.x + (x0 - 1) * cell > w + m) continue;
    if (L.y + (y1 + 2) * cell < 0 || L.y + (y0 - 1) * cell > h) continue;
    drawSnake(g, L, bodyPts(p, st.w), p.dir, COLORS.snake[p.color], lw, 1);
  }
  c.key = key;
  c.list = st.list;
  return c.canvas;
}

export function render(ctx, w, h, st, now) {
  if (st.transparent) ctx.clearRect(0, 0, w, h);
  else {
    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, w, h);
  }
  if (!st.grid) return;

  const L = view(w, h, st);
  const { cell } = L;
  const lw = lineWidth(cell);

  // тряска поля при ошибке
  let sx = 0;
  const shakeT = (now - st.shakeT0) / ANIM.shakeMs;
  if (shakeT >= 0 && shakeT < 1) sx = Math.sin(shakeT * Math.PI * 6) * ANIM.shakePx * (1 - shakeT);

  ctx.save();
  // приближенное или сдвинутое поле не залезает под HUD
  ctx.beginPath();
  ctx.rect(0, L.top, w, L.bottom - L.top);
  ctx.clip();
  ctx.translate(sx, 0);

  // силуэт поля и точки клеток — неподвижны, рисуются один раз в отдельный холст
  if (st.showBg !== false) {
    const bg = background(ctx, st, L);
    if (bg) ctx.drawImage(bg.canvas, L.x - bg.pad * L.zoom, L.y - bg.pad * L.zoom, bg.cw * L.zoom, bg.ch * L.zoom);
  }

  // пока горит подсказка, остальные змейки приглушены
  let dimK = 0;
  if (st.hint) {
    const ht = now - st.hint.t0;
    dimK = Math.max(0, Math.min(1, ht / ANIM.hintFadeMs, (ANIM.hintShowMs - ht) / ANIM.hintFadeMs));
  }
  const othersAlpha = 1 - (1 - ANIM.hintDim) * dimK;
  const pressId = st.press ? st.press.id : -1;
  const diag = st.w + st.h;
  const isLive = (p) => st.bumps.has(p.id) || st.pops.has(p.id) || p.id === pressId || (st.hint && st.hint.id === p.id);

  // Неподвижные змейки лежат в отдельном холсте и перерисовываются, только когда меняется
  // их набор или камера; каждый кадр рисуются лишь «живые» (отскок, нажатие, подсказка).
  // Во время волны появления и для разовых отрисовок (фон заставки) — всё напрямую.
  const appearing = now - (st.bornT || 0) < ANIM.appearTotalMs + ANIM.appearMs;
  let list;
  if (!appearing && !st.transparent) {
    const live = st.list.filter(isLive);
    const layer = snakeLayer(ctx, st, L, w, h, lw, live);
    if (layer) {
      ctx.globalAlpha = othersAlpha;
      const dpr = ctx.getTransform().a || 1;
      ctx.drawImage(layer, -ANIM.shakePx, 0, layer.width / dpr, layer.height / dpr); // 1:1 по пикселям
      ctx.globalAlpha = 1;
      list = live;
    }
  }
  // змейки на поле; дёргающиеся и выделенные рисуем последними — поверх соседей
  if (!list) list = st.list.slice().sort((a, b) => (isLive(a) ? 1 : 0) - (isLive(b) ? 1 : 0));
  for (const p of list) {
    const [hx, hy] = cellXY(p.head, st.w);
    // появление: волна по диагонали, линия «вырастает» с лёгким перелётом
    const at = (now - (st.bornT || 0) - ((hx + hy) / diag) * ANIM.appearTotalMs) / ANIM.appearMs;
    if (at <= 0) continue;
    const grow = at < 1 ? backOut(at, ANIM.appearOvershoot) : 1;

    let s = 0;
    const bump = st.bumps.get(p.id);
    if (bump) s = Math.sin(Math.min(1, (now - bump.t0) / bump.dur) * Math.PI) * bump.amount;
    let width = lw * grow;
    const pop = st.pops.get(p.id);
    if (pop) width *= 1 + Math.sin(Math.min(1, (now - pop) / ANIM.popMs) * Math.PI) * 0.3;
    if (p.id === pressId) width *= SNAKE.pressScale;
    const isHint = st.hint && st.hint.id === p.id;
    const alpha = Math.min(1, at * 2) * (isHint ? 1 : othersAlpha);
    if (isHint) {
      const pulse = 0.5 + 0.5 * Math.sin(((now - st.hint.t0) / ANIM.hintPulseMs) * Math.PI * 2);
      width *= 1 + (SNAKE.hintScale - 1) * pulse * dimK;
      s += ANIM.hintNudge * pulse * dimK; // «кивок» туда, куда змейка уедет
    }
    const pts = s > 0 ? windowAt(trajectory(p, st.w, s + 1), s, p.len) : bodyPts(p, st.w);
    drawSnake(ctx, L, pts, p.dir, COLORS.snake[p.color], width, alpha);
  }

  // стёртые ластиком: тают на месте — тоньше и прозрачнее
  for (const e of st.erased || []) {
    const k = Math.min(1, (now - e.t0) / BOOSTERS.eraseMs);
    drawSnake(ctx, L, bodyPts(e.piece, st.w), e.piece.dir, COLORS.snake[e.piece.color], lw * (1 + k * 0.6) * (1 - k), 1 - k);
  }

  // уезжающие змейки: тело ползёт по своему пути, за краем — плавно исчезает
  for (const f of st.flyers) {
    const p = f.piece;
    const color = COLORS.snake[p.color];
    drawPuff(ctx, L, f, now, color, st.w);
    const s = ((now - f.t0) / 1000) * f.speed;
    const alpha = Math.max(0, 1 - Math.max(0, s - f.toEdge) / ANIM.flyFadeCells);
    if (alpha <= 0) continue;
    drawSnake(ctx, L, windowAt(trajectory(p, st.w, s + 1), s, p.len), p.dir, color, lw, alpha);
  }

  ctx.restore();
}
