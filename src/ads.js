// Реклама (п. 12.6, этап 13): только в Android/iOS-приложении (Capacitor + AdMob), на сайте её нет.
// Реклама за награду — всегда по желанию игрока; между уровнями — редко и по уму (правила ADS в config, SPEC §8).
// Ошибки рекламы никогда не ломают игру: не загрузилась — просто нет награды/паузы.
import { Capacitor } from '@capacitor/core';
import { ADS } from './config.js';
import { dayIndex } from './level.js';

let plugin = null;
let events = null;
let ready = false;
let sinceAd = 0; // уровней пройдено с последней рекламы между уровнями
let lastAdAt = 0; // когда была последняя реклама (performance.now), 0 — ещё не было
const startedAt = typeof performance !== 'undefined' ? performance.now() : 0; // начало сессии
const unit = (k) => (ADS.testing ? ADS.test : ADS.real)[k];

// показывать ли рекламу между уровнями. Без DOM — проверяется тестами.
// level — пройденный уровень; since — уровней с прошлой рекламы; noAds — куплено «Без рекламы»;
// secs — секунд с прошлой рекламы (Infinity — ещё не было); session — секунд с запуска игры; today — показов сегодня
export function shouldInterstitial(level, since, noAds, secs = Infinity, session = Infinity, today = 0) {
  if (noAds || level < ADS.interstitialFrom) return false;
  if (session < ADS.sessionGraceSec || today >= ADS.dailyCap) return false;
  const early = level < ADS.rampUntil;
  const every = early ? ADS.rampEvery : ADS.interstitialEvery;
  const minSec = early ? ADS.rampMinSec : ADS.interstitialMinSec;
  return since >= every && secs >= minSec;
}

export function noAdsBought() {
  try {
    return JSON.parse(localStorage.getItem(ADS.noAdsKey)) === true;
  } catch {
    return false;
  }
}
export const adsReady = () => ready;

// счётчики показов: сегодня (для дневного лимита) и всего (спецпредложение — после нескольких реклам)
export function adStats(day = dayIndex(new Date())) {
  let s = null;
  try {
    s = JSON.parse(localStorage.getItem(ADS.statsKey));
  } catch {
    /* испорченная запись — начнём заново */
  }
  if (!s || typeof s.total !== 'number') s = { day, today: 0, total: 0 };
  if (s.day !== day) s = { day, today: 0, total: s.total };
  return s;
}
function countShown() {
  const s = adStats();
  s.today++;
  s.total++;
  try {
    localStorage.setItem(ADS.statsKey, JSON.stringify(s));
  } catch {
    /* хранилище недоступно — лимит просто не считается */
  }
}

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
  // игрок сам посмотрел ролик — ближайшая реклама между уровнями сдвигается, как будто она только что была
  if (earned) lastAdAt = performance.now();
  return earned;
}

// после пройденного уровня, перед следующим: иногда полноэкранная реклама. true — реклама была показана
export async function betweenLevels(level) {
  sinceAd++;
  const now = performance.now();
  const secs = lastAdAt ? (now - lastAdAt) / 1000 : Infinity;
  const session = (now - startedAt) / 1000;
  if (!ready || !shouldInterstitial(level, sinceAd, noAdsBought(), secs, session, adStats().today)) return false;
  sinceAd = 0;
  lastAdAt = now;
  try {
    await plugin.prepareInterstitial({ adId: unit('interstitialId'), isTesting: ADS.testing });
    await plugin.showInterstitial();
    countShown();
    return true;
  } catch {
    return false; // нет рекламы — играем дальше
  }
}
