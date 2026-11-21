// Пульт прослушивания (только админка, кнопка 🎧): каждый звук и каждая тема музыки — по кнопке,
// у каждого отметка «оставить / поменять» и заметка. «Скопировать отзыв» — текст для агента.
// Отметки хранятся в localStorage (только у этого игрока), на игру не влияют.
import { sfx, music, unlock } from './sound.js';

const KEY = 'strelki.soundReview';

// что слышит игрок и когда; play — как звук звучит в игре
const SFX = [
  { id: 'tap', name: 'Верный тап', when: 'стрелка улетает (обычный ход)', play: () => sfx.fly(0, 3) },
  { id: 'combo', name: 'Серия тапов', when: 'несколько верных ходов подряд — тон растёт', play: () => [0, 1, 2, 3, 4].forEach((c, i) => setTimeout(() => sfx.fly(c, 3), i * 260)) },
  { id: 'long', name: 'Длинная стрелка', when: 'улетает стрелка из многих клеток', play: () => sfx.fly(0, 12) },
  { id: 'bump', name: 'Ошибка', when: 'стрелка упёрлась, минус жизнь', play: () => sfx.bump() },
  { id: 'hint', name: 'Лупа / жизнь', when: 'подсказка, +1 жизнь', play: () => sfx.hint() },
  { id: 'win', name: 'Победа', when: 'уровень пройден', play: () => sfx.win() },
  { id: 'stars', name: 'Звёзды', when: 'звёзды по одной в окне победы', play: () => [0, 1, 2].forEach((i) => setTimeout(() => sfx.star(i), i * 380)) },
  { id: 'lose', name: 'Поражение', when: 'жизни кончились', play: () => sfx.lose() },
  { id: 'click', name: 'Кнопка', when: 'любая кнопка интерфейса', play: () => sfx.click() },
];

function loadReview() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || {};
  } catch {
    return {};
  }
}
function saveReview(r) {
  try {
    localStorage.setItem(KEY, JSON.stringify(r));
  } catch {
    /* хранилище недоступно — отметки живут до перезагрузки */
  }
}

export function initSoundboard() {
  const review = loadReview();
  const themes = music.themes.map((th, i) => ({
    id: 'music-' + th.id,
    name: 'Музыка: ' + th.name.ru,
    when: 'фоновая тема (фраза 40–90 с, потом пауза)',
    play: () => {
      music.setTheme(i);
      music.start();
    },
  }));
  const items = [...SFX, ...themes];

  const box = document.createElement('div');
  box.className = 'soundboard';
  box.hidden = true;
  box.innerHTML = `
    <div class="sb-head"><b>🎧 Звуки и музыка</b><button data-act="close">×</button></div>
    <div class="sb-tip">Слушай, отмечай ✓ оставить / ✎ поменять, пиши, что не так. Эффекты — записанные звуки Kenney (CC0), музыка пока генеративная.</div>
    <div class="sb-list"></div>
    <div class="sb-foot">
      <button data-act="stop">■ Стоп музыка</button>
      <button data-act="copy">📋 Скопировать отзыв</button>
    </div>
    <textarea class="sb-out" readonly hidden></textarea>`;
  document.body.appendChild(box);
  const list = box.querySelector('.sb-list');

  const row = (it) => {
    const r = review[it.id] || {};
    const el = document.createElement('div');
    el.className = 'sb-row';
    el.innerHTML = `
      <button class="sb-play" data-play="${it.id}">▶</button>
      <div class="sb-text"><div class="sb-name">${it.name}</div><div class="sb-when">${it.when}</div>
        <input class="sb-note" data-note="${it.id}" placeholder="что не так / как надо" value="${(r.note || '').replace(/"/g, '&quot;')}" /></div>
      <div class="sb-marks">
        <button class="sb-mark${r.mark === 'keep' ? ' on' : ''}" data-mark="keep" data-id="${it.id}" title="оставить">✓</button>
        <button class="sb-mark${r.mark === 'change' ? ' on change' : ''}" data-mark="change" data-id="${it.id}" title="поменять">✎</button>
      </div>`;
    return el;
  };
  items.forEach((it) => list.appendChild(row(it)));

  box.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    unlock();
    if (b.dataset.play) items.find((it) => it.id === b.dataset.play).play();
    if (b.dataset.mark) {
      const r = (review[b.dataset.id] ||= {});
      r.mark = r.mark === b.dataset.mark ? null : b.dataset.mark;
      saveReview(review);
      b.parentElement.querySelectorAll('.sb-mark').forEach((m) => m.classList.toggle('on', m.dataset.mark === r.mark));
      b.parentElement.querySelector('[data-mark="change"]').classList.toggle('change', r.mark === 'change');
    }
    if (b.dataset.act === 'close') box.hidden = true;
    if (b.dataset.act === 'stop') music.stop();
    if (b.dataset.act === 'copy') {
      const lines = items.map((it) => {
        const r = review[it.id] || {};
        const mark = r.mark === 'keep' ? 'оставить' : r.mark === 'change' ? 'ПОМЕНЯТЬ' : 'не отмечено';
        return `- ${it.name} (${it.id}): ${mark}${r.note ? ' — ' + r.note : ''}`;
      });
      const text = 'Отзыв по звукам:\n' + lines.join('\n');
      const out = box.querySelector('.sb-out');
      out.value = text;
      out.hidden = false;
      out.select();
      navigator.clipboard?.writeText(text).catch(() => {});
    }
  });
  box.addEventListener('input', (e) => {
    const id = e.target.dataset.note;
    if (!id) return;
    (review[id] ||= {}).note = e.target.value;
    saveReview(review);
  });
  return () => (box.hidden = !box.hidden);
}
