// Пульт прослушивания (только админка, кнопка 🎧): каждый звук и каждая тема музыки — по кнопке,
// у каждого отметка «оставить / поменять» и заметка. «Скопировать отзыв» — текст для агента.
// Отметки хранятся в localStorage (только у этого игрока), на игру не влияют.
import { sfx, music, unlock, setStyle, getStyle, getStyleOverride } from './sound.js';

// сравнение «было / стало»: варианты звука, ▶ — как он звучит в игре, «в игру» — включить в игре
const COMPARE = [
  {
    sound: 'fly',
    title: 'Верный тап',
    note: '▶ — серия из 5 тапов',
    play: () => [0, 1, 2, 3, 4].forEach((c, i) => setTimeout(() => sfx.fly(c, 3), i * 230)),
    ms: 5 * 230,
    variants: [
      { id: 'pop', name: 'Было', hint: 'мягкий «поп»' },
      { id: 'bubble', name: 'A', hint: 'пузырёк, «блоп»' },
      { id: 'wood', name: 'B', hint: 'деревяшка, сухой щелчок' },
      { id: 'swoosh', name: 'C', hint: 'свуш, «улетела» — выбран' },
    ],
  },
  {
    sound: 'win',
    title: 'Победа — вариации от твоих ♥ (F, D, W)',
    note: '▶ — звук пройденного уровня',
    play: () => sfx.win(),
    ms: 50,
    variants: [
      { id: 'swishSpark', name: 'F+D', hint: 'свуш переходит в искры' },
      { id: 'swishShort', name: 'F1', hint: 'короткий свуш + колокольчик выше' },
      { id: 'swishTwo', name: 'F2', hint: 'свуш + два колокольчика' },
      { id: 'sparkFast', name: 'D1', hint: 'искры быстрее и короче' },
      { id: 'sparkSoft', name: 'D2', hint: 'искры ниже и мягче' },
      { id: 'sparkUp', name: 'D3', hint: 'искры широкими шагами вверх' },
      { id: 'upSpark', name: 'W+D', hint: 'запись «взлёт» + искры' },
      { id: 'swishUp', name: 'F+W', hint: 'свуш + запись «взлёт»' },
    ],
  },
  {
    sound: 'win',
    title: 'Победа',
    note: '▶ — звук пройденного уровня',
    play: () => sfx.win(),
    ms: 50,
    variants: [
      { id: 'arp', name: 'Было', hint: 'перелив из 5 нот + колокол' },
      { id: 'chime', name: 'A', hint: 'два колокольчика вверх, коротко' },
      { id: 'harp', name: 'B', hint: 'арфа: быстрый взлёт' },
      { id: 'chord', name: 'C', hint: 'мягкий аккорд, «выдох»' },
      { id: 'sparkle', name: 'D', hint: 'россыпь искр, быстро вверх' },
      { id: 'marimba', name: 'E', hint: 'маримба, тёплое «та-да-даа»' },
      { id: 'swish', name: 'F', hint: 'свуш + колокольчик (как тап)' },
      { id: 'glow', name: 'G', hint: 'тёплый аккорд + колокольчик' },
      { id: 'sax1', name: 'H', hint: 'запись: саксофон, взлёт гаммой' },
      { id: 'sax2', name: 'I', hint: 'запись: саксофон, коротко' },
      { id: 'steel1', name: 'J', hint: 'запись: стил-драм, коротко' },
      { id: 'steel2', name: 'K', hint: 'запись: стил-драм, длиннее' },
      { id: 'pizz', name: 'L', hint: 'запись: струнные щипком' },
      { id: 'ok1', name: 'M', hint: 'запись: «готово», мягко вверх' },
      { id: 'ok2', name: 'N', hint: 'запись: «готово», очень коротко' },
      { id: 'ok3', name: 'O', hint: 'запись: две ноты вверх' },
      { id: 'ok4', name: 'P', hint: 'запись: «динь-дон»' },
      { id: 'bit1', name: 'Q', hint: 'запись: 8-бит, коротко' },
      { id: 'bit2', name: 'R', hint: 'запись: 8-бит, длиннее' },
      { id: 'sax3', name: 'S', hint: 'запись: саксофон, перелив вверх' },
      { id: 'sax4', name: 'T', hint: 'запись: саксофон, две ноты' },
      { id: 'steel3', name: 'U', hint: 'запись: стил-драм, взлёт с повтором' },
      { id: 'bit3', name: 'V', hint: 'запись: 8-бит, мелодия вверх' },
      { id: 'up1', name: 'W', hint: 'запись: короткий «взлёт»' },
      { id: 'up2', name: 'X', hint: 'запись: короткий «взлёт», выше' },
      { id: 'tri', name: 'Y', hint: 'запись: три тона вверх' },
      { id: 'high', name: 'Z', hint: 'запись: чистый «взлёт»' },
      { id: 'pow1', name: 'A2', hint: 'запись: «пауэр-ап»' },
      { id: 'pow2', name: 'B2', hint: 'запись: «пауэр-ап», другой' },
      { id: 'phase', name: 'C2', hint: 'запись: мягкий фазер вверх' },
    ],
  },
];

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
    <div class="sb-tip">Слушай, отмечай ✓ оставить / ✎ поменять, пиши, что не так. Звуки эффектов подстраиваются под тональность текущей темы музыки.</div>
    <div class="sb-list">
    ${COMPARE.map((g) => `<div class="sb-taps">
      <div class="sb-name">${g.title} — сравни</div>
      <div class="sb-when">${g.note}. «В игру» — этот вариант звучит в игре (закрой пульт и пройди уровень).</div>
      ${g.variants.map((v) => `<div class="sb-tap"><button class="sb-play" data-try="${g.sound}:${v.id}">▶</button><div class="sb-text"><b>${v.name}</b> · ${v.hint}</div><button class="sb-like${review['like:' + g.sound + ':' + v.id] ? ' on' : ''}" data-like="${g.sound}:${v.id}" title="близко к тому, что надо">${review['like:' + g.sound + ':' + v.id] ? '♥' : '♡'}</button><button class="sb-use" data-use="${g.sound}:${v.id}">в игру</button></div>`).join('')}
    </div>`).join('')}
    </div>
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
  const markUse = () =>
    box.querySelectorAll('.sb-use').forEach((u) => {
      const [name, id] = u.dataset.use.split(':');
      u.classList.toggle('on', getStyle(name) === id);
    });
  markUse();

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
    if (b.dataset.try) {
      const [name, id] = b.dataset.try.split(':');
      const g = COMPARE.find((x) => x.sound === name);
      const keep = getStyleOverride(name);
      setStyle(name, id);
      g.play();
      setTimeout(() => setStyle(name, keep), g.ms);
    }
    if (b.dataset.like) {
      const k = 'like:' + b.dataset.like;
      if (review[k]) delete review[k];
      else review[k] = true;
      saveReview(review);
      b.classList.toggle('on', !!review[k]);
      b.textContent = review[k] ? '♥' : '♡';
    }
    if (b.dataset.use) {
      const [name, id] = b.dataset.use.split(':');
      setStyle(name, id);
      markUse();
    }
    if (b.dataset.act === 'close') box.hidden = true;
    if (b.dataset.act === 'stop') music.stop();
    if (b.dataset.act === 'copy') {
      const lines = items.map((it) => {
        const r = review[it.id] || {};
        const mark = r.mark === 'keep' ? 'оставить' : r.mark === 'change' ? 'ПОМЕНЯТЬ' : 'не отмечено';
        return `- ${it.name} (${it.id}): ${mark}${r.note ? ' — ' + r.note : ''}`;
      });
      const liked = COMPARE.flatMap((g) =>
        g.variants.filter((v) => review['like:' + g.sound + ':' + v.id]).map((v) => `${g.title}: ${v.name} (${v.id}) — ${v.hint}`),
      );
      const chosen = COMPARE.map((g) => `${g.title}: в игре ${getStyle(g.sound)}`);
      const text = ['Отзыв по звукам:', ...lines, '', '♥ Близко к нужному:', ...(liked.length ? liked.map((l) => '- ' + l) : ['- (ничего не отмечено)']), '', 'Сейчас в игре:', ...chosen.map((l) => '- ' + l)].join('\n');
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
