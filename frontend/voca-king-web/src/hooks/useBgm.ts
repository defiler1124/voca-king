/**
 * 배경음악 훅 (Web Audio API 합성)
 * HTML 원본과 동일한 음악 생성
 */
import { useRef, useCallback, useState, useEffect } from 'react';

// 트랙 정보
const BGM_TRACKS = [
  { name: 'Sunny Day', ko: '맑은 날', emoji: '☀️', bpm: 104, root: 60, scale: [0, 2, 4, 7, 9], chords: [[0, 'M'], [7, 'M'], [9, 'm'], [5, 'M']], mel: 'triangle', pad: 'sine', bass: 'triangle', p: 0.7, drums: 'soft' },
  { name: 'Lullaby', ko: '자장가', emoji: '🌙', bpm: 66, root: 65, scale: [0, 2, 4, 7, 9], chords: [[0, 'M7'], [9, 'm7'], [7, 'M'], [0, 'M']], mel: 'sine', pad: 'sine', bass: 'sine', p: 0.45, drums: null },
  { name: 'Adventure', ko: '모험', emoji: '🚀', bpm: 126, root: 57, scale: [0, 2, 3, 5, 7, 8, 10], chords: [[0, 'm'], [8, 'M'], [3, 'M'], [10, 'M']], mel: 'square', pad: 'sawtooth', bass: 'sawtooth', p: 0.8, drums: 'beat' },
  { name: 'Lo-fi Chill', ko: '로파이', emoji: '🎧', bpm: 78, root: 62, scale: [0, 2, 4, 7, 9], chords: [[0, 'm7'], [5, 'M7'], [10, 'M7'], [3, 'M7']], mel: 'triangle', pad: 'triangle', bass: 'sine', p: 0.55, drums: 'lofi' },
  { name: 'Arcade', ko: '오락실', emoji: '🎮', bpm: 140, root: 60, scale: [0, 2, 4, 5, 7, 9, 11], chords: [[0, 'M'], [9, 'm'], [5, 'M'], [7, 'M']], mel: 'square', pad: 'square', bass: 'square', p: 0.9, drums: 'beat' },
  { name: 'Ocean', ko: '바다', emoji: '🌊', bpm: 58, root: 62, scale: [0, 2, 4, 7, 9], chords: [[0, 'M7'], [7, 'M'], [4, 'm7'], [5, 'M7']], mel: 'sine', pad: 'sine', bass: 'sine', p: 0.4, drums: null },
  { name: 'Calm Focus', ko: '차분한 집중', emoji: '🍃', bpm: 168, root: 62, scale: [0, 2, 4, 7, 9], chords: [[0, 'M7'], [9, 'm7'], [5, 'M7'], [7, 'M']], mel: 'sine', pad: 'sine', bass: 'sine', p: 0.28, drums: null },
  { name: 'Quiet Study', ko: '조용한 공부', emoji: '📖', bpm: 152, root: 60, scale: [0, 2, 4, 7, 9], chords: [[0, 'M'], [5, 'M'], [9, 'm'], [7, 'M']], mel: 'sine', pad: 'sine', bass: 'sine', p: 0.22, drums: null }
];

const BGM_CHORD: Record<string, number[]> = { M: [0, 4, 7], m: [0, 3, 7], M7: [0, 4, 7, 11], m7: [0, 3, 7, 10] };

function mtof(m: number) { return 440 * Math.pow(2, (m - 69) / 12); }
function rng(seed: number) { let a = seed >>> 0; return function () { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

function tone(ctx: AudioContext, dest: AudioNode, t: number, freq: number, dur: number, type: OscillatorType, vol: number, att: number, filt?: number) {
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = type; o.frequency.value = freq;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(vol, t + att);
  g.gain.setValueAtTime(vol, t + Math.max(att, dur * 0.6));
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  let node: AudioNode = o;
  if (filt) { const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = filt; o.connect(f); node = f; }
  node.connect(g); g.connect(dest);
  o.start(t); o.stop(t + dur + 0.05);
}

function noise(ctx: AudioContext, dest: AudioNode, t: number, dur: number, vol: number, hp: number, buf: AudioBuffer) {
  const s = ctx.createBufferSource(); s.buffer = buf;
  const f = ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = hp;
  const g = ctx.createGain();
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  s.connect(f); f.connect(g); g.connect(dest);
  s.start(t); s.stop(t + dur + 0.02);
}

function kick(ctx: AudioContext, dest: AudioNode, t: number, vol: number) {
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = 'sine'; o.frequency.setValueAtTime(130, t); o.frequency.exponentialRampToValueAtTime(45, t + 0.12);
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
  o.connect(g); g.connect(dest); o.start(t); o.stop(t + 0.25);
}

function playBar(ctx: AudioContext, dest: AudioNode, tr: typeof BGM_TRACKS[0], barIdx: number, t0: number, noiseBuf: AudioBuffer, trIdx: number) {
  const beat = 60 / tr.bpm, bar = beat * 4, step = beat / 2;
  const ch = tr.chords[barIdx % tr.chords.length];
  const croot = tr.root + (ch[0] as number) - 12, ivs = BGM_CHORD[ch[1] as string];
  const rand = rng((trIdx + 1) * 1009 + barIdx * 37 + 11);
  // 패드
  ivs.forEach(iv => tone(ctx, dest, t0, mtof(croot + iv), bar * 0.98, tr.pad as OscillatorType, 0.05, 0.25, 1400));
  // 베이스
  [0, 2].forEach(b => tone(ctx, dest, t0 + b * beat, mtof(croot - 12), beat * 1.8, tr.bass as OscillatorType, 0.11, 0.02, 500));
  // 멜로디
  let prev = tr.scale[Math.floor(rand() * tr.scale.length)];
  for (let s = 0; s < 8; s++) {
    if (rand() > tr.p) continue;
    let m;
    if (s % 2 === 0 && rand() < 0.7) m = croot + 12 + ivs[Math.floor(rand() * ivs.length)] + 12 * (rand() < 0.4 ? 1 : 0);
    else {
      const k = tr.scale.indexOf(prev); const d = Math.floor(rand() * 3) - 1;
      const idx = Math.max(0, Math.min(tr.scale.length - 1, (k < 0 ? 0 : k) + d));
      prev = tr.scale[idx]; m = tr.root + 12 + prev;
    }
    const swing = (tr.drums === 'lofi' && s % 2 === 1) ? step * 0.25 : 0;
    tone(ctx, dest, t0 + s * step + swing, mtof(m), step * (tr.mel === 'sine' ? 2.2 : 1.1), tr.mel as OscillatorType, tr.mel === 'square' ? 0.035 : 0.07, 0.01, tr.mel === 'square' ? 2200 : 3200);
  }
  // 드럼
  if (tr.drums) {
    const kv = tr.drums === 'beat' ? 0.22 : 0.14, hv = tr.drums === 'beat' ? 0.05 : 0.03;
    [0, 2].forEach(b => kick(ctx, dest, t0 + b * beat, kv));
    for (let s = 1; s < 8; s += 2) noise(ctx, dest, t0 + s * step, 0.05, hv, 7000, noiseBuf);
    if (tr.drums === 'beat') [1, 3].forEach(b => noise(ctx, dest, t0 + b * beat, 0.12, 0.07, 1800, noiseBuf));
  }
}

interface BgmState {
  ctx: AudioContext | null;
  master: GainNode | null;
  bus: GainNode | null;
  noise: AudioBuffer | null;
  timer: number | null;
  nextT: number;
  bar: number;
  playing: boolean;
  trackIdx: number;
}

export function useBgm() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [trackIndex, setTrackIndex] = useState(0);
  const [volume, setVolume] = useState(0.5);
  const state = useRef<BgmState>({
    ctx: null, master: null, bus: null, noise: null,
    timer: null, nextT: 0, bar: 0, playing: false, trackIdx: 0
  });

  const ensureCtx = useCallback(() => {
    if (state.current.ctx) return true;
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return false;
    try {
      const ctx = new AC();
      const comp = ctx.createDynamicsCompressor();
      const master = ctx.createGain(); master.gain.value = volume * 0.5;
      master.connect(comp); comp.connect(ctx.destination);
      const len = ctx.sampleRate; const buf = ctx.createBuffer(1, len, ctx.sampleRate); const d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      state.current = { ...state.current, ctx, master, noise: buf };
      return true;
    } catch { return false; }
  }, [volume]);

  const tick = useCallback(() => {
    const { ctx, bus, noise, playing, trackIdx } = state.current;
    if (!ctx || !bus || !noise || !playing) return;
    const tr = BGM_TRACKS[trackIdx], barDur = 240 / tr.bpm;
    while (state.current.nextT < ctx.currentTime + 0.8) {
      playBar(ctx, bus, tr, state.current.bar, state.current.nextT, noise, trackIdx);
      state.current.nextT += barDur; state.current.bar++;
    }
  }, []);

  const newBus = useCallback(() => {
    const { ctx, master, bus: oldBus } = state.current;
    if (!ctx || !master) return;
    if (oldBus) {
      try { oldBus.gain.cancelScheduledValues(ctx.currentTime); oldBus.gain.setValueAtTime(oldBus.gain.value, ctx.currentTime); oldBus.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.35); } catch {}
      setTimeout(() => { try { oldBus.disconnect(); } catch {} }, 700);
    }
    const bus = ctx.createGain(); bus.gain.value = 1; bus.connect(master);
    state.current.bus = bus; state.current.bar = 0; state.current.nextT = ctx.currentTime + 0.12;
  }, []);

  const start = useCallback(() => {
    if (!ensureCtx()) return;
    const { ctx, master } = state.current;
    if (!ctx || !master) return;
    try { if (ctx.state === 'suspended') ctx.resume(); } catch {}
    master.gain.value = volume * 0.5;
    newBus();
    state.current.playing = true;
    if (state.current.timer) clearInterval(state.current.timer);
    state.current.timer = window.setInterval(tick, 200);
    tick();
    setIsPlaying(true);
  }, [ensureCtx, newBus, tick, volume]);

  const stop = useCallback(() => {
    const { ctx, bus } = state.current;
    state.current.playing = false;
    if (state.current.timer) { clearInterval(state.current.timer); state.current.timer = null; }
    if (ctx && bus) {
      try { bus.gain.cancelScheduledValues(ctx.currentTime); bus.gain.setValueAtTime(bus.gain.value, ctx.currentTime); bus.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.3); } catch {}
      setTimeout(() => { try { bus.disconnect(); } catch {} }, 600);
      state.current.bus = null;
    }
    setIsPlaying(false);
  }, []);

  const toggle = useCallback(() => { if (state.current.playing) stop(); else start(); }, [start, stop]);

  const changeTrack = useCallback((idx: number) => {
    setTrackIndex(idx);
    state.current.trackIdx = idx;
    if (state.current.playing) { newBus(); }
  }, [newBus]);

  const changeVolume = useCallback((v: number) => {
    setVolume(v);
    if (state.current.master) state.current.master.gain.value = v * 0.5;
  }, []);

  useEffect(() => { return () => { if (state.current.timer) clearInterval(state.current.timer); }; }, []);

  return { isPlaying, trackIndex, volume, tracks: BGM_TRACKS, toggle, start, stop, changeTrack, changeVolume };
}
