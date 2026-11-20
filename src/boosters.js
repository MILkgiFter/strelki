// Бустеры: запас общий на всю игру, хранится в localStorage. Без DOM — тестируется отдельно.
//  hint   — лупа: подсветить стрелку, которую можно выпустить
//  eraser — ластик: убрать любую стрелку (решаемость не страдает — путь только освобождается)
//  life   — сердечко: +1 жизнь (и «Продолжить» после поражения)
import { BOOSTERS } from './config.js';

export const BOOSTER_KINDS = ['hint', 'eraser', 'life'];

// запас из сохранения (или стартовый), с проверкой значений
export function initBoosters(saved) {
  const b = { ...BOOSTERS.start, next: 0 };
  if (saved && typeof saved === 'object') {
    for (const k of [...BOOSTER_KINDS, 'next']) {
      const v = Number(saved[k]);
      if (Number.isFinite(v) && v >= 0) b[k] = Math.min(k === 'next' ? 1e9 : BOOSTERS.max, Math.floor(v));
    }
  }
  return b;
}

// награда за новые звёзды: по perStar бустеров за звезду, виды по кругу; возвращает список выданных
export function grantForStars(b, newStars) {
  const got = [];
  for (let i = 0; i < newStars * BOOSTERS.perStar; i++) {
    const k = BOOSTER_KINDS[b.next % BOOSTER_KINDS.length];
    b.next++;
    if (b[k] < BOOSTERS.max) {
      b[k]++;
      got.push(k);
    }
  }
  return got;
}

// выдать набор бустеров вида { hint: 1, eraser: 1 } (не больше максимума); возвращает список выданных
export function grantSet(b, set) {
  const got = [];
  for (const k of BOOSTER_KINDS) {
    for (let i = 0; i < (set[k] || 0); i++) {
      if (b[k] < BOOSTERS.max) {
        b[k]++;
        got.push(k);
      }
    }
  }
  return got;
}

// потратить один бустер; false — если нет
export function spend(b, k) {
  if (!(b[k] > 0)) return false;
  b[k]--;
  return true;
}
