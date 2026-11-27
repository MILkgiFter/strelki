// Недельное событие (п. 12.10): плитка в меню и окно с 5 уровнями темы.
// Логика — events.js (без DOM); здесь показ. Запуск уровня и награда — main.js (api.startEvent).
import { EVENTS, COLORS, MENU } from './config.js';
import { t, shapeName } from './i18n.js';
import { sfx, unlock } from './sound.js';
import { dayIndex, shapeById } from './level.js';
import { drawSilhouette } from './render.js';
import { weekOf, daysLeft, eventStatus } from './events.js';
import { $, load } from './store.js';

const ICONS = { hint: '🔍', eraser: '🧽', life: '♥' };
const rewardText = (r) =>
  Object.entries(r)
    .map(([k, n]) => `${ICONS[k]}${n > 1 ? '×' + n : ''}`)
    .join(' ');

let api = null; // { startEvent(i) }

// событие текущей недели и сколько дней до новой
export function currentEvent() {
  const day = dayIndex(new Date());
  return { left: daysLeft(day), s: eventStatus(load(EVENTS.key, null), weekOf(day)) };
}

export function updateEventCard() {
  const { left, s } = currentEvent();
  $('event-icon').textContent = s.icon;
  $('event-name').textContent = t('event_' + s.id);
  $('event-note').textContent = `${s.finished ? '✓' : `${s.done} / ${s.total}`} · ${t('eventLeft', left)}`;
  $('open-event').classList.toggle('ready', !s.finished);
}

function render() {
  const { left, s } = currentEvent();
  $('event-title').textContent = `${s.icon} ${t('event_' + s.id)}`;
  $('event-sub').textContent = `${t('eventTile')} · ${t('eventLeft', left)}`;
  const colors = Object.values(COLORS.dir);
  const box = $('event-steps');
  box.innerHTML = '';
  s.shapes.forEach((id, i) => {
    const shape = shapeById(id);
    const state = i < s.done ? 'done' : i === s.done ? 'next' : 'locked';
    const el = document.createElement('div');
    el.className = 'ev-step ' + state;
    const cv = document.createElement('canvas');
    drawSilhouette(cv, shape, state === 'locked' ? COLORS.albumLocked : colors[i % colors.length], EVENTS.thumb, MENU.albumCells);
    const name = document.createElement('span');
    name.className = 'ev-name';
    name.textContent = state === 'locked' ? '?' : shapeName(shape);
    const rw = document.createElement('span');
    rw.className = 'ev-rw';
    rw.textContent = state === 'done' ? '✓' : rewardText(EVENTS.rewards[i]);
    el.append(cv, name, rw);
    box.appendChild(el);
  });
  $('event-play').hidden = s.finished;
  $('event-play').textContent = t('eventPlay', s.done + 1, s.total);
  $('event-done').hidden = !s.finished;
  $('event-done').textContent = t('eventAllDone', left);
}

export function initEventsUI(a) {
  api = a;
  $('open-event').addEventListener('click', () => {
    unlock();
    sfx.click();
    render();
    $('event').hidden = false;
  });
  $('event-close').addEventListener('click', () => {
    sfx.click();
    $('event').hidden = true;
  });
  $('event-play').addEventListener('click', () => {
    unlock();
    sfx.click();
    const { s } = currentEvent();
    if (s.finished) return;
    $('event').hidden = true;
    api.startEvent(s.done);
  });
  updateEventCard();
}
