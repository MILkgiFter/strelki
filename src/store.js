// Общие мелочи для модулей интерфейса: поиск элемента, сохранение, админская сборка. Без игровой логики.
import { GAME, DAILY, BOOSTERS, STREAK, TASKS, COLLECTIONS, EVENTS } from './config.js';

// админская сборка: ?admin=1 — все уровни открыты, прогресс и звёзды не сохраняются
const query = typeof location !== 'undefined' ? new URLSearchParams(location.search) : new URLSearchParams();
// демо для записи роликов: ?demo — тоже ничего не сохраняет
export const IS_DEMO = query.has('demo');
export const IS_ADMIN = query.has('admin') || IS_DEMO;
export const $ = (id) => document.getElementById(id);

// ---------- сохранение (может быть недоступно — тогда просто играем) ----------
export function load(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw == null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
}
export function save(key, value) {
  if (IS_ADMIN && (key === GAME.storageKey || key === GAME.starsKey || key === DAILY.key || key === BOOSTERS.coachKey || key === GAME.volKey || key === STREAK.key || key === TASKS.key || key === COLLECTIONS.key || key === EVENTS.key)) return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* хранилище недоступно */
  }
}
