import { describe, it, expect } from 'vitest';
import { existsSync } from 'node:fs';
import { SOUND } from '../src/config.js';

describe('настройки звука', () => {
  it('выбранные варианты звуков заданы (без них тап и победа падают)', () => {
    expect(typeof SOUND.styles?.fly).toBe('string');
    expect(typeof SOUND.styles?.win).toBe('string');
  });

  it('записанные звуки победы лежат в public/ и у каждого есть громкость', () => {
    for (const [id, file] of Object.entries(SOUND.winFiles || {})) {
      expect(existsSync(new URL('../public/' + file, import.meta.url)), file).toBe(true);
      expect(SOUND.winFileVol[id], id).toBeGreaterThan(0);
    }
  });
});
