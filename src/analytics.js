// Аналитика и отчёты о вылетах (этап 14): Firebase Analytics + Crashlytics, только в приложении.
// На сайте и при любой ошибке плагина — молча ничего. Персональных данных не шлём: только события игры.
// Названия событий — по рекомендациям GA4 там, где они есть (level_start, level_end, tutorial_begin…).
// Сбор аналитики выключен в манифесте и включается только после согласия (UMP в ads.js) — setAnalyticsConsent.
import { Capacitor } from '@capacitor/core';
import { ANALYTICS } from './config.js';

const native = Capacitor.isNativePlatform();
let fa = null; // FirebaseAnalytics
let fc = null; // FirebaseCrashlytics
let queue = []; // события до загрузки плагина
let consent = null; // null — ещё неизвестно, true/false — решение после формы согласия

// согласие выяснено (ads.js): включить или оставить выключенным сбор аналитики
export function setAnalyticsConsent(ok) {
  consent = !!ok;
  if (!fa) return; // плагин ещё грузится — initAnalytics применит решение и отправит очередь
  fa.setEnabled({ enabled: consent })
    .then(flush)
    .catch(() => {});
}

// события, накопленные до согласия: при согласии — отправить, при отказе — выбросить
function flush() {
  const q = queue;
  queue = [];
  if (consent) for (const [name, params] of q) fa.logEvent({ name, params }).catch(() => {});
}

// текст ошибки без длинных хвостов (в сообщениях ошибок кода пользовательского ввода нет, но на всякий случай режем)
const clip = (s, n) => String(s ?? '').slice(0, n);

export async function initAnalytics(lang) {
  if (!native) return;
  try {
    fa = (await import('@capacitor-firebase/analytics')).FirebaseAnalytics;
    if (lang) await fa.setUserProperty({ key: 'lang', value: String(lang) });
    if (consent !== null) {
      await fa.setEnabled({ enabled: consent });
      flush();
    }
  } catch {
    fa = null;
    queue = [];
  }
  try {
    fc = (await import('@capacitor-firebase/crashlytics')).FirebaseCrashlytics;
    // ошибки JS в WebView тоже попадают в Crashlytics (как «нефатальные»), не больше maxErrors за сессию
    let sent = 0;
    const report = (message, stack) => {
      if (!fc || sent >= ANALYTICS.maxErrors) return;
      sent++;
      // стек JS — строкой в лог отчёта: формат стека плагина рассчитан на нативные кадры
      if (stack) fc.log({ message: clip(stack, ANALYTICS.stackLen) }).catch(() => {});
      fc.recordException({ message: clip(message, ANALYTICS.msgLen) }).catch(() => {});
    };
    window.addEventListener('error', (e) => report(e.message, e.error?.stack));
    window.addEventListener('unhandledrejection', (e) => report(e.reason?.message || e.reason, e.reason?.stack));
  } catch {
    fc = null;
  }
}

// событие игры; params — числа и короткие строки
export function track(name, params = {}) {
  if (!native) return;
  // до загрузки плагина и до решения о согласии — копим (иначе события до формы согласия теряются)
  if (!fa || consent === null) {
    if (queue.length < ANALYTICS.queue) queue.push([name, params]);
    return;
  }
  if (!consent) return;
  fa.logEvent({ name, params }).catch(() => {});
}
