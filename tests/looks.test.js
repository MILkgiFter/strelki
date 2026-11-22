import { describe, it, expect } from 'vitest';
import { THEMES, THEME, SKINS, COLORS } from '../src/config.js';
import { PALETTE_SIZE } from '../src/level.js';
import { t, setLang } from '../src/i18n.js';

describe('оформление: темы и скины', () => {
  it('у каждой темы из списка есть палитра на все цвета змеек и название RU/EN', () => {
    for (const lang of ['ru', 'en']) {
      setLang(lang);
      for (const { id } of THEME.list) {
        expect(THEMES[id], id).toBeTruthy();
        expect(THEMES[id].snake.length, id).toBeGreaterThanOrEqual(PALETTE_SIZE);
        expect(typeof t('theme_' + id), id).toBe('string');
      }
      for (const { id } of SKINS.list) expect(typeof t('skin_' + id), id).toBe('string');
    }
    setLang('ru');
  });

  it('первая тема и первый скин бесплатны, цены растут', () => {
    for (const list of [THEME.list, SKINS.list]) {
      expect(list[0].stars).toBe(0);
      for (let i = 1; i < list.length; i++) expect(list[i].stars).toBeGreaterThan(list[i - 1].stars);
    }
  });

  it('скин задаёт толщину, «трубка» — полую середину меньше толщины', () => {
    for (const s of SKINS.list) {
      expect(s.width).toBeGreaterThan(0);
      expect(s.hollow).toBeGreaterThanOrEqual(0);
      expect(s.hollow).toBeLessThan(1);
    }
    expect(COLORS.lineScale).toBe(1);
  });
});
