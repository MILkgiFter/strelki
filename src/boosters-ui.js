// Бустеры и их интерфейс: лупа, ластик, жизнь, всплывающая строка (тост).
import { GAME, BOOSTERS } from './config.js';
import { spend } from './boosters.js';
import { t } from './i18n.js';
import { sfx, unlock } from './sound.js';
import { view } from './render.js';
import { findFree, removePiece, cellXY } from './level.js';
import { clampCam, viewCenter } from './camera.js';
import { $ } from './store.js';
import { adsReady, showRewarded } from './ads.js';
import { grantSet } from './boosters.js';
import { boosterPackButton } from './offer-ui.js';

let st = null;
let boost = null;
let saveBoost = null;
let updateHud = null;

let toastTimer = 0;
export function toast(text) {
  $('toast').textContent = text;
  $('toast').hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => ($('toast').hidden = true), BOOSTERS.toastMs);
}
export function setMode(mode) {
  st.mode = mode;
  if (mode === 'erase') {
    $('toast').textContent = t('eraseToast');
    $('toast').hidden = false;
    clearTimeout(toastTimer);
  } else {
    $('toast').hidden = true;
  }
  updateHud();
}
// ластик: стрелка тает на месте, жизнь не тратится; выпуск стрелки никому не мешает — уровень остаётся решаемым
export function erase(piece) {
  if (st.bumps.has(piece.id)) return; // стрелка ещё в отскоке — как и обычный тап
  if (!spend(boost, 'eraser')) return setMode(null);
  st.usedBoost = true;
  saveBoost();
  removePiece(st.grid, piece);
  st.list = st.list.filter((q) => q !== piece);
  st.erased.push({ piece, t0: performance.now() });
  if (st.hint && st.hint.id === piece.id) st.hint = null;
  st.touched = true;
  sfx.fly(0, piece.len);
  setMode(null);
}
export function useLife() {
  if (st.over) return;
  if (st.lives >= GAME.lives) return toast(t('lifeFull'));
  if (!spend(boost, 'life')) return noBoost('life');
  st.usedBoost = true;
  st.usedLife = true;
  saveBoost();
  st.lives++;
  sfx.hint();
  updateHud();
}

export function useHint() {
  if (st.over || (st.hint && !st.hint.hold)) return; // пока подсказка горит — новую не тратим (подсветка обучения — не в счёт)
  if (boost.hint <= 0) return noBoost('hint');
  const piece = findFree(st.grid, st.w, st.h);
  if (!piece) return;
  spend(boost, 'hint');
  st.usedBoost = true;
  saveBoost();
  st.hint = { id: piece.id, t0: performance.now() };
  // на приближенном или сдвинутом поле подсказанная змейка может быть за краем экрана — подводим камеру
  if (st.cam.z > 1 || st.cam.ox || st.cam.oy) {
    const L = view(window.innerWidth, window.innerHeight, st);
    const [hx, hy] = cellXY(piece.head, st.w);
    const [cx, cy] = viewCenter();
    st.cam.ox += cx - (L.x + (hx + 0.5) * L.cell);
    st.cam.oy += cy - (L.y + (hy + 0.5) * L.cell);
    clampCam();
  }
  sfx.hint();
  updateHud();
}

// бустер закончился: в приложении — предложить ролик за +1, иначе просто сообщить
const AD_ICONS = { hint: '🔍', eraser: '🧽', life: '♥' };
export function noBoost(kind) {
  boosterPackButton(); // пак бустеров — вторая кнопка, только если стор отвечает
  if (!adsReady() && $('adoffer-buy').hidden) return toast(t('noBoost'));
  $('adoffer-title').textContent = t('adBoost', AD_ICONS[kind]);
  $('adoffer-watch').hidden = !adsReady();
  $('adoffer').hidden = false;
  $('adoffer-no').onclick = () => ($('adoffer').hidden = true);
  $('adoffer-watch').onclick = async () => {
    if ($('adoffer').hidden) return; // уже нажато — ролик идёт
    $('adoffer').hidden = true;
    if (!(await showRewarded())) return;
    grantSet(boost, { [kind]: 1 });
    saveBoost();
    updateHud();
    sfx.hint();
    toast(t('reward', '+1 ' + AD_ICONS[kind]));
  };
}

export function initBoostersUI(api) {
  ({ st, boost, saveBoost, updateHud } = api);
  $('b-eraser').addEventListener('click', () => {
    unlock();
    sfx.click();
    if (st.over) return;
    if (st.mode === 'erase') return setMode(null);
    if (boost.eraser <= 0) return noBoost('eraser');
    setMode('erase');
  });
  $('b-life').addEventListener('click', () => {
    unlock();
    useLife();
  });
  $('b-hint').addEventListener('click', () => {
    unlock();
    useHint();
  });
}
