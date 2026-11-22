import { describe, it, expect } from 'vitest';
import { COLLECTIONS, MENU } from '../src/config.js';
import { shapeFor } from '../src/level.js';
import { collectionsStatus, claimCollection, collectionOf } from '../src/collections.js';

// фигуры альбома — как в screens.js: узнаваемые, без абстрактных и повторов
function albumIds() {
  const seen = new Set();
  for (let n = 1; n <= MENU.albumLevels; n++) {
    const s = shapeFor(n);
    if (!s.name || s.id.startsWith('abs') || seen.has(s.id)) continue;
    seen.add(s.id);
  }
  return seen;
}

describe('коллекции в альбоме', () => {
  it('каждая фигура альбома (кроме «Классики») ровно в одном наборе, лишних нет', () => {
    const album = albumIds();
    album.delete('rect');
    const all = COLLECTIONS.list.flatMap((c) => c.shapes);
    expect(new Set(all).size, 'повторы между наборами').toBe(all.length);
    for (const id of album) expect(collectionOf(id), id).not.toBe(null);
    for (const id of all) expect(album.has(id), `${id} нет в альбоме`).toBe(true);
  });

  it('прогресс и награда только за полный набор, один раз', () => {
    const c = COLLECTIONS.list[0];
    const part = new Set(c.shapes.slice(1));
    expect(collectionsStatus(part, null)[0]).toMatchObject({ have: c.shapes.length - 1, done: false });
    expect(claimCollection(part, null, c.id).reward).toEqual({});
    const full = new Set(c.shapes);
    const r = claimCollection(full, null, c.id);
    expect(r.reward).toEqual(c.reward);
    expect(collectionsStatus(full, r.state)[0].claimed).toBe(true);
    expect(claimCollection(full, r.state, c.id).reward).toEqual({});
  });
});
