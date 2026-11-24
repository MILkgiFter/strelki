// Окно «Магазин» (п. 12.7): товары с ценой из Google Play, покупка, «Восстановить покупки».
// Кнопка 🛒 видна только в приложении (на сайте магазина нет); там она заменяет 👁 в меню
// (режим для дальтоников есть в «Оформлении»).
import { Capacitor } from '@capacitor/core';
import { t } from './i18n.js';
import { sfx, unlock } from './sound.js';
import { $ } from './store.js';
import { toast } from './boosters-ui.js';
import { initShop, shopReady, shopItems, buy, restore } from './shop.js';
import { updateThemeButton } from './screens.js';
import { privacyChoicesNeeded, showPrivacyOptions } from './ads.js';

function render() {
  const box = $('shop-list');
  box.innerHTML = '';
  for (const x of shopItems()) {
    const row = document.createElement('div');
    row.className = 'task' + (x.owned ? ' got' : '');
    const right = x.owned
      ? `<span class="task-ok">${t('shopOwned')}</span>`
      : `<button class="btn task-claim shop-price" data-buy="${x.id}" ${x.available ? '' : 'disabled'}>${x.price || '—'}</button>`;
    row.innerHTML = `<div class="task-text"><div class="task-name">${t('shop_' + x.id)}</div><div class="task-n">${t('shop_' + x.id + '_d')}</div></div>${right}`;
    box.appendChild(row);
  }
}

export function initShopUI({ grant }) {
  const native = Capacitor.isNativePlatform();
  $('shop-btn').hidden = !native;
  if (native) $('cb').hidden = true;
  $('shop-btn').addEventListener('click', () => {
    unlock();
    sfx.click();
    if (!shopReady()) toast(t('shopNoStore'));
    render();
    $('shop-privacy').hidden = !privacyChoicesNeeded(); // только где закон требует согласия (ЕС, Великобритания)
    $('shop').hidden = false;
  });
  $('shop-close').addEventListener('click', () => {
    sfx.click();
    $('shop').hidden = true;
  });
  $('shop-privacy').addEventListener('click', () => {
    sfx.click();
    showPrivacyOptions();
  });
  $('shop-restore').addEventListener('click', () => {
    unlock();
    sfx.click();
    restore();
  });
  $('shop-list').addEventListener('click', (e) => {
    const b = e.target.closest('[data-buy]');
    if (!b) return;
    unlock();
    sfx.click();
    buy(b.dataset.buy);
  });
  initShop({
    grant,
    onChange: (bought) => {
      if (bought) {
        sfx.hint();
        toast(t('shopThanks'));
      }
      updateThemeButton(); // «Всё оформление» открывает темы — счётчик в меню сразу 8/8
      if (!$('shop').hidden) render();
    },
  });
}
