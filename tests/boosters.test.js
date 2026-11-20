import { describe, it, expect } from 'vitest';
import { initBoosters, grantForStars, grantSet, spend } from '../src/boosters.js';
import { BOOSTERS } from '../src/config.js';

describe('бустеры', () => {
  it('стартовый запас и защита от испорченного сохранения', () => {
    expect(initBoosters(null)).toMatchObject(BOOSTERS.start);
    const b = initBoosters({ hint: -5, eraser: 'abc', life: 1e9, next: 2 });
    expect(b.hint).toBe(BOOSTERS.start.hint);
    expect(b.eraser).toBe(BOOSTERS.start.eraser);
    expect(b.life).toBe(BOOSTERS.max);
    expect(b.next).toBe(2);
  });

  it('за новые звёзды — бустеры по кругу: лупа → ластик → жизнь', () => {
    const b = initBoosters({ hint: 0, eraser: 0, life: 0, next: 0 });
    expect(grantForStars(b, 3)).toEqual(['hint', 'eraser', 'life']);
    expect(grantForStars(b, 1)).toEqual(['hint']);
    expect(grantForStars(b, 0)).toEqual([]);
    expect(b).toMatchObject({ hint: 2, eraser: 1, life: 1 });
  });

  it('потратить можно только то, что есть', () => {
    const b = initBoosters({ hint: 1, eraser: 0, life: 0 });
    expect(spend(b, 'hint')).toBe(true);
    expect(spend(b, 'hint')).toBe(false);
    expect(spend(b, 'eraser')).toBe(false);
    expect(b.hint).toBe(0);
  });

  it('набор бустеров (ежедневная награда) — не больше максимума', () => {
    const b = initBoosters({ hint: 0, eraser: BOOSTERS.max, life: 1, next: 0 });
    expect(grantSet(b, { hint: 1, eraser: 1, life: 2 })).toEqual(['hint', 'life', 'life']);
    expect(b).toMatchObject({ hint: 1, eraser: BOOSTERS.max, life: 3 });
  });
});
