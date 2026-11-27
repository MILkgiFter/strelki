import { describe, it, expect } from 'vitest';
import { EVENTS } from '../src/config.js';
import { weekOf, daysLeft, eventOf, eventLevel, eventStatus, eventWin } from '../src/events.js';
import { shapeById, generate, analyze, dayIndex } from '../src/level.js';

describe('недельные события (п. 12.10)', () => {
  it('неделя начинается с понедельника, дни до конца недели 7..1', () => {
    const mon = dayIndex(new Date(2026, 10, 23)); // понедельник
    const sun = dayIndex(new Date(2026, 10, 29));
    expect(weekOf(mon)).toBe(weekOf(sun));
    expect(weekOf(sun + 1)).toBe(weekOf(sun) + 1);
    expect(daysLeft(mon)).toBe(7);
    expect(daysLeft(sun)).toBe(1);
  });

  it('у каждой темы ≥ 5 существующих фигур, внутри недели без повторов, темы идут по кругу', () => {
    for (const th of EVENTS.themes) {
      expect(th.shapes.length).toBeGreaterThanOrEqual(EVENTS.levels);
      for (const id of th.shapes) expect(shapeById(id), id).toBeTruthy();
    }
    for (let w = 0; w < 60; w++) {
      const e = eventOf(w);
      expect(new Set(e.shapes).size).toBe(EVENTS.levels);
      expect(eventOf(w + EVENTS.themes.length).id).toBe(e.id);
    }
    expect(eventOf(1).id).not.toBe(eventOf(0).id);
  });

  it('уровни события разные, за пределами обычных и ежедневных, решаемы', () => {
    // два полных круга тем: все фигуры всех тем
    for (let w = 40; w < 40 + 2 * EVENTS.themes.length; w++) {
      const e = eventOf(w);
      const nums = e.shapes.map((_, i) => eventLevel(w, i));
      expect(new Set(nums).size).toBe(EVENTS.levels);
      for (let i = 0; i < EVENTS.levels; i++) {
        expect(nums[i]).toBeGreaterThan(100000);
        const L = generate(nums[i], shapeById(e.shapes[i]));
        expect(L.shape.id).toBe(e.shapes[i]);
        expect(analyze(L.grid, L.w, L.h).solved, `${w}: ${e.shapes[i]}`).toBe(true);
      }
    }
  });

  it('награда — по порядку, повтор и чужой уровень без награды, новая неделя с нуля', () => {
    let saved = null;
    const w = 10;
    let r = eventWin(saved, w, 1);
    expect(r.reward).toEqual({});
    for (let i = 0; i < EVENTS.levels; i++) {
      r = eventWin(saved, w, i);
      expect(r.reward).toEqual(EVENTS.rewards[i]);
      saved = r.state;
    }
    expect(r.finished).toBe(true);
    expect(eventStatus(saved, w).finished).toBe(true);
    expect(eventWin(saved, w, 4).reward).toEqual({});
    expect(eventStatus(saved, w + 1).done).toBe(0);
    expect(eventStatus({ week: w, done: 'x' }, w).done).toBe(0);
  });
});
