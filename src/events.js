// Недельные события (п. 12.10): тема недели, 5 уровней с её фигурами, награды по порядку.
// Без DOM — тестируется отдельно. day — номер дня (dayIndex из level.js).
import { EVENTS, RHYTHM } from './config.js';

export const weekOf = (day) => Math.floor((day + EVENTS.weekShift) / 7);
// сколько дней осталось до новой недели, считая сегодняшний (1..7)
export const daysLeft = (day) => 7 - ((day + EVENTS.weekShift) % 7);

// событие недели: { week, id, icon, shapes: [id × levels] } — фигуры без повторов внутри недели
export function eventOf(week) {
  const L = EVENTS.themes.length;
  const theme = EVENTS.themes[((week % L) + L) % L];
  const turn = Math.floor(week / L);
  const n = theme.shapes.length;
  const shapes = Array.from({ length: EVENTS.levels }, (_, i) => theme.shapes[(turn * EVENTS.levels + i) % n]);
  return { week, id: theme.id, icon: theme.icon, shapes };
}

// номер «виртуального» уровня для генератора: такт ритма из EVENTS.tags (узнаваемый, не гигантский),
// круг ритма — свой на каждую неделю, далеко за обычными уровнями
export function eventLevel(week, i) {
  const C = RHYTHM.cycle.length;
  const tag = EVENTS.tags[i];
  const slots = [];
  RHYTHM.cycle.forEach((b, k) => {
    if (b.named && !b.mega && b.tag === tag) slots.push(k);
  });
  const before = EVENTS.tags.slice(0, i).filter((x) => x === tag).length;
  return RHYTHM.introLevels + 1 + (EVENTS.firstRound + week) * C + slots[before % slots.length];
}

const doneOf = (saved, week) =>
  saved && saved.week === week ? Math.max(0, Math.min(EVENTS.levels, Math.floor(Number(saved.done) || 0))) : 0;

// { ...eventOf(week), done, total, finished }
export function eventStatus(saved, week) {
  const done = doneOf(saved, week);
  return { ...eventOf(week), done, total: EVENTS.levels, finished: done >= EVENTS.levels };
}

// пройден уровень i события недели week: награда — только за следующий по порядку
export function eventWin(saved, week, i) {
  const done = doneOf(saved, week);
  if (i !== done || done >= EVENTS.levels) return { state: { week, done }, reward: {}, finished: done >= EVENTS.levels };
  return { state: { week, done: done + 1 }, reward: { ...EVENTS.rewards[i] }, finished: done + 1 >= EVENTS.levels };
}
