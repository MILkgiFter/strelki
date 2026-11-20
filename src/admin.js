// Админская сборка для проверки уровней: открывается по адресу ?admin=1.
// Переход на любой уровень, автопрохождение, прогон диапазона с отчётом.
// Прогресс и звёзды игрока в этом режиме не сохраняются (см. main.js).
import { ADMIN } from './config.js';

export function initAdmin(api) {
  const { st, startLevel, tap, findFree, analyze } = api;
  window.__adminSt = st; // для замеров скорости отрисовки из консоли
  const panel = document.createElement('div');
  panel.className = 'admin';
  panel.innerHTML = `
    <div class="admin-row">
      <b>ADMIN</b>
      <input id="adm-n" type="number" min="1" value="${st.level}" />
      <button id="adm-go">▶</button>
      <button id="adm-prev">◀</button>
      <button id="adm-next">▶▶</button>
      <button id="adm-solve">Решить</button>
      <button id="adm-run">Прогон</button>
      <input id="adm-to" type="number" min="1" value="${ADMIN.runTo}" title="до уровня" />
      <button id="adm-hide">×</button>
    </div>
    <div class="admin-status" id="adm-status">готово</div>`;
  document.body.appendChild(panel);
  const $ = (id) => panel.querySelector('#' + id);
  const status = (txt) => ($('adm-status').textContent = txt);
  const go = (n) => {
    stop();
    startLevel(Math.max(1, n));
    $('adm-n').value = st.level;
    status(info());
  };
  const info = () => `ур. ${st.level} · ${st.shape?.id} · ${st.tag || 'medium'} · ${st.w}×${st.h} · змеек ${st.list.length}`;

  // автопрохождение: каждый кадр выпускает до perFrame свободных змеек
  let job = null;
  const stop = () => {
    if (job) job.cancel = true;
    job = null;
  };
  function solve(perFrame, onDone) {
    stop();
    const my = { cancel: false };
    job = my;
    const frames = [];
    let last = performance.now();
    const step = (now) => {
      if (my.cancel) return;
      frames.push(now - last);
      last = now;
      if (!st.over) {
        for (let i = 0; i < perFrame; i++) {
          const p = findFree(st.grid, st.w, st.h);
          if (!p) break;
          tap(p);
        }
        // змейки ещё летят — дождаться; в турбо-режиме не ждём их анимацию
        if (ADMIN.turbo && !findFree(st.grid, st.w, st.h)) st.flyers = [];
      }
      if (st.over) {
        onDone && onDone(frames);
        return;
      }
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  $('adm-go').onclick = () => go(Number($('adm-n').value));
  $('adm-prev').onclick = () => go(st.level - 1);
  $('adm-next').onclick = () => go(st.level + 1);
  $('adm-hide').onclick = () => panel.classList.toggle('min');
  $('adm-solve').onclick = () => {
    status(`решаю ${info()}…`);
    solve(1, (fr) => status(`решено: ${info()} · жизней ${st.lives} · кадр макс ${Math.max(...fr).toFixed(0)} мс`));
  };

  // прогон: каждый уровень — генерация, проверка решателем и пустот, автопрохождение в игре
  $('adm-run').onclick = () => {
    const from = Number($('adm-n').value) || 1;
    const to = Number($('adm-to').value) || ADMIN.runTo;
    const report = [];
    window.__adminReport = report;
    const errors0 = api.errorCount();
    let n = from;
    const next = () => {
      if (n > to) {
        const bad = report.filter((r) => !r.ok);
        const maxFrame = Math.max(...report.map((r) => r.maxFrame));
        status(`прогон ${from}–${to}: ${report.length} ур., проблем ${bad.length}, ошибок JS ${api.errorCount() - errors0}, худший кадр ${maxFrame.toFixed(0)} мс`);
        console.log('[admin] отчёт', report);
        return;
      }
      const t0 = performance.now();
      startLevel(n);
      const genMs = performance.now() - t0;
      const solvable = analyze(st.grid, st.w, st.h).solved;
      let empty = 0;
      if (st.level > 2) for (let c = 0; c < st.grid.length; c++) if (st.mask[c] && !st.grid[c]) empty++;
      const row = { n, shape: st.shape?.id, tag: st.tag || 'medium', size: `${st.w}x${st.h}`, snakes: st.list.length, genMs: +genMs.toFixed(1), solvable, empty };
      $('adm-n').value = n;
      status(`прогон: ${info()}`);
      solve(ADMIN.runPerFrame, (frames) => {
        // победа: окно победы или финал с собранной фигурой перед ним
        const shown = !document.getElementById('overlay').hidden || !document.getElementById('finale').hidden;
        Object.assign(row, {
          won: shown && st.lives > 0,
          lives: st.lives,
          maxFrame: +Math.max(...frames.slice(2), 0).toFixed(1),
          avgFrame: +(frames.slice(2).reduce((a, b) => a + b, 0) / Math.max(1, frames.length - 2)).toFixed(1),
        });
        row.ok = row.solvable && row.empty === 0 && row.won && row.lives === 3;
        report.push(row);
        n++;
        setTimeout(next, 0);
      });
    };
    next();
  };

  status(info());
  return { go, solve, stop };
}
