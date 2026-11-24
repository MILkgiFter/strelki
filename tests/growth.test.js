import { describe, it, expect } from 'vitest';
import { shouldAskReview, shouldAskNotify } from '../src/growth.js';
import { REVIEW, NOTIFY } from '../src/config.js';

describe('оценка и уведомления (этап 14)', () => {
  it('оценку просим только с 15-го уровня и только после 3 ★', () => {
    expect(shouldAskReview(REVIEW.from - 1, 3, null, 100)).toBe(false);
    expect(shouldAskReview(REVIEW.from, 2, null, 100)).toBe(false);
    expect(shouldAskReview(REVIEW.from, 3, null, 100)).toBe(true);
  });
  it('оценку — не чаще раза в 60 дней', () => {
    expect(shouldAskReview(40, 3, 100, 100 + REVIEW.gapDays - 1)).toBe(false);
    expect(shouldAskReview(40, 3, 100, 100 + REVIEW.gapDays)).toBe(true);
  });
  it('разрешение на уведомления — не в первый день и один раз', () => {
    expect(shouldAskNotify({ first: 10, asked: false }, 10)).toBe(false);
    expect(shouldAskNotify({ first: 10, asked: false }, 10 + NOTIFY.askFromDay)).toBe(true);
    expect(shouldAskNotify({ first: 10, asked: true }, 20)).toBe(false);
    expect(shouldAskNotify(null, 20)).toBe(false);
  });
});
