// Звуки и музыка синтезируются Web Audio — без файлов и лицензий.
// Браузер разрешает звук только после жеста пользователя: вызывай unlock() на первом тапе.
// Шина: эффекты/музыка → master → компрессор → выход, плюс общий реверб (свёртка с шумом).
import { SOUND, MUSIC } from './config.js';

const midiHz = (m) => 440 * Math.pow(2, (m - 69) / 12);
// n-я ступень пентатоники от тоники (n может быть > 4 — следующие октавы)
const pentaMidi = (n) => {
  const len = SOUND.scale.length;
  return SOUND.root + 12 * Math.floor(n / len) + SOUND.scale[((n % len) + len) % len];
};
const pentaHz = (n) => midiHz(pentaMidi(n));

// Тембры: [множитель частоты, амплитуда, множитель затухания]
const KALIMBA = [[1, 1, 1], [4, 0.3, 0.3], [9.2, 0.08, 0.12]];
const MARIMBA = [[1, 1, 1], [4, 0.25, 0.25]];
const BELL = [[1, 1, 1], [2.76, 0.35, 0.6], [5.4, 0.15, 0.35], [8.9, 0.06, 0.2]];

export function createEngine(c, rand = Math.random) {
  // ---- шина ----
  const master = c.createGain();
  master.gain.value = SOUND.master;
  const comp = c.createDynamicsCompressor();
  for (const k of ['threshold', 'knee', 'ratio', 'attack', 'release']) comp[k].value = SOUND.comp[k];
  // мягкий ограничитель пиков: tanh, потолок 0.9 (мелкие сигналы почти не меняются)
  const shaper = c.createWaveShaper();
  const curve = new Float32Array(2049);
  for (let i = 0; i < curve.length; i++) curve[i] = 0.9 * Math.tanh((i / 1024 - 1) / 0.9);
  shaper.curve = curve;
  master.connect(comp).connect(shaper).connect(c.destination);

  // реверб: импульс из затухающего шума (стерео), смягчён однополюсным фильтром
  const len = Math.floor(c.sampleRate * SOUND.reverbSec);
  const ir = c.createBuffer(2, len, c.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = ir.getChannelData(ch);
    let lp = 0;
    for (let i = 0; i < len; i++) {
      lp += (rand() * 2 - 1 - lp) * 0.35;
      d[i] = lp * Math.pow(1 - i / len, 3);
    }
  }
  const conv = c.createConvolver();
  conv.buffer = ir;
  const revOut = c.createGain();
  revOut.gain.value = 0.9;
  conv.connect(revOut).connect(master);

  function makeBus(vol, send) {
    const bus = c.createGain();
    bus.gain.value = vol;
    const s = c.createGain();
    s.gain.value = send;
    bus.connect(master);
    bus.connect(s).connect(conv);
    return bus;
  }
  const sfxBus = makeBus(SOUND.volume, SOUND.reverbSend);
  const musicFade = c.createGain(); // плавное появление/пауза музыки
  musicFade.gain.value = 0;
  const musicBus = makeBus(MUSIC.volume, MUSIC.reverbSend);
  musicFade.connect(musicBus);

  // ---- голоса ----
  // щипок: сумма гармоник с быстрым затуханием через мягкий low-pass
  function pluck(dest, { f, t, dur, vol, parts = KALIMBA, cut = 5000 }) {
    const lp = c.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = Math.min(cut, f * 7);
    lp.Q.value = 0.4;
    lp.connect(dest);
    for (const [ratio, amp, dm] of parts) {
      if (f * ratio > 14000) continue;
      const o = c.createOscillator();
      const g = c.createGain();
      const end = t + dur * dm;
      o.type = 'sine';
      o.frequency.value = f * ratio;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(vol * amp, t + 0.005);
      g.gain.exponentialRampToValueAtTime(0.0001, end);
      o.connect(g).connect(lp);
      o.start(t);
      o.stop(end + 0.05);
    }
  }

  // мягкий «тук»: синус с падением высоты + чуть шума через low-pass
  function thud(t) {
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(125, t);
    o.frequency.exponentialRampToValueAtTime(62, t + 0.14);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(SOUND.bumpVol, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
    o.connect(g).connect(sfxBus);
    o.start(t);
    o.stop(t + 0.25);
    const nb = c.createBuffer(1, Math.floor(c.sampleRate * 0.06), c.sampleRate);
    const d = nb.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (rand() * 2 - 1) * (1 - i / d.length);
    const n = c.createBufferSource();
    n.buffer = nb;
    const nf = c.createBiquadFilter();
    nf.type = 'lowpass';
    nf.frequency.value = 400;
    const ng = c.createGain();
    ng.gain.value = SOUND.bumpVol * 0.25;
    n.connect(nf).connect(ng).connect(sfxBus);
    n.start(t);
  }

  const now = () => c.currentTime + 0.01;
  let sfxOn = true;

  const sfx = {
    fly(combo = 0, len = 1) {
      if (!sfxOn) return;
      const step = SOUND.flyBase + Math.max(0, Math.min(combo, SOUND.comboMax));
      const t = now();
      const dur = SOUND.flyDur + SOUND.flyDurPerLen * Math.min(len - 1, 6);
      pluck(sfxBus, { f: pentaHz(step), t, dur, vol: SOUND.flyVol, parts: KALIMBA });
    },
    bump() {
      if (!sfxOn) return;
      thud(now());
    },
    hint() {
      if (!sfxOn) return;
      const t = now();
      pluck(sfxBus, { f: pentaHz(9), t, dur: 0.7, vol: SOUND.hintVol, parts: BELL });
      pluck(sfxBus, { f: pentaHz(12), t: t + 0.11, dur: 0.9, vol: SOUND.hintVol * 0.9, parts: BELL });
    },
    win() {
      if (!sfxOn) return;
      const t = now();
      [5, 7, 9, 10, 12].forEach((n, i) =>
        pluck(sfxBus, { f: pentaHz(n), t: t + i * SOUND.winGap, dur: i === 4 ? 1.2 : 0.6, vol: SOUND.winVol, parts: i === 4 ? BELL : KALIMBA }),
      );
    },
    star(i = 0) {
      if (!sfxOn) return;
      const n = [9, 11, 13][Math.max(0, Math.min(i, 2))];
      pluck(sfxBus, { f: pentaHz(n), t: now(), dur: 0.9, vol: SOUND.starVol, parts: BELL });
    },
    lose() {
      if (!sfxOn) return;
      const t = now();
      [4, 2, 0].forEach((n, i) =>
        pluck(sfxBus, { f: pentaHz(n), t: t + i * 0.2, dur: 0.8, vol: SOUND.loseVol, parts: MARIMBA, cut: 1800 }),
      );
    },
    click() {
      if (!sfxOn) return;
      pluck(sfxBus, { f: pentaHz(10), t: now(), dur: 0.16, vol: SOUND.clickVol, parts: MARIMBA, cut: 3000 });
    },
  };

  // ---- музыка ----
  const beatDur = 60 / MUSIC.bpm;
  const pads = new Set(); // живые генераторы пэда (для остановки)
  let playing = false;
  let timer = null;
  let nextT = 0;
  let beat = 0;
  let chordIdx = -1;
  let dropStep = 8;
  let fadeTimer = null;

  function schedulePad(chord, t) {
    const dur = MUSIC.chordBeats * beatDur + MUSIC.padRelease;
    const att = MUSIC.padAttack;
    const lp = c.createBiquadFilter();
    lp.type = 'lowpass';
    lp.Q.value = 0.3;
    lp.frequency.setValueAtTime(MUSIC.padCutoff[0], t);
    lp.frequency.linearRampToValueAtTime(MUSIC.padCutoff[1], t + dur * 0.6);
    lp.frequency.linearRampToValueAtTime(MUSIC.padCutoff[0], t + dur);
    lp.connect(musicFade);
    const voices = chord.map((m, i) => ({ m, v: i === 0 ? MUSIC.bassVol : MUSIC.padVol, bass: i === 0 }));
    for (const { m, v, bass } of voices) {
      const g = c.createGain();
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(v, t + att);
      g.gain.setValueAtTime(v, t + dur - MUSIC.padRelease);
      g.gain.linearRampToValueAtTime(0, t + dur);
      g.connect(bass ? musicFade : lp);
      for (const det of bass ? [0] : [-6, 6]) {
        const o = c.createOscillator();
        o.type = bass ? 'sine' : 'triangle';
        o.frequency.value = midiHz(m);
        o.detune.value = det;
        o.connect(g);
        pads.add(o);
        o.onended = () => {
          pads.delete(o);
          o.disconnect();
        };
        o.start(t);
        o.stop(t + dur + 0.05);
      }
    }
  }

  function scheduleDrop(t) {
    const [lo, hi] = MUSIC.dropRange;
    const moves = [-2, -1, 1, 2, 3, -3];
    dropStep = Math.max(lo, Math.min(hi, dropStep + moves[Math.floor(rand() * moves.length)]));
    const f = pentaHz(dropStep);
    pluck(musicFade, { f, t, dur: 1.6, vol: MUSIC.dropVol, parts: BELL, cut: 3500 });
    if (rand() < MUSIC.echoProb) {
      pluck(musicFade, { f, t: t + beatDur * 0.75, dur: 1.2, vol: MUSIC.dropVol * 0.35, parts: BELL, cut: 2500 });
    }
  }

  // планируем всё, что попадает до horizon (время контекста)
  function pump(horizon) {
    while (nextT < horizon) {
      if (beat === 0) {
        let k;
        do k = Math.floor(rand() * MUSIC.chords.length);
        while (k === chordIdx);
        chordIdx = k;
        schedulePad(MUSIC.chords[k], nextT);
      }
      if (rand() < MUSIC.dropProb) scheduleDrop(nextT + rand() * beatDur * 0.6);
      beat = (beat + 1) % MUSIC.chordBeats;
      nextT += beatDur;
    }
  }

  function tick() {
    timer = null;
    if (!playing) return;
    pump(c.currentTime + MUSIC.lookahead);
    timer = setTimeout(tick, MUSIC.tickMs);
  }

  function fadeTo(v, sec) {
    const p = musicFade.gain;
    const t = c.currentTime;
    p.cancelScheduledValues(t);
    p.setValueAtTime(p.value, t);
    p.linearRampToValueAtTime(v, t + sec);
  }

  const music = {
    start() {
      if (playing) return;
      playing = true;
      clearTimeout(fadeTimer);
      nextT = c.currentTime + 0.15;
      beat = 0;
      fadeTo(1, MUSIC.fadeIn);
      tick();
    },
    stop() {
      if (!playing) return;
      playing = false;
      clearTimeout(timer);
      timer = null;
      fadeTo(0, MUSIC.fadeOut);
      clearTimeout(fadeTimer);
      fadeTimer = setTimeout(() => {
        for (const o of [...pads]) {
          try {
            o.stop();
          } catch (e) {
            /* уже остановлен */
          }
        }
      }, MUSIC.fadeOut * 1000 + 100);
    },
    pump,
    stats: () => ({ pads: pads.size, playing }),
  };

  return { sfx, music, setSfxOn: (v) => (sfxOn = v), master, musicFade };
}

// ---- модульный API (его зовёт main.js) ----
let ctx = null;
let engine = null;
let sfxEnabled = true;
let musicEnabled = MUSIC.enabled;
let musicWanted = false;

function ac() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    try {
      ctx = new AC();
      engine = createEngine(ctx);
      engine.setSfxOn(sfxEnabled);
    } catch (e) {
      ctx = null;
      engine = null;
      return null;
    }
  }
  if (ctx.state === 'suspended' && !document.hidden) ctx.resume();
  return ctx;
}

export const setEnabled = (v) => {
  sfxEnabled = !!v;
  if (engine) engine.setSfxOn(sfxEnabled);
  return sfxEnabled;
};
export const isEnabled = () => sfxEnabled;

export function unlock() {
  ac();
}

const call = (name) =>
  function (...a) {
    if (!sfxEnabled || !ac()) return;
    engine.sfx[name](...a);
  };

export const sfx = {
  fly: call('fly'),
  bump: call('bump'),
  hint: call('hint'),
  win: call('win'),
  star: call('star'),
  lose: call('lose'),
  click: call('click'),
};

function musicRun() {
  if (musicWanted && musicEnabled && !document.hidden && ac()) engine.music.start();
}

export const music = {
  setEnabled(v) {
    musicEnabled = !!v;
    if (musicEnabled) musicRun();
    else if (engine) engine.music.stop();
    return musicEnabled;
  },
  isEnabled: () => musicEnabled,
  start() {
    musicWanted = true;
    musicRun();
  },
  stop() {
    musicWanted = false;
    if (engine) engine.music.stop();
  },
};

// Скрытая вкладка: музыка в паузу (контекст приостанавливается), при возврате продолжаем
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (!ctx || !engine) return;
    if (document.hidden) {
      engine.music.stop();
      setTimeout(() => {
        if (document.hidden && ctx.state === 'running') ctx.suspend();
      }, MUSIC.fadeOut * 1000 + 200);
    } else {
      if (ctx.state === 'suspended') ctx.resume();
      musicRun();
    }
  });
}
