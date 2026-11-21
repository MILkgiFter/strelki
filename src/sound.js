// Звуки и музыка синтезируются Web Audio — без файлов и лицензий.
// Браузер разрешает звук только после жеста пользователя: вызывай unlock() на первом тапе.
// Шина: эффекты/музыка → master → компрессор → ограничитель → выход, плюс общий реверб.
import { SOUND, MUSIC, SAMPLES } from './config.js';

const midiHz = (m) => 440 * Math.pow(2, (m - 69) / 12);
// n-я ступень лада scale от тоники root (n может выходить за октаву, в т.ч. быть < 0)
const stepMidi = (root, scale, n) => {
  const L = scale.length;
  return root + 12 * Math.floor(n / L) + scale[((n % L) + L) % L];
};

// Тембры щипка: [множитель частоты, амплитуда, множитель затухания]
const KALIMBA = [[1, 1, 1], [4, 0.3, 0.3], [9.2, 0.08, 0.12]];
const MARIMBA = [[1, 1, 1], [4, 0.25, 0.25]];
const BELL = [[1, 1, 1], [2.76, 0.35, 0.6], [5.4, 0.15, 0.35], [8.9, 0.06, 0.2]];
const HARP = [[1, 1, 1], [2, 0.4, 0.6], [3, 0.2, 0.4], [4, 0.1, 0.25]];

export function createEngine(c, rand = Math.random) {
  // ---- шина ----
  const master = c.createGain();
  master.gain.value = SOUND.master;
  const comp = c.createDynamicsCompressor();
  for (const k of ['threshold', 'knee', 'ratio', 'attack', 'release']) comp[k].value = SOUND.comp[k];
  // мягкий ограничитель пиков: tanh, потолок 0.9
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
  const sfxDry = c.createGain(); // без реверба (клики)
  sfxDry.gain.value = SOUND.volume;
  sfxDry.connect(master);
  const musicFade = c.createGain(); // плавное появление/пауза музыки
  musicFade.gain.value = 0;
  const musicBus = makeBus(MUSIC.volume, MUSIC.reverbSend);
  musicFade.connect(musicBus);

  // общий буфер шума (2 с)
  const noiseBuf = c.createBuffer(1, c.sampleRate * 2, c.sampleRate);
  {
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = rand() * 2 - 1;
  }
  function noise(t, dur) {
    const n = c.createBufferSource();
    n.buffer = noiseBuf;
    n.start(t, rand() * 1.5, dur);
    return n;
  }

  // ---- голоса ----
  // щипок: сумма гармоник с быстрым затуханием через мягкий low-pass
  function pluck(dest, { f, t, dur, vol, parts = KALIMBA, cut = 5000, attack = 0.005 }) {
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
      g.gain.linearRampToValueAtTime(vol * amp, t + attack);
      g.gain.exponentialRampToValueAtTime(0.0001, end);
      o.connect(g).connect(lp);
      o.start(t);
      o.stop(end + 0.05);
    }
  }

  // флейта: синус с вибрато и шумом дыхания
  function flute(dest, { f, t, dur, vol }) {
    const lp = c.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = Math.min(4000, f * 5);
    lp.connect(dest);
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + Math.min(0.16, dur * 0.3));
    g.gain.setValueAtTime(vol * 0.9, t + dur * 0.55);
    g.gain.linearRampToValueAtTime(0.0001, t + dur);
    g.connect(lp);
    const lfo = c.createOscillator();
    lfo.frequency.value = 4.8 + rand() * 0.8;
    const lg = c.createGain();
    lg.gain.setValueAtTime(0, t);
    lg.gain.linearRampToValueAtTime(f * 0.007, t + 0.5); // вибрато нарастает
    lfo.connect(lg);
    for (const [r, a] of [[1, 1], [2, 0.12]]) {
      const o = c.createOscillator();
      const og = c.createGain();
      o.type = 'sine';
      o.frequency.value = f * r;
      og.gain.value = a;
      lg.connect(o.frequency);
      o.connect(og).connect(g);
      o.start(t);
      o.stop(t + dur + 0.05);
    }
    lfo.start(t);
    lfo.stop(t + dur + 0.05);
    const n = noise(t, dur + 0.05);
    const bp = c.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = Math.min(f * 2, 6000);
    bp.Q.value = 2;
    const ng = c.createGain();
    ng.gain.setValueAtTime(0.0001, t);
    ng.gain.linearRampToValueAtTime(vol * 0.35, t + 0.06);
    ng.gain.exponentialRampToValueAtTime(vol * 0.04, t + 0.4);
    ng.gain.linearRampToValueAtTime(0.0001, t + dur);
    n.connect(bp).connect(ng).connect(lp);
  }

  // электропиано: простая FM (модулятор 1:1, индекс затухает)
  function rhodes(dest, { f, t, dur, vol }) {
    const lp = c.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 2600;
    lp.connect(dest);
    const car = c.createOscillator();
    const mod = c.createOscillator();
    const mg = c.createGain();
    const g = c.createGain();
    car.frequency.value = f;
    mod.frequency.value = f;
    mg.gain.setValueAtTime(f * 1.1, t);
    mg.gain.exponentialRampToValueAtTime(f * 0.08, t + dur * 0.5);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    mod.connect(mg).connect(car.frequency);
    car.connect(g).connect(lp);
    car.start(t);
    mod.start(t);
    car.stop(t + dur + 0.05);
    mod.stop(t + dur + 0.05);
  }

  const INST = {
    kalimba: (d, o) => pluck(d, { ...o, parts: KALIMBA }),
    harp: (d, o) => pluck(d, { ...o, parts: HARP, cut: o.cut ?? 4000 }),
    bell: (d, o) => pluck(d, { ...o, parts: BELL, cut: o.cut ?? 3500 }),
    flute,
    rhodes,
  };

  // ударные для лофи: всё приглушено
  function kick(dest, t, vol) {
    const o = c.createOscillator();
    const g = c.createGain();
    o.frequency.setValueAtTime(100, t);
    o.frequency.exponentialRampToValueAtTime(45, t + 0.16);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.28);
    o.connect(g).connect(dest);
    o.start(t);
    o.stop(t + 0.32);
  }
  function hiss(dest, t, vol, dur, freq, type) {
    const n = noise(t, dur + 0.02);
    const f = c.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    n.connect(f).connect(g).connect(dest);
  }

  // ---- тема и подстройка эффектов ----
  let themeIdx = 0;
  const theme = () => MUSIC.themes[themeIdx];
  // тоника эффектов: тот же тон, что у темы, в октаве около C4
  const sfxRoot = () => 60 + ((theme().root % 12) + 7) % 12 - 7;
  const sfxHz = (n) => midiHz(stepMidi(sfxRoot(), theme().penta, n));

  const now = () => c.currentTime + 0.01;
  let sfxOn = true;

  const sfx = {
    // правильный тап: очень короткий мягкий «поп» (шум + тон в середине), сухой, без мелодии;
    // combo едва поднимает высоту (до comboSemis полутонов), len чуть удлиняет
    fly(combo = 0, len = 1) {
      if (!sfxOn) return;
      const t = now();
      const k = Math.min(Math.max(combo, 0), SOUND.comboMax) / SOUND.comboMax;
      const semi = Math.pow(2, (k * SOUND.comboSemis) / 12);
      const dur = SOUND.popDur * (1 + 0.2 * Math.min(Math.max(len - 1, 0), 6) / 6);
      const f = SOUND.popFreq * semi * (0.96 + rand() * 0.08);
      const vol = SOUND.flyVol * (0.9 + rand() * 0.2);
      const lp = c.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = SOUND.popCut;
      lp.connect(sfxDry);
      const o = c.createOscillator();
      const g = c.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(f * 1.35, t);
      o.frequency.exponentialRampToValueAtTime(f, t + dur * 0.5);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(vol, t + 0.004);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g).connect(lp);
      o.start(t);
      o.stop(t + dur + 0.03);
      const n = noise(t, dur);
      const bp = c.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.value = f * 2;
      bp.Q.value = 1;
      const ng = c.createGain();
      ng.gain.setValueAtTime(0.0001, t);
      ng.gain.linearRampToValueAtTime(vol * 0.5, t + 0.003);
      ng.gain.exponentialRampToValueAtTime(0.0001, t + dur * 0.6);
      n.connect(bp).connect(ng).connect(lp);
    },
    bump() {
      if (!sfxOn) return;
      const t = now();
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
      hiss(sfxBus, t, SOUND.bumpVol * 0.25, 0.06, 400, 'lowpass');
    },
    hint() {
      if (!sfxOn) return;
      // «нашлось»: тихое стеклянное «динь» с лёгким свипом вверх и плавной атакой
      const t = now();
      const lp = c.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 4500;
      lp.connect(sfxBus);
      for (const [r, a, d] of [[1, 1, 0.34], [2.01, 0.3, 0.2]]) {
        const o = c.createOscillator();
        const g = c.createGain();
        o.type = 'sine';
        o.frequency.setValueAtTime(900 * r, t);
        o.frequency.exponentialRampToValueAtTime(1180 * r, t + 0.09);
        g.gain.setValueAtTime(0.0001, t);
        g.gain.linearRampToValueAtTime(SOUND.hintVol * a, t + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, t + d + 0.04);
        o.connect(g).connect(lp);
        o.start(t);
        o.stop(t + d + 0.1);
      }
    },
    win() {
      if (!sfxOn) return;
      const t = now();
      [5, 7, 9, 10, 12].forEach((n, i) =>
        pluck(sfxBus, { f: sfxHz(n), t: t + i * SOUND.winGap, dur: i === 4 ? 1.2 : 0.6, vol: SOUND.winVol, parts: i === 4 ? BELL : KALIMBA }),
      );
    },
    star(i = 0) {
      if (!sfxOn) return;
      const n = [9, 11, 13][Math.max(0, Math.min(i, 2))];
      pluck(sfxBus, { f: sfxHz(n), t: now(), dur: 0.9, vol: SOUND.starVol, parts: BELL });
    },
    lose() {
      if (!sfxOn) return;
      const t = now();
      [4, 2, 0].forEach((n, i) =>
        pluck(sfxBus, { f: sfxHz(n), t: t + i * 0.2, dur: 0.8, vol: SOUND.loseVol, parts: MARIMBA, cut: 1800 }),
      );
    },
    click() {
      if (!sfxOn) return;
      // нейтральный тактильный тик: ≤ 40 мс, шум без тона, без реверба, одинаков во всех темах
      const t = now();
      const n = noise(t, 0.05);
      const bp = c.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.value = SOUND.clickFreq * (0.97 + rand() * 0.06);
      bp.Q.value = 0.9;
      const g = c.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(SOUND.clickVol, t + 0.002);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.03);
      n.connect(bp).connect(g).connect(sfxDry);
    },
  };

  // ---- музыка: у каждой темы свой «голос» (состояние + узел громкости) ----
  const voices = []; // звучащие и затухающие темы (≤ 3)
  let playing = false;
  let timer = null;
  let fadeTimer = null;
  let started = false;
  let rotateAt = Infinity; // время контекста следующей автосмены

  function makeVoice(idx, fadeSec) {
    const cfg = MUSIC.themes[idx];
    const gain = c.createGain();
    const t = c.currentTime;
    gain.gain.setValueAtTime(fadeSec > 0 ? 0 : cfg.vol, t);
    if (fadeSec > 0) gain.gain.linearRampToValueAtTime(cfg.vol, t + fadeSec);
    gain.connect(musicFade);
    const v = {
      idx, cfg, gain, pads: new Set(),
      nextT: t + 0.15, slot: 0, chordIdx: -1, chordCount: 0,
      motif: cfg.melody.motif.slice(),
    };
    voices.push(v);
    return v;
  }

  function killVoice(v) {
    for (const o of [...v.pads]) {
      try {
        o.stop();
      } catch (e) {
        /* уже остановлен */
      }
    }
    v.gain.disconnect();
    const k = voices.indexOf(v);
    if (k >= 0) voices.splice(k, 1);
  }

  function schedulePad(v, chord, t) {
    const { cfg } = v;
    const P = cfg.pad;
    const beatDur = 60 / cfg.bpm;
    const dur = cfg.chordBeats * beatDur + P.release;
    const lp = c.createBiquadFilter();
    lp.type = 'lowpass';
    lp.Q.value = 0.3;
    lp.frequency.setValueAtTime(P.cutoff[0], t);
    lp.frequency.linearRampToValueAtTime(P.cutoff[1], t + dur * 0.6);
    lp.frequency.linearRampToValueAtTime(P.cutoff[0], t + dur);
    lp.connect(v.gain);
    chord.forEach((off, i) => {
      const bass = i === 0;
      const vol = bass ? P.bass : P.vol;
      if (!vol) return;
      const g = c.createGain();
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(vol, t + P.attack);
      g.gain.setValueAtTime(vol, t + dur - P.release);
      g.gain.linearRampToValueAtTime(0, t + dur);
      g.connect(bass ? v.gain : lp);
      for (const det of bass ? [0] : [-6, 6]) {
        const o = c.createOscillator();
        o.type = bass ? 'sine' : P.type;
        o.frequency.value = midiHz(cfg.root + off);
        o.detune.value = det;
        o.connect(g);
        v.pads.add(o);
        o.onended = () => {
          v.pads.delete(o);
          o.disconnect();
        };
        o.start(t);
        o.stop(t + dur + 0.05);
      }
    });
  }

  const rnd = ([a, b]) => a + rand() * (b - a);
  // сессионная усталость 0..1: растёт линейно за fatigue.afterMin минут звучащей музыки
  let sessT0 = 0;
  const fatigueK = () => (playing ? Math.max(0, Math.min(1, (c.currentTime - sessT0) / (MUSIC.fatigue.afterMin * 60))) : 0);

  // мотив узнаваем, но каждый аккорд слегка меняется: мутации, сдвиг начала, регистр
  function varyMotif(v) {
    const M = v.cfg.melody;
    if (v.chordCount % 5 === 1) v.motif = M.motif.slice(); // периодически возврат к исходному
    const m = v.motif;
    if (rand() < M.vary) {
      const k = Math.floor(rand() * m.length);
      if (m[k] !== null) m[k] += rand() < 0.5 ? -1 : 1;
    }
    if (rand() < M.vary * 0.6) {
      const k = Math.floor(rand() * m.length);
      m[k] = m[k] === null ? (rand() < 0.5 ? 0 : 2) : null;
    }
    if (rand() < 0.3) for (let r = 1 + Math.floor(rand() * 3); r > 0; r--) m.push(m.shift());
    v.shift = M.shifts[Math.floor(rand() * M.shifts.length)];
    v.quiet = rand() < M.restChord;
  }

  function stepVoice(v) {
    const { cfg } = v;
    const M = cfg.melody;
    const beatDur = 60 / cfg.bpm;
    const slotDur = M.grid * beatDur;
    const slotsPerChord = Math.round(cfg.chordBeats / M.grid);
    const slotsPerBar = Math.round(4 / M.grid);
    if (v.slot === 0) {
      // конец фразы: пауза тишины (длиннее при усталости), затем новая фраза
      if (v.playEnd === undefined) v.playEnd = v.nextT + rnd(MUSIC.playSec);
      else if (v.nextT >= v.playEnd) {
        v.nextT += rnd(MUSIC.restSec) * (1 + (MUSIC.fatigue.restMul - 1) * fatigueK());
        v.playEnd = v.nextT + rnd(MUSIC.playSec);
        v.chordCount = 0;
        return;
      }
      let k;
      if (cfg.order === 'cycle') k = (v.chordIdx + 1 + (rand() < 0.3 ? 1 : 0)) % cfg.chords.length;
      else
        do k = Math.floor(rand() * cfg.chords.length);
        while (k === v.chordIdx && cfg.chords.length > 1);
      v.chordIdx = k;
      v.chordCount++;
      varyMotif(v);
      schedulePad(v, cfg.chords[k], v.nextT);
    }
    const swing = cfg.drums && v.slot % 2 === 1 ? cfg.drums.swing * slotDur : 0;
    const t = v.nextT + swing;
    const bs = v.slot % slotsPerBar;
    // мелодия
    const m = v.motif[v.slot % v.motif.length];
    if (m !== null && !v.quiet && rand() >= M.skip) {
      const f = midiHz(stepMidi(cfg.root, cfg.scale, M.base + v.shift + m));
      const vol = M.vol * (0.85 + rand() * 0.3);
      const o = { f, t, dur: M.dur, vol, cut: M.cut, attack: M.attack };
      INST[M.inst](v.gain, o);
      if (M.echo && rand() < M.echo) INST[M.inst](v.gain, { ...o, t: t + M.echoBeats * beatDur, vol: vol * 0.35, dur: M.dur * 0.8 });
    }
    // аккорды-«удары» (Rhodes)
    if (cfg.hits && cfg.hits.slots.includes(bs) && rand() < 0.85) {
      const chord = cfg.chords[v.chordIdx];
      chord.slice(1).forEach((off, i) => rhodes(v.gain, { f: midiHz(cfg.root + off), t: t + i * 0.025, dur: 1.6, vol: cfg.hits.vol * (0.9 + rand() * 0.2) }));
    }
    // ударные
    const D = cfg.drums;
    if (D) {
      if (bs === 0 || bs === 5) kick(v.gain, t, D.kick * (bs === 0 ? 1 : 0.75));
      if (D.brush && (bs === 2 || bs === 6)) hiss(v.gain, t, D.brush, 0.18, 1800, 'bandpass');
      if ((bs === 2 || bs === 6) && rand() < 0.6) hiss(v.gain, t, D.hat * (0.8 + rand() * 0.4), 0.06, 6000, 'highpass');
    }
    v.slot = (v.slot + 1) % slotsPerChord;
    v.nextT += slotDur;
  }

  // планируем всё, что попадает до horizon (время контекста)
  function pump(horizon) {
    if (!voices.length) makeVoice(themeIdx, 0);
    for (const v of voices) while (v.nextT < horizon) stepVoice(v);
  }

  function pickOther() {
    const n = MUSIC.themes.length;
    if (n < 2) return themeIdx;
    let k;
    do k = Math.floor(rand() * n);
    while (k === themeIdx);
    return k;
  }

  function resetRotate() {
    rotateAt = c.currentTime + MUSIC.themeMinutes * 60;
  }

  // плавная смена темы: старая затухает, новая нарастает
  function switchTheme(i) {
    const n = MUSIC.themes.length;
    i = ((Math.floor(i) % n) + n) % n;
    if (i === themeIdx) return themeIdx;
    themeIdx = i;
    if (playing) {
      const fade = MUSIC.themeFade;
      const t = c.currentTime;
      for (const v of voices.slice()) {
        if (v.retiring) continue;
        v.retiring = true;
        v.gain.gain.cancelScheduledValues(t);
        v.gain.gain.setValueAtTime(v.gain.gain.value, t);
        v.gain.gain.linearRampToValueAtTime(0, t + fade);
        setTimeout(() => killVoice(v), fade * 1000 + 150);
      }
      while (voices.length > 2) killVoice(voices[0]); // при быстрых сменах не копим
      makeVoice(themeIdx, fade);
    }
    return themeIdx;
  }

  function tick() {
    timer = null;
    if (!playing) return;
    applyMusicGain();
    if (musicVol >= 0.01) {
      if (c.currentTime >= rotateAt) {
        switchTheme(pickOther());
        resetRotate();
      }
      for (const v of voices) {
        // после паузы громкости 0 не догоняем пропущенное
        if (v.nextT < c.currentTime - 0.2) {
          v.nextT = c.currentTime + 0.1;
          v.slot = 0;
        }
      }
      pump(c.currentTime + MUSIC.lookahead);
    } else rotateAt += MUSIC.tickMs / 1000;
    timer = setTimeout(tick, MUSIC.tickMs);
  }

  let musicVol = 1;
  let sfxVol = 1;
  // перцептивная кривая v², усталость плавно снижает громкость
  function applyMusicGain() {
    const g = MUSIC.volume * musicVol * musicVol * (1 - MUSIC.fatigue.volDrop * fatigueK());
    musicBus.gain.setTargetAtTime(g, c.currentTime, 0.07);
  }
  function setSfxVolume(v) {
    sfxVol = Math.max(0, Math.min(1, +v || 0));
    const g = SOUND.volume * sfxVol * sfxVol;
    sfxBus.gain.setTargetAtTime(g, c.currentTime, 0.07);
    sfxDry.gain.setTargetAtTime(g, c.currentTime, 0.07);
  }
  function setMusicVolume(v) {
    musicVol = Math.max(0, Math.min(1, +v || 0));
    applyMusicGain();
  }

  function fadeTo(v, sec) {
    const p = musicFade.gain;
    const t = c.currentTime;
    p.cancelScheduledValues(t);
    p.setValueAtTime(p.value, t);
    p.linearRampToValueAtTime(v, t + sec);
  }

  const music = {
    themes: MUSIC.themes.map(({ id, name }) => ({ id, name })),
    start() {
      if (playing) return;
      playing = true;
      clearTimeout(fadeTimer);
      for (const v of voices.slice()) killVoice(v);
      if (!started) themeIdx = Math.floor(rand() * MUSIC.themes.length); // первый запуск — случайная тема
      started = true;
      makeVoice(themeIdx, 0);
      resetRotate();
      sessT0 = c.currentTime;
      applyMusicGain();
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
        for (const v of voices.slice()) killVoice(v);
      }, MUSIC.fadeOut * 1000 + 100);
    },
    setTheme(i) {
      started = true; // ручной выбор важнее случайного
      const r = switchTheme(i);
      if (playing) resetRotate(); // ручной выбор сбрасывает таймер
      return r;
    },
    theme: () => themeIdx,
    setVolume: setMusicVolume,
    getVolume: () => musicVol,
    cfg: MUSIC,
    pump,
    tick,
    stats: () => ({ pads: voices.reduce((s, v) => s + v.pads.size, 0), voices: voices.length, playing }),
  };

  return { sfx, music, setSfxOn: (v) => (sfxOn = v), setSfxVolume, getSfxVolume: () => sfxVol, master, musicFade, musicBus, sfxBus, sfxDry };
}

// ---- модульный API (его зовёт main.js) ----
let ctx = null;
let engine = null;
let sfxEnabled = true;
let musicEnabled = MUSIC.enabled;
let musicWanted = false;
let pendingTheme = null;
let sfxVolume = 1;
let musicVolume = 1;

function ac() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    try {
      ctx = new AC();
      engine = createEngine(ctx);
      engine.setSfxOn(sfxEnabled);
      if (pendingTheme !== null) engine.music.setTheme(pendingTheme);
      engine.setSfxVolume(sfxVolume);
      engine.music.setVolume(musicVolume);
      loadSamples();
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

// громкость эффектов 0..1 (множитель поверх SOUND.volume, кривая v²)
export function setSfxVolume(v) {
  sfxVolume = Math.max(0, Math.min(1, +v || 0));
  if (engine) engine.setSfxVolume(sfxVolume);
  return sfxVolume;
}
export const getSfxVolume = () => sfxVolume;

export function unlock() {
  ac();
}

// ---- записанные звуки (SAMPLES в config.js) ----
const buffers = {}; // имя → [{ buf, off }]; off — тишина в начале mp3, её пропускаем
function loadSamples() {
  for (const [name, files] of Object.entries(SAMPLES.files)) {
    buffers[name] = [];
    for (const f of files) {
      fetch(SAMPLES.base + f)
        .then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(new Error(f))))
        .then((b) => new Promise((res, rej) => ctx.decodeAudioData(b, res, rej)))
        .then((buf) => {
          const d = buf.getChannelData(0);
          let i = 0;
          while (i < d.length && Math.abs(d[i]) < 0.002) i++;
          buffers[name].push({ buf, off: i / buf.sampleRate });
        })
        .catch(() => {}); // нет файла или формат не поддержан — остаётся синтез
    }
  }
}
let lastPick = {};
// играет записанный звук; false — его нет (ещё грузится), тогда звучит синтез
function playSample(name, rate = 1) {
  const list = buffers[name];
  if (!list || !list.length) return false;
  // чередуем варианты, не повторяя один и тот же подряд
  let k = Math.floor(Math.random() * list.length);
  if (list.length > 1 && k === lastPick[name]) k = (k + 1) % list.length;
  lastPick[name] = k;
  const { buf, off } = list[k];
  const src = ctx.createBufferSource();
  src.buffer = buf;
  src.playbackRate.value = rate;
  const g = ctx.createGain();
  g.gain.value = SAMPLES.vol[name] ?? 0.5;
  src.connect(g).connect(engine.sfxDry);
  src.start(ctx.currentTime, off);
  return true;
}
const sampleArgs = {
  fly: (combo = 0) => {
    const k = Math.min(Math.max(combo, 0), SOUND.comboMax) / SOUND.comboMax;
    return (1 + k * SAMPLES.comboRate) * (1 + (Math.random() * 2 - 1) * SAMPLES.rateJitter);
  },
  star: (i = 0) => SAMPLES.starRates[Math.max(0, Math.min(i, SAMPLES.starRates.length - 1))],
};

const call = (name) =>
  function (...a) {
    if (!sfxEnabled || !ac()) return;
    const rate = sampleArgs[name] ? sampleArgs[name](...a) : 1;
    if (!playSample(name, rate)) engine.sfx[name](...a);
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
  themes: MUSIC.themes.map(({ id, name }) => ({ id, name })),
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
  setTheme(i) {
    if (engine) return engine.music.setTheme(i);
    pendingTheme = i;
    return i;
  },
  theme: () => (engine ? engine.music.theme() : pendingTheme ?? 0),
  // громкость музыки 0..1 (множитель поверх MUSIC.volume, кривая v², плавно ~0.2 с; 0 — генерация на паузе)
  setVolume(v) {
    musicVolume = Math.max(0, Math.min(1, +v || 0));
    if (engine) engine.music.setVolume(musicVolume);
    return musicVolume;
  },
  getVolume: () => musicVolume,
};

// Скрытая вкладка: музыка в паузу (контекст приостанавливается; таймер смены темы идёт по
// времени контекста, поэтому скрытое время не считается), при возврате продолжаем
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
