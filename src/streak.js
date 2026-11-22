// Серия дней (п. 12.1): подарок раз в день, награда растёт к 7-му дню, пропуск сбрасывает серию.
// Без DOM — тестируется отдельно. День — номер из level.js dayIndex (локальная дата игрока).
import { STREAK } from './config.js';

const LEN = () => STREAK.rewards.length;

// сохранение → { last, step }; мусор и чужие значения — как «ещё ни разу»
export function normStreak(saved) {
  const last = Number(saved?.last);
  const step = Number(saved?.step);
  return {
    last: Number.isInteger(last) && last >= 0 ? last : -1,
    step: Number.isInteger(step) && step >= 0 && step < LEN() ? step : 0,
  };
}

// Что показать сегодня:
//  claimed — подарок уже забран сегодня; step — какой день серии (0..6) сегодня/забран;
//  done — сколько клеток календаря отмечено ✓ (до сегодняшней); broken — серия прервалась
export function streakStatus(saved, today) {
  const s = normStreak(saved);
  if (s.last === today) return { claimed: true, step: s.step, done: s.step + 1, broken: false };
  const cont = s.last >= 0 && s.last === today - 1;
  const step = cont ? (s.step + 1) % LEN() : 0;
  return { claimed: false, step, done: step, broken: s.last >= 0 && !cont };
}

// Забрать сегодняшний подарок: новое сохранение и набор бустеров ({} — если уже забран)
export function claimStreak(saved, today) {
  const st = streakStatus(saved, today);
  if (st.claimed) return { state: normStreak(saved), reward: {} };
  return { state: { last: today, step: st.step }, reward: { ...STREAK.rewards[st.step] } };
}
