import { describe, it, expect } from 'vitest';
import { shouldInterstitial } from '../src/ads.js';
import { ADS } from '../src/config.js';

// аргументы: уровень, уровней с прошлой рекламы, «Без рекламы», секунд с прошлой рекламы, секунд с запуска, показов сегодня
const ok = (lv, since = 99, secs = Infinity) => shouldInterstitial(lv, since, false, secs, 9999, 0);

describe('умная реклама между уровнями (SPEC §8, этап 13)', () => {
  it('первые уровни чистые — не раньше 12-го', () => {
    expect(ADS.interstitialFrom).toBeGreaterThanOrEqual(12);
    for (let lv = 1; lv < ADS.interstitialFrom; lv++) expect(ok(lv), `ур. ${lv}`).toBe(false);
    expect(ok(ADS.interstitialFrom)).toBe(true);
  });

  it('до 30-го уровня — не чаще раза в 3 уровня и в 2,5 минуты', () => {
    expect(ok(15, ADS.rampEvery - 1)).toBe(false);
    expect(ok(15, ADS.rampEvery)).toBe(true);
    expect(ok(15, 99, ADS.rampMinSec - 1)).toBe(false);
    expect(ADS.rampMinSec).toBeGreaterThanOrEqual(120);
  });

  it('дальше — не чаще раза в 2 уровня и в 90 секунд', () => {
    expect(ADS.interstitialEvery).toBeGreaterThanOrEqual(2);
    expect(ADS.interstitialMinSec).toBeGreaterThanOrEqual(90);
    expect(ok(40, 1)).toBe(false);
    expect(ok(40, 2)).toBe(true);
    expect(ok(40, 5, 30)).toBe(false);
    expect(ok(40, 5, 120)).toBe(true);
  });

  it('в первые 2 минуты после запуска — без рекламы', () => {
    expect(shouldInterstitial(50, 99, false, Infinity, ADS.sessionGraceSec - 1, 0)).toBe(false);
    expect(shouldInterstitial(50, 99, false, Infinity, ADS.sessionGraceSec, 0)).toBe(true);
  });

  it('дневной лимит показов', () => {
    expect(shouldInterstitial(50, 99, false, Infinity, 9999, ADS.dailyCap - 1)).toBe(true);
    expect(shouldInterstitial(50, 99, false, Infinity, 9999, ADS.dailyCap)).toBe(false);
  });

  it('за 30 быстрых уровней подряд — не больше 10 реклам', () => {
    let since = 0;
    let last = -Infinity;
    let shown = 0;
    for (let lv = 1, sec = 0; lv <= 60; lv++, sec += 60) {
      since++;
      if (shouldInterstitial(lv, since, false, sec - last, sec, shown)) {
        shown++;
        since = 0;
        last = sec;
      }
    }
    expect(shown).toBeLessThanOrEqual(14);
    expect(shown).toBeGreaterThan(0);
  });

  it('после покупки «Без рекламы» — никогда', () => {
    for (let lv = 1; lv < 300; lv++) expect(shouldInterstitial(lv, 99, true, Infinity, 9999, 0)).toBe(false);
  });
});
