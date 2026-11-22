// Ежедневные задания (п. 12.2): выбор 3 заданий на день, прогресс по событиям игры, награды.
// Без DOM — тестируется отдельно. День — номер из level.js dayIndex.
import { TASKS } from './config.js';
import { rng } from './level.js';

// 3 задания разных видов, по номеру дня (у всех игроков в этот день одинаковые)
export function tasksFor(day) {
  const rand = rng(day * 7349 + 101);
  const pool = TASKS.pool.slice();
  const out = [];
  while (out.length < TASKS.perDay && pool.length) {
    const i = Math.floor(rand() * pool.length);
    const t = pool.splice(i, 1)[0];
    if (!out.some((o) => o.kind === t.kind)) out.push(t);
  }
  return out;
}

// сохранение → состояние на сегодня (вчерашний прогресс сгорает)
export function normTasks(saved, day) {
  const ok = saved && typeof saved === 'object' && saved.day === day;
  return {
    day,
    prog: ok && saved.prog && typeof saved.prog === 'object' ? { ...saved.prog } : {},
    got: ok && saved.got && typeof saved.got === 'object' ? { ...saved.got } : {},
    bonus: ok && saved.bonus === true,
  };
}

// сколько прибавляет событие к заданию данного вида
function gain(kind, ev) {
  if (ev.type === 'arrow') return kind === 'arrows' ? ev.n || 1 : 0;
  if (ev.type !== 'win') return 0;
  switch (kind) {
    case 'wins':
      return 1;
    case 'perfect':
      return ev.perfect ? 1 : 0;
    case 'daily':
      return ev.daily ? 1 : 0;
    case 'noBoost':
      return ev.usedBoost ? 0 : 1;
    case 'big':
      return TASKS.bigTags.includes(ev.tag) ? 1 : 0;
    case 'stars':
      return ev.stars || 0;
    default:
      return 0;
  }
}

// событие игры: { type: 'arrow', n } или { type: 'win', perfect, daily, usedBoost, tag, stars }
// → новое состояние и задания, выполненные именно этим событием
export function tasksEvent(saved, day, ev) {
  const state = normTasks(saved, day);
  const completed = [];
  for (const t of tasksFor(day)) {
    const was = state.prog[t.id] || 0;
    if (was >= t.goal) continue;
    const now = Math.min(t.goal, was + gain(t.kind, ev));
    state.prog[t.id] = now;
    if (now >= t.goal) completed.push(t);
  }
  return { state, completed };
}

// список на сегодня с прогрессом: { ...задание, n, done, got }
export function tasksStatus(saved, day) {
  const state = normTasks(saved, day);
  return tasksFor(day).map((t) => {
    const n = state.prog[t.id] || 0;
    return { ...t, n, done: n >= t.goal, got: !!state.got[t.id] };
  });
}

// забрать награду за выполненное задание; за последнее из трёх — ещё и бонус дня
export function claimTask(saved, day, id) {
  const state = normTasks(saved, day);
  const list = tasksStatus(state, day);
  const t = list.find((x) => x.id === id);
  if (!t || !t.done || t.got) return { state, reward: {}, bonus: false };
  state.got[id] = true;
  const reward = { ...t.reward };
  let bonus = false;
  if (!state.bonus && list.every((x) => x.id === id || x.got)) {
    state.bonus = true;
    bonus = true;
    for (const [k, v] of Object.entries(TASKS.bonus)) reward[k] = (reward[k] || 0) + v;
  }
  return { state, reward, bonus };
}
