import { describe, it, expect } from 'vitest';
import { shouldOffer, offerShown, offerDeclined, emptyOffer } from '../src/offer.js';
import { OFFER } from '../src/config.js';

const H = 3600 * 1000;
const T0 = 1_800_000_000_000;

describe('спецпредложение после рекламы (этап 13)', () => {
  it('не раньше, чем игрок увидит несколько реклам', () => {
    expect(shouldOffer(null, T0, OFFER.afterAds - 1, false)).toBe(false);
    expect(shouldOffer(null, T0, OFFER.afterAds, false)).toBe(true);
  });

  it('никогда, если реклама уже отключена покупкой', () => {
    expect(shouldOffer(null, T0, 99, true)).toBe(false);
  });

  it('не чаще раза в 2 дня', () => {
    const s = offerShown(emptyOffer(), T0);
    expect(shouldOffer(s, T0 + (OFFER.gapHours - 1) * H, 99, false)).toBe(false);
    expect(shouldOffer(s, T0 + OFFER.gapHours * H, 99, false)).toBe(true);
  });

  it('после двух «Не сейчас» — пауза неделю', () => {
    let s = offerShown(emptyOffer(), T0);
    s = offerDeclined(s);
    s = offerDeclined(s);
    expect(shouldOffer(s, T0 + OFFER.gapHours * H, 99, false)).toBe(false);
    expect(shouldOffer(s, T0 + OFFER.declineGapDays * 24 * H, 99, false)).toBe(true);
  });

  it('всего не больше maxShows показов', () => {
    let s = emptyOffer();
    let now = T0;
    let shown = 0;
    for (let i = 0; i < 50; i++, now += 30 * 24 * H) {
      if (shouldOffer(s, now, 99, false)) {
        s = offerShown(s, now);
        shown++;
      }
    }
    expect(shown).toBe(OFFER.maxShows);
  });
});
