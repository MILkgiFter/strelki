// Окно спецпредложения (этап 13): после рекламы между уровнями, редко (правила — offer.js и OFFER в config).
// Без давления: никаких таймеров «осталось 5 минут», крупная кнопка покупки и заметная «Не сейчас».
import { OFFER } from './config.js';
import { t } from './i18n.js';
import { sfx, unlock } from './sound.js';
import { $, load, save } from './store.js';
import { shouldOffer, offerShown, offerDeclined } from './offer.js';
import { adStats, noAdsBought } from './ads.js';
import { shopReady, shopItems, buy } from './shop.js';

// цена товара из стора; '' — стор недоступен или товар уже куплен
function priceOf(id) {
  if (!shopReady()) return '';
  const x = shopItems().find((p) => p.id === id);
  return x && !x.owned && x.available ? x.price : '';
}

function open(price, onClose) {
  $('offer-price').textContent = price;
  $('offer').hidden = false;
  sfx.hint();
  const close = (declined) => {
    if ($('offer').hidden) return;
    $('offer').hidden = true;
    if (declined) save(OFFER.key, offerDeclined(load(OFFER.key, null)));
    onClose?.();
  };
  $('offer-buy').onclick = () => {
    unlock();
    sfx.click();
    close(false);
    buy(OFFER.product);
  };
  $('offer-no').onclick = () => {
    sfx.click();
    close(true);
  };
}

// после показанной рекламы между уровнями: может быть, предложить «Стартовый набор» (навсегда без рекламы)
export function maybeOfferAfterAd(onClose) {
  const state = load(OFFER.key, null);
  const price = priceOf(OFFER.product);
  if (!price || !shouldOffer(state, Date.now(), adStats().total, noAdsBought())) return false;
  save(OFFER.key, offerShown(state, Date.now()));
  open(price, onClose);
  return true;
}

// для админки и проверки вида окна на сайте (без стора — цена-заглушка)
export function previewOffer() {
  open(priceOf(OFFER.product) || '$1.99');
}

// окно «закончился бустер»: кроме ролика за +1 — пак бустеров, если стор доступен (контекстно, без отдельного окна)
export function boosterPackButton() {
  const price = priceOf('boosters_small');
  const b = $('adoffer-buy');
  b.hidden = !price;
  if (!price) return;
  b.textContent = t('offerPack', price);
  b.onclick = () => {
    unlock();
    sfx.click();
    $('adoffer').hidden = true;
    buy('boosters_small');
  };
}
