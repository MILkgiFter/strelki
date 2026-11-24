// Тексты интерфейса на русском и английском. Язык — по браузеру, можно переключить (сохраняется).

import { LOCALES, LANG_NAMES } from './locales/index.js';

const LANG_KEY = 'strelki.lang';

const T = {
  ru: {
    title: 'Стрелки',
    loading: 'Загрузка…',
    tapToSkip: 'нажми, чтобы начать',
    level: (n) => `Уровень ${n}`,
    playLevel: (n) => `уровень ${n}`,
    levelLocked: (n) => `Уровень ${n} закрыт`,
    play: 'Играть',
    levels: 'Уровни',
    hint: 'Подсказка',
    restart: 'Заново',
    menu: 'Меню',
    next: 'Дальше',
    daily: 'Ежедневный',
    dailyNote: 'награда: +1 🔍 +1 🧽 +1 ♥',
    dailyDoneNote: '✓ пройден · завтра новый',
    dailyWin: 'Ежедневный пройден! Новый — завтра',
    back: 'Назад',
    album: 'Альбом',
    streakTitle: 'Подарок дня',
    streakTile: 'Подарок',
    shopTitle: 'Магазин',
    shopSub: 'Игра бесплатная — покупки по желанию',
    shopRestore: 'Восстановить покупки',
    shopOwned: 'куплено ✓',
    shopNoStore: 'Магазин недоступен — проверь интернет и вход в Google Play',
    shopThanks: 'Спасибо за покупку!',
    shop_starter_pack: 'Стартовый набор',
    shop_starter_pack_d: 'без рекламы + 🔍×10 🧽×5 ♥×5',
    shop_no_ads: 'Без рекламы',
    shop_no_ads_d: 'никакой рекламы между уровнями',
    shop_all_looks: 'Всё оформление',
    shop_all_looks_d: 'все темы и стрелки сразу',
    shop_boosters_small: 'Пак бустеров',
    shop_boosters_small_d: '🔍×5 🧽×3 ♥×3',
    shop_boosters_big: 'Большой пак',
    shop_boosters_big_d: '🔍×40 🧽×25 ♥×25 — выгоднее',
    shop_boosters_huge: 'Огромный пак',
    shop_boosters_huge_d: '🔍×100 🧽×60 ♥×60 — самый выгодный',
    adOfferSub: 'Короткий ролик — и награда твоя',
    adWatch: '▶ Смотреть',
    adBoost: (i) => `+1 ${i} за ролик?`,
    offerBadge: 'Спецпредложение',
    offerTitle: 'Играй без рекламы',
    offerPerk1: 'Навсегда без рекламы между уровнями',
    offerPerk2: 'В подарок: 🔍×10 🧽×5 ♥×5',
    offerPerk3: 'Выгоднее, чем просто «Без рекламы»',
    offerBuy: 'Забрать',
    offerNo: 'Не сейчас',
    offerPack: (p) => `🛒 Пак бустеров · ${p}`,
    tutDone: 'Отлично! Дальше — сам',
    tutBlocked: 'Путь закрыт — сначала убери ту, что мешает',
    adDouble: '▶ Удвоить награду',
    adContinue: '▶ Продолжить за ролик',
    coll_animals: 'Животные',
    coll_tales: 'Сказки и легенды',
    coll_heroes: 'Герои',
    coll_signs: 'Знаки и фигуры',
    coll_transport: 'Транспорт',
    coll_things: 'Вещи',
    coll_nature: 'Еда и природа',
    coll_world: 'Чудеса света',
    collRest: 'Разное',
    dailyNew: 'новый',
    looks: 'Оформление',
    looksSub: 'Открывается за звёзды',
    looksThemes: 'Тема',
    looksSkins: 'Стрелки',
    looksLocked: (n) => `Откроется за ${n} ★`,
    theme_light: 'Светлая',
    theme_sunset: 'Закат',
    theme_neon: 'Неон',
    theme_chalk: 'Доска',
    skin_normal: 'Обычные',
    skin_thin: 'Тонкие',
    skin_bold: 'Толстые',
    skin_tube: 'Трубки',
    tasksTitle: 'Задания',
    tasksSub: 'Новые каждый день — за выполнение бустеры',
    tasksNote: (d, n) => `${d} / ${n}`,
    tasksNoteReady: 'награда!',
    tasksBonus: (r) => `Все три задания — бонус ${r}`,
    tasksBonusGot: 'Все задания дня выполнены. Новые — завтра!',
    tasksBonusToast: (r) => `Все задания дня! Награда: ${r}`,
    taskDoneToast: (s) => `Задание выполнено: ${s}`,
    task_wins: (n) => `Пройди ${n} уровня`,
    task_perfect: () => 'Пройди уровень без ошибок',
    task_arrows: (n) => `Выпусти ${n} стрелок`,
    task_daily: () => 'Пройди ежедневный уровень',
    task_noBoost: () => 'Пройди уровень без бустеров',
    task_big: () => 'Пройди большой уровень',
    task_stars: (n) => `Собери ${n} ★`,
    streakSub: (n) => `День ${n} серии — заходи каждый день, к 7-му подарок больше`,
    streakBroken: 'Серия прервалась — начинаем заново с 1-го дня',
    streakDone: 'Подарок забран. Завтра — следующий!',
    streakDay: (n) => `День ${n}`,
    streakClaim: 'Забрать',
    streakLater: 'Позже',
    streakOk: 'Отлично',
    streakNoteReady: 'забери!',
    streakNoteTomorrow: () => '✓',
    themeLight: 'Тема: светлая',
    cbSwitch: 'Режим для дальтоников',
    cbOn: 'Режим для дальтоников: линии с узорами',
    cbOff: 'Режим для дальтоников выключен',
    themeNeon: 'Тема: неон',
    themeSwitch: 'нажми, чтобы сменить',
    themeLocked: (n) => `🔒 неон — за ${n} ★`,
    albumLevel: (n) => `уровень ${n}`,
    lives: 'Жизни',
    soundOff: 'Выключить звук',
    soundOn: 'Включить звук',
    mixer: 'Громкость',
    mixMusic: 'Музыка',
    mixSfx: 'Звуки',
    bgHide: 'Убрать фон',
    bgShow: 'Показать фон',
    bgTitle: 'Фон под фигурой',
    zoomIn: 'Приблизить',
    zoomOut: 'Отдалить',
    langSwitch: 'Язык / Language',
    starTitles: { 3: 'Идеально!', 2: 'Отлично!', 1: 'Пройдено' },
    record: (s) => `Твой рекорд здесь: ${s}`,
    try3: 'Пройди без ошибок — получишь 3 звезды',
    perfect: 'Без единой ошибки',
    finale: (n) => `Ты собрал: ${n}!`,
    loseTitle: 'Жизни закончились',
    loseSub: 'Попробуй другой порядок',
    tags: { small: 'маленький', big: 'большой', huge: 'огромный', mega: 'гигантский' },
    bHint: 'Лупа',
    coachTitle: 'Помощники',
    coachHint: 'Лупа — покажет стрелку, которую можно выпустить',
    coachEraser: 'Ластик — уберёт любую стрелку, жизнь не тратится',
    coachLife: 'Жизнь — вернёт потерянное сердце',
    coachMore: 'Новые помощники — за звёзды',
    coachOk: 'Понятно',
    bEraser: 'Ластик',
    bLife: 'Жизнь',
    eraseToast: 'Выбери стрелку — ластик её уберёт',
    lifeFull: 'Жизни и так полные',
    noBoost: 'Бустеры копятся за новые ★',
    reward: (s) => `Награда: ${s}`,
    continueLife: (n) => `Продолжить ♥ (осталось ${n})`,
    tutorial: {
      1: 'Тапни по стрелке — она улетит, если путь свободен',
      3: 'Хвост ползёт следом — важен только путь перед носом',
      4: 'Большой уровень: «+» или щипок — приблизить, тяни — двигать',
      12: 'Гигантский уровень! Приближай и путешествуй по картине',
      20: 'Серые камни стоят на месте — стрелки в них упираются',
      30: 'Стрелка с замком уйдёт, только когда улетит ключ того же цвета',
    },
  },
  en: {
    title: 'Arrows',
    loading: 'Loading…',
    tapToSkip: 'tap to start',
    level: (n) => `Level ${n}`,
    playLevel: (n) => `level ${n}`,
    levelLocked: (n) => `Level ${n} locked`,
    play: 'Play',
    levels: 'Levels',
    hint: 'Hint',
    restart: 'Restart',
    menu: 'Menu',
    next: 'Next',
    daily: 'Daily',
    dailyNote: 'reward: +1 🔍 +1 🧽 +1 ♥',
    dailyDoneNote: '✓ done · new one tomorrow',
    dailyWin: 'Daily done! A new one tomorrow',
    back: 'Back',
    album: 'Album',
    streakTitle: 'Daily gift',
    streakTile: 'Gift',
    shopTitle: 'Shop',
    shopSub: 'The game is free — purchases are optional',
    shopRestore: 'Restore purchases',
    shopOwned: 'owned ✓',
    shopNoStore: 'Store unavailable — check internet and Google Play sign-in',
    shopThanks: 'Thank you for your purchase!',
    shop_starter_pack: 'Starter pack',
    shop_starter_pack_d: 'no ads + 🔍×10 🧽×5 ♥×5',
    shop_no_ads: 'No ads',
    shop_no_ads_d: 'no ads between levels',
    shop_all_looks: 'All looks',
    shop_all_looks_d: 'every theme and arrow style',
    shop_boosters_small: 'Booster pack',
    shop_boosters_small_d: '🔍×5 🧽×3 ♥×3',
    shop_boosters_big: 'Big pack',
    shop_boosters_big_d: '🔍×40 🧽×25 ♥×25 — better value',
    shop_boosters_huge: 'Huge pack',
    shop_boosters_huge_d: '🔍×100 🧽×60 ♥×60 — best value',
    adOfferSub: 'Watch a short video to get it',
    adWatch: '▶ Watch',
    adBoost: (i) => `+1 ${i} for a video?`,
    offerBadge: 'Special offer',
    offerTitle: 'Play without ads',
    offerPerk1: 'No ads between levels — forever',
    offerPerk2: 'Bonus: 🔍×10 🧽×5 ♥×5',
    offerPerk3: 'Better value than plain “No ads”',
    offerBuy: 'Get it',
    offerNo: 'Not now',
    offerPack: (p) => `🛒 Booster pack · ${p}`,
    tutDone: 'Great! Now on your own',
    tutBlocked: 'Path blocked — clear the arrow in the way first',
    adDouble: '▶ Double the reward',
    adContinue: '▶ Continue for a video',
    coll_animals: 'Animals',
    coll_tales: 'Tales & legends',
    coll_heroes: 'Heroes',
    coll_signs: 'Signs & shapes',
    coll_transport: 'Transport',
    coll_things: 'Things',
    coll_nature: 'Food & nature',
    coll_world: 'Wonders of the world',
    collRest: 'Other',
    dailyNew: 'new',
    looks: 'Looks',
    looksSub: 'Unlocked with stars',
    looksThemes: 'Theme',
    looksSkins: 'Arrows',
    looksLocked: (n) => `Unlocks at ${n} ★`,
    theme_light: 'Light',
    theme_sunset: 'Sunset',
    theme_neon: 'Neon',
    theme_chalk: 'Chalkboard',
    skin_normal: 'Classic',
    skin_thin: 'Thin',
    skin_bold: 'Bold',
    skin_tube: 'Tubes',
    tasksTitle: 'Tasks',
    tasksSub: 'New every day — boosters for completing',
    tasksNote: (d, n) => `${d} / ${n}`,
    tasksNoteReady: 'reward!',
    tasksBonus: (r) => `All three — bonus ${r}`,
    tasksBonusGot: 'All tasks done for today. New ones tomorrow!',
    tasksBonusToast: (r) => `All daily tasks! Reward: ${r}`,
    taskDoneToast: (s) => `Task complete: ${s}`,
    task_wins: (n) => `Complete ${n} levels`,
    task_perfect: () => 'Complete a level with no mistakes',
    task_arrows: (n) => `Release ${n} arrows`,
    task_daily: () => 'Complete the daily level',
    task_noBoost: () => 'Complete a level without boosters',
    task_big: () => 'Complete a big level',
    task_stars: (n) => `Collect ${n} ★`,
    streakSub: (n) => `Day ${n} of your streak — come back daily, day 7 is bigger`,
    streakBroken: 'Streak broken — starting again from day 1',
    streakDone: 'Gift claimed. Another one tomorrow!',
    streakDay: (n) => `Day ${n}`,
    streakClaim: 'Claim',
    streakLater: 'Later',
    streakOk: 'Great',
    streakNoteReady: 'claim!',
    streakNoteTomorrow: () => '✓',
    themeLight: 'Theme: light',
    cbSwitch: 'Colour-blind mode',
    cbOn: 'Colour-blind mode: patterned lines',
    cbOff: 'Colour-blind mode off',
    themeNeon: 'Theme: neon',
    themeSwitch: 'tap to switch',
    themeLocked: (n) => `🔒 neon — for ${n} ★`,
    albumLevel: (n) => `level ${n}`,
    lives: 'Lives',
    soundOff: 'Mute',
    soundOn: 'Unmute',
    mixer: 'Volume',
    mixMusic: 'Music',
    mixSfx: 'Sounds',
    bgHide: 'Hide background',
    bgShow: 'Show background',
    bgTitle: 'Background under the shape',
    zoomIn: 'Zoom in',
    zoomOut: 'Zoom out',
    langSwitch: 'Language',
    starTitles: { 3: 'Perfect!', 2: 'Great!', 1: 'Cleared' },
    record: (s) => `Your best here: ${s}`,
    try3: 'No mistakes — and you get 3 stars',
    perfect: 'Not a single mistake',
    finale: (n) => `You built: ${n}!`,
    loseTitle: 'Out of lives',
    loseSub: 'Try a different order',
    tags: { small: 'small', big: 'big', huge: 'huge', mega: 'giant' },
    bHint: 'Magnifier',
    coachTitle: 'Helpers',
    coachHint: 'Magnifier — shows an arrow that can fly out',
    coachEraser: 'Eraser — removes any arrow, no life lost',
    coachLife: 'Life — gives back a lost heart',
    coachMore: 'Earn more helpers with stars',
    coachOk: 'Got it',
    bEraser: 'Eraser',
    bLife: 'Life',
    eraseToast: 'Pick an arrow — the eraser removes it',
    lifeFull: 'Lives are already full',
    noBoost: 'Earn boosters with new ★',
    reward: (s) => `Reward: ${s}`,
    continueLife: (n) => `Continue ♥ (${n} left)`,
    tutorial: {
      1: 'Tap an arrow — it flies away if its path is clear',
      3: 'The tail follows — only the path ahead of the nose matters',
      4: 'Big level: «+» or pinch to zoom, drag to move',
      12: 'Giant level! Zoom in and explore the picture',
      20: 'Grey stones never move — arrows bump into them',
      30: 'A locked arrow can leave only after the key of its colour is gone',
    },
  },
};

// Названия фигур по-английски (по id); абстрактные — по виду
const SHAPE_EN = {
  rect: 'Classic', heart: 'Heart', star: 'Star', ring: 'Donut', flower: 'Flower', moon: 'Crescent', diamond: 'Crystal',
  hexagon: 'Honeycomb', plus: 'Plus', drop: 'Drop', clover: 'Clover', hourglass: 'Hourglass', arch: 'Arch',
  elephant: 'Elephant', cat: 'Cat', fish: 'Fish', butterfly: 'Butterfly', turtle: 'Turtle', bird: 'Bird', hare: 'Hare',
  snail: 'Snail', whale: 'Whale', mushroom: 'Mushroom', tree: 'Fir tree', rocket: 'Rocket', robot: 'Robot', ninja: 'Ninja',
  dragon: 'Dragon', alien: 'Alien', ghost: 'Ghost', pirate: 'Pirate', astronaut: 'Astronaut', dinosaur: 'Dinosaur',
  unicorn: 'Unicorn', matryoshka: 'Matryoshka', firebird: 'Firebird', gorynych: 'Three-headed dragon', wizard: 'Wizard',
  knight: 'Knight', viking: 'Viking', samurai: 'Samurai', elf: 'Elf archer', bogatyr: 'Bogatyr', princess: 'Princess',
  mermaid: 'Mermaid', fairy: 'Fairy', ballerina: 'Ballerina', witch: 'Witch on a broom', dancer: 'Dancer', ogre: 'Ogre',
  troll: 'Troll', goblin: 'Goblin', orc: 'Orc', gnome: 'Wise gnome', necromancer: 'Necromancer', paladin: 'Paladin',
  superhero: 'Superhero', vampire: 'Vampire', mummy: 'Mummy', arrowsign: 'Arrow', lightning: 'Lightning', crown: 'Crown',
  shield: 'Shield', house: 'House', horseshoe: 'Horseshoe', spade: 'Spades', club: 'Clubs', car: 'Car', bus: 'Bus',
  plane: 'Plane', heli: 'Helicopter', boat: 'Sailboat', train: 'Steam train', bike: 'Bicycle', balloon: 'Hot-air balloon',
  sub: 'Submarine', umbrella: 'Umbrella', key: 'Key', bulb: 'Light bulb', cup: 'Cup', bell: 'Bell', anchor: 'Anchor',
  guitar: 'Guitar', headphones: 'Headphones', clock: 'Alarm clock', banana: 'Banana', strawberry: 'Strawberry',
  cherry: 'Cherries', carrot: 'Carrot', icecream: 'Ice cream', cake: 'Cake', cactus: 'Cactus', palm: 'Palm tree', sun: 'Sun',
  cloud: 'Thundercloud', snowflake: 'Snowflake', leaf: 'Leaf', dog: 'Dog', penguin: 'Penguin', owl: 'Owl', giraffe: 'Giraffe',
  octopus: 'Octopus', crab: 'Crab', bigben: 'Big Ben', eiffel: 'Eiffel Tower', kremlin: 'Kremlin tower', tajmahal: 'Taj Mahal',
  colosseum: 'Colosseum', pyramids: 'Pyramids', skyline: 'Night city', mountains: 'Mountain range', pisa: 'Leaning Tower',
  lighthouse: 'Lighthouse', castle: 'Castle', windmill: 'Windmill', cathedral: 'Onion-dome cathedral', bridge: 'Bridge',
  pagoda: 'Pagoda', ferris: 'Ferris wheel',
};
const ABSTRACT_EN = {
  Клякса: 'Blot', Мандала: 'Mandala', Остров: 'Island', Волна: 'Wave', Спираль: 'Spiral', Вспышка: 'Burst',
  Лента: 'Ribbon', Решётка: 'Lattice', Архипелаг: 'Archipelago', Зигзаг: 'Zigzag', Шестерёнка: 'Gear',
  Узел: 'Knot', 'Треугольник Серпинского': 'Sierpinski triangle', Мишень: 'Target', Бесконечность: 'Infinity',
  Галактика: 'Galaxy', 'Пиксель-пришелец': 'Pixel alien', Роза: 'Rose',
};

// все языки: ru, en и файлы из src/locales
export const LANGS = ['ru', 'en', ...Object.keys(LOCALES)];
export const langName = (l) => LANG_NAMES[l] || l;
// для проверки переводов (tests/i18n.test.js) и переводчиков
export const STRINGS_EN = T.en;
export { SHAPE_EN, ABSTRACT_EN };

// язык телефона → наш: точное совпадение кода, иначе русскоязычные соседи → ru, иначе en
function fromNavigator() {
  const list = (typeof navigator !== 'undefined' && (navigator.languages?.length ? navigator.languages : [navigator.language])) || [];
  for (const raw of list) {
    const code = String(raw || '').toLowerCase().split('-')[0];
    if (LANGS.includes(code)) return code;
    if (['uk', 'be', 'kk', 'ky', 'uz', 'tg'].includes(code)) return 'ru';
  }
  return 'en';
}
function detect() {
  try {
    const saved = localStorage.getItem(LANG_KEY);
    if (LANGS.includes(saved)) return saved;
  } catch {
    /* хранилище недоступно */
  }
  return fromNavigator();
}

let lang = detect();

export const getLang = () => lang;
export function setLang(l) {
  lang = LANGS.includes(l) ? l : 'en';
  try {
    localStorage.setItem(LANG_KEY, lang);
  } catch {
    /* хранилище недоступно */
  }
}
// t('play') → строка; t('level', 5) → функция с аргументами; нет перевода → английский
export function t(key, ...args) {
  const v = (T[lang] || LOCALES[lang]?.strings || {})[key] ?? T.en[key] ?? T.ru[key];
  return typeof v === 'function' ? v(...args) : v;
}
export function shapeName(shape) {
  if (!shape || !shape.name) return '';
  if (lang === 'ru') return shape.name;
  const loc = LOCALES[lang];
  return loc?.shapes?.[shape.id] || loc?.abstract?.[shape.name] || SHAPE_EN[shape.id] || ABSTRACT_EN[shape.name] || shape.name;
}

export function applyStatic(root = document) {
  document.documentElement.lang = lang;
  document.title = t('title');
  root.querySelectorAll('[data-i18n]').forEach((el) => {
    el.textContent = t(el.dataset.i18n);
  });
  root.querySelectorAll('[data-i18n-aria]').forEach((el) => {
    el.setAttribute('aria-label', t(el.dataset.i18nAria));
  });
  root.querySelectorAll('[data-i18n-title]').forEach((el) => {
    el.title = t(el.dataset.i18nTitle);
  });
}
