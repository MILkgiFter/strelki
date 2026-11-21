// Состояние игры, ввод и экраны.
import { GAME, ANIM, LAYOUT, STARS, SOUND, MENU, CONFETTI, COLORS, CAMERA, SPLASH, ADMIN, BOOSTERS, DAILY, THEMES, THEME, COLORBLIND } from './config.js';
import { initBoosters, grantForStars, grantSet, spend, BOOSTER_KINDS } from './boosters.js';
import { t, shapeName, applyStatic, getLang, setLang } from './i18n.js';
import { sfx, unlock, setEnabled, isEnabled, music, setSfxVolume } from './sound.js';
import { generate, findFree, probePiece, removePiece, pieces, isPiece, isLocked, cellXY, analyze, shapeFor, dayIndex, dailyLevel } from './level.js';

// админская сборка: ?admin=1 — все уровни открыты, прогресс и звёзды не сохраняются
const IS_ADMIN = new URLSearchParams(location.search).has('admin');
let jsErrors = 0;
window.addEventListener('error', () => jsErrors++);
import { render, view, safe, hudTop, hudBottom, drawSilhouette } from './render.js';

const $ = (id) => document.getElementById(id);
const canvas = $('board');
const ctx = canvas.getContext('2d');

const st = {
  level: 1,
  w: 0,
  h: 0,
  press: null, // змейка под пальцем: { id, pointerId }
  grid: null,
  lives: 0,
  flyers: [],
  bumps: new Map(),
  pops: new Map(),
  shakeT0: -1e9,
  hint: null,
  over: false,
  loseAt: 0,
  combo: 0, // выпусков подряд без ошибки (для тона звука)
  comboT: 0,
};
let overlayToken = 0; // отменяет отложенную анимацию звёзд, если оверлей сменился

// ---------- сохранение (может быть недоступно — тогда просто играем) ----------
function load(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw == null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
}
function save(key, value) {
  if (IS_ADMIN && (key === GAME.storageKey || key === GAME.starsKey || key === DAILY.key || key === BOOSTERS.coachKey || key === GAME.volKey)) return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* хранилище недоступно */
  }
}
function loadLevel() {
  const n = parseInt(load(GAME.storageKey, 1), 10);
  return Number.isFinite(n) && n > 0 ? Math.min(n, GAME.maxLevel) : 1;
}
// progress — первый ещё не пройденный уровень; переигровка старых его не уменьшает
let progress = IS_ADMIN ? ADMIN.levels : loadLevel();

let bestStars = load(GAME.starsKey, {});
if (!bestStars || typeof bestStars !== 'object') bestStars = {};
const totalStars = () => Object.values(bestStars).reduce((s, v) => s + (Number(v) || 0), 0);

// ---------- тема оформления ----------
const neonOpen = () => IS_ADMIN || totalStars() >= THEME.neonStars;
let theme = load(THEME.key, 'light') === 'neon' && neonOpen() ? 'neon' : 'light';
let colorblind = load(COLORBLIND.key, false) === true;
function applyTheme(name) {
  theme = name;
  Object.assign(COLORS, THEMES[name], { snake: [...THEMES[name].snake] });
  COLORS.patterns = colorblind;
  if (colorblind && name === 'light') COLORS.snake = [...COLORBLIND.palette];
  document.documentElement.classList.toggle('cb', colorblind);
  document.documentElement.dataset.theme = name;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', COLORS.bg);
}
applyTheme(theme);

// микшер: громкость музыки и звуков 0..1 (старые выключатели переносятся: выкл = 0)
const vol = (() => {
  const v = load(GAME.volKey, null);
  const ok = (x) => Number.isFinite(Number(x)) ? Math.min(1, Math.max(0, Number(x))) : null;
  return {
    music: ok(v?.music) ?? (load(GAME.musicKey, true) === false ? 0 : 1),
    sfx: ok(v?.sfx) ?? (load(GAME.soundKey, true) === false ? 0 : 1),
  };
})();
function applyVolume() {
  setEnabled(vol.sfx > 0);
  setSfxVolume(vol.sfx);
  music.setEnabled(vol.music > 0);
  music.setVolume(vol.music);
}
applyVolume();
// музыка стартует с первым касанием (раньше браузер не даёт звук)
let musicStarted = false;
function startMusic() {
  if (musicStarted || !music.isEnabled()) return;
  musicStarted = true;
  unlock();
  music.start();
}
document.addEventListener('pointerdown', startMusic, true);
document.addEventListener('keydown', startMusic, true);
// запас бустеров (в админке — бесконечный и не сохраняется)
const boost = initBoosters(IS_ADMIN ? { hint: 50, eraser: 50, life: 50 } : load(GAME.boostKey, null));
const saveBoost = () => {
  if (!IS_ADMIN) save(GAME.boostKey, boost);
};
st.showBg = load(GAME.bgKey, false) === true; // клетки под фигурой — по умолчанию выключены

// ежедневный уровень: дата последнего прохождения (награда — раз в день)
const todayKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
let dailyDate = load(DAILY.key, null)?.date || '';
const dailyDoneToday = () => dailyDate === todayKey();
const startDaily = () => startLevel(dailyLevel(dayIndex(new Date())), true);

// подсказка о бустерах: один раз, когда игрок дошёл до BOOSTERS.coachFrom (в админке не мешает прогону)
let coachSeen = IS_ADMIN || load(BOOSTERS.coachKey, false) === true;
function showCoach(on) {
  $('coach').hidden = !on;
  document.body.classList.toggle('coaching', on);
}
function closeCoach() {
  if ($('coach').hidden) return;
  showCoach(false);
  coachSeen = true;
  save(BOOSTERS.coachKey, true);
}

// ---------- уровень ----------
// daily — ежедневный уровень: прогресс и звёзды не меняет, своя награда
function startLevel(n, daily = false) {
  const { w, h, grid, mask, shape, tag, stones } = generate(n);
  Object.assign(st, {
    level: n,
    w,
    h,
    mask,
    stones,
    shape,
    tag,
    list: pieces(grid), // змейки на поле (чтобы не собирать их из сетки каждый кадр)
    winAt: 0, // когда показать окно победы (после финала с фигурой)
    daily,
    press: null,
    cam: { z: 1, ox: 0, oy: 0 },
    grid,
    lives: GAME.lives,
    mode: null, // 'erase' — следующий тап убирает стрелку ластиком
    erased: [],
    flyers: [],
    hint: null,
    over: false,
    loseAt: 0,
    shakeT0: -1e9,
    tutorial: t('tutorial')[n] || '',
    bornT: performance.now(), // старт анимации появления
    touched: false, // был ли хоть один тап
  });
  st.full = st.list; // вся картинка — для финала
  st.bumps.clear();
  st.pops.clear();
  $('finale').hidden = true;
  closeOverlay();
  hideScreens();
  zoomButtons();
  $('toast').hidden = true;
  $('tutorial').textContent = st.tutorial;
  $('tutorial').hidden = !st.tutorial;
  showCoach(!coachSeen && n >= BOOSTERS.coachFrom);
  updateHud();
}

function updateHud() {
  $('level').textContent = st.daily ? t('daily') : t('level', st.level);
  $('hearts').innerHTML = Array.from(
    { length: GAME.lives },
    (_, i) => `<span class="heart${i < st.lives ? '' : ' empty'}">♥</span>`,
  ).join('');
  for (const k of BOOSTER_KINDS) {
    $('c-' + k).textContent = boost[k];
    $('b-' + k).classList.toggle('empty', boost[k] <= 0);
  }
  $('b-eraser').classList.toggle('active', st.mode === 'erase');
  $('stars-total').textContent = `★ ${totalStars()}`;
  // фигура и такт ритма: «Звезда · сложный»
  const info = [shapeName(st.shape), t('tags')[st.tag]].filter(Boolean).join(' · ');
  $('level-info').textContent = info;
  $('level-info').className = `level-info ${st.tag || ''}`;
  $('sound').textContent = vol.sfx > 0 || vol.music > 0 ? '🔊' : '🔇';
}

function showOverlay(title, sub, btn, action, stars = 0) {
  const token = ++overlayToken;
  $('ov-continue').hidden = true;
  $('ov-reward').hidden = true;
  $('ov-title').textContent = title;
  $('ov-sub').textContent = sub;
  $('ov-btn').textContent = btn;
  $('ov-btn').onclick = () => {
    sfx.click();
    action();
  };
  const row = $('ov-stars');
  row.hidden = !stars;
  row.querySelectorAll('.star').forEach((el, i) => {
    el.classList.remove('on');
    if (i < stars) {
      setTimeout(() => {
        if (token !== overlayToken) return;
        el.classList.add('on');
        sfx.star(i);
      }, STARS.delayMs * (i + 1.5));
    }
  });
  $('overlay').hidden = false;
}

// скрыть оверлей и отменить его отложенные звёзды
function closeOverlay() {
  overlayToken++;
  $('confetti').innerHTML = '';
  $('overlay').hidden = true;
}

// ---------- действия ----------
// piece — змейка, по которой тапнули (любая её клетка)
function tap(piece) {
  unlock();
  if (st.over || !piece || st.bumps.has(piece.id)) return;
  st.touched = true;
  const now = performance.now();
  const locked = isLocked(st.grid, piece);
  const p = locked ? { blocked: true, free: 0 } : probePiece(st.grid, st.w, st.h, piece);
  st.pops.set(piece.id, now);
  // замок закрыт: стрелка дёргается на месте, ключ того же цвета подсвечивается
  if (locked) st.hint = { id: piece.lock.id, t0: now, key: true };

  if (!p.blocked) {
    removePiece(st.grid, piece);
    st.list = st.list.filter((q) => q !== piece);
    st.pops.delete(piece.id);
    // змейка целиком покидает поле, когда хвост проползёт free + len клеток
    const toEdge = p.free + piece.len;
    const speed = Math.max(ANIM.flySpeed, (toEdge * 1000) / ANIM.flyMaxMs);
    st.flyers.push({ piece, t0: now, toEdge, speed });
    if (st.hint && st.hint.id === piece.id) st.hint = null;
    st.combo = now - st.comboT < SOUND.comboWindowMs ? st.combo + 1 : 0;
    st.comboT = now;
    sfx.fly(st.combo, piece.len);
    return;
  }

  sfx.bump();
  st.combo = 0;
  try {
    // до первого настоящего касания браузер блокирует вибрацию и пишет ошибку в консоль
    if (navigator.userActivation?.hasBeenActive !== false) navigator.vibrate?.(GAME.vibrateMs);
  } catch {
    /* вибрация недоступна */
  }

  // путь занят: стрелка доезжает до препятствия и возвращается
  const amount = p.free + ANIM.bumpTouch;
  const bump = { t0: now, amount, dur: ANIM.bumpMs + Math.min((p.free * 2 * 1000) / ANIM.bumpSpeed, ANIM.bumpMaxMs) };
  st.bumps.set(piece.id, bump);
  st.shakeT0 = now;
  st.lives--;
  updateHud();
  if (st.lives <= 0) {
    st.over = true;
    st.loseAt = now + bump.dur + 150;
    updateHud();
  }
}

function useHint() {
  if (st.over || st.hint) return; // пока подсказка горит — новую не тратим
  if (boost.hint <= 0) return toast(t('noBoost'));
  const piece = findFree(st.grid, st.w, st.h);
  if (!piece) return;
  spend(boost, 'hint');
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

function win() {
  st.over = true;
  showCoach(false); // не мешает финалу; не видели до конца — покажется на следующем уровне
  setMode(null);
  const stars = Math.max(1, Math.min(3, st.lives));
  let prev = 0;
  if (st.daily) {
    // ежедневный: прогресс и звёзды не трогаем, награда — только за первое прохождение за день
    const first = !dailyDoneToday();
    st.winGot = first ? grantSet(boost, DAILY.reward) : [];
    if (first) {
      dailyDate = todayKey();
      save(DAILY.key, { date: dailyDate });
    }
  } else {
    if (st.level + 1 > progress && st.level < GAME.maxLevel) {
      progress = st.level + 1;
      save(GAME.storageKey, progress);
    }
    prev = Number(bestStars[st.level]) || 0;
    if (stars > prev) {
      bestStars[st.level] = stars;
      save(GAME.starsKey, bestStars);
    }
    // награда: бустеры за каждую новую звезду (сразу — даже если окно победы не дождутся)
    st.winGot = grantForStars(boost, Math.max(0, stars - prev));
  }
  saveBoost();
  updateHud();
  sfx.win();
  // финал: картинка собирается заново целиком, над ней — название; окно победы — следом
  const name = shapeName(st.shape);
  if (name) {
    const now = performance.now();
    Object.assign(st, { list: st.full, bornT: now, cam: { z: 1, ox: 0, oy: 0 }, hint: null, press: null, tutorial: name });
    st.bumps.clear();
    st.pops.clear();
    zoomButtons();
    $('tutorial').hidden = true;
    $('finale').textContent = t('finale', name);
    $('finale').hidden = false;
    st.winAt = now + ANIM.finaleMs;
    st.winStars = { stars, prev };
  } else showWin(stars, prev);
}

function showWin(stars, prev) {
  $('finale').hidden = true;
  const sub = st.daily ? t('dailyWin') : prev > stars ? t('record', '★'.repeat(prev)) : stars < 3 ? t('try3') : t('perfect');
  // после ежедневного «Дальше» ведёт к основному пути
  showOverlay(t('starTitles')[stars], sub, t('next'), () => startLevel(st.daily ? progress : st.level + 1), stars);
  const icons = { hint: '🔍', eraser: '🧽', life: '♥' };
  const got = st.winGot || [];
  $('ov-reward').hidden = !got.length;
  $('ov-reward').textContent = got.length ? t('reward', got.map((k) => '+1 ' + icons[k]).join('  ')) : '';
  confetti(stars);
}

// конфетти поверх всего; кусочки — DOM-элементы с CSS-анимацией, удаляются сами
function confetti(stars) {
  const box = $('confetti');
  box.innerHTML = '';
  const colors = [...Object.values(COLORS.dir), COLORS.hint];
  const n = CONFETTI.perStar * stars;
  for (let i = 0; i < n; i++) {
    const el = document.createElement('i');
    const dur = CONFETTI.minMs + Math.random() * (CONFETTI.maxMs - CONFETTI.minMs);
    el.style.cssText =
      `left:${Math.random() * 100}vw;background:${colors[i % colors.length]};` +
      `--dx:${(Math.random() * 2 - 1) * CONFETTI.spreadVw}vw;--rot:${(Math.random() * 4 - 2) * 360}deg;` +
      `animation-duration:${dur}ms;animation-delay:${Math.random() * 300}ms`;
    el.addEventListener('animationend', () => el.remove());
    box.appendChild(el);
  }
}

function lose() {
  sfx.lose();
  setMode(null);
  showOverlay(t('loseTitle'), t('loseSub'), t('restart'), () => startLevel(st.level, st.daily));
  // «Продолжить» за бустер-жизнь: игра идёт дальше с того же места
  if (boost.life > 0) {
    $('ov-continue').hidden = false;
    $('ov-continue').textContent = t('continueLife', boost.life - 1);
    $('ov-continue').onclick = () => {
      if (!spend(boost, 'life')) return;
      saveBoost();
      sfx.hint();
      st.lives = 1;
      st.over = false;
      st.loseAt = 0;
      closeOverlay();
      updateHud();
    };
  }
}

// ---------- бустеры ----------
let toastTimer = 0;
function updateThemeButton() {
  $('theme-name').textContent = t(theme === 'neon' ? 'themeNeon' : 'themeLight');
  $('theme-note').textContent = neonOpen() ? t('themeSwitch') : t('themeLocked', THEME.neonStars);
}
$('theme-btn').addEventListener('click', () => {
  unlock();
  sfx.click();
  if (!neonOpen()) return toast(t('themeLocked', THEME.neonStars));
  applyTheme(theme === 'neon' ? 'light' : 'neon');
  save(THEME.key, theme);
  updateThemeButton();
});

$('cb').addEventListener('click', () => {
  unlock();
  sfx.click();
  colorblind = !colorblind;
  save(COLORBLIND.key, colorblind);
  applyTheme(theme);
  toast(t(colorblind ? 'cbOn' : 'cbOff'));
});

function toast(text) {
  $('toast').textContent = text;
  $('toast').hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => ($('toast').hidden = true), BOOSTERS.toastMs);
}
function setMode(mode) {
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
function erase(piece) {
  if (st.bumps.has(piece.id)) return; // стрелка ещё в отскоке — как и обычный тап
  if (!spend(boost, 'eraser')) return setMode(null);
  saveBoost();
  removePiece(st.grid, piece);
  st.list = st.list.filter((q) => q !== piece);
  st.erased.push({ piece, t0: performance.now() });
  if (st.hint && st.hint.id === piece.id) st.hint = null;
  st.touched = true;
  sfx.fly(0, piece.len);
  setMode(null);
}
function useLife() {
  if (st.over) return;
  if (st.lives >= GAME.lives) return toast(t('lifeFull'));
  if (!spend(boost, 'life')) return toast(t('noBoost'));
  saveBoost();
  st.lives++;
  sfx.hint();
  updateHud();
}

// ---------- экраны ----------
function hideScreens() {
  $('menu').hidden = true;
  $('levels').hidden = true;
  $('album').hidden = true;
}

function showMenu() {
  st.loseAt = 0; // поражение не должно всплыть поверх меню
  st.winAt = 0; // и окно победы после финала
  $('finale').hidden = true;
  setMode(null);
  $('menu-stars').textContent = totalStars() ? `★ ${totalStars()}` : '';
  closeOverlay(); // после победы/поражения «Играть» всё равно начинает уровень заново
  $('play-level').textContent = t('playLevel', st.over || st.daily ? progress : st.level);
  $('daily-note').textContent = dailyDoneToday() ? t('dailyDoneNote') : t('dailyNote');
  updateThemeButton();
  $('levels').hidden = true;
  $('album').hidden = true;
  $('menu').hidden = false;
}

// Альбом: узнаваемые фигуры и достопримечательности по порядку уровней (без абстрактных и прямоугольников).
// Список фигур не меняется — считается один раз; открыта фигура, если её уровень пройден.
let albumList = null;
function albumEntries() {
  if (albumList) return albumList;
  const seen = new Set();
  albumList = [];
  for (let n = 1; n <= MENU.albumLevels; n++) {
    const shape = shapeFor(n);
    if (!shape.name || shape.id.startsWith('abs') || seen.has(shape.id)) continue;
    seen.add(shape.id);
    albumList.push({ n, shape });
  }
  return albumList;
}
function showAlbum() {
  const colors = Object.values(COLORS.snake);
  const list = albumEntries().map((e) => ({ ...e, open: e.n < progress || Number(bestStars[e.n]) > 0 }));
  const grid = $('album-grid');
  grid.innerHTML = '';
  list.forEach((e, i) => {
    const btn = document.createElement('button');
    btn.className = e.open ? 'alb' : 'alb locked';
    if (e.open) btn.dataset.n = e.n;
    else btn.disabled = true;
    const cv = document.createElement('canvas');
    drawSilhouette(cv, e.shape, e.open ? colors[i % colors.length] : COLORS.albumLocked, MENU.albumThumb, MENU.albumCells);
    const name = document.createElement('span');
    name.className = 'alb-name';
    name.textContent = e.open ? shapeName(e.shape) : t('albumLevel', e.n);
    btn.setAttribute('aria-label', e.open ? shapeName(e.shape) : t('levelLocked', e.n));
    btn.append(cv, name);
    grid.appendChild(btn);
  });
  $('album-count').textContent = `${list.filter((e) => e.open).length} / ${list.length}`;
  $('menu').hidden = true;
  $('album').hidden = false;
  $('album').scrollTop = 0;
}

function showLevels() {
  const count = Math.max(MENU.levelsMin, Math.ceil(progress / MENU.levelsStep) * MENU.levelsStep);
  const cells = [];
  for (let n = 1; n <= count; n++) {
    if (n > progress) {
      cells.push(`<button class="lvl locked" disabled aria-label="${t('levelLocked', n)}"><span class="lvl-n">${n}</span><span class="lvl-s">🔒</span></button>`);
      continue;
    }
    const s = Math.min(3, Number(bestStars[n]) || 0);
    const starsHtml = `<b>${'★'.repeat(s)}</b>${'★'.repeat(3 - s)}`;
    const cur = n === progress && !s; // ещё не пройден — вместо пустых звёзд «играть»
    const cls = cur ? 'lvl current' : 'lvl';
    const under = cur ? '▶' : starsHtml;
    cells.push(`<button class="${cls}" data-n="${n}" aria-label="${t('level', n)}"><span class="lvl-n">${n}</span><span class="lvl-s">${under}</span></button>`);
  }
  $('levels-grid').innerHTML = cells.join('');
  $('levels-stars').textContent = `★ ${totalStars()}`;
  $('menu').hidden = true;
  $('levels').hidden = false;
  $('levels').querySelector('.lvl.current')?.scrollIntoView({ block: 'center' });
}

$('play').addEventListener('click', () => {
  unlock();
  sfx.click();
  // начатый и не завершённый уровень (в т.ч. переигровка старого) продолжается; ежедневный — нет
  if (!st.over && !st.daily) {
    hideScreens();
    if (!st.touched) st.bornT = performance.now(); // поле ещё не трогали — пусть появится красиво
  }
  else startLevel(progress);
});
$('open-levels').addEventListener('click', () => {
  unlock();
  sfx.click();
  showLevels();
});
$('coach-ok').addEventListener('click', () => {
  sfx.click();
  closeCoach();
});
document.querySelector('.hud-bottom').addEventListener('click', (e) => {
  if (e.target.closest('.boost:not(.boost-ghost)')) closeCoach(); // «Заново» не считается
}, true);
$('open-daily').addEventListener('click', () => {
  unlock();
  sfx.click();
  startDaily();
});
$('open-album').addEventListener('click', () => {
  unlock();
  sfx.click();
  showAlbum();
});
$('album-back').addEventListener('click', () => {
  sfx.click();
  showMenu();
});
$('album-grid').addEventListener('click', (e) => {
  const btn = e.target.closest('.alb[data-n]');
  if (!btn) return;
  unlock();
  sfx.click();
  startLevel(Number(btn.dataset.n));
});
$('levels-back').addEventListener('click', () => {
  sfx.click();
  showMenu();
});
$('levels-grid').addEventListener('click', (e) => {
  const btn = e.target.closest('.lvl[data-n]');
  if (!btn) return;
  unlock();
  sfx.click();
  startLevel(Number(btn.dataset.n));
});
$('ov-menu').addEventListener('click', () => {
  sfx.click();
  showMenu();
});
$('to-menu').addEventListener('click', () => {
  unlock();
  sfx.click();
  showMenu();
});

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

// ---------- камера (большие поля) ----------
function maxZoom() {
  const L = view(window.innerWidth, window.innerHeight, { ...st, cam: null });
  return Math.max(1, CAMERA.maxCellPx / L.cell);
}
// поле не уезжает совсем: центр видимой области всегда над полем
function clampCam() {
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
function zoomAt(px, py, factor) {
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
function zoomButtons() {
  const L = view(window.innerWidth, window.innerHeight, { ...st, cam: null });
  $('zoom').hidden = L.cell >= CAMERA.smallCellPx;
}
const viewCenter = () => [window.innerWidth / 2, (hudTop() + window.innerHeight - hudBottom()) / 2];
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

// ---------- касания ----------
// Один палец: нажатие подсвечивает змейку, действие — при отпускании (палец можно довести до нужной линии).
// На приближенном поле сдвиг дальше dragPx — перетаскивание. Два пальца — щипок и сдвиг.
const touches = new Map(); // pointerId → { x, y }
let gesture = null; // { kind: 'tap' | 'pan' | 'pinch', ... }

function pinchInfo() {
  const [a, b] = [...touches.values()];
  return { d: Math.hypot(a.x - b.x, a.y - b.y), mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2 };
}

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

function endPointer(e, cancel) {
  if (!touches.delete(e.pointerId)) return;
  if (gesture && gesture.kind === 'tap' && gesture.id === e.pointerId && !cancel) {
    const p = st.press && st.press.piece;
    st.press = null;
    if (p && st.grid[p.head] === p) {
      if (st.mode === 'erase') erase(p);
      else tap(p);
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
canvas.addEventListener('pointerup', (e) => endPointer(e, false));
canvas.addEventListener('pointercancel', (e) => endPointer(e, true));

$('b-eraser').addEventListener('click', () => {
  unlock();
  sfx.click();
  if (st.over) return;
  if (st.mode === 'erase') return setMode(null);
  if (boost.eraser <= 0) return toast(t('noBoost'));
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
$('restart').addEventListener('click', () => {
  unlock();
  sfx.click();
  startLevel(st.level, st.daily);
});
// серая подложка под фигурой — можно убрать, останутся только линии
function updateBgButton() {
  $('bg-toggle').classList.toggle('off', !st.showBg);
  $('bg-toggle').setAttribute('aria-label', st.showBg ? t('bgHide') : t('bgShow'));
  $('bg-toggle').title = t('bgTitle');
}
updateBgButton();
$('bg-toggle').addEventListener('click', () => {
  unlock();
  sfx.click();
  st.showBg = !st.showBg;
  save(GAME.bgKey, st.showBg);
  updateBgButton();
});
// ---------- микшер ----------
function showMixer(on) {
  $('mixer').hidden = !on;
  if (on) {
    $('vol-music').value = Math.round(vol.music * 100);
    $('vol-sfx').value = Math.round(vol.sfx * 100);
  }
}
$('sound').addEventListener('click', () => {
  unlock();
  sfx.click();
  showMixer($('mixer').hidden);
});
$('vol-music').addEventListener('input', (e) => {
  vol.music = e.target.value / 100;
  applyVolume();
  if (vol.music > 0) startMusic();
  updateHud();
});
$('vol-sfx').addEventListener('input', (e) => {
  vol.sfx = e.target.value / 100;
  applyVolume();
  updateHud();
});
// отпустил ползунок звуков — короткий пример, чтобы услышать громкость
$('vol-sfx').addEventListener('change', () => sfx.fly(0, 3));
for (const id of ['vol-music', 'vol-sfx']) $(id).addEventListener('change', () => save(GAME.volKey, vol));
// тап мимо карточки закрывает микшер
document.addEventListener('pointerdown', (e) => {
  if (!$('mixer').hidden && !e.target.closest('#mixer, #sound')) showMixer(false);
}, true);

// ---------- цикл ----------
// отступы безопасной зоны: env() читается только из CSS, поэтому — через невидимый элемент
const safeProbe = document.createElement('div');
safeProbe.style.cssText = 'position:fixed;visibility:hidden;pointer-events:none;padding:var(--safe-t) 0 var(--safe-b)';
document.body.appendChild(safeProbe);
function readSafe() {
  const cs = getComputedStyle(safeProbe);
  safe.top = parseFloat(cs.paddingTop) || 0;
  safe.bottom = parseFloat(cs.paddingBottom) || 0;
}

function resize() {
  readSafe();
  if (st.cam) clampCam();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(window.innerWidth * dpr);
  canvas.height = Math.round(window.innerHeight * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  if (st.grid) zoomButtons();
}
window.addEventListener('resize', resize);
// iOS Safari не слушает user-scalable=no: щипок и двойной тап зумят страницу — гасим,
// щипок по полю обрабатывает сама игра (pointer-события)
for (const ev of ['gesturestart', 'gesturechange', 'gestureend']) document.addEventListener(ev, (e) => e.preventDefault(), { passive: false });
document.addEventListener('dblclick', (e) => e.preventDefault(), { passive: false });

// офлайн и «установить на главный экран»: service worker только в сборке (в dev мешал бы HMR)
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register(import.meta.env.BASE_URL + 'sw.js').catch(() => {}));
}
// перенос окна на монитор с другой плотностью пикселей не всегда даёт resize
function watchDpr() {
  try {
    const mq = matchMedia(`(resolution: ${window.devicePixelRatio || 1}dppx)`);
    mq.addEventListener('change', () => {
      resize();
      watchDpr();
    }, { once: true });
  } catch {
    /* старый браузер — хватит resize */
  }
}
watchDpr();

function tick(now) {
  // следующий кадр заказываем сразу: ошибка в одном кадре не должна останавливать игру
  requestAnimationFrame(tick);
  // убрать завершённые анимации
  st.flyers = st.flyers.filter(
    (f) => ((now - f.t0) / 1000) * f.speed < f.toEdge + ANIM.flyFadeCells || now - f.t0 < ANIM.puffMs,
  );
  for (const [i, b] of st.bumps) if (now - b.t0 > b.dur) st.bumps.delete(i);
  for (const [i, t] of st.pops) if (now - t > ANIM.popMs) st.pops.delete(i);
  if (st.hint && now - st.hint.t0 > ANIM.hintShowMs) st.hint = null;
  st.erased = st.erased.filter((e) => now - e.t0 < BOOSTERS.eraseMs);

  if (!st.over && st.grid && st.flyers.length === 0 && st.grid.every((v) => !isPiece(v))) win();
  if (st.winAt && now >= st.winAt) {
    st.winAt = 0;
    showWin(st.winStars.stars, st.winStars.prev);
  }
  if (st.loseAt && now >= st.loseAt) {
    st.loseAt = 0;
    lose();
  }

  render(ctx, window.innerWidth, window.innerHeight, st, now);
}

// ---------- язык ----------
// «пузырчатое» слово логотипа: буквы разных цветов, выпрыгивают по очереди
function renderWords() {
  const colors = [...Object.values(COLORS.dir), COLORS.hint];
  document.querySelectorAll('[data-word]').forEach((el) => {
    el.innerHTML = [...t('title')]
      .map((ch, i) => `<span style="color:${colors[i % colors.length]};animation-delay:${i * 0.07}s, ${i * 0.15}s">${ch}</span>`)
      .join('');
  });
}
// плитки логотипа: жирная белая стрелка (символы ↑→↓← в системных шрифтах слишком тонкие)
const ARROW_SVG = (rot) =>
  `<svg viewBox="0 0 24 24" width="62%" height="62%" style="transform:rotate(${rot}deg)"><path d="M12 3 L21 12 L15.5 12 L15.5 21 L8.5 21 L8.5 12 L3 12 Z" fill="#fff" stroke="#fff" stroke-width="2" stroke-linejoin="round"/></svg>`;
document.querySelectorAll('.tile').forEach((el) => {
  const rot = { t1: 0, t2: 90, t3: 180, t4: 270 }[[...el.classList].find((c) => /^t\d$/.test(c))];
  el.innerHTML = ARROW_SVG(rot);
});

function applyLang() {
  applyStatic();
  renderWords();
  $('lang').textContent = getLang() === 'ru' ? 'EN' : 'RU';
  st.tutorial = t('tutorial')[st.level] || '';
  $('tutorial').textContent = st.tutorial;
  $('tutorial').hidden = !st.tutorial;
  updateHud();
  updateBgButton();
  if (!$('menu').hidden) showMenu();
  if (!$('levels').hidden) showLevels();
}
$('lang').addEventListener('click', () => {
  unlock();
  sfx.click();
  setLang(getLang() === 'ru' ? 'en' : 'ru');
  applyLang();
});

// ---------- заставка ----------
// на фоне — настоящие уровни-фигуры (мелко и полупрозрачно), полоса загрузки, тап — пропустить
function splashArt() {
  const box = $('splash-art');
  const spots = SPLASH.art;
  spots.forEach(([n, left, top, width, rot], i) => {
    const g = generate(n);
    const cv = document.createElement('canvas');
    cv.width = 390;
    cv.height = 812;
    cv.style.cssText = `left:${left}%;top:${top}%;width:${width}%;rotate:${rot}deg;animation-delay:${-i * 1.7}s`;
    const s = { grid: g.grid, w: g.w, h: g.h, mask: g.mask, stones: g.stones, list: pieces(g.grid), level: 'splash' + n, bumps: new Map(), pops: new Map(),
      flyers: [], hint: null, press: null, shakeT0: -1e9, bornT: -1e9, tutorial: '', showBg: false, transparent: true, cam: null };
    render(cv.getContext('2d'), 390, 812, s, performance.now());
    box.appendChild(cv);
  });
}
function runSplash() {
  const el = $('splash');
  setTimeout(splashArt, 0); // после первого кадра — заставка видна сразу
  const t0 = performance.now();
  let done = false;
  const finish = () => {
    if (done) return;
    done = true;
    el.classList.add('hide');
    setTimeout(() => (el.hidden = true), SPLASH.fadeMs);
  };
  const step = () => {
    if (done) return;
    const k = Math.min(1, (performance.now() - t0) / SPLASH.ms);
    $('loader-fill').style.width = `${Math.round(k * 100)}%`;
    if (k < 1) requestAnimationFrame(step);
    else setTimeout(finish, 150);
  };
  requestAnimationFrame(step);
  el.addEventListener('click', () => {
    unlock();
    finish();
  });
}

resize();
if (IS_ADMIN) {
  startLevel(1);
  applyLang();
  $('splash').hidden = true;
  import('./admin.js').then((m) => m.initAdmin({ st, startLevel, tap, findFree, analyze, errorCount: () => jsErrors }));
} else {
  startLevel(progress);
  showMenu();
  applyLang();
  runSplash();
}
requestAnimationFrame(tick);
