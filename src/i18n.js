// Тексты интерфейса на русском и английском. Язык — по браузеру, можно переключить (сохраняется).

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
    albumLevel: (n) => `уровень ${n}`,
    lives: 'Жизни',
    soundOff: 'Выключить звук',
    soundOn: 'Включить звук',
    bgHide: 'Убрать фон',
    bgShow: 'Показать фон',
    bgTitle: 'Фон под фигурой',
    zoomIn: 'Приблизить',
    zoomOut: 'Отдалить',
    langSwitch: 'Switch to English',
    starTitles: { 3: 'Идеально!', 2: 'Отлично!', 1: 'Пройдено' },
    record: (s) => `Твой рекорд здесь: ${s}`,
    try3: 'Пройди без ошибок — получишь 3 звезды',
    perfect: 'Без единой ошибки',
    finale: (n) => `Ты собрал: ${n}!`,
    loseTitle: 'Жизни закончились',
    loseSub: 'Попробуй другой порядок',
    tags: { small: 'маленький', big: 'большой', huge: 'огромный', mega: 'гигантский' },
    bHint: 'Лупа',
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
    albumLevel: (n) => `level ${n}`,
    lives: 'Lives',
    soundOff: 'Mute',
    soundOn: 'Unmute',
    bgHide: 'Hide background',
    bgShow: 'Show background',
    bgTitle: 'Background under the shape',
    zoomIn: 'Zoom in',
    zoomOut: 'Zoom out',
    langSwitch: 'Переключить на русский',
    starTitles: { 3: 'Perfect!', 2: 'Great!', 1: 'Cleared' },
    record: (s) => `Your best here: ${s}`,
    try3: 'No mistakes — and you get 3 stars',
    perfect: 'Not a single mistake',
    finale: (n) => `You built: ${n}!`,
    loseTitle: 'Out of lives',
    loseSub: 'Try a different order',
    tags: { small: 'small', big: 'big', huge: 'huge', mega: 'giant' },
    bHint: 'Magnifier',
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

function detect() {
  try {
    const saved = localStorage.getItem(LANG_KEY);
    if (saved === 'ru' || saved === 'en') return saved;
  } catch {
    /* хранилище недоступно */
  }
  const nav = (navigator.language || 'ru').toLowerCase();
  return nav.startsWith('ru') || nav.startsWith('uk') || nav.startsWith('be') || nav.startsWith('kk') ? 'ru' : 'en';
}

let lang = detect();

export const getLang = () => lang;
export function setLang(l) {
  lang = l === 'en' ? 'en' : 'ru';
  try {
    localStorage.setItem(LANG_KEY, lang);
  } catch {
    /* хранилище недоступно */
  }
}
// t('play') → строка; t('level', 5) → функция с аргументами
export function t(key, ...args) {
  const v = T[lang][key] ?? T.ru[key];
  return typeof v === 'function' ? v(...args) : v;
}
export function shapeName(shape) {
  if (!shape || !shape.name) return '';
  if (lang === 'ru') return shape.name;
  return SHAPE_EN[shape.id] || ABSTRACT_EN[shape.name] || shape.name;
}

// Статичные надписи в HTML: data-i18n — текст, data-i18n-aria — подсказка для экранного диктора
export function applyStatic(root = document) {
  document.documentElement.lang = lang;
  document.title = t('title');
  root.querySelectorAll('[data-i18n]').forEach((el) => {
    el.textContent = t(el.dataset.i18n);
  });
  root.querySelectorAll('[data-i18n-aria]').forEach((el) => {
    el.setAttribute('aria-label', t(el.dataset.i18nAria));
  });
}
