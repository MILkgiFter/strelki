// Демо-режим для записи роликов: адрес ?demo или ?demo=N (начать с уровня N).
// Интерфейс скрыт, уровень проходится сам в ровном темпе «волной» от стрелки к соседней,
// в конце собирается картинка с названием. Прогресс игрока не сохраняется (как в админке).
// Управление: тап или пробел — старт / пауза / дальше; → или N — следующий уровень, ← — предыдущий, R — заново.
import { DEMO } from './config.js';
import { pieces, isFree, cellXY } from './level.js';

export function initDemo({ st, startLevel, tap }) {
  document.body.classList.add('demo');
  const catcher = document.createElement('div');
  catcher.className = 'demo-catch';
  document.body.appendChild(catcher);

  let mode = 'ready'; // ready → play ⇄ pause → done
  let step = 0;
  let acc = 0;
  let last = 0;
  let prev = null; // клетка последней выпущенной стрелки

  const go = (n) => {
    startLevel(Math.max(1, n));
    mode = 'ready';
    prev = null;
  };

  // следующая стрелка: одна из ближайших свободных к прошлой — поле очищается волной, а не вразброс
  function pick() {
    const free = pieces(st.grid).filter((p) => isFree(st.grid, st.w, st.h, p));
    if (!free.length) return null;
    if (!prev) return free[Math.floor(Math.random() * free.length)];
    const [px, py] = prev;
    const near = free
      .map((p) => {
        const [x, y] = cellXY(p.head, st.w);
        return { p, d: (x - px) ** 2 + (y - py) ** 2 };
      })
      .sort((a, b) => a.d - b.d)
      .slice(0, DEMO.near);
    return near[Math.floor(Math.random() * near.length)].p;
  }

  function frame(now) {
    if (mode !== 'play') return;
    acc += now - last;
    last = now;
    while (acc >= step && !st.over) {
      acc -= step;
      const p = pick();
      if (!p) break;
      prev = cellXY(p.head, st.w);
      tap(p);
    }
    if (st.over) {
      mode = 'done';
      return;
    }
    requestAnimationFrame(frame);
  }

  function play() {
    if (mode === 'ready') {
      step = Math.min(DEMO.maxStepMs, Math.max(DEMO.minStepMs, DEMO.durationMs / Math.max(1, st.list.length)));
      acc = step; // первая стрелка — сразу
    }
    last = performance.now();
    mode = 'play';
    requestAnimationFrame(frame);
  }

  function main() {
    if (mode === 'ready' || mode === 'pause') play();
    else if (mode === 'play') mode = 'pause';
    else go(st.level + 1);
  }

  catcher.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    main();
  });
  window.addEventListener('keydown', (e) => {
    const k = e.key.toLowerCase();
    if (k === ' ' || k === 'enter') main();
    else if (k === 'arrowright' || k === 'n' || k === 'т') go(st.level + 1);
    else if (k === 'arrowleft') go(st.level - 1);
    else if (k === 'r' || k === 'к') go(st.level);
    else return;
    e.preventDefault();
  });

  const n = Number(new URLSearchParams(location.search).get('demo'));
  go(Number.isFinite(n) && n > 0 ? n : DEMO.start);
}
