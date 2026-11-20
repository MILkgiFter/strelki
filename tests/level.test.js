import { describe, it, expect } from 'vitest';
import { generate, solve, params, analyze, pieces, DIRS, cellXY, trajectory, windowAt, dayIndex, dailyLevel } from '../src/level.js';
const inside = (mask) => mask.reduce((t, v) => t + v, 0);

const bent = (p, w) => new Set(p.cells.map((c) => c % w)).size > 1 && new Set(p.cells.map((c) => Math.floor(c / w))).size > 1;

describe('уровни', () => {
  it('первые 500 уровней проходимы (включая огромные)', () => {
    for (let n = 1; n <= 500; n++) {
      const { grid, w, h } = generate(n);
      expect(solve(grid, w, h).solved, `уровень ${n}`).toBe(true);
    }
  });

  it('заполненность близка к цели из конфига', () => {
    for (const n of [3, 10, 20, 40, 120]) {
      const { grid, mask } = generate(n);
      const count = grid.filter(Boolean).length;
      expect(count / inside(mask), `уровень ${n}`).toBeGreaterThan(params(n).fill - 0.15);
    }
  });

  it('пустых клеток внутри фигуры нет (с 3-го уровня)', () => {
    for (let n = 3; n <= 120; n++) {
      const { grid, mask } = generate(n);
      expect(grid.filter(Boolean).length, `уровень ${n}`).toBe(inside(mask));
    }
  });

  it('змейки живут только внутри фигуры', () => {
    for (let n = 1; n <= 60; n++) {
      const { grid, mask } = generate(n);
      grid.forEach((p, c) => {
        if (p) expect(mask[c], `уровень ${n}, клетка ${c}`).toBe(1);
      });
    }
  });

  it('формы разные: за 20 уровней не меньше 8 фигур, подряд не повторяются', () => {
    const ids = [];
    for (let n = 3; n <= 22; n++) ids.push(generate(n).shape.id);
    expect(new Set(ids).size).toBeGreaterThanOrEqual(8);
    for (let i = 1; i < ids.length; i++) expect(ids[i], `уровни ${i + 2}–${i + 3}`).not.toBe(ids[i - 1]);
  });

  it('200 уровней: узнаваемые фигуры не повторяются, абстрактные — каждая своя', () => {
    const named = [];
    const abs = [];
    for (let n = 3; n <= 202; n++) {
      const s = generate(n).shape;
      (s.abstract ? abs : named).push(s.id);
    }
    expect(new Set(named).size, 'узнаваемые без повторов').toBe(named.length);
    expect(named.length).toBeGreaterThanOrEqual(95);
    expect(new Set(abs).size).toBe(abs.length);
  });

  it('ритм: 80% крупных уровней, 15% средних, 5% маленьких; крупные больше по числу змеек', () => {
    const tags = {};
    const cnt = { big: [], small: [] };
    for (let n = 3; n <= 202; n++) {
      const { grid, w, h, tag } = generate(n);
      const t = tag || 'medium';
      tags[t] = (tags[t] || 0) + 1;
      if (n <= 80) (['big', 'huge', 'mega'].includes(t) ? cnt.big : cnt.small).push(analyze(grid, w, h).count);
    }
    expect((tags.big || 0) + (tags.huge || 0) + (tags.mega || 0)).toBe(160);
    expect(tags.medium).toBe(30);
    expect(tags.small).toBe(10);
    const mean = (a) => a.reduce((t, v) => t + v, 0) / a.length;
    expect(mean(cnt.big)).toBeGreaterThan(mean(cnt.small) * 2);
  });

  it('ежедневный уровень: по дате, за обычными уровнями, большой с узнаваемой фигурой, решаемый', () => {
    expect(dayIndex(new Date(2026, 0, 1))).toBe(0);
    expect(dayIndex(new Date(2026, 10, 20, 23, 59))).toBe(dayIndex(new Date(2026, 10, 20, 0, 1)));
    expect(dayIndex(new Date(2026, 10, 21)) - dayIndex(new Date(2026, 10, 20))).toBe(1);
    const shapes = [];
    for (let d = 300; d < 314; d++) {
      const n = dailyLevel(d);
      expect(n).toBeGreaterThan(1000);
      const p = params(n);
      expect(p.tag).toBe('big');
      expect(p.shape.name && !p.shape.id.startsWith('abs')).toBeTruthy();
      shapes.push(p.shape.id);
      if (d < 303) {
        const g = generate(n);
        expect(solve(g.grid, g.w, g.h).solved).toBe(true);
      }
    }
    for (let i = 1; i < shapes.length; i++) expect(shapes[i]).not.toBe(shapes[i - 1]);
    expect(new Set(shapes).size).toBeGreaterThanOrEqual(10);
  });

  it('уровень детерминирован', () => {
    expect(generate(7)).toEqual(generate(7));
  });

  it('уровень 1 — обучение: 3–5 прямых змеек', () => {
    const { grid, w } = generate(1);
    const all = pieces(grid);
    expect(all.length).toBeGreaterThanOrEqual(3);
    expect(all.length).toBeLessThanOrEqual(5);
    expect(all.some((p) => bent(p, w))).toBe(false);
  });

  it('изгибы есть с 4-го уровня', () => {
    for (let n = 4; n <= 10; n++) {
      const { grid, w } = generate(n);
      expect(pieces(grid).some((p) => bent(p, w)), `уровень ${n}`).toBe(true);
    }
  });

  it('геометрия змеек корректна', () => {
    for (const n of [1, 3, 6, 12, 25, 50, 90, 150]) {
      const { grid, w, h } = generate(n);
      for (const p of pieces(grid)) {
        const [dx, dy] = DIRS[p.dir];
        const [hx, hy] = cellXY(p.head, w);
        expect(p.cells[0]).toBe(p.head);
        expect(p.len).toBe(p.cells.length);
        expect(p.len).toBeGreaterThanOrEqual(1);
        // последний отрезок смотрит туда же, куда нос (у стрелки из одной клетки отрезка нет)
        if (p.len > 1) expect(p.cells[1]).toBe((hy - dy) * w + (hx - dx));
        expect(p.color).toBeGreaterThanOrEqual(0);
        expect(p.color).toBeLessThan(5);
        p.cells.forEach((c, k) => {
          expect(grid[c]).toBe(p);
          if (k > 0) {
            // соседние клетки по стороне
            const [ax, ay] = cellXY(p.cells[k - 1], w);
            const [bx, by] = cellXY(c, w);
            expect(Math.abs(ax - bx) + Math.abs(ay - by)).toBe(1);
          }
          // ни одна своя клетка не на луче головы
          const [x, y] = cellXY(c, w);
          const onRay = dx ? y === hy && Math.sign(x - hx) === dx : x === hx && Math.sign(y - hy) === dy;
          expect(onRay).toBe(false);
        });
        expect(new Set(p.cells).size).toBe(p.len);
        expect(hx >= 0 && hy >= 0 && hx < w && hy < h).toBe(true);
      }
    }
  });

  it('генерация гигантского уровня быстрая (< 150 мс)', () => {
    const t0 = performance.now();
    generate(12);
    expect(performance.now() - t0).toBeLessThan(150);
  });

  // Порог сложности: если генератор «облегчится», тест упадёт
  const avg = (from, to) => {
    let free = 0, rounds = 0;
    for (let n = from; n <= to; n++) {
      const { grid, w, h } = generate(n);
      const s = analyze(grid, w, h);
      free += s.freeStart / s.count;
      rounds += s.rounds;
    }
    const k = to - from + 1;
    return { free: free / k, rounds: rounds / k };
  };

  it('средние уровни (16–30): ≤ 35% змеек свободно на старте, цепочка ≥ 7 волн', () => {
    const s = avg(16, 30);
    expect(s.free).toBeLessThanOrEqual(0.35);
    expect(s.rounds).toBeGreaterThanOrEqual(7);
  });

  it('поздние уровни (31–60): ≤ 35% свободно, цепочка ≥ 8 волн (в среднем, с лёгкими тактами)', () => {
    const s = avg(31, 60);
    expect(s.free).toBeLessThanOrEqual(0.35);
    expect(s.rounds).toBeGreaterThanOrEqual(8);
  });

  it('сложность растёт от ранних уровней к поздним', () => {
    expect(avg(31, 60).rounds).toBeGreaterThan(avg(2, 6).rounds);
  });
});

describe('движение по пути', () => {
  // змейка: голова (2,0) смотрит вправо, тело (1,0) → (1,1) → (0,1)
  const w = 5;
  const p = { dir: 'R', head: 2, cells: [2, 1, 6, 5], len: 4 };

  it('trajectory: от хвоста к голове и дальше по направлению', () => {
    expect(trajectory(p, w, 2)).toEqual([[0, 1], [1, 1], [1, 0], [2, 0], [3, 0], [4, 0]]);
  });

  it('windowAt: в покое совпадает с телом', () => {
    const P = trajectory(p, w, 0);
    expect(windowAt(P, 0, 4)).toEqual([[0, 1], [1, 1], [1, 0], [2, 0]]);
  });

  it('windowAt: сдвиг на 1.5 — хвост посередине отрезка, голова впереди', () => {
    const P = trajectory(p, w, 3);
    const win = windowAt(P, 1.5, 4);
    expect(win[0]).toEqual([1, 0.5]);
    expect(win[win.length - 1]).toEqual([3.5, 0]);
    // длина ломаной всегда len − 1
    let L = 0;
    for (let i = 1; i < win.length; i++) L += Math.hypot(win[i][0] - win[i - 1][0], win[i][1] - win[i - 1][1]);
    expect(L).toBeCloseTo(3);
  });
});
