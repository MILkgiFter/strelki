// Обучение на первых уровнях (этап 13): палец «нажимает» на свободную стрелку, остальные приглушены
// (та же подсветка, что у лупы, но без таймера). После TUTORIAL.taps улетевших стрелок — «Отлично!» и свобода.
// На ранних уровнях упёршаяся стрелка объясняет, почему не улетела.
import { TUTORIAL, ANIM } from './config.js';
import { t } from './i18n.js';
import { view } from './render.js';
import { findFree, cellXY } from './level.js';
import { $ } from './store.js';
import { toast } from './boosters-ui.js';

let st = null;
let tut = null; // { left, id } — сколько стрелок ещё показать и какую сейчас

const finger = () => $('finger');

export function initTutorial(state) {
  st = state;
}

// новый уровень: вести ли за руку
export function startTutorial(level, daily) {
  tut = !daily && TUTORIAL.levels.includes(level) ? { left: TUTORIAL.taps, id: -1 } : null;
  finger().hidden = true;
  clearTimeout(doneTimer);
  $('tutorial').classList.remove('tut-good');
}

let doneTimer = 0;
function stop(done) {
  tut = null;
  finger().hidden = true;
  if (st.hint && st.hint.hold) st.hint = null;
  if (done) {
    const el = $('tutorial');
    el.textContent = t('tutDone');
    el.classList.add('tut-good');
    el.hidden = false;
    // похвала — ненадолго, чтобы не висела под окном победы
    clearTimeout(doneTimer);
    doneTimer = setTimeout(() => el.classList.contains('tut-good') && (el.hidden = true), TUTORIAL.doneMs);
  }
}

// каждый кадр: держим подсветку на свободной стрелке и ставим над ней палец
export function tutorialFrame(now) {
  if (!tut) return;
  if (st.over) return stop(false);
  if (now - st.bornT < TUTORIAL.fingerDelayMs) return;
  let piece = st.list.find((p) => p.id === tut.id);
  if (!piece || st.flyers.some((f) => f.piece === piece)) {
    piece = findFree(st.grid, st.w, st.h);
    if (!piece) return stop(false);
    tut.id = piece.id;
  }
  // подсветка без срока: держится, пока стрелка не улетит; возвращается, если её сменила лупа или подсветка ключа
  if (!st.hint) st.hint = { id: piece.id, t0: now - ANIM.hintFadeMs, hold: true };
  const L = view(window.innerWidth, window.innerHeight, st);
  // палец — на середине тела: нос с направлением остаётся видно
  const mid = piece.cells[Math.min(piece.cells.length - 1, Math.max(1, Math.floor(piece.cells.length / 2)))];
  const [hx, hy] = cellXY(mid, st.w);
  const x = L.x + (hx + 0.5) * L.cell;
  const y = L.y + (hy + 0.5) * L.cell;
  const f = finger();
  if (f.hidden) {
    // первое появление — сразу на месте, без проезда через весь экран из угла
    f.style.transition = 'none';
    f.style.transform = `translate(${x}px, ${y}px)`;
    f.hidden = false;
    void f.offsetWidth;
    f.style.transition = '';
  } else {
    f.style.transform = `translate(${x}px, ${y}px)`;
  }
}

// стрелка улетела — следующая или конец обучения
export function tutorialFlew(piece) {
  if (!tut || piece.id !== tut.id) return;
  tut.left--;
  tut.id = -1;
  if (st.hint && st.hint.hold && st.hint.id === piece.id) st.hint = null;
  if (tut.left <= 0) stop(true);
}

// стрелка упёрлась: на первых уровнях — понятное объяснение
export function tutorialBlocked(level, daily) {
  if (!daily && level < TUTORIAL.blockedToastLevels) toast(t('tutBlocked'));
}
