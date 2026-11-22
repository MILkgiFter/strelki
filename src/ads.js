// Реклама (п. 12.6): только в Android/iOS-приложении (Capacitor + AdMob), на сайте её нет.
// Реклама за награду — всегда по желанию игрока; между уровнями — редко (правила ADS в config, SPEC §8).
// Ошибки рекламы никогда не ломают игру: не загрузилась — просто нет награды/паузы.
import { Capacitor } from '@capacitor/core';
import { ADS } from './config.js';

let plugin = null;
let events = null;
let ready = false;
let sinceAd = 0; // уровней пройдено с последней рекламы между уровнями
let lastAdAt = 0; // когда была последняя реклама (performance.now), 0 — ещё не было
const unit = (k) => (ADS.testing ? ADS.test : ADS.real)[k];

// показывать ли рекламу между уровнями: не на первых уровнях, не чаще раза в N уровней и в M секунд,
// не после «Без рекламы»; secs — секунд с прошлой рекламы (Infinity — ещё не было)
export function shouldInterstitial(level, since, noAds, secs = Infinity) {
  return !noAds && level >= ADS.interstitialFrom && since >= ADS.interstitialEvery && secs >= ADS.interstitialMinSec;
}

export function noAdsBought() {
  try {
    return JSON.parse(localStorage.getItem(ADS.noAdsKey)) === true;
  } catch {
    return false;
  }
}
export const adsReady = () => ready;

export async function initAds() {
  if (!Capacitor.isNativePlatform()) return;
  try {
    const m = await import('@capacitor-community/admob');
    plugin = m.AdMob;
    events = m.RewardAdPluginEvents;
    await plugin.initialize({ initializeForTesting: ADS.testing });
    // согласие на персонализацию (GDPR/UMP): форма только там, где она обязательна
    try {
      const info = await plugin.requestConsentInfo();
      if (info?.isConsentFormAvailable && info.status === 'REQUIRED') await plugin.showConsentForm();
    } catch {
      /* без формы реклама всё равно показывается неперсонализированной */
    }
    ready = true;
  } catch {
    ready = false;
  }
}

// ролик за награду; true — досмотрен и награда положена
export async function showRewarded() {
  if (!ready) return false;
  let earned = false;
  let sub = null;
  try {
    sub = await plugin.addListener(events.Rewarded, () => (earned = true));
    await plugin.prepareRewardVideoAd({ adId: unit('rewardedId'), isTesting: ADS.testing });
    const r = await plugin.showRewardVideoAd();
    if (r && (r.amount > 0 || r.type)) earned = true;
  } catch {
    /* не загрузилась или закрыли — без награды */
  } finally {
    sub?.remove?.();
  }
  return earned;
}

// после пройденного уровня, перед следующим: иногда полноэкранная реклама
export async function betweenLevels(level) {
  sinceAd++;
  const secs = lastAdAt ? (performance.now() - lastAdAt) / 1000 : Infinity;
  if (!ready || !shouldInterstitial(level, sinceAd, noAdsBought(), secs)) return;
  sinceAd = 0;
  lastAdAt = performance.now();
  try {
    await plugin.prepareInterstitial({ adId: unit('interstitialId'), isTesting: ADS.testing });
    await plugin.showInterstitial();
  } catch {
    /* нет рекламы — играем дальше */
  }
}
