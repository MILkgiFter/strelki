// Аналитика и отчёты о вылетах (этап 14): Firebase Analytics + Crashlytics, только в приложении.
// На сайте и при любой ошибке плагина — молча ничего. Персональных данных не шлём: только события игры.
// Названия событий — по рекомендациям GA4 там, где они есть (level_start, level_end, tutorial_begin…).
import { Capacitor } from '@capacitor/core';

const native = Capacitor.isNativePlatform();
let fa = null; // FirebaseAnalytics
let fc = null; // FirebaseCrashlytics
let queue = []; // события до загрузки плагина

export async function initAnalytics(lang) {
  if (!native) return;
  try {
    fa = (await import('@capacitor-firebase/analytics')).FirebaseAnalytics;
    if (lang) await fa.setUserProperty({ key: 'lang', value: String(lang) });
    for (const [name, params] of queue) fa.logEvent({ name, params }).catch(() => {});
  } catch {
    fa = null;
  }
  queue = [];
  try {
    fc = (await import('@capacitor-firebase/crashlytics')).FirebaseCrashlytics;
    // ошибки JS в WebView тоже попадают в Crashlytics (как «нефатальные»), не чаще 5 за сессию
    let sent = 0;
    const report = (message, stack) => {
      if (!fc || sent >= 5) return;
      sent++;
      // стек JS кладём строкой в лог отчёта — формат стека плагина рассчитан на нативные кадры
      if (stack) fc.log({ message: String(stack).slice(0, 1000) }).catch(() => {});
      fc.recordException({ message: String(message).slice(0, 500) }).catch(() => {});
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
  if (!fa) {
    if (queue.length < 50) queue.push([name, params]);
    return;
  }
  fa.logEvent({ name, params }).catch(() => {});
}
