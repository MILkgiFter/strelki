// Реестр языков (п. 12.9): ru и en живут в src/i18n.js, остальные — по файлу на язык.
// Файл языка: export default { strings, shapes, abstract } — ключи как в en (проверяет tests/i18n.test.js).
// LANG_NAMES — как язык называет себя (для списка языков).
import es from './es.js';
import pt from './pt.js';
import de from './de.js';
import fr from './fr.js';
import it from './it.js';
import tr from './tr.js';
import pl from './pl.js';
import id from './id.js';
import vi from './vi.js';
import ja from './ja.js';
import ko from './ko.js';
import zh from './zh.js';
import hi from './hi.js';

export const LOCALES = { es, pt, de, fr, it, tr, pl, id, vi, ja, ko, zh, hi };
export const LANG_NAMES = {
  ru: 'Русский',
  en: 'English',
  es: 'Español',
  pt: 'Português (Brasil)',
  de: 'Deutsch',
  fr: 'Français',
  it: 'Italiano',
  tr: 'Türkçe',
  pl: 'Polski',
  id: 'Bahasa Indonesia',
  vi: 'Tiếng Việt',
  ja: '日本語',
  ko: '한국어',
  zh: '中文（简体）',
  hi: 'हिन्दी',
};
