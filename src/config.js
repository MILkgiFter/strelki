// Все числа баланса и визуала. Меняй здесь, а не в коде.

export const GAME = {
  lives: 3,
  storageKey: 'strelki.level',
  starsKey: 'strelki.stars', // { [уровень]: лучшие звёзды }
  soundKey: 'strelki.sound',
  musicKey: 'strelki.music', // фоновая музыка вкл/выкл (старое сохранение, читается для переноса)
  volKey: 'strelki.vol', // микшер: { music: 0..1, sfx: 0..1 }
  bgKey: 'strelki.bg', // серая подложка под фигурой: вкл/выкл
  boostKey: 'strelki.boosters', // запас бустеров
  vibrateMs: 40, // вибрация при ошибке (мобильные)
  maxLevel: 9999, // защита от испорченного сохранения
};

// Конфетти на победе: число кусочков растёт со звёздами
export const CONFETTI = {
  perStar: 22,
  minMs: 1600, // длительность падения кусочка, мин/макс
  maxMs: 2600,
  spreadVw: 18, // боковой снос, % ширины экрана
};

// Экран выбора уровня
export const MENU = {
  levelsMin: 200, // сколько клеток показывать минимум (закрытые — с замком), список прокручивается
  levelsStep: 10, // число клеток округляется вверх до кратного
  albumLevels: 200, // альбом: фигуры с уровней 1..albumLevels
  albumCells: 28, // разрешение силуэта в альбоме (клеток по длинной стороне)
  albumThumb: 72, // размер силуэта в альбоме, px
};

// Звёзды за уровень: по числу оставшихся жизней (3 — без ошибок)
export const STARS = {
  delayMs: 280, // пауза между появлением звёзд на экране победы
};

export const SOUND = {
  volume: 0.9, // громкость эффектов (шина sfx)
  master: 0.85, // общая громкость до компрессора
  comboWindowMs: 1500, // быстрые выпуски подряд повышают тон
  comboMax: 8, // сколько ступеней пентатоники вверх от базовой
  reverbSec: 2.2, // длина импульса ревербератора
  reverbSend: 0.16, // доля эффектов в реверб (меньше «звона» в хвосте)
  comp: { threshold: -14, knee: 24, ratio: 3, attack: 0.004, release: 0.25 },
  flyBase: 5, // ступень пентатоники для combo = 0 (5 = C5)
  flyDur: 0.42, // длина «плинка», с (+ flyDurPerLen за клетку)
  flyDurPerLen: 0.03,
  flyVol: 0.3, // тап звучит сотни раз — почти на грани слышимости, «тактильный», а не музыкальный
  popDur: 0.09, // длина «попа», с
  popFreq: 260, // тон «попа», Гц (ниже — теплее, не пищит)
  popCut: 1500, // low-pass тапа (мягче, без щелчка)
  comboSemis: 1, // на сколько полутонов максимум поднимает combo
  // выбранные варианты звуков (сравнение в пульте 🎧 админки):
  // fly: pop — было, bubble — пузырёк, wood — деревяшка, swoosh — свуш (выбран игроком 2026-11-21)
  // win: arp — было; варианты «галочка / задача выполнена» (сравнение в пульте 🎧):
  //      check — две ноты вверх, tickDing — щелчок + динь, glass — стеклянное динь, triple — три ноты вверх,
  //      soft — мягко две ноты, pling — динь со взлётом; ding1/ding2 — записанные «динь» (Kenney)
  styles: { fly: 'swoosh', win: 'arp' },
  winCheck: { vol: 0.42, tickVol: 0.5, mul: { tickDing: 1.3, glass: 1.6, pling: 1.8 } }, // громкость выровнена замером
  // записанные «динь» (Kenney Interface Sounds, CC0; assets/CREDITS.md)
  winFiles: {
    ding1: 'sounds/win-ding1.mp3', // glass_003
    ding2: 'sounds/win-ding2.mp3', // glass_002
  },
  winFileVol: { ding1: 0.74, ding2: 1 },
  tapBubble: { vol: 0.26, f: 520, up: 1.7, dur: 0.07, cut: 2600 },
  tapWood: { vol: 0.32, f: 1100, q: 9, dur: 0.045 },
  tapSwoosh: { vol: 0.38, f0: 700, f1: 2200, dur: 0.14, q: 1.2 },
  bumpVol: 0.5, // ошибка — мягкий глухой «тук», не наказание
  hintVol: 0.26,
  winVol: 0.3,
  starVol: 0.3,
  loseVol: 0.26,
  clickVol: 0.3, // еле слышный нейтральный тик кнопок (шум)
  clickFreq: 1400, // центр полосы тика, Гц
  winGap: 0.09, // пауза между нотами арпеджио, с
};

// Фоновая музыка (генеративная)
export const MUSIC = {
  enabled: true,
  volume: 0.05, // фон: еле слышно, не спорит с игрой
  fadeIn: 1.5, // плавное появление/затухание, с
  fadeOut: 1.5,
  themeFade: 2, // кроссфейд при смене темы, с
  themeMinutes: 2, // каждые N минут (звучащей музыки) включается другая случайная тема
  playSec: [35, 70], // фраза/цикл темы звучит столько секунд…
  restSec: [30, 75], // …потом столько секунд тишины (тишина — тоже часть фона)
  // усталость: чем дольше непрерывная сессия, тем реже и тише (сбрасывается новым start())
  fatigue: { afterMin: 10, restMul: 2, volDrop: 0.3 },
  lookahead: 1.6, // планируем наперёд, с
  tickMs: 250, // период планировщика
  reverbSend: 0.55,
  // Темы. root — тоника (MIDI), chords — сдвиги в полутонах от root (первый — бас),
  // penta — ступени для эффектов, scale — лад мелодии,
  // melody.motif — рисунок по ступеням лада относительно base (null — пауза): узнаваем, но
  // каждый раз с вариацией (сдвиг регистра shifts, мутации vary, пропуски skip, целые аккорды без мелодии restChord).
  themes: [
    {
      id: 'morning', name: { ru: 'Утро', en: 'Morning' },
      root: 60, penta: [0, 2, 4, 7, 9], scale: [0, 2, 4, 7, 9],
      bpm: 50, chordBeats: 8, order: 'random', vol: 0.9,
      chords: [[-24, -8, -5, -1, 2], [-27, -12, -8, -5, -1], [-19, -12, -8, -5, -3], [-17, -10, -8, -3, -1]],
      pad: { type: 'triangle', vol: 0.05, bass: 0.06, cutoff: [380, 800], attack: 2.2, release: 2.6 },
      melody: { inst: 'kalimba', grid: 1, base: 2, shifts: [-1, 0, 0, 1], dur: 2.4, vol: 0.12, skip: 0.3, restChord: 0.3, vary: 0.5, cut: 1800, attack: 0.03, echo: 0, echoBeats: 1.5,
        motif: [0, null, 2, null, null, 1, null, null, 3, null, null, null, 2, null, null, null] },
    },
    {
      id: 'garden', name: { ru: 'Сад', en: 'Garden' },
      root: 62, penta: [0, 3, 5, 7, 10], scale: [0, 2, 3, 5, 7, 9, 10],
      bpm: 48, chordBeats: 8, order: 'random', vol: 0.6,
      chords: [[-24, -9, -5, -2, 2], [-19, -12, -3, 0, 2], [-26, -10, -7, -3, 0], [-17, -14, -10, -7, -3]],
      pad: { type: 'sine', vol: 0.055, bass: 0.06, cutoff: [340, 700], attack: 2.4, release: 2.6 },
      melody: { inst: 'flute', grid: 2, base: 3, shifts: [-1, 0, 0, 1], dur: 4.5, vol: 0.12, skip: 0.25, restChord: 0.25, vary: 0.5, echo: 0, echoBeats: 2,
        motif: [0, null, 2, null, 3, null, null, null, 1, null, null, null] },
    },
    {
      id: 'water', name: { ru: 'Вода', en: 'Water' },
      root: 65, penta: [0, 2, 4, 6, 9], scale: [0, 2, 4, 6, 7, 9, 11],
      bpm: 48, chordBeats: 8, order: 'random', vol: 1.05,
      chords: [[-24, -17, -13, -8, -6], [-22, -15, -10, -8, -6], [-27, -15, -12, -8, -5], [-20, -13, -10, -5, -1]],
      pad: { type: 'triangle', vol: 0.04, bass: 0.055, cutoff: [360, 760], attack: 2.4, release: 2.6 },
      melody: { inst: 'harp', grid: 1, base: 3, shifts: [-2, -1, 0, 0, 1], dur: 3, vol: 0.1, skip: 0.45, restChord: 0.3, vary: 0.5, cut: 1600, attack: 0.03, echo: 0.3, echoBeats: 1.5,
        motif: [0, null, 3, null, null, 5, null, null, 2, null, null, null, null] },
    },
    {
      id: 'night', name: { ru: 'Ночь', en: 'Night' },
      root: 57, penta: [0, 3, 5, 7, 10], scale: [0, 2, 3, 5, 7, 8, 10],
      bpm: 40, chordBeats: 8, order: 'cycle', vol: 0.65,
      chords: [[-24, -5, -2, 2, 3], [-16, -9, 0, 3, 7], [-19, -7, -4, 0, 3], [-17, -5, -2, 2, 5]],
      pad: { type: 'triangle', vol: 0.06, bass: 0.06, cutoff: [300, 600], attack: 2.8, release: 3.2 },
      melody: { inst: 'bell', grid: 2, base: 4, shifts: [-1, 0, 0, 1], dur: 4, vol: 0.08, skip: 0.5, restChord: 0.4, vary: 0.5, cut: 1300, attack: 0.06, echo: 0.25, echoBeats: 2,
        motif: [0, null, null, 3, null, null, 1, null, null, null] },
    },
    {
      id: 'lofi', name: { ru: 'Лофи', en: 'Lo-fi' },
      root: 58, penta: [0, 2, 4, 7, 9], scale: [0, 2, 4, 7, 9],
      bpm: 66, chordBeats: 16, order: 'cycle', vol: 1.5,
      chords: [[-12, -1, 4, 7, 14], [-15, -5, 0, 4, 11], [-10, 0, 4, 5, 9], [-17, -7, -1, 4]],
      pad: { type: 'sine', vol: 0, bass: 0.07, cutoff: [500, 500], attack: 0.4, release: 1.2 },
      hits: { vol: 0.06, slots: [0, 5] },
      drums: { kick: 0.16, hat: 0.03, brush: 0, swing: 0.14 },
      melody: { inst: 'rhodes', grid: 0.5, base: 4, shifts: [-1, 0, 0, 1], dur: 2.2, vol: 0.06, skip: 0.4, restChord: 0.3, vary: 0.5, echo: 0, echoBeats: 1,
        motif: [null, null, 0, null, null, null, 2, null, null, null, null, 1, null, null, null, null] },
    },
  ],
};

// Сложность по номеру уровня:
// upTo — до уровня включительно; cols×rows — сетка; fill — заполненность 0..1;
// minLen/maxLen — длина змейки в клетках (хвосты потом дотягиваются в пустоты до maxLen+4);
// patterns — веса узоров тела: серпантин, крючок-спираль, лесенка, случайные изгибы;
// snakes — сколько змеек на уровне (главная ручка сложности; с 3-го уровня × такт ритма);
// turn — шанс повернуть тело на каждом шаге (0 = прямые);
// tries — сколько вариантов поля сгенерировать и взять самый запутанный;
// bias — насколько головы предпочитают «длинное» направление через поле (0 = случайно)
// Узоры тела змейки и их веса (см. makePattern в level.js)
const P_EASY = { meander: 1, hook: 2 };
const P_MID = { meander: 1, hook: 2, serp: 2 };
const P_ALL = { meander: 1, hook: 2, serp: 2, zigzag: 1 };

// ringLen — длина змеек краевого кольца, freeTarget — до какой доли свободных на старте разворачивать змейки
export const DIFFICULTY = [
  { upTo: 1, snakes: 4, cols: 4, rows: 4, minLen: 2, maxLen: 3, turn: 0, fill: 0.6, tries: 1, bias: 0 },
  { upTo: 3, snakes: 9, cols: 6, rows: 8, minLen: 4, maxLen: 8, turn: 0.3, fill: 1, tries: 8, bias: 1, patterns: P_EASY },
  { upTo: 6, snakes: 13, cols: 8, rows: 11, minLen: 5, maxLen: 12, turn: 0.35, fill: 1, tries: 10, bias: 1.5, patterns: P_MID },
  { upTo: 15, snakes: 18, cols: 10, rows: 14, minLen: 6, maxLen: 16, turn: 0.35, fill: 1, tries: 12, bias: 2, patterns: P_ALL, ringLen: 40, freeTarget: 0.06 },
  { upTo: 30, snakes: 25, cols: 13, rows: 19, minLen: 6, maxLen: 20, turn: 0.35, fill: 1, tries: 10, bias: 2, patterns: P_ALL, ringLen: 40, freeTarget: 0.06 },
  { upTo: 60, snakes: 34, cols: 16, rows: 24, minLen: 7, maxLen: 24, turn: 0.35, fill: 1, tries: 8, bias: 2, patterns: P_ALL, ringLen: 40, freeTarget: 0.06 },
  { upTo: 100, snakes: 44, cols: 19, rows: 30, minLen: 8, maxLen: 26, turn: 0.35, fill: 1, tries: 6, bias: 2, patterns: P_ALL, ringLen: 40, freeTarget: 0.06 },
  { upTo: Infinity, snakes: 54, cols: 22, rows: 36, minLen: 8, maxLen: 30, turn: 0.35, fill: 1, tries: 6, bias: 2, patterns: P_ALL, ringLen: 40, freeTarget: 0.06 },
];

// Ритм уровней: такты идут по кругу, чтобы за сложным был лёгкий, а раз в круг — большой.
// count — число змеек от базовой ступени (snakes); tag — пометка в HUD.
// Площадь поля = змейки × cellsPerSnake / заполненность фигуры, длина змеек подстраивается под площадь.
export const RHYTHM = {
  introLevels: 2, // первые уровни — простой прямоугольник
  // 20 тактов: 16 крупных (большой / огромный / гигантский) + 3 средних + 1 маленький.
  // named — узнаваемая фигура (иначе абстрактная), mega — гигантский с достопримечательностью.
  cycle: [
    { tag: '', count: 1 },
    { tag: 'big', count: 2.2, minSnakes: 50, minSide: 26, maxCols: 40, maxRows: 60, named: true },
    { tag: 'big', count: 2.4, minSnakes: 55, minSide: 26, maxCols: 40, maxRows: 60 },
    { tag: 'huge', count: 4.5, minSnakes: 110, minSide: 32, maxCols: 40, maxRows: 60, named: true },
    { tag: 'big', count: 2.2, minSnakes: 50, minSide: 26, maxCols: 40, maxRows: 60, named: true },
    { tag: 'big', count: 2.6, minSnakes: 60, minSide: 28, maxCols: 40, maxRows: 60 },
    { tag: '', count: 1.1 },
    { tag: 'big', count: 2.4, minSnakes: 55, minSide: 26, maxCols: 40, maxRows: 60, named: true },
    { tag: 'big', count: 2.2, minSnakes: 50, minSide: 26, maxCols: 40, maxRows: 60 },
    { tag: 'mega', count: 8, minSnakes: 200, minSide: 30, maxCols: 96, maxRows: 96, maxCells: 4200, named: true, mega: true },
    { tag: 'big', count: 2.2, minSnakes: 50, minSide: 26, maxCols: 40, maxRows: 60 },
    { tag: 'big', count: 2.6, minSnakes: 60, minSide: 28, maxCols: 40, maxRows: 60, named: true },
    { tag: 'small', count: 0.6 },
    { tag: 'huge', count: 4.5, minSnakes: 110, minSide: 32, maxCols: 40, maxRows: 60, named: true },
    { tag: 'big', count: 2.2, minSnakes: 50, minSide: 26, maxCols: 40, maxRows: 60 },
    { tag: 'big', count: 2.4, minSnakes: 55, minSide: 26, maxCols: 40, maxRows: 60, named: true },
    { tag: 'huge', count: 5, minSnakes: 120, minSide: 32, maxCols: 40, maxRows: 60 },
    { tag: 'big', count: 2.6, minSnakes: 60, minSide: 28, maxCols: 40, maxRows: 60, named: true },
    { tag: '', count: 1.2 },
    { tag: 'big', count: 2.4, minSnakes: 55, minSide: 26, maxCols: 40, maxRows: 60, named: true },
  ],

  maxCols: 24, // самое крупное поле (на телефоне клетка ≈ 14 px)
  maxRows: 38,
  minSide: 5,
  shapeMinSide: 16, // фигура узнаётся, если меньшая сторона ≥ стольких клеток
  cellsPerSnake: 9, // средняя длина змейки, под которую подбирается площадь
  outwardK: 0.02, // вес головы, смотрящей сразу наружу фигуры (такая змейка свободна с начала уровня)
  outwardLatePasses: 1, // головы «сразу наружу» разрешены только в последних проходах
  freeWeight: 150, // вес доли свободных на старте при выборе лучшего варианта уровня
  passes: 5, // проходов «поставить головы» (короткие змейки — только в последних двух)
  minStub: 4, // змейки короче не ставятся в первых проходах генератора (меньше «огрызков»)
};

// Текст обучения над полем на конкретных уровнях
// Бустеры (src/boosters.js): стартовый запас, предел, награда за каждую новую звезду
// Серия дней (п. 12.1): заходишь каждый день — забираешь подарок, награда растёт к 7-му дню;
// пропустил день — серия с начала. После 7-го дня круг повторяется.
export const STREAK = {
  key: 'strelki.streak', // { last: номер дня последнего подарка (dayIndex), step: 0..6 }
  rewards: [
    { hint: 1 },
    { eraser: 1 },
    { life: 1 },
    { hint: 1, eraser: 1 },
    { hint: 2 },
    { eraser: 1, life: 1 },
    { hint: 3, eraser: 2, life: 2 }, // 7-й день — большой подарок
  ],
  showDelayMs: 450, // окно подарка всплывает в меню чуть позже, чтобы меню успело появиться
};

// Ежедневные задания (п. 12.2): 3 в день из пула (по номеру дня — одинаковые у всех в этот день).
// kind: wins — пройти уровни, perfect — без ошибок, arrows — выпустить стрелки, daily — ежедневный уровень,
// noBoost — пройти без бустеров, big — большой/огромный/гигантский уровень, stars — собрать звёзды
export const TASKS = {
  key: 'strelki.tasks', // { day, prog: { id: n }, got: { id: true }, bonus: bool }
  perDay: 3,
  bonus: { hint: 1, eraser: 1, life: 1 }, // за все 3 задания дня
  pool: [
    { id: 'wins2', kind: 'wins', goal: 2, reward: { hint: 1 } },
    { id: 'wins3', kind: 'wins', goal: 3, reward: { eraser: 1 } },
    { id: 'perfect1', kind: 'perfect', goal: 1, reward: { life: 1 } },
    { id: 'arrows150', kind: 'arrows', goal: 150, reward: { hint: 1 } },
    { id: 'arrows300', kind: 'arrows', goal: 300, reward: { hint: 1, eraser: 1 } },
    { id: 'daily1', kind: 'daily', goal: 1, reward: { eraser: 1 } },
    { id: 'noBoost1', kind: 'noBoost', goal: 1, reward: { hint: 1 } },
    { id: 'big1', kind: 'big', goal: 1, reward: { life: 1 } },
    { id: 'stars6', kind: 'stars', goal: 6, reward: { hint: 1, life: 1 } },
  ],
  bigTags: ['big', 'huge', 'mega'],
};

// Коллекции в альбоме (п. 12.4): каждая узнаваемая фигура — ровно в одном наборе;
// собрал весь набор (все его уровни пройдены) — награда бустерами
export const COLLECTIONS = {
  key: 'strelki.collections', // { claimed: { id: true } }
  list: [
    { id: 'animals', icon: '🐾', reward: { hint: 2, life: 1 },
      shapes: ['snail', 'fish', 'cat', 'turtle', 'bird', 'elephant', 'whale', 'dinosaur', 'dog', 'crab', 'octopus', 'owl'] },
    { id: 'tales', icon: '🐉', reward: { eraser: 2, life: 1 },
      shapes: ['gorynych', 'firebird', 'matryoshka', 'bogatyr', 'unicorn', 'dragon', 'mermaid', 'fairy', 'elf', 'troll', 'ogre', 'goblin', 'gnome'] },
    { id: 'heroes', icon: '🦸', reward: { hint: 2, eraser: 1, life: 1 },
      shapes: ['paladin', 'viking', 'knight', 'necromancer', 'superhero', 'pirate', 'ballerina', 'astronaut', 'alien', 'wizard', 'samurai', 'mummy', 'vampire', 'robot', 'ghost'] },
    { id: 'signs', icon: '⭐', reward: { hint: 2, eraser: 1, life: 1 },
      shapes: ['hourglass', 'hexagon', 'diamond', 'drop', 'shield', 'star', 'crown', 'clover', 'ring', 'club', 'horseshoe', 'arrowsign', 'heart', 'lightning', 'moon'] },
    { id: 'transport', icon: '🚂', reward: { eraser: 1, life: 1 },
      shapes: ['train', 'bus', 'car', 'bike', 'heli', 'plane', 'boat', 'anchor', 'rocket'] },
    { id: 'things', icon: '🎸', reward: { hint: 1, eraser: 1 },
      shapes: ['guitar', 'clock', 'key', 'balloon', 'cup', 'bell', 'headphones', 'bulb', 'house', 'arch'] },
    { id: 'nature', icon: '🍓', reward: { hint: 2, life: 1 },
      shapes: ['strawberry', 'cherry', 'palm', 'cake', 'carrot', 'leaf', 'icecream', 'sun', 'cactus', 'snowflake', 'cloud', 'banana', 'mushroom', 'tree'] },
    { id: 'world', icon: '🗼', reward: { hint: 2, eraser: 2, life: 2 },
      shapes: ['bigben', 'eiffel', 'kremlin', 'tajmahal', 'colosseum', 'pyramids', 'skyline', 'mountains', 'pisa', 'lighthouse'] },
  ],
};

// Реклама (п. 12.6, SPEC §8): только в приложении. Аккаунт AdMob пользователя, приложение «Стрелки».
// testing: true — показываются тестовые ролики Google (показы/клики по своей настоящей рекламе
// при разработке запрещены правилами AdMob). Перед выпуском в стор: testing: false.
// ID приложения (real.appId) прописан и в android/app/src/main/res/values/strings.xml (admob_app_id).
export const ADS = {
  testing: true,
  real: {
    appId: 'ca-app-pub-7222055770291725~5642118498',
    rewardedId: 'ca-app-pub-7222055770291725/5450546801', // strelki_rewarded
    interstitialId: 'ca-app-pub-7222055770291725/4638534727', // strelki_interstitial
  },
  test: {
    rewardedId: 'ca-app-pub-3940256099942544/5224354917', // тестовый ролик за награду Google
    interstitialId: 'ca-app-pub-3940256099942544/1033173712', // тестовая реклама между уровнями Google
  },
  // умная реклама между уровнями (этап 13): первые уровни чистые — игра затягивает, потом мягкий ритм
  interstitialFrom: 12, // не раньше этого уровня
  interstitialEvery: 2, // не чаще раза в столько пройденных уровней (с уровня rampUntil)
  interstitialMinSec: 90, // и не чаще раза в столько секунд (решение 2026-11-22)
  rampUntil: 30, // до этого уровня реклама ещё реже:
  rampEvery: 3, // раз в 3 уровня
  rampMinSec: 150, // и не чаще раза в 2,5 минуты
  sessionGraceSec: 120, // первые 2 минуты после запуска игры — без рекламы между уровнями
  dailyCap: 12, // не больше стольких реклам между уровнями за день
  noAdsKey: 'strelki.noads', // куплено «Без рекламы» (п. 12.7)
  statsKey: 'strelki.adstats', // { day, today, total } — показы за сегодня и всего (для лимита и спецпредложения)
};

// Спецпредложение после рекламы (этап 13): редко, красиво, без давления и таймеров
export const OFFER = {
  key: 'strelki.offer', // { last, shows, declines }
  product: 'starter_pack', // «Стартовый набор»: навсегда без рекламы + бустеры — выгоднее, чем «Без рекламы»
  afterAds: 3, // первый раз — не раньше, чем игрок увидит столько реклам между уровнями
  gapHours: 48, // и не чаще раза в 2 дня
  declineGapDays: 7, // после двух «Не сейчас» подряд — пауза неделю
  maxShows: 6, // всего не больше стольких показов
};

// Обучение на первых уровнях (этап 13): палец показывает свободную стрелку, остальные приглушены
export const TUTORIAL = {
  levels: [1, 2], // на каких уровнях вести за руку
  taps: 2, // сколько стрелок показать пальцем на уровне
  blockedToastLevels: 3, // до какого уровня объяснять, почему стрелка не улетела
  fingerDelayMs: 900, // палец появляется после проявления поля
  doneMs: 2600, // сколько висит «Отлично! Дальше — сам»
};

// Покупки (п. 12.7): Google Play Billing через cordova-plugin-purchase, только в приложении.
// id товара должен совпадать с товаром в Play Console. non — разовая, cons — расходуется (можно купить снова).
// grant: бустеры и флаги (noAds — без рекламы между уровнями, allLooks — все темы и скины).
export const SHOP = {
  allLooksKey: 'strelki.allLooks',
  products: [
    { id: 'starter_pack', type: 'non', grant: { noAds: true, hint: 10, eraser: 5, life: 5 } },
    { id: 'no_ads', type: 'non', grant: { noAds: true } },
    { id: 'all_looks', type: 'non', grant: { allLooks: true } },
    { id: 'boosters_small', type: 'cons', grant: { hint: 5, eraser: 3, life: 3 } },
    // паки: чем дороже, тем выгоднее за доллар ($0.99 → 11 шт, $4.99 → 90, $9.99 → 220)
    { id: 'boosters_big', type: 'cons', grant: { hint: 40, eraser: 25, life: 25 } },
    { id: 'boosters_huge', type: 'cons', grant: { hint: 100, eraser: 60, life: 60 } },
  ],
};

export const BOOSTERS = {
  start: { hint: 3, eraser: 2, life: 2 },
  max: 999, // запас каждого бустера (огромный пак — до 100 за раз)
  perStar: 1, // бустеров за каждую новую ★ (виды по кругу: лупа → ластик → жизнь)
  eraseMs: 320, // анимация исчезновения под ластиком
  toastMs: 1800, // всплывающая подсказка («жизни и так полные» и т. п.)
  coachFrom: 3, // с какого уровня один раз показать подсказку о бустерах
  coachKey: 'strelki.coach', // подсказку уже видели
};

// Ежедневный уровень: один на всех в этот день (номер уровня — из даты), награда — раз в день
export const DAILY = {
  key: 'strelki.daily', // { date: 'ГГГГ-ММ-ДД' } — когда ежедневный пройден последний раз
  epoch: [2026, 0, 1], // день 0 (год, месяц с 0, число)
  firstRound: 100, // круги ритма далеко за обычными уровнями — ежедневные не повторяют основные
  reward: { hint: 1, eraser: 1, life: 1 },
};

// Админская сборка (?admin=1): проверка уровней, прогресс игрока не трогается
export const ADMIN = {
  levels: 200, // сколько уровней открыто в выборе уровня
  runTo: 200, // прогон по умолчанию до этого уровня
  runPerFrame: 6, // змеек за кадр при прогоне
  turbo: true, // не ждать анимацию вылета последних змеек
};

// Заставка при запуске (тексты обучения и все надписи — в src/i18n.js)
export const SPLASH = {
  ms: 1500, // сколько идёт полоса загрузки
  fadeMs: 350,
  // фон — уровни-фигуры: [номер уровня, left %, top %, ширина %, поворот°]
  art: [
    [12, -14, -6, 46, -6],
    [4, 62, -10, 48, 7],
    [7, -18, 46, 44, 5],
    [16, 66, 40, 46, -8],
    [10, 12, 62, 40, -4],
    [20, 50, 66, 42, 6],
  ],
};

// Случайность порядка постройки от центра (проверено: больше 2.2 уровни не усложняет)
// Камни (п. 9.1): неподвижные клетки внутри фигуры, стрелки в них упираются
export const STONES = {
  fromLevel: 20, // с какого уровня
  density: 0.02, // доля клеток фигуры
  min: 2,
  max: 40,
  gap: 3, // камни не ближе стольких клеток друг к другу (по Чебышёву)
  size: 0.88, // сторона камня от клетки
  radius: 0.3, // скругление от стороны
  light: 0.55, // высота блика от стороны
};

// Замки (п. 9.2): змейка-замок выпускается только после змейки-ключа того же цвета
export const LOCKS = {
  fromLevel: 30,
  perSnakes: 35, // одна пара «замок–ключ» на столько змеек
  max: 4,
  keyLag: 2, // ключ уходит хотя бы на столько волн позже, чем замок мог бы
  badge: 0.58, // радиус значка от клетки (значок чуть больше клетки — заметнее)
  badgeLine: 0.09, // толщина обводки значка от клетки
};

export const GEN_JITTER = 2.2;

export const ANIM = {
  flySpeed: 12, // клеток в секунду (минимум)
  flyMaxMs: 900, // длинный путь проезжается не дольше — скорость растёт
  finaleMs: 1700, // финал уровня: собранная фигура с названием, потом окно победы
  flyFadeCells: 1.5, // за сколько клеток за краем стрелка исчезает
  bumpMs: 250,
  bumpSpeed: 28, // клеток/с: скорость проезда до препятствия при ошибке
  bumpMaxMs: 700, // туда-обратно не дольше
  bumpTouch: 0.1, // насколько клетки стрелка «касается» препятствия
  shakeMs: 300,
  shakePx: 6,
  hintPulseMs: 900,
  hintShowMs: 2400,
  hintDim: 0.35, // прозрачность остальных стрелок, пока горит подсказка
  hintFadeMs: 250, // плавное затемнение/возврат
  hintNudge: 0.12, // подсказанная стрелка «кивает» в сторону вылета, клеток
  popMs: 140, // «нажатие» стрелки при тапе
  // появление поля: змейки проявляются волной от верхнего левого угла
  appearMs: 280,
  appearTotalMs: 600, // за сколько волна пройдёт всё поле, независимо от размера
  appearOvershoot: 1.7, // сила «перелёта» (easing back-out)
  // облачко у хвоста при вылете
  puffMs: 420, // мягкое облачко на месте старта
  puffCount: 3,
  puffDist: 0.35, // снос назад, клеток
  puffSize: 0.22, // радиус круга, доля клетки
  puffAlpha: 0.22,
};

// Камера на больших полях: приближение щипком / колесом / кнопками, перетаскивание
export const CAMERA = {
  maxCellPx: 44, // приближать, пока клетка не станет такой
  zoomStep: 1.6, // кнопки «+» / «−»
  wheelK: 0.0015, // чувствительность колеса
  dragPx: 10, // палец сдвинулся больше — это перетаскивание, а не тап
  smallCellPx: 18, // клетка мельче — показать кнопки приближения
  maxTexture: 4096, // предел размера холста фона
};

export const LAYOUT = {
  hudTop: 84,
  hudBottom: 96,
  tutorialH: 44, // место под подсказку обучения над полем
  maxCell: 72, // клетка не крупнее (мелкие поля на десктопе)
  hitRadius: 0.9, // промах мимо линии: ближайшая змейка в пределах стольких клеток
  pad: 16,
  backing: 0.12, // подложка поля выступает на долю клетки
  maxBoard: 560, // ширина поля не больше (px)
};

// Змейка-линия: размеры в долях клетки, толщина ограничена в пикселях
export const SNAKE = {
  width: 0.18, // толщина линии
  minWidthPx: 2,
  maxWidthPx: 10,
  bendRadius: 0.45, // скругление изгибов
  headLen: 0.5, // наконечник: длина
  headWidth: 0.62, // и ширина
  headAhead: 0.42, // кончик впереди центра клетки головы
  pressScale: 1.45, // толщина змейки под пальцем
  hintScale: 1.35,
  dotR: 0.06, // точки в центрах пустых клеток
};

export const COLORS = {
  bg: '#F4F1EA',
  board: '#E7E1D5',
  albumLocked: '#D9D2C4', // закрытая фигура в альбоме — тень
  cell: '#EFEAE0',
  text: '#2E2A24',
  muted: '#8A8275',
  heart: '#FF7A59',
  heartEmpty: '#D9D2C4',
  hint: '#FFB020',
  dot: '#D3CABA',
  // камни (п. 9.1): тело, блик сверху, тень снизу
  stone: '#A39A8B',
  stoneLight: '#BDB5A7',
  stoneShade: '#8A8173',
  // палитра змеек: у соседних змеек цвета разные (раскраска в level.js)
  snake: ['#5B7FFF', '#FF7A59', '#2BB673', '#FFB020', '#A76BFF'],
  // цвета направлений — для логотипа и конфетти
  dir: { U: '#5B7FFF', R: '#FF7A59', D: '#2BB673', L: '#A76BFF' },
  glow: 0, // свечение линий (неоновая тема): ширина ореола от толщины линии
  glowAlpha: 0,
  patterns: false, // узоры линий по цвету (режим для дальтоников, включает screens.js)
  lineScale: 1, // толщина линии от скина (SKINS)
  hollow: 0, // «трубка»: доля толщины, вырезанная фоном посередине
};

// Темы оформления (п. 10.2): COLORS — текущая тема, на старте и при переключении
// в него копируются значения выбранной; CSS переключается через html[data-theme]
export const THEMES = {
  light: { ...COLORS, snake: [...COLORS.snake], dir: { ...COLORS.dir } },
  neon: {
    ...COLORS,
    bg: '#14151F',
    board: '#1D1F2E',
    albumLocked: '#2C2F48',
    cell: '#22253A',
    text: '#ECEAF6',
    muted: '#8D8FB0',
    heartEmpty: '#3A3D55',
    dot: '#34374F',
    stone: '#4A4D66',
    stoneLight: '#666A8E',
    stoneShade: '#2E3044',
    snake: ['#4DD8FF', '#FF4D8D', '#5CFF7A', '#FFE84D', '#C76BFF'],
    dir: { U: '#4DD8FF', R: '#FF4D8D', D: '#5CFF7A', L: '#C76BFF' },
    glow: 1.6,
    glowAlpha: 0.22,
    dark: true,
  },
  // «Доска»: мел на тёмно-зелёной доске (п. 12.3)
  chalk: {
    ...COLORS,
    bg: '#22352B',
    board: '#2A4134',
    albumLocked: '#34503F',
    cell: '#2E4638',
    text: '#EEF1E8',
    muted: '#9DB3A5',
    heartEmpty: '#3E5A49',
    dot: '#3E5A49',
    stone: '#5E7568',
    stoneLight: '#7D9486',
    stoneShade: '#3E5247',
    snake: ['#F4F1E6', '#F7C59F', '#A8DADC', '#FFE66D', '#E5B3FE'],
    dir: { U: '#A8DADC', R: '#F7C59F', D: '#FFE66D', L: '#E5B3FE' },
    glow: 0.5,
    glowAlpha: 0.12,
    dark: true,
  },
  // «Закат»: тёплая светлая палитра (п. 12.3)
  sunset: {
    ...COLORS,
    bg: '#FFF1E6',
    board: '#FBE1CF',
    albumLocked: '#F0CDB6',
    cell: '#FDE8DA',
    dot: '#EBC3AA',
    stone: '#C9A58E',
    stoneLight: '#DDBFAB',
    stoneShade: '#AE8A74',
    snake: ['#E76F51', '#2A9D8F', '#F4A261', '#9B5DE5', '#E9C46A'],
    dir: { U: '#2A9D8F', R: '#E76F51', D: '#E9C46A', L: '#9B5DE5' },
  },
};
// Режим для дальтоников (п. 10.4): у каждого цвета свой узор линии; в светлой теме — палитра Okabe–Ito
export const COLORBLIND = {
  key: 'strelki.cb',
  palette: ['#0072B2', '#E69F00', '#009E73', '#D55E00', '#CC79A7'],
  // штрих/пробел в толщинах линии; 0.01 — точка (круглый конец), [] — сплошная
  dash: [[], [1.8, 2.2], [0.01, 2], [4.5, 2.2], [3, 1.9, 0.01, 1.9]],
};

export const THEME = {
  key: 'strelki.theme',
  // темы по порядку и сколько ★ нужно, чтобы открыть (экран «Оформление», п. 12.3)
  list: [
    { id: 'light', stars: 0 },
    { id: 'sunset', stars: 15 },
    { id: 'neon', stars: 30 },
    { id: 'chalk', stars: 60 },
  ],
};

// Скины стрелок (п. 12.3): толщина линии и «трубка» (полая середина); открываются за ★
export const SKINS = {
  key: 'strelki.skin',
  list: [
    { id: 'normal', stars: 0, width: 1, hollow: 0 },
    { id: 'thin', stars: 10, width: 0.7, hollow: 0 },
    { id: 'bold', stars: 25, width: 1.35, hollow: 0 },
    { id: 'tube', stars: 45, width: 1.4, hollow: 0.45 },
  ],
};
