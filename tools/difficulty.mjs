// Статистика сложности уровней: node tools/difficulty.mjs
import { generate, analyze } from '../src/level.js';

const bands = [[2, 3], [4, 6], [7, 15], [16, 30], [31, 60], [61, 100], [101, 130]];
const t0 = performance.now();
for (const [a, b] of bands) {
  let fr = 0, rd = 0, n = 0;
  for (let l = a; l <= b; l++) {
    const { grid, w, h } = generate(l);
    const s = analyze(grid, w, h);
    fr += s.freeStart / s.count;
    rd += s.rounds;
    n++;
  }
  console.log(`уровни ${a}-${b}: свободно на старте ${((fr / n) * 100).toFixed(0)}%, волн ${(rd / n).toFixed(1)}`);
}
console.log(`генерация 129 уровней: ${(performance.now() - t0).toFixed(0)} мс`);
