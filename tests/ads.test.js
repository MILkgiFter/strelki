import { describe, it, expect } from 'vitest';
import { shouldInterstitial } from '../src/ads.js';
import { ADS } from '../src/config.js';

describe('реклама между уровнями (SPEC §8)', () => {
  it('не раньше 10-го уровня', () => {
    for (let lv = 1; lv < ADS.interstitialFrom; lv++) expect(shouldInterstitial(lv, 99, false), `ур. ${lv}`).toBe(false);
    expect(ADS.interstitialFrom).toBeGreaterThanOrEqual(10);
  });

  it('не чаще раза в 2 уровня', () => {
    expect(ADS.interstitialEvery).toBeGreaterThanOrEqual(2);
    let since = 0;
    let shown = 0;
    for (let lv = 10; lv < 70; lv++) {
      since++;
      if (shouldInterstitial(lv, since, false)) {
        shown++;
        since = 0;
      }
    }
    expect(shown).toBeLessThanOrEqual(Math.ceil(60 / ADS.interstitialEvery));
  });

  it('не чаще раза в 90 секунд, даже если уровни короткие', () => {
    expect(ADS.interstitialMinSec).toBeGreaterThanOrEqual(90);
    expect(shouldInterstitial(20, 5, false, 30)).toBe(false);
    expect(shouldInterstitial(20, 5, false, 120)).toBe(true);
  });

  it('после покупки «Без рекламы» — никогда', () => {
    for (let lv = 1; lv < 300; lv++) expect(shouldInterstitial(lv, 99, true)).toBe(false);
  });
});
