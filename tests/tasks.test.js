import { describe, it, expect } from 'vitest';
import { tasksFor, tasksEvent, tasksStatus, claimTask, normTasks } from '../src/tasks.js';
import { TASKS } from '../src/config.js';

const win = (o = {}) => ({ type: 'win', perfect: false, daily: false, usedBoost: false, tag: '', stars: 1, ...o });
// событие, которое двигает все виды заданий сразу
const allWin = () => win({ perfect: true, daily: true, tag: 'huge', stars: 3 });

function finishAll(day) {
  let s = null;
  for (let i = 0; i < 400; i++) s = tasksEvent(s, day, { type: 'arrow', n: 1 }).state;
  for (let i = 0; i < 4; i++) s = tasksEvent(s, day, allWin()).state;
  return s;
}

describe('ежедневные задания', () => {
  it('3 задания разных видов, одинаковые в один день, меняются по дням', () => {
    const seen = new Set();
    for (let d = 0; d < 60; d++) {
      const a = tasksFor(d);
      expect(a.length).toBe(TASKS.perDay);
      expect(new Set(a.map((t) => t.kind)).size).toBe(TASKS.perDay);
      expect(tasksFor(d).map((t) => t.id)).toEqual(a.map((t) => t.id));
      seen.add(a.map((t) => t.id).join());
    }
    expect(seen.size).toBeGreaterThan(20);
  });

  it('прогресс копится по событиям и не превышает цель', () => {
    const day = 5;
    for (const t of tasksStatus(finishAll(day), day)) {
      expect(t.n, t.id).toBe(t.goal);
      expect(t.done).toBe(true);
    }
  });

  it('событие сообщает о выполненном задании ровно один раз', () => {
    const day = 9;
    let s = null;
    const done = [];
    for (let i = 0; i < 400; i++) {
      const r = tasksEvent(s, day, i % 50 ? { type: 'arrow', n: 1 } : allWin());
      s = r.state;
      done.push(...r.completed.map((t) => t.id));
    }
    expect(done.sort()).toEqual(tasksFor(day).map((t) => t.id).sort());
  });

  it('бустер в уровне не засчитывает «без бустеров», ошибка — «без ошибок»', () => {
    const day = 0;
    const s = tasksEvent(null, day, win({ usedBoost: true, perfect: false })).state;
    for (const t of tasksStatus(s, day)) if (t.kind === 'noBoost' || t.kind === 'perfect') expect(t.n).toBe(0);
  });

  it('награда выдаётся один раз, за все три — бонус дня', () => {
    const day = 12;
    const s = finishAll(day);
    const ids = tasksFor(day).map((t) => t.id);
    const r1 = claimTask(s, day, ids[0]);
    expect(Object.keys(r1.reward).length).toBeGreaterThan(0);
    expect(claimTask(r1.state, day, ids[0]).reward).toEqual({});
    const r2 = claimTask(r1.state, day, ids[1]);
    expect(r2.bonus).toBe(false);
    const r3 = claimTask(r2.state, day, ids[2]);
    expect(r3.bonus).toBe(true);
    expect(r3.reward.life).toBeGreaterThanOrEqual(TASKS.bonus.life);
  });

  it('невыполненное не выдаётся; новый день — прогресс с нуля', () => {
    const day = 3;
    const s = tasksEvent(null, day, { type: 'arrow', n: 1 }).state;
    for (const t of tasksFor(day)) if (t.goal > 1) expect(claimTask(s, day, t.id).reward).toEqual({});
    expect(normTasks(s, day + 1).prog).toEqual({});
  });
});
