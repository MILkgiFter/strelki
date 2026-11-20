// Абстрактные фигуры: у каждого номера уровня — своя, сгенерированная по сиду.
// Формат как в shapes.js: { id, name, aspect, fn(u, v) }, u, v ∈ [-1, 1], v растёт вниз.

function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const KINDS = [
  'blob', 'mandala', 'wave', 'spiral', 'burst', 'ribbon', 'lattice', 'archipelago', 'zigzag', 'gear',
  'knot', 'sierpinski', 'rings', 'infinity', 'galaxy', 'pixel', 'rose',
];
const NAMES = {
  blob: 'Клякса', mandala: 'Мандала', island: 'Остров', wave: 'Волна', spiral: 'Спираль', burst: 'Вспышка',
  ribbon: 'Лента', lattice: 'Решётка', archipelago: 'Архипелаг', zigzag: 'Зигзаг', gear: 'Шестерёнка',
  knot: 'Узел', sierpinski: 'Треугольник Серпинского', rings: 'Мишень', infinity: 'Бесконечность', galaxy: 'Галактика',
  pixel: 'Пиксель-пришелец', rose: 'Роза',
};

// одна и та же фигура для одного сида (детерминизм и кэш доли заполнения)
const cache = new Map();
// kind задаёт уровень (виды идут по очереди, чтобы не повторялись подряд); без него — по сиду
export function abstractShape(seed, kind) {
  const key = `${seed}|${kind || ''}`;
  if (!cache.has(key)) cache.set(key, build(seed, kind));
  return cache.get(key);
}

function build(seed, kindArg) {
  const r = rng(seed * 2654435761 + 12345);
  const kind = kindArg || KINDS[Math.floor(r() * KINDS.length)];
  let aspect = 0.75 + r() * 0.5;
  let fn;

  if (kind === 'blob') {
    // цепочка кругов, каждый касается предыдущего; часто — зеркально симметрично
    const mirror = r() < 0.7;
    const circles = [];
    let x = mirror ? 0.15 : (r() - 0.5) * 0.4;
    let y = (r() - 0.5) * 0.4;
    const n = 5 + Math.floor(r() * 4);
    for (let i = 0; i < n; i++) {
      const rad = 0.22 + r() * 0.26;
      circles.push([x, y, rad]);
      const ang = r() * Math.PI * 2;
      x = Math.max(-0.6, Math.min(0.6, x + Math.cos(ang) * rad * 0.9));
      y = Math.max(-0.6, Math.min(0.6, y + Math.sin(ang) * rad * 0.9));
    }
    fn = (u, v) => circles.some(([cx, cy, rr]) => (u - cx) ** 2 + (v - cy) ** 2 <= rr * rr || (mirror && (-u - cx) ** 2 + (v - cy) ** 2 <= rr * rr));
  } else if (kind === 'mandala') {
    // лепестки с k-кратной симметрией, иногда с дыркой в центре
    aspect = 1;
    const k = 3 + Math.floor(r() * 6);
    const ph = r() * Math.PI;
    const a1 = 0.18 + r() * 0.15;
    const a2 = r() * 0.12;
    const hole = r() < 0.4 ? 0.18 + r() * 0.12 : 0;
    fn = (u, v) => {
      const d = Math.hypot(u, v);
      const t = Math.atan2(v, u);
      const R = 0.68 + a1 * Math.cos(k * t) + a2 * Math.cos(2 * k * t + ph);
      return d <= Math.min(1, R) && d >= hole;
    };
  } else if (kind === 'island') {
    // «остров»: сумма волн, обрезанная к краям
    const w = Array.from({ length: 4 }, () => [(r() - 0.5) * 9, (r() - 0.5) * 9, r() * 6.28, 0.5 + r() * 0.5]);
    fn = (u, v) => {
      let f = 0;
      for (const [a, b, c, amp] of w) f += amp * Math.sin(a * u + b * v + c);
      return 1 - (u * u + v * v) * 1.1 + f * 0.22 > 0.35;
    };
  } else if (kind === 'wave') {
    // одна или две толстые волны
    aspect = 1.3 + r() * 0.5;
    const om = 3 + r() * 4;
    const ph = r() * 6.28;
    const amp = 0.35 + r() * 0.25;
    const thick = 0.3 + r() * 0.12;
    const two = r() < 0.5;
    fn = (u, v) => {
      const y = amp * Math.sin(om * u + ph);
      if (two) return Math.abs(v - 0.45 - y * 0.6) < thick * 0.8 || Math.abs(v + 0.45 - y * 0.6) < thick * 0.8 || Math.abs(u) > 0.9;
      return Math.abs(v - y) < thick + 0.12 * Math.cos(om * 0.5 * u);
    };
  } else if (kind === 'knot') {
    // узел: толстая фигура Лиссажу — петли, пересекающие сами себя
    const pairs = [[1, 2], [2, 3], [3, 2], [3, 4], [1, 3], [3, 5]];
    const [a, b] = pairs[Math.floor(r() * pairs.length)];
    const ph = Math.PI / (2 + Math.floor(r() * 3));
    const thick = 0.12 + r() * 0.04;
    const pts = [];
    for (let i = 0; i < 600; i++) {
      const tt = (i / 600) * Math.PI * 2;
      pts.push([0.86 * Math.sin(a * tt + ph), 0.86 * Math.sin(b * tt)]);
    }
    fn = (u, v) => pts.some(([x, y]) => (u - x) ** 2 + (v - y) ** 2 < thick * thick);
  } else if (kind === 'sierpinski') {
    // треугольник Серпинского: дырки-треугольники внутри треугольника
    aspect = 1.12;
    const depth = 2 + Math.floor(r() * 2);
    const flip = r() < 0.5;
    fn = (u, v0) => {
      const v = flip ? -v0 : v0;
      // барицентрические координаты относительно A(0,-0.95), B(0.98,0.9), C(-0.98,0.9)
      const l1 = (0.9 - v) / 1.85;
      const l2 = (u / 0.98 + 1 - l1) / 2;
      const l3 = 1 - l1 - l2;
      let p = [l1, l2, l3];
      if (p.some((x) => x < 0)) return false;
      for (let i = 0; i < depth; i++) {
        const k = p.findIndex((x) => x >= 0.5);
        if (k < 0) return false; // средний треугольник — дырка
        p = p.map((x, j) => (j === k ? 2 * x - 1 : 2 * x));
      }
      return true;
    };
  } else if (kind === 'rings') {
    // мишень: кольца, соединённые перемычками
    aspect = 1;
    const n = 3 + Math.floor(r() * 2);
    const w = 0.92 / (n * 2 - 1);
    const rot = r() * 6.28;
    fn = (u, v) => {
      const d = Math.hypot(u, v);
      if (d > 0.98) return false;
      if (Math.floor(d / w) % 2 === 0) return true;
      const a = Math.atan2(v, u) + rot;
      return Math.abs(Math.sin(a * 2)) < 0.18; // перемычки крест-накрест
    };
  } else if (kind === 'infinity') {
    // бесконечность: толстая лемниската
    aspect = 1.8;
    const thick = 0.17 + r() * 0.05;
    const pts = [];
    for (let i = 0; i < 400; i++) {
      const tt = (i / 400) * Math.PI * 2;
      const den = 1 + Math.sin(tt) ** 2;
      pts.push([(0.95 * Math.cos(tt)) / den, (1.5 * Math.sin(tt) * Math.cos(tt)) / den]);
    }
    fn = (u, v) => pts.some(([x, y]) => (u - x) ** 2 + ((v - y) * 0.75) ** 2 < thick * thick);
  } else if (kind === 'galaxy') {
    // галактика: ядро и два закрученных рукава
    aspect = 1;
    const dir = r() < 0.5 ? 1 : -1;
    const tw = 1.1 + r() * 0.6;
    fn = (u, v) => {
      const d = Math.hypot(u, v);
      if (d > 1) return false;
      if (d < 0.22) return true;
      const a = Math.atan2(v, u) * dir;
      const arm = ((a - Math.log(d) * tw * 2.4) / Math.PI) % 1; // два рукава через π
      const x = ((arm % 1) + 1) % 1;
      return Math.abs(x - 0.5) < 0.2 + 0.1 * (1 - d);
    };
  } else if (kind === 'pixel') {
    // пиксель-пришелец: симметричный спрайт 9×9 крупными пикселями
    aspect = 1;
    const half = 5;
    const rows = 9;
    const bits = Array.from({ length: rows }, (_, y) => Array.from({ length: half }, (_, x) => r() < (x === half - 1 ? 0.8 : 0.5) || (y > 2 && y < 6 && x > 1)));
    fn = (u, v) => {
      const x = Math.floor(((u + 1) / 2) * (half * 2 - 1));
      const y = Math.floor(((v + 1) / 2) * rows);
      if (x < 0 || y < 0 || y >= rows || x >= half * 2 - 1) return false;
      return bits[y][x < half ? x : half * 2 - 2 - x];
    };
  } else if (kind === 'rose') {
    // роза: лепестки кривой r = |cos(kθ)|
    aspect = 1;
    const k = 2 + Math.floor(r() * 4);
    const rot = r() * 6.28;
    fn = (u, v) => {
      const d = Math.hypot(u, v);
      const a = Math.atan2(v, u) + rot;
      return d <= 0.98 * Math.abs(Math.cos(k * a)) ** 0.55 || d < 0.16;
    };
  } else if (kind === 'burst') {
    // звезда-вспышка: много лучей разной длины
    aspect = 1;
    const n = 7 + Math.floor(r() * 6);
    const rays = Array.from({ length: n }, () => 0.7 + r() * 0.3);
    const inner = 0.38 + r() * 0.12;
    const rot = r() * 6.28;
    fn = (u, v) => {
      const d = Math.hypot(u, v);
      const t = ((Math.atan2(v, u) + rot) / (2 * Math.PI) + 1) % 1;
      const x = t * n;
      const i = Math.floor(x);
      const f = x - i;
      const tip = rays[i % n];
      return d <= inner + (tip - inner) * Math.max(0, 1 - Math.abs(f - 0.5) * 2.2);
    };
  } else if (kind === 'ribbon') {
    // лента: толстая S-образная кривая
    aspect = 0.7 + r() * 0.3;
    const k = 1.2 + r() * 1.4;
    const ph = r() * 6.28;
    const thick = 0.3 + r() * 0.1;
    fn = (u, v) => Math.abs(u - 0.62 * Math.sin(v * k * Math.PI + ph)) < thick && Math.abs(v) < 0.97;
  } else if (kind === 'lattice') {
    // решётка: квадрат с окошками
    aspect = 0.8 + r() * 0.4;
    const nx = 3 + Math.floor(r() * 2);
    const ny = 3 + Math.floor(r() * 3);
    const hole = 0.42 + r() * 0.12;
    fn = (u, v) => {
      if (Math.abs(u) > 0.96 || Math.abs(v) > 0.96) return false;
      const fx = (((u + 1) / 2) * nx) % 1;
      const fy = (((v + 1) / 2) * ny) % 1;
      return !(Math.abs(fx - 0.5) < hole / 2 && Math.abs(fy - 0.5) < hole / 2);
    };
  } else if (kind === 'archipelago') {
    // архипелаг: несколько отдельных островов
    const isles = Array.from({ length: 3 + Math.floor(r() * 3) }, () => [(r() - 0.5) * 1.3, (r() - 0.5) * 1.3, 0.25 + r() * 0.2]);
    fn = (u, v) => isles.some(([cx, cy, rr]) => (u - cx) ** 2 + ((v - cy) * 1.15) ** 2 <= rr * rr);
  } else if (kind === 'zigzag') {
    // зигзаг: ломаная толстая полоса сверху вниз
    aspect = 0.75 + r() * 0.25;
    const teeth = 2 + Math.floor(r() * 3);
    const thick = 0.32 + r() * 0.1;
    fn = (u, v) => {
      const t = (((v + 1) / 2) * teeth) % 1;
      const x = (t < 0.5 ? t * 2 : 2 - t * 2) * 1.2 - 0.6;
      return Math.abs(u - x) < thick && Math.abs(v) < 0.97;
    };
  } else if (kind === 'gear') {
    // шестерёнка: зубчатое колесо с отверстием
    aspect = 1;
    const teeth = 7 + Math.floor(r() * 5);
    const hole = 0.22 + r() * 0.1;
    fn = (u, v) => {
      const d = Math.hypot(u, v);
      const t = ((Math.atan2(v, u) / (2 * Math.PI) + 1) * teeth) % 1;
      const R = t < 0.5 ? 0.98 : 0.76;
      return d <= R && d >= hole;
    };
  } else {
    // спираль с толстым рукавом
    aspect = 1;
    const turns = 1.6 + r() * 1.2;
    const dir = r() < 0.5 ? 1 : -1;
    fn = (u, v) => {
      const d = Math.hypot(u, v);
      if (d > 1) return false;
      if (d < 0.2) return true;
      const t = (Math.atan2(v, u) * dir + Math.PI) / (2 * Math.PI); // 0..1
      const step = 0.8 / turns; // расстояние между витками
      const thick = step * 0.3; // рукав уже зазора — витки не сливаются
      const x = (d - 0.15 - t * step) / step;
      return Math.abs(x - Math.round(x)) * step < thick;
    };
  }

  return { id: `abs-${seed}`, name: NAMES[kind], aspect, fn, abstract: true };
}
