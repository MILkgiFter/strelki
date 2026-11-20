// Статистика сложности уровней: node tools/difficulty.mjs
import { generate, analyze, pieces, isFree, removePiece } from '../src/level.js';

// сколько вариантов хода в среднем по ходу игры: играем детерминированно, пока не убрано 80% змеек
function branching(grid, w, h) {
  const g = grid.slice();
  let left = pieces(g);
  const N = left.length;
  let sum = 0, steps = 0;
  while (left.length > N * 0.2) {
    const free = left.filter((q) => isFree(g, w, h, q));
    sum += free.length;
    steps++;
    const q = free[Math.floor(free.length * 0.37)];
    removePiece(g, q);
    left = left.filter((x) => x !== q);
  }
  return sum / steps;
}

const bands = [[2, 3], [4, 6], [7, 15], [16, 30], [31, 60], [61, 100], [101, 130]];
const t0 = performance.now();
for (const [a, b] of bands) {
  let fr = 0, rd = 0, n = 0, br = 0, brN = 0;
  for (let l = a; l <= b; l++) {
    const { grid, w, h } = generate(l);
    const s = analyze(grid, w, h);
    fr += s.freeStart / s.count;
    rd += s.rounds;
    const b = branching(grid, w, h);
    br += b / s.count;
    brN += b;
    n++;
  }
  console.log(`уровни ${a}-${b}: свободно на старте ${((fr / n) * 100).toFixed(0)}%, волн ${(rd / n).toFixed(1)}, вариантов хода в среднем ${(brN / n).toFixed(1)} (${((br / n) * 100).toFixed(0)}%)`);
}
console.log(`генерация 129 уровней: ${(performance.now() - t0).toFixed(0)} мс`);
