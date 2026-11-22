// Покупки (п. 12.7): Google Play Billing (cordova-plugin-purchase), только в Android-приложении.
// Своего сервера нет: покупку подтверждает стор, выдача — на устройстве. На сайте магазина нет.
import { Capacitor } from '@capacitor/core';
import { SHOP, ADS } from './config.js';

// --- без DOM: что даёт товар ---
export const productOf = (id) => SHOP.products.find((p) => p.id === id) || null;

// товар → { boosters: { hint, eraser, life }, flags: ['noAds' | 'allLooks'] }
export function grantsFor(id) {
  const p = productOf(id);
  const boosters = {};
  const flags = [];
  if (!p) return { boosters, flags };
  for (const [k, v] of Object.entries(p.grant)) {
    if (v === true) flags.push(k);
    else boosters[k] = v;
  }
  return { boosters, flags };
}

const FLAG_KEYS = { noAds: ADS.noAdsKey, allLooks: SHOP.allLooksKey };
function setFlag(flag) {
  try {
    localStorage.setItem(FLAG_KEYS[flag], 'true');
  } catch {
    /* хранилище недоступно — восстановится через «Восстановить покупки» */
  }
}
export function flagOn(flag) {
  try {
    return JSON.parse(localStorage.getItem(FLAG_KEYS[flag])) === true;
  } catch {
    return false;
  }
}

// --- магазин (только в приложении) ---
let store = null;
let api = null; // { grant(boosters), onChange() }
let ready = false;
const delivered = new Set(); // транзакции, уже выданные за этот запуск

export const shopReady = () => ready;

function deliver(productId, txId) {
  const key = productId + ':' + (txId || '');
  if (delivered.has(key)) return;
  delivered.add(key);
  const { boosters, flags } = grantsFor(productId);
  flags.forEach(setFlag);
  if (Object.keys(boosters).length) api.grant(boosters);
  api.onChange(productId);
}

export async function initShop(a) {
  api = a;
  if (!Capacitor.isNativePlatform()) return;
  const C = window.CdvPurchase;
  if (!C) return;
  try {
    store = C.store;
    store.register(
      SHOP.products.map((p) => ({
        id: p.id,
        type: p.type === 'cons' ? C.ProductType.CONSUMABLE : C.ProductType.NON_CONSUMABLE,
        platform: C.Platform.GOOGLE_PLAY,
      })),
    );
    // оплачено → выдать → завершить (расходуемые после этого можно купить снова)
    store
      .when()
      .approved((tx) => {
        for (const item of tx.products) deliver(item.id, tx.transactionId);
        tx.finish();
      })
      .productUpdated(() => {
        // разовые покупки, сделанные раньше (переустановка, другое устройство) — вернуть флаги
        for (const p of SHOP.products) if (p.type === 'non' && store.get(p.id)?.owned) grantsFor(p.id).flags.forEach(setFlag);
        api.onChange();
      });
    await store.initialize([C.Platform.GOOGLE_PLAY]);
    ready = true;
    api.onChange();
  } catch {
    ready = false;
  }
}

// для окна магазина: цена из стора, куплен ли
export function shopItems() {
  return SHOP.products.map((p) => {
    const sp = store?.get(p.id);
    const owned = p.type === 'non' && (!!sp?.owned || grantsFor(p.id).flags.every(flagOn));
    return { ...p, price: sp?.pricing?.price || '', available: !!sp?.canPurchase || !!sp?.getOffer?.(), owned };
  });
}

export async function buy(id) {
  const offer = store?.get(id)?.getOffer?.();
  if (!offer) return false;
  const err = await store.order(offer);
  return !err;
}

export async function restore() {
  if (!store) return;
  try {
    await store.restorePurchases();
  } catch {
    /* нет сети — попробовать позже */
  }
  api.onChange();
}
