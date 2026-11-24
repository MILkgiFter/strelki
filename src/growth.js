// Рост (этап 14): просьба оценить игру и ежедневное уведомление. Только в приложении (Capacitor);
// на сайте всё молча пропускается. Ошибки плагинов никогда не ломают игру.
import { Capacitor } from '@capacitor/core';
import { REVIEW, NOTIFY } from './config.js';
import { dayIndex } from './level.js';
import { load, save } from './store.js';
import { t } from './i18n.js';
import { track } from './analytics.js';

const native = () => Capacitor.isNativePlatform();
const today = () => dayIndex(new Date());

// ---------- логика без плагинов (тесты) ----------
// просить ли оценку: пройден уровень level на stars звёзд, last — день прошлой просьбы (null — не просили)
export function shouldAskReview(level, stars, last, day) {
  if (level < REVIEW.from || stars < REVIEW.minStars) return false;
  return last == null || day - last >= REVIEW.gapDays;
}
// спрашивать ли разрешение на уведомления: не в первый день игры и один раз
export function shouldAskNotify(state, day) {
  return !!state && !state.asked && day - state.first >= NOTIFY.askFromDay;
}

// ---------- оценка ----------
// true — окно оценки запрошено (тогда в этот раз ничего больше не спрашиваем)
export async function maybeAskReview(level, stars) {
  if (!native()) return false;
  const day = today();
  if (!shouldAskReview(level, stars, load(REVIEW.key, null), day)) return false;
  save(REVIEW.key, day);
  track('review_ask', { level });
  try {
    const { InAppReview } = await import('@capacitor-community/in-app-review');
    await InAppReview.requestReview();
  } catch {
    /* нет Google Play / лимит — ничего страшного */
  }
  return true;
}

// ---------- уведомление ----------
async function notifications() {
  return (await import('@capacitor/local-notifications')).LocalNotifications;
}
async function schedule(LN) {
  await LN.cancel({ notifications: [{ id: NOTIFY.id }] }).catch(() => {});
  await LN.schedule({
    notifications: [
      {
        id: NOTIFY.id,
        title: t('notifyTitle'),
        body: t('notifyBody'),
        schedule: { on: { hour: NOTIFY.hour, minute: NOTIFY.minute }, allowWhileIdle: true },
      },
    ],
  });
}

// при запуске: запомнить первый день; если разрешение уже есть — переставить уведомление (язык мог смениться)
export async function initGrowth() {
  if (!native()) return;
  const day = today();
  if (!load(NOTIFY.key, null)) save(NOTIFY.key, { first: day, asked: false });
  try {
    const LN = await notifications();
    if ((await LN.checkPermissions()).display === 'granted') await schedule(LN);
  } catch {
    /* плагина нет или уведомления выключены */
  }
}

// после победы: со второго дня игры один раз спросить разрешение (системное окно Android 13+)
export async function maybeAskNotify() {
  if (!native()) return;
  const state = load(NOTIFY.key, null);
  if (!shouldAskNotify(state, today())) return;
  save(NOTIFY.key, { ...state, asked: true });
  try {
    const LN = await notifications();
    const p = await LN.requestPermissions();
    track('notify_permission', { granted: p.display === 'granted' ? 1 : 0 });
    if (p.display === 'granted') await schedule(LN);
  } catch {
    /* отказ или нет плагина */
  }
}
