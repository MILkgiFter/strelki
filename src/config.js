// Все числа баланса и визуала. Меняй здесь, а не в коде.

export const GAME = {
  lives: 3,
  storageKey: 'strelki.level',
  starsKey: 'strelki.stars', // { [уровень]: лучшие звёзды }
  soundKey: 'strelki.sound',
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
  volume: 0.8,
  comboWindowMs: 1500, // быстрые выпуски подряд повышают тон
  comboMax: 12, // полутонов
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

export const DIFFICULTY = [
  { upTo: 1, snakes: 4, cols: 4, rows: 4, minLen: 2, maxLen: 3, turn: 0, fill: 0.6, tries: 1, bias: 0 },
  { upTo: 3, snakes: 9, cols: 6, rows: 8, minLen: 4, maxLen: 8, turn: 0.3, fill: 1, tries: 8, bias: 1, patterns: P_EASY },
  { upTo: 6, snakes: 13, cols: 8, rows: 11, minLen: 5, maxLen: 12, turn: 0.35, fill: 1, tries: 10, bias: 1.5, patterns: P_MID },
  { upTo: 15, snakes: 18, cols: 10, rows: 14, minLen: 6, maxLen: 16, turn: 0.35, fill: 1, tries: 12, bias: 2, patterns: P_ALL },
  { upTo: 30, snakes: 25, cols: 13, rows: 19, minLen: 6, maxLen: 20, turn: 0.35, fill: 1, tries: 10, bias: 2, patterns: P_ALL },
  { upTo: 60, snakes: 34, cols: 16, rows: 24, minLen: 7, maxLen: 24, turn: 0.35, fill: 1, tries: 8, bias: 2, patterns: P_ALL },
  { upTo: 100, snakes: 44, cols: 19, rows: 30, minLen: 8, maxLen: 26, turn: 0.35, fill: 1, tries: 6, bias: 2, patterns: P_ALL },
  { upTo: Infinity, snakes: 54, cols: 22, rows: 36, minLen: 8, maxLen: 30, turn: 0.35, fill: 1, tries: 6, bias: 2, patterns: P_ALL },
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
  passes: 5, // проходов «поставить головы» (короткие змейки — только в последних двух)
  minStub: 4, // змейки короче не ставятся в первых проходах генератора (меньше «огрызков»)
};

// Текст обучения над полем на конкретных уровнях
// Бустеры (src/boosters.js): стартовый запас, предел, награда за каждую новую звезду
export const BOOSTERS = {
  start: { hint: 3, eraser: 2, life: 2 },
  max: 99,
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
  // палитра змеек: у соседних змеек цвета разные (раскраска в level.js)
  snake: ['#5B7FFF', '#FF7A59', '#2BB673', '#FFB020', '#A76BFF'],
  // цвета направлений — для логотипа и конфетти
  dir: { U: '#5B7FFF', R: '#FF7A59', D: '#2BB673', L: '#A76BFF' },
};
