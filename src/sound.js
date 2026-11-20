// Звуки синтезируются Web Audio — без файлов и лицензий.
// Браузер разрешает звук только после жеста пользователя: вызывай unlock() на первом тапе.
import { SOUND } from './config.js';

let ctx = null;
let enabled = true;

export const setEnabled = (v) => (enabled = v);
export const isEnabled = () => enabled;

function ac() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

export function unlock() {
  if (enabled) ac();
}

function tone({ freq, to = freq, dur = 0.12, type = 'sine', vol = 0.2, delay = 0, attack = 0.006 }) {
  if (!enabled) return;
  const c = ac();
  if (!c) return;
  const t = c.currentTime + delay;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (to !== freq) o.frequency.exponentialRampToValueAtTime(to, t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol * SOUND.volume, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(c.destination);
  o.start(t);
  o.stop(t + dur + 0.03);
}

const semi = (f, n) => f * Math.pow(2, n / 12);

export const sfx = {
  // выпуск стрелки; combo — сколько выпусков подряд (тон растёт)
  fly(combo = 0, len = 1) {
    const f = semi(520, Math.min(combo, SOUND.comboMax));
    const dur = 0.12 + 0.03 * (len - 1);
    tone({ freq: f, to: f * 1.7, dur, type: 'triangle', vol: 0.22 });
    tone({ freq: f * 2, to: f * 3.2, dur: dur * 0.8, type: 'sine', vol: 0.05 });
  },
  bump() {
    tone({ freq: 160, to: 80, dur: 0.18, type: 'square', vol: 0.07 });
    tone({ freq: 95, to: 55, dur: 0.22, type: 'sine', vol: 0.35 });
  },
  hint() {
    tone({ freq: 880, dur: 0.15, type: 'sine', vol: 0.15 });
    tone({ freq: 1320, dur: 0.22, type: 'sine', vol: 0.12, delay: 0.09 });
  },
  win() {
    [523, 659, 784, 1047].forEach((f, i) => tone({ freq: f, dur: 0.22, type: 'triangle', vol: 0.18, delay: i * 0.08 }));
  },
  star(i) {
    const f = [784, 988, 1175][i] || 1175;
    tone({ freq: f, dur: 0.25, type: 'triangle', vol: 0.2 });
    tone({ freq: f * 2, dur: 0.18, type: 'sine', vol: 0.06, delay: 0.02 });
  },
  lose() {
    [392, 330, 262].forEach((f, i) => tone({ freq: f, to: f * 0.97, dur: 0.28, type: 'triangle', vol: 0.16, delay: i * 0.14 }));
  },
  click() {
    tone({ freq: 660, dur: 0.05, type: 'sine', vol: 0.08 });
  },
};
