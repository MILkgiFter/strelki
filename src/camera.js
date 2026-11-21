// Камера больших полей: масштаб, сдвиг, кнопки «+ / −», колесо. Состояние — st.cam.
import { CAMERA } from './config.js';
import { unlock } from './sound.js';
import { view, hudTop, hudBottom } from './render.js';
import { $ } from './store.js';

let st = null;

// ---------- камера (большие поля) ----------
export function maxZoom() {
  const L = view(window.innerWidth, window.innerHeight, { ...st, cam: null });
  return Math.max(1, CAMERA.maxCellPx / L.cell);
}
// поле не уезжает совсем: центр видимой области всегда над полем
export function clampCam() {
  const c = st.cam;
  c.z = Math.min(maxZoom(), Math.max(1, c.z));
  // поле двигается при любом масштабе, но его край не уходит дальше центра экрана
  const L = view(window.innerWidth, window.innerHeight, st);
  const cx = window.innerWidth / 2;
  const cy = (L.top + L.bottom) / 2;
  c.ox = Math.min(cx - L.base.x, Math.max(cx - L.base.x - L.bw, c.ox));
  c.oy = Math.min(cy - L.base.y, Math.max(cy - L.base.y - L.bh, c.oy));
}
// приближение вокруг точки экрана (px, py): точка поля под ней остаётся на месте
export function zoomAt(px, py, factor) {
  const L = view(window.innerWidth, window.innerHeight, st);
  const fx = (px - L.x) / L.cell;
  const fy = (py - L.y) / L.cell;
  const c = st.cam;
  c.z = Math.min(maxZoom(), Math.max(1, c.z * factor));
  const cell = L.base.cell * c.z;
  c.ox = px - fx * cell - L.base.x;
  c.oy = py - fy * cell - L.base.y;
  clampCam();
}
// кнопки «+ / −» только там, где клетка мелкая
export function zoomButtons() {
  const L = view(window.innerWidth, window.innerHeight, { ...st, cam: null });
  $('zoom').hidden = L.cell >= CAMERA.smallCellPx;
}
export const viewCenter = () => [window.innerWidth / 2, (hudTop() + window.innerHeight - hudBottom()) / 2];
export function initCamera(state, canvas) {
  st = state;
  $('zoom-in').addEventListener('click', () => {
    unlock();
    zoomAt(...viewCenter(), CAMERA.zoomStep);
  });
  $('zoom-out').addEventListener('click', () => {
    unlock();
    zoomAt(...viewCenter(), 1 / CAMERA.zoomStep);
  });
  canvas.addEventListener(
    'wheel',
    (e) => {
      if (!st.grid) return;
      e.preventDefault();
      zoomAt(e.clientX, e.clientY, Math.exp(-e.deltaY * CAMERA.wheelK));
    },
    { passive: false },
  );
}
