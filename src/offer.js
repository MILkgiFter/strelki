// Спецпредложение после рекламы (этап 13): логика без DOM — когда показывать, чтобы не раздражало.
// Правила (OFFER в config): не раньше N реклам, не чаще раза в 2 дня, после двух «Не сейчас» — пауза неделю,
// всего не больше maxShows раз, и никогда, если реклама уже отключена покупкой.
import { OFFER } from './config.js';

const HOUR = 3600 * 1000;
export const emptyOffer = () => ({ last: 0, shows: 0, declines: 0 });

// state — { last, shows, declines }; now — Date.now(); adsTotal — сколько реклам между уровнями видел игрок;
// noAds — реклама уже отключена (куплено «Без рекламы» или «Стартовый набор»)
export function shouldOffer(state, now, adsTotal, noAds) {
  const s = state || emptyOffer();
  if (noAds || adsTotal < OFFER.afterAds || s.shows >= OFFER.maxShows) return false;
  const gap = (s.declines >= 2 ? OFFER.declineGapDays * 24 : OFFER.gapHours) * HOUR;
  return !s.last || now - s.last >= gap;
}

// показали окно
export const offerShown = (s, now) => ({ ...(s || emptyOffer()), last: now, shows: (s?.shows || 0) + 1 });
// «Не сейчас» — копим отказы (после двух подряд — длинная пауза); покупка обнуляет
export const offerDeclined = (s) => ({ ...(s || emptyOffer()), declines: (s?.declines || 0) + 1 });
