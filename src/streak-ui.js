// Окно «Подарок дня» (п. 12.1): календарь серии из 7 дней, кнопка в меню, выдача бустеров.
// Логика серии — streak.js (без DOM), здесь только показ и сохранение.
import { STREAK } from './config.js';
import { t } from './i18n.js';
import { sfx, unlock } from './sound.js';
import { dayIndex } from './level.js';
import { grantSet } from './boosters.js';
import { streakStatus, claimStreak } from './streak.js';
import { $, load, save } from './store.js';

const ICONS = { hint: '🔍', eraser: '🧽', life: '♥' };
let api = null; // { boost: () => запас, saveBoost, updateHud }
let shownThisSession = false;

const today = () => dayIndex(new Date());
const status = () => streakStatus(load(STREAK.key, null), today());
const rewardText = (r) =>
  Object.entries(r)
    .map(([k, n]) => `${ICONS[k]}${n > 1 ? '×' + n : ''}`)
    .join(' ');

function render() {
  const st = status();
  const grid = $('streak-days');
  grid.innerHTML = '';
  STREAK.rewards.forEach((r, i) => {
    const el = document.createElement('div');
    const done = i < st.done || (st.claimed && i === st.step);
    const now = !st.claimed && i === st.step;
    el.className = 'sd' + (done ? ' done' : '') + (now ? ' now' : '') + (i === STREAK.rewards.length - 1 ? ' big' : '');
    el.innerHTML = `<span class="sd-day">${t('streakDay', i + 1)}</span><span class="sd-gift">${done ? '✓' : rewardText(r)}</span>`;
    grid.appendChild(el);
  });
  $('streak-sub').textContent = st.claimed ? t('streakDone') : st.broken ? t('streakBroken') : t('streakSub', st.step + 1);
  $('streak-claim').hidden = st.claimed;
  $('streak-later').textContent = st.claimed ? t('streakOk') : t('streakLater');
}

export function updateStreakButton() {
  const st = status();
  $('streak-note').textContent = st.claimed ? t('streakNoteTomorrow', ((st.step + 1) % STREAK.rewards.length) + 1) : t('streakNoteReady');
  $('open-streak').classList.toggle('ready', !st.claimed);
}

export function showStreak() {
  render();
  $('streak').hidden = false;
}

// в меню: сам всплывает один раз за запуск, если подарок ещё не забран
export function maybeShowStreak() {
  updateStreakButton();
  if (shownThisSession || status().claimed) return;
  shownThisSession = true;
  setTimeout(() => {
    if (!$('menu').hidden) showStreak();
  }, STREAK.showDelayMs);
}

export function initStreakUI(a) {
  api = a;
  $('open-streak').addEventListener('click', () => {
    unlock();
    sfx.click();
    showStreak();
  });
  $('streak-later').addEventListener('click', () => {
    sfx.click();
    $('streak').hidden = true;
  });
  $('streak-claim').addEventListener('click', () => {
    unlock();
    const { state, reward } = claimStreak(load(STREAK.key, null), today());
    save(STREAK.key, state);
    const got = grantSet(api.boost(), reward);
    api.saveBoost();
    api.updateHud();
    sfx.hint();
    render();
    $('streak-got').textContent = got.length ? t('reward', rewardText(reward)) : '';
    $('streak-got').hidden = !got.length;
    updateStreakButton();
  });
}
