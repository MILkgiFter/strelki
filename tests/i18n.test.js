import { describe, it, expect } from 'vitest';
import { STRINGS_EN, SHAPE_EN, ABSTRACT_EN, LANGS } from '../src/i18n.js';
import { LOCALES, LANG_NAMES } from '../src/locales/index.js';

const keys = (o) => Object.keys(o).sort();

describe('переводы (п. 12.9)', () => {
  it('у каждого языка есть название для списка', () => {
    for (const l of LANGS) expect(LANG_NAMES[l], l).toBeTruthy();
  });

  for (const [code, loc] of Object.entries(LOCALES)) {
    it(`${code}: все строки, фигуры и абстрактные фигуры переведены`, () => {
      expect(keys(loc.strings)).toEqual(keys(STRINGS_EN));
      expect(keys(loc.shapes)).toEqual(keys(SHAPE_EN));
      expect(keys(loc.abstract)).toEqual(keys(ABSTRACT_EN));
    });

    it(`${code}: тип каждого значения как в en, функции возвращают строку`, () => {
      for (const [k, v] of Object.entries(STRINGS_EN)) {
        const tv = loc.strings[k];
        expect(typeof tv, `${code}.${k}`).toBe(typeof v);
        if (typeof v === 'function') {
          for (const n of [1, 2, 5, 21]) expect(typeof tv(n, 3), `${code}.${k}(${n})`).toBe('string');
        } else if (typeof v === 'string') {
          expect(tv.length, `${code}.${k} пустая`).toBeGreaterThan(0);
        }
      }
    });
  }
});
