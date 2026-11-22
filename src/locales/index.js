// Реестр языков (п. 12.9): ru и en живут в src/i18n.js, остальные — по файлу на язык.
// Файл языка: export default { strings, shapes, abstract } — ключи как в en (проверяет tests/i18n.test.js).
// name — как язык называет себя (для списка языков).
export const LOCALES = {};
export const LANG_NAMES = { ru: 'Русский', en: 'English' };
