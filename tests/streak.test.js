import { describe, it, expect } from 'vitest';
import { streakStatus, claimStreak, normStreak } from '../src/streak.js';
import { STREAK } from '../src/config.js';

describe('серия дней', () => {
  it('первый заход: день 1, подарок можно забрать', () => {
    const st = streakStatus(null, 100);
    expect(st).toEqual({ claimed: false, step: 0, done: 0, broken: false });
    const { state, reward } = claimStreak(null, 100);
    expect(state).toEqual({ last: 100, step: 0 });
    expect(reward).toEqual(STREAK.rewards[0]);
  });

  it('в тот же день второй раз не выдаётся', () => {
    const { state } = claimStreak(null, 100);
    expect(streakStatus(state, 100).claimed).toBe(true);
    expect(claimStreak(state, 100).reward).toEqual({});
  });

  it('7 дней подряд — награды по порядку, потом круг заново', () => {
    let s = null;
    for (let d = 0; d < STREAK.rewards.length + 2; d++) {
      const r = claimStreak(s, 50 + d);
      expect(r.reward, `день ${d + 1}`).toEqual(STREAK.rewards[d % STREAK.rewards.length]);
      s = r.state;
    }
  });

  it('пропуск дня сбрасывает серию', () => {
    let s = claimStreak(null, 10).state;
    s = claimStreak(s, 11).state;
    s = claimStreak(s, 12).state;
    const st = streakStatus(s, 14);
    expect(st).toMatchObject({ claimed: false, step: 0, done: 0, broken: true });
    expect(claimStreak(s, 14).reward).toEqual(STREAK.rewards[0]);
  });

  it('мусор в сохранении не ломает', () => {
    expect(normStreak({ last: 'x', step: 99 })).toEqual({ last: -1, step: 0 });
    expect(streakStatus('abc', 5).step).toBe(0);
  });

  it('награда растёт: 7-й день больше любого другого', () => {
    const sum = (r) => Object.values(r).reduce((a, b) => a + b, 0);
    const last = sum(STREAK.rewards[STREAK.rewards.length - 1]);
    for (const r of STREAK.rewards.slice(0, -1)) expect(sum(r)).toBeLessThan(last);
  });
});
