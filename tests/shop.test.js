import { describe, it, expect } from 'vitest';
import { grantsFor, productOf } from '../src/shop.js';
import { SHOP } from '../src/config.js';

describe('покупки: что даёт товар', () => {
  it('id товаров уникальны и в формате Play Console (строчные, цифры, _ .)', () => {
    const ids = SHOP.products.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toMatch(/^[a-z0-9][a-z0-9_.]*$/);
  });

  it('«Без рекламы» и «Всё оформление» — разовые флаги, паки бустеров — расходуемые', () => {
    expect(grantsFor('no_ads')).toEqual({ boosters: {}, flags: ['noAds'] });
    expect(grantsFor('all_looks').flags).toEqual(['allLooks']);
    expect(productOf('no_ads').type).toBe('non');
    for (const id of ['boosters_small', 'boosters_big']) {
      expect(productOf(id).type).toBe('cons');
      expect(grantsFor(id).flags).toEqual([]);
      expect(grantsFor(id).boosters.hint).toBeGreaterThan(0);
    }
  });

  it('огромный пак больше большого', () => {
    const b = grantsFor('boosters_big').boosters;
    const h = grantsFor('boosters_huge').boosters;
    for (const k of ['hint', 'eraser', 'life']) expect(h[k]).toBeGreaterThan(b[k]);
  });

  it('большой пак больше малого; стартовый набор убирает рекламу и даёт бустеры', () => {
    const s = grantsFor('boosters_small').boosters;
    const b = grantsFor('boosters_big').boosters;
    for (const k of ['hint', 'eraser', 'life']) expect(b[k]).toBeGreaterThan(s[k]);
    const st = grantsFor('starter_pack');
    expect(st.flags).toContain('noAds');
    expect(st.boosters.hint).toBeGreaterThan(0);
  });

  it('неизвестный товар ничего не даёт', () => {
    expect(grantsFor('nope')).toEqual({ boosters: {}, flags: [] });
  });
});
