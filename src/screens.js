// Экраны и настройки вида: меню, выбор уровня, альбом, тема (светлая / неон за ★), режим для дальтоников.
import { MENU, COLORS, THEMES, THEME, COLORBLIND, SKINS } from './config.js';
import { t, shapeName } from './i18n.js';
import { sfx, unlock } from './sound.js';
import { shapeFor } from './level.js';
import { drawSilhouette } from './render.js';
import { IS_ADMIN, $, load, save } from './store.js';
import { toast, setMode } from './boosters-ui.js';
import { maybeShowStreak } from './streak-ui.js';
import { updateTasksButton } from './tasks-ui.js';

// всё, что принадлежит main.js: состояние, прогресс, запуск уровней (progress и звёзды — через функции, они меняются)
let st, startLevel, startDaily, closeOverlay, closeCoach, dailyDoneToday, totalStars;
let progress = () => 1;
let bestStars = () => ({});

// ---------- оформление: тема, скин стрелок, режим для дальтоников (п. 12.3) ----------
let theme = 'light';
let skin = 'normal';
let colorblind = false;
const isOpen = (item) => IS_ADMIN || totalStars() >= item.stars;
const themeItem = (id) => THEME.list.find((x) => x.id === id);
const skinItem = (id) => SKINS.list.find((x) => x.id === id);
function loadTheme() {
  const th = themeItem(load(THEME.key, 'light'));
  theme = th && isOpen(th) ? th.id : 'light';
  const sk = skinItem(load(SKINS.key, 'normal'));
  skin = sk && isOpen(sk) ? sk.id : 'normal';
  colorblind = load(COLORBLIND.key, false) === true;
}
export function applyTheme(name) {
  theme = name;
  const th = THEMES[name];
  Object.assign(COLORS, th, { snake: [...th.snake] });
  COLORS.patterns = colorblind;
  if (colorblind && !th.dark) COLORS.snake = [...COLORBLIND.palette];
  const sk = skinItem(skin) || SKINS.list[0];
  COLORS.lineScale = sk.width;
  COLORS.hollow = sk.hollow;
  document.documentElement.classList.toggle('cb', colorblind);
  // тёмные темы делят тёмное оформление интерфейса (CSS html[data-theme="neon"])
  document.documentElement.dataset.theme = th.dark ? 'neon' : 'light';
  document.documentElement.dataset.look = name;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', COLORS.bg);
}
function updateThemeButton() {
  const all = [...THEME.list, ...SKINS.list];
  $('theme-note').textContent = `${all.filter(isOpen).length}/${all.length}`;
}
// превью темы: фон и три линии её цветов; скина — линия выбранной толщины
function looksCard(kind, item) {
  const open = isOpen(item);
  const sel = kind === 'theme' ? theme === item.id : skin === item.id;
  const b = document.createElement('button');
  b.className = 'look' + (sel ? ' on' : '') + (open ? '' : ' locked');
  b.dataset.kind = kind;
  b.dataset.id = item.id;
  const th = kind === 'theme' ? THEMES[item.id] : THEMES[theme];
  const cols = th.snake.slice(0, 3);
  const sk = kind === 'skin' ? item : skinItem(skin);
  const w = 6 * sk.width;
  const lines = cols
    .map((c, i) => `<line x1="10" y1="${12 + i * 12}" x2="70" y2="${12 + i * 12}" stroke="${c}" stroke-width="${w}" stroke-linecap="round"/>` +
      (sk.hollow ? `<line x1="10" y1="${12 + i * 12}" x2="70" y2="${12 + i * 12}" stroke="${th.bg}" stroke-width="${w * sk.hollow}" stroke-linecap="round"/>` : ''))
    .join('');
  b.innerHTML = `<svg viewBox="0 0 80 48" class="look-prev" style="background:${th.bg}">${lines}</svg>
    <span class="look-name">${t((kind === 'theme' ? 'theme_' : 'skin_') + item.id)}</span>
    <span class="look-note">${sel ? '✓' : open ? '' : '🔒 ' + item.stars + ' ★'}</span>`;
  return b;
}
function renderLooks() {
  $('looks-stars').textContent = `★ ${totalStars()}`;
  const th = $('looks-themes');
  th.innerHTML = '';
  THEME.list.forEach((x) => th.appendChild(looksCard('theme', x)));
  const sk = $('looks-skins');
  sk.innerHTML = '';
  SKINS.list.forEach((x) => sk.appendChild(looksCard('skin', x)));
  $('looks-cb').classList.toggle('on', colorblind);
}

// ---------- экраны ----------
export function hideScreens() {
  $('menu').hidden = true;
  $('levels').hidden = true;
  $('album').hidden = true;
}

export function showMenu() {
  st.loseAt = 0; // поражение не должно всплыть поверх меню
  st.winAt = 0; // и окно победы после финала
  $('finale').hidden = true;
  setMode(null);
  $('menu-stars').textContent = totalStars() ? `★ ${totalStars()}` : '';
  closeOverlay(); // после победы/поражения «Играть» всё равно начинает уровень заново
  $('play-level').textContent = t('playLevel', st.over || st.daily ? progress() : st.level);
  $('daily-note').textContent = dailyDoneToday() ? '✓' : t('dailyNew');
  $('open-daily').classList.toggle('ready', !dailyDoneToday());
  updateThemeButton();
  maybeShowStreak();
  updateTasksButton();
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
  const list = albumEntries().map((e) => ({ ...e, open: e.n < progress() || Number(bestStars()[e.n]) > 0 }));
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

export function showLevels() {
  const count = Math.max(MENU.levelsMin, Math.ceil(progress() / MENU.levelsStep) * MENU.levelsStep);
  const cells = [];
  for (let n = 1; n <= count; n++) {
    if (n > progress()) {
      cells.push(`<button class="lvl locked" disabled aria-label="${t('levelLocked', n)}"><span class="lvl-n">${n}</span><span class="lvl-s">🔒</span></button>`);
      continue;
    }
    const s = Math.min(3, Number(bestStars()[n]) || 0);
    const starsHtml = `<b>${'★'.repeat(s)}</b>${'★'.repeat(3 - s)}`;
    const cur = n === progress() && !s; // ещё не пройден — вместо пустых звёзд «играть»
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

export function initScreens(api) {
  ({ st, startLevel, startDaily, closeOverlay, closeCoach, dailyDoneToday, totalStars, progress, bestStars } = api);
  loadTheme();
  applyTheme(theme);

  $('theme-btn').addEventListener('click', () => {
    unlock();
    sfx.click();
    renderLooks();
    $('looks').hidden = false;
  });
  $('looks-close').addEventListener('click', () => {
    sfx.click();
    $('looks').hidden = true;
  });
  $('looks').addEventListener('click', (e) => {
    const b = e.target.closest('.look');
    if (!b) return;
    unlock();
    const list = b.dataset.kind === 'theme' ? THEME.list : SKINS.list;
    const item = list.find((x) => x.id === b.dataset.id);
    if (!isOpen(item)) return toast(t('looksLocked', item.stars));
    sfx.click();
    if (b.dataset.kind === 'theme') {
      theme = item.id;
      save(THEME.key, theme);
    } else {
      skin = item.id;
      save(SKINS.key, skin);
    }
    applyTheme(theme);
    renderLooks();
    updateThemeButton();
  });
  $('looks-cb').addEventListener('click', () => $('cb').click());

  $('cb').addEventListener('click', () => {
    unlock();
    sfx.click();
    colorblind = !colorblind;
    save(COLORBLIND.key, colorblind);
    applyTheme(theme);
    if (!$('looks').hidden) renderLooks();
    toast(t(colorblind ? 'cbOn' : 'cbOff'));
  });


  $('play').addEventListener('click', () => {
    unlock();
    sfx.click();
    // начатый и не завершённый уровень (в т.ч. переигровка старого) продолжается; ежедневный — нет
    if (!st.over && !st.daily) {
      hideScreens();
      if (!st.touched) st.bornT = performance.now(); // поле ещё не трогали — пусть появится красиво
    }
    else startLevel(progress());
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
}
