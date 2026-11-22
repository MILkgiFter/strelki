// Коллекции в альбоме (п. 12.4): прогресс по наборам фигур и награда за полный набор.
// Без DOM — тестируется отдельно. open — множество id открытых фигур (их уровни пройдены).
import { COLLECTIONS } from './config.js';

const claimedOf = (saved) => (saved && typeof saved.claimed === 'object' && saved.claimed ? saved.claimed : {});

// [{ id, icon, reward, shapes, have, total, done, claimed }]
export function collectionsStatus(open, saved) {
  const claimed = claimedOf(saved);
  return COLLECTIONS.list.map((c) => {
    const have = c.shapes.filter((id) => open.has(id)).length;
    return { ...c, have, total: c.shapes.length, done: have === c.shapes.length, claimed: !!claimed[c.id] };
  });
}

// забрать награду за собранный набор; повторно и за неполный — ничего
export function claimCollection(open, saved, id) {
  const claimed = { ...claimedOf(saved) };
  const c = collectionsStatus(open, saved).find((x) => x.id === id);
  if (!c || !c.done || c.claimed) return { state: { claimed }, reward: {} };
  claimed[id] = true;
  return { state: { claimed }, reward: { ...c.reward } };
}

// в каком наборе фигура (для подписи в альбоме)
export const collectionOf = (shapeId) => COLLECTIONS.list.find((c) => c.shapes.includes(shapeId)) || null;
