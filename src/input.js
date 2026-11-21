// Ввод на поле: тап (подсветка при нажатии, действие при отпускании), сдвиг, щипок.
import { ANIM, LAYOUT, CAMERA } from './config.js';
import { unlock } from './sound.js';
import { view } from './render.js';
import { cellXY, isPiece } from './level.js';
import { zoomAt, clampCam } from './camera.js';

let st = null;
let canvas = null;
let act = null; // (piece) => void — тап или ластик, решает main.js

// ---------- ввод ----------
// Змейка под точкой экрана: своя клетка, иначе ближайшая занятая соседняя (промах пальцем мимо тонкой линии)
function pieceAt(clientX, clientY) {
  if (!st.grid) return null;
  const L = view(window.innerWidth, window.innerHeight, st);
  const fx = (clientX - L.x) / L.cell;
  const fy = (clientY - L.y) / L.cell;
  const x = Math.floor(fx);
  const y = Math.floor(fy);
  const now = performance.now();
  // ещё не проявившуюся при появлении поля змейку тапнуть нельзя — её не видно
  const shown = (p) => {
    const [hx, hy] = cellXY(p.head, st.w);
    return now - st.bornT > ((hx + hy) / (st.w + st.h)) * ANIM.appearTotalMs;
  };
  const inb = (cx, cy) => cx >= 0 && cy >= 0 && cx < st.w && cy < st.h;
  const own = inb(x, y) ? st.grid[y * st.w + x] : null;
  if (isPiece(own) && shown(own)) return own;
  let best = null;
  let bestD = LAYOUT.hitRadius;
  for (let cy = y - 1; cy <= y + 1; cy++) {
    for (let cx = x - 1; cx <= x + 1; cx++) {
      if (!inb(cx, cy) || !isPiece(st.grid[cy * st.w + cx]) || !shown(st.grid[cy * st.w + cx])) continue;
      const d = Math.hypot(fx - (cx + 0.5), fy - (cy + 0.5));
      if (d < bestD) {
        bestD = d;
        best = st.grid[cy * st.w + cx];
      }
    }
  }
  return best;
}

// ---------- касания ----------
// Один палец: нажатие подсвечивает змейку, действие — при отпускании (палец можно довести до нужной линии).
// На приближенном поле сдвиг дальше dragPx — перетаскивание. Два пальца — щипок и сдвиг.
const touches = new Map(); // pointerId → { x, y }
let gesture = null; // { kind: 'tap' | 'pan' | 'pinch', ... }

function pinchInfo() {
  const [a, b] = [...touches.values()];
  return { d: Math.hypot(a.x - b.x, a.y - b.y), mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2 };
}

function endPointer(e, cancel) {
  if (!touches.delete(e.pointerId)) return;
  if (gesture && gesture.kind === 'tap' && gesture.id === e.pointerId && !cancel) {
    const p = st.press && st.press.piece;
    st.press = null;
    if (p && st.grid[p.head] === p) {
      act(p);
    }
  }
  if (touches.size === 0) {
    gesture = null;
    st.press = null;
  } else if (gesture && gesture.kind === 'pinch') {
    // после щипка оставшийся палец только двигает поле
    const [[id, t]] = [...touches.entries()];
    gesture = { kind: 'pan', id, x: t.x, y: t.y };
  }
}
export function initInput(state, cv, onPiece) {
  st = state;
  canvas = cv;
  act = onPiece;
  canvas.addEventListener('pointerdown', (e) => {
    if (!st.grid || e.button !== 0) return;
    unlock();
    try {
      canvas.setPointerCapture(e.pointerId); // движение и отпускание придут сюда, даже если палец ушёл на HUD
    } catch {
      /* не критично */
    }
    touches.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (touches.size === 2) {
      st.press = null; // второй палец — щипок; тап первого отменяется
      gesture = { kind: 'pinch', ...pinchInfo() };
      return;
    }
    if (touches.size > 2) return;
    const p = st.over ? null : pieceAt(e.clientX, e.clientY);
    st.press = p ? { id: p.id, piece: p, pointerId: e.pointerId } : null;
    gesture = { kind: 'tap', id: e.pointerId, x0: e.clientX, y0: e.clientY, x: e.clientX, y: e.clientY };
  });

  canvas.addEventListener('pointermove', (e) => {
    const t = touches.get(e.pointerId);
    if (!t || !gesture) return;
    t.x = e.clientX;
    t.y = e.clientY;
    if (gesture.kind === 'pinch') {
      if (touches.size < 2) return;
      const now = pinchInfo();
      zoomAt(now.mx, now.my, now.d / Math.max(1, gesture.d));
      st.cam.ox += now.mx - gesture.mx;
      st.cam.oy += now.my - gesture.my;
      clampCam();
      Object.assign(gesture, now);
      return;
    }
    if (gesture.id !== e.pointerId) return;
    if (gesture.kind === 'tap' && Math.hypot(e.clientX - gesture.x0, e.clientY - gesture.y0) > CAMERA.dragPx) {
      gesture.kind = 'pan';
      st.press = null;
    }
    if (gesture.kind === 'pan') {
      st.cam.ox += e.clientX - gesture.x;
      st.cam.oy += e.clientY - gesture.y;
      clampCam();
    } else {
      const p = st.over ? null : pieceAt(e.clientX, e.clientY);
      st.press = p ? { id: p.id, piece: p, pointerId: e.pointerId } : null;
    }
    gesture.x = e.clientX;
    gesture.y = e.clientY;
  });

  canvas.addEventListener('pointerup', (e) => endPointer(e, false));
  canvas.addEventListener('pointercancel', (e) => endPointer(e, true));
}
