// Гигантские фигуры-достопримечательности и панорамы — для уровней «гигантский».
// Нарисованы функциями, а не ASCII: остаются чёткими на полях до 96×96 клеток.
// Формат как в shapes.js: { id, name, aspect, fn(u, v) }, u, v ∈ [-1, 1], v растёт вниз.
// Внутри функций удобнее «физические» координаты: X = u·aspect, Y = v (высота 2, ширина 2·aspect).

const inCircle = (x, y, cx, cy, r) => (x - cx) ** 2 + (y - cy) ** 2 <= r * r;
// треугольник с основанием на y = base (полуширина hw) и вершиной на y = apex, по центру cx
const inTri = (x, y, cx, hw, apex, base) => y >= apex && y <= base && Math.abs(x - cx) <= (hw * (y - apex)) / (base - apex);
const band = (y, a, b) => y >= a && y <= b;

// детерминированный «шум» для силуэта города
const hash = (i) => {
  const s = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};

export const LANDMARKS = [
  {
    id: 'bigben',
    name: 'Биг-Бен',
    aspect: 0.34,
    fn: (u, v) => {
      const a = 0.34;
      const X = u * a;
      if (inCircle(X, v, 0, -0.44, 0.13)) return false; // циферблат — окно
      if (band(v, 0.88, 1)) return Math.abs(u) <= 0.82; // цоколь
      if (band(v, -0.3, 0.88)) return Math.abs(u) <= 0.56; // ствол башни
      if (band(v, -0.58, -0.3)) return Math.abs(u) <= 0.78; // часовой ярус
      if (band(v, -0.72, -0.58)) return Math.abs(u) <= 0.62; // звонница
      return inTri(u, v, 0, 0.62, -1, -0.72); // шпиль
    },
  },
  {
    id: 'eiffel',
    name: 'Эйфелева башня',
    aspect: 0.62,
    fn: (u, v) => {
      const t = (v + 1) / 2; // 0 сверху, 1 снизу
      const half = 0.1 + 0.9 * t ** 2.4; // силуэт расширяется книзу
      if (Math.abs(u) > half) {
        // площадки выступают за силуэт
        if (band(v, 0.32, 0.4)) return Math.abs(u) <= half + 0.1;
        if (band(v, -0.18, -0.12)) return Math.abs(u) <= half + 0.06;
        return false;
      }
      if (v > 0.46) {
        // арка между ногами
        const k = (v - 0.46) / 0.54;
        if (Math.abs(u) < 0.62 * Math.sqrt(k)) return false;
      }
      return v >= -0.96;
    },
  },
  {
    id: 'kremlin',
    name: 'Кремлёвская башня',
    aspect: 0.4,
    fn: (u, v) => {
      // ворота-арка внизу
      if (v > 0.62 && Math.abs(u) < 0.32 && (v > 0.78 || (u / 0.32) ** 2 + ((v - 0.78) / 0.16) ** 2 <= 1)) return false;
      if (band(v, 0.28, 1)) return Math.abs(u) <= 0.86 && !(v < 0.36 && Math.abs(u) > 0.62 && Math.floor((u + 1) * 6) % 2 === 0);
      if (band(v, -0.02, 0.28)) return Math.abs(u) <= 0.64;
      if (band(v, -0.26, -0.02)) return Math.abs(u) <= 0.5;
      if (band(v, -0.44, -0.26)) return Math.abs(u) <= 0.38;
      if (inTri(u, v, 0, 0.38, -0.86, -0.44)) return true; // шатёр
      return Math.abs(u) + Math.abs(v + 0.92) * 2 <= 0.2; // звезда
    },
  },
  {
    id: 'tajmahal',
    name: 'Тадж-Махал',
    aspect: 1.5,
    fn: (u, v) => {
      const a = 1.5;
      const X = u * a;
      // минареты по краям
      for (const mx of [-0.92, 0.92]) {
        if (Math.abs(u - mx) <= 0.05 && v >= -0.5) return true;
        if (Math.abs(u - mx) <= 0.075 && band(v, -0.6, -0.5)) return true;
      }
      if (band(v, 0.78, 1)) return Math.abs(u) <= 0.98; // платформа
      if (band(v, 0.05, 0.78)) {
        if (Math.abs(u) < 0.12 && v > 0.32) return false; // главная арка
        return Math.abs(u) <= 0.62;
      }
      if (inCircle(X, v, 0, -0.22, 0.48) && v <= 0.05) return true; // главный купол
      for (const cx of [-0.42, 0.42]) if (inCircle(X, v, cx * a, -0.02, 0.17) && v <= 0.05) return true; // малые купола
      return Math.abs(u) <= 0.03 && band(v, -0.95, -0.6); // шпиль купола
    },
  },
  {
    id: 'colosseum',
    name: 'Колизей',
    aspect: 1.9,
    fn: (u, v) => {
      // верх обрушен справа ступеньками
      const top = u < 0.25 ? -0.75 : -0.75 + Math.ceil((u - 0.25) / 0.15) * 0.18;
      if (v < top || Math.abs(u) > 0.98) return false;
      // три яруса арок: в нижней части каждого яруса — проёмы
      const tier = Math.floor((v + 0.75) / 0.58);
      const tv = (v + 0.75) - tier * 0.58;
      const cell = (u + 1) / 0.13;
      const inArch = cell - Math.floor(cell) > 0.3 && cell - Math.floor(cell) < 0.7;
      if (tier < 3 && tv > 0.2 && tv < 0.5 && inArch) return false;
      return true;
    },
  },
  {
    id: 'pyramids',
    name: 'Пирамиды',
    aspect: 2.3,
    fn: (u, v) =>
      inTri(u, v, -0.5, 0.48, -0.55, 1) || inTri(u, v, 0.18, 0.62, -1, 1) || inTri(u, v, 0.76, 0.3, 0.12, 1) || band(v, 0.9, 1),
  },
  {
    id: 'skyline',
    name: 'Ночной город',
    aspect: 2.6,
    fn: (u, v) => {
      const n = 22; // домов в панораме
      const i = Math.min(n - 1, Math.floor(((u + 1) / 2) * n));
      let top = 0.75 - hash(i) * 1.2;
      if (i === 7) top = -0.92; // небоскрёб
      if (i === 15) top = -0.7; // телебашня
      if (i === 15) {
        const lx = ((u + 1) / 2) * n - i; // 0..1 внутри дома
        if (v < -0.2 && Math.abs(lx - 0.5) > 0.2) return false; // узкая игла
      }
      return v >= top || v > 0.85;
    },
  },
  {
    id: 'mountains',
    name: 'Горная гряда',
    aspect: 2.4,
    fn: (u, v) => {
      const ridge =
        0.25 -
        0.55 * Math.max(0, 1 - Math.abs(u + 0.35) * 1.6) -
        0.45 * Math.max(0, 1 - Math.abs(u - 0.45) * 2) -
        0.25 * Math.max(0, 1 - Math.abs(u - 0.95) * 3) +
        0.06 * Math.sin(u * 23);
      return v >= ridge;
    },
  },
  {
    id: 'pisa',
    name: 'Пизанская башня',
    aspect: 0.48,
    fn: (u, v) => {
      const x = u + (v - 1) * 0.24; // наклон: верх уходит вправо
      if (band(v, 0.9, 1)) return Math.abs(u) <= 0.75;
      if (band(v, -0.86, 0.9)) {
        const ring = Math.abs(((v + 0.86) / 0.25) % 1 - 0.5) > 0.4; // карнизы этажей
        return Math.abs(x) <= (ring ? 0.66 : 0.56);
      }
      return Math.abs(x) <= 0.42 && v >= -1;
    },
  },
  {
    id: 'lighthouse',
    name: 'Маяк',
    aspect: 0.5,
    fn: (u, v) => {
      if (v > 0.78) return Math.abs(u) <= 0.95 - (v - 0.78) * 0.5; // скалы
      if (band(v, -0.55, 0.78)) return Math.abs(u) <= 0.3 + (0.2 * (v + 0.55)) / 1.33; // башня
      if (band(v, -0.64, -0.55)) return Math.abs(u) <= 0.62; // галерея
      if (band(v, -0.86, -0.64)) return Math.abs(u) <= 0.38 && !(Math.abs(u) < 0.16 && band(v, -0.8, -0.7)); // фонарь с окном
      return inTri(u, v, 0, 0.46, -1, -0.86); // крыша
    },
  },
  {
    id: 'castle',
    name: 'Замок',
    aspect: 1.4,
    fn: (u, v) => {
      if (Math.abs(u) < 0.12 && v > 0.5) return false; // ворота
      if (v >= 0.1 && Math.abs(u) <= 0.8) return true; // стена
      if (band(v, -0.02, 0.1) && Math.abs(u) <= 0.8) return Math.floor((u + 1) * 9) % 2 === 0; // зубцы
      for (const c of [-0.84, 0.84]) {
        if (Math.abs(u - c) <= 0.14 && v >= -0.45) return true; // угловые башни
        if (inTri(u, v, c, 0.18, -0.85, -0.45)) return true; // их крыши
      }
      if (Math.abs(u) <= 0.3 && v >= -0.42) return true; // донжон
      return inTri(u, v, 0, 0.36, -1, -0.42);
    },
  },
  {
    id: 'windmill',
    name: 'Мельница',
    aspect: 0.95,
    fn: (u, v) => {
      const a = 0.95;
      const X = u * a;
      if (band(v, -0.15, 1)) {
        if (Math.abs(X) <= 0.18 + (0.16 * (v + 0.15)) / 1.15) return !(Math.abs(X) < 0.08 && v > 0.72); // башня с дверью
      }
      if (inCircle(X, v, 0, -0.3, 0.2)) return true; // ступица
      // четыре лопасти крестом под 45°
      const dx = X;
      const dy = v + 0.3;
      for (let k = 0; k < 4; k++) {
        const ang = Math.PI / 4 + (k * Math.PI) / 2;
        const along = dx * Math.cos(ang) + dy * Math.sin(ang);
        const across = -dx * Math.sin(ang) + dy * Math.cos(ang);
        if (along > 0.1 && along < 0.95 && Math.abs(across) < (along > 0.35 ? 0.17 : 0.07)) return true;
      }
      return false;
    },
  },
  {
    id: 'cathedral',
    name: 'Собор с куполами',
    aspect: 1.05,
    fn: (u, v) => {
      if (v >= 0.35) return Math.abs(u) <= 0.92 && !(Math.abs(u) < 0.12 && v > 0.7);
      const towers = [[-0.62, -0.25], [-0.3, -0.45], [0, -0.9], [0.3, -0.45], [0.62, -0.25]];
      for (const [c, top] of towers) {
        if (Math.abs(u - c) <= 0.11 && v >= top + 0.2) return true; // барабан
        // луковка: круг и острый кончик
        const dy = v - (top + 0.08);
        if ((u - c) ** 2 + (dy * 1.1) ** 2 <= 0.16 ** 2) return true;
        if (inTri(u, v, c, 0.1, top - 0.18, top - 0.02)) return true;
      }
      return false;
    },
  },
  {
    id: 'bridge',
    name: 'Мост',
    aspect: 3,
    fn: (u, v) => {
      if (band(v, 0.25, 0.4)) return true; // полотно
      for (const c of [-0.55, 0.55]) {
        if (Math.abs(u - c) <= 0.04 && band(v, -0.9, 0.95)) return true; // пилоны
      }
      // главный трос между пилонами и боковые к берегам
      if (Math.abs(u) <= 0.55) {
        const y = -0.85 + 1.05 * (u / 0.55) ** 2;
        if (Math.abs(v - y) <= 0.08) return true;
      } else {
        const t = (Math.abs(u) - 0.55) / 0.45;
        const y = -0.85 + t * 1.1;
        if (Math.abs(v - y) <= 0.08) return true;
      }
      // подвесы
      if (Math.abs(u) <= 0.55 && Math.abs(((u + 1) / 0.11) % 1 - 0.5) < 0.12 && v > -0.85 + 1.05 * (u / 0.55) ** 2 && v < 0.25) return true;
      return false;
    },
  },
  {
    id: 'pagoda',
    name: 'Пагода',
    aspect: 0.78,
    fn: (u, v) => {
      for (let i = 0; i < 5; i++) {
        const y0 = 1 - i * 0.36; // низ яруса
        const roofHalf = 0.95 - i * 0.14;
        const bodyHalf = 0.58 - i * 0.09;
        if (band(v, y0 - 0.1, y0)) return Math.abs(u) <= roofHalf + (y0 - v) * 0.6 * 0; // крыша
        if (band(v, y0 - 0.36, y0 - 0.1)) {
          if (Math.abs(u) <= bodyHalf) return true;
          // загнутые концы крыши
          if (band(v, y0 - 0.16, y0 - 0.1) && Math.abs(u) >= roofHalf - 0.08 && Math.abs(u) <= roofHalf) return true;
          return false;
        }
      }
      return Math.abs(u) <= 0.06 && v >= -1;
    },
  },
  {
    id: 'ferris',
    name: 'Колесо обозрения',
    aspect: 0.88,
    fn: (u, v) => {
      const a = 0.88;
      const X = u * a;
      const cx = 0;
      const cy = -0.15;
      const d = Math.hypot(X - cx, v - cy);
      if (d >= 0.6 && d <= 0.7) return true; // обод
      if (d <= 0.1) return true; // ступица
      for (let k = 0; k < 12; k++) {
        const ang = (k * Math.PI) / 6;
        if (inCircle(X, v, cx + Math.cos(ang) * 0.72, cy + Math.sin(ang) * 0.72, 0.085)) return true; // кабинки
      }
      for (let k = 0; k < 8; k++) {
        const ang = (k * Math.PI) / 4;
        const along = (X - cx) * Math.cos(ang) + (v - cy) * Math.sin(ang);
        const across = -(X - cx) * Math.sin(ang) + (v - cy) * Math.cos(ang);
        if (along > 0 && along < 0.62 && Math.abs(across) < 0.04) return true; // спицы
      }
      // опоры и основание
      for (const s of [-1, 1]) {
        const t = (v - cy) / (0.95 - cy);
        if (t >= 0 && t <= 1 && Math.abs(X - s * 0.42 * t) < 0.06) return true;
      }
      return v > 0.92 && Math.abs(u) <= 0.6;
    },
  },
];
