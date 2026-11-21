/**
 * 배경음악 훅 (Web Audio API 합성)
 * HTML 원본과 동일한 음악 생성
 *
 * 모바일 대응 (원본 BGM2와 동일): 곡을 미리 WAV로 렌더링해 <audio>로 재생
 * → iOS 무음 스위치·자동재생 제한에 강함. 실패 시 실시간 Web Audio 합성으로 전환
 */
import { useRef, useCallback, useState, useEffect } from 'react';
import { setSpeechDuckHandler } from '../utils/tts';

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

function tone(ctx: BaseAudioContext, dest: AudioNode, t: number, freq: number, dur: number, type: OscillatorType, vol: number, att: number, filt?: number) {
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

function noise(ctx: BaseAudioContext, dest: AudioNode, t: number, dur: number, vol: number, hp: number, buf: AudioBuffer) {
  const s = ctx.createBufferSource(); s.buffer = buf;
  const f = ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = hp;
  const g = ctx.createGain();
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  s.connect(f); f.connect(g); g.connect(dest);
  s.start(t); s.stop(t + dur + 0.02);
}

function kick(ctx: BaseAudioContext, dest: AudioNode, t: number, vol: number) {
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = 'sine'; o.frequency.setValueAtTime(130, t); o.frequency.exponentialRampToValueAtTime(45, t + 0.12);
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
  o.connect(g); g.connect(dest); o.start(t); o.stop(t + 0.25);
}

function playBar(ctx: BaseAudioContext, dest: AudioNode, tr: typeof BGM_TRACKS[0], barIdx: number, t0: number, noiseBuf: AudioBuffer, trIdx: number) {
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

// ── <audio> 재생용 WAV 렌더링 (원본 BGM2) ──
const OfflineAC: typeof OfflineAudioContext | undefined =
  window.OfflineAudioContext || (window as unknown as { webkitOfflineAudioContext?: typeof OfflineAudioContext }).webkitOfflineAudioContext;
const trackUrls: Record<number, string> = {};
const trackBusy: Record<number, Promise<string>> = {};

function toWav(f32: Float32Array, sr: number) {
  const n = f32.length, b = new ArrayBuffer(44 + n * 2), v = new DataView(b);
  const w = (o: number, s: string) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
  w(0, 'RIFF'); v.setUint32(4, 36 + n * 2, true); w(8, 'WAVE'); w(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
  v.setUint32(24, sr, true); v.setUint32(28, sr * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true); w(36, 'data'); v.setUint32(40, n * 2, true);
  for (let i = 0; i < n; i++) { const x = Math.max(-1, Math.min(1, f32[i])); v.setInt16(44 + i * 2, x < 0 ? x * 0x8000 : x * 0x7fff, true); }
  return new Blob([b], { type: 'audio/wav' });
}

function renderTrack(i: number): Promise<string> {
  if (trackUrls[i]) return Promise.resolve(trackUrls[i]);
  if (i in trackBusy) return trackBusy[i];
  const p = new Promise<string>((resolve, reject) => {
    if (!OfflineAC) { reject(new Error('OfflineAudioContext unsupported')); return; }
    const tr = BGM_TRACKS[i], bars = 16, barDur = 240 / tr.bpm, sr = 22050;
    const c = new OfflineAC(1, Math.ceil(sr * bars * barDur), sr);
    const comp = c.createDynamicsCompressor(), master = c.createGain(); master.gain.value = 0.5;
    master.connect(comp); comp.connect(c.destination);
    const nb = c.createBuffer(1, sr, sr), d = nb.getChannelData(0);
    for (let k = 0; k < sr; k++) d[k] = Math.random() * 2 - 1;
    for (let bar = 0; bar < bars; bar++) playBar(c, master, tr, bar, bar * barDur, nb, i);
    const done = (buf: AudioBuffer) => {
      try {
        const f = buf.getChannelData(0), n = f.length, fade = Math.min(n, Math.floor(sr * 0.04));
        for (let k = 0; k < fade; k++) f[n - 1 - k] *= k / fade; // 루프 이음새 클릭 방지
        trackUrls[i] = URL.createObjectURL(toWav(f, sr));
        resolve(trackUrls[i]);
      } catch (e) { reject(e); }
    };
    try {
      const r = c.startRendering();
      if (r && r.then) r.then(done, reject);
      else c.oncomplete = e => done(e.renderedBuffer);
    } catch (e) { reject(e); }
  });
  trackBusy[i] = p;
  p.catch(() => { delete trackBusy[i]; });
  return p;
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

interface AudioElState {
  audio: HTMLAudioElement | null;
  ok: boolean;          // <audio> 모드 사용 중 (false면 Web Audio 합성)
  unlocked: boolean;
  unlocking: boolean;
  want: number;
  rej: number;
  wd: number | null;
  prerendered: boolean;
  ducked: boolean;      // 발음 중 음악 멈춤
  duckT: number | null;
}

export function useBgm() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [trackIndex, setTrackIndex] = useState(0);
  const [volume, setVolume] = useState(0.5);
  const volRef = useRef(0.5);
  const state = useRef<BgmState>({
    ctx: null, master: null, bus: null, noise: null,
    timer: null, nextT: 0, bar: 0, playing: false, trackIdx: 0
  });
  const el = useRef<AudioElState>({
    audio: null, ok: !!OfflineAC && typeof Audio !== 'undefined',
    unlocked: false, unlocking: false, want: 0, rej: 0, wd: null, prerendered: false,
    ducked: false, duckT: null
  });

  // Web Audio 모드 마스터 볼륨 (발음 중이면 30%로 낮춤)
  const webGain = () => volRef.current * 0.5 * (el.current.ducked ? 0.3 : 1);

  const ensureCtx = useCallback(() => {
    if (state.current.ctx) return true;
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return false;
    try {
      const ctx = new AC();
      const comp = ctx.createDynamicsCompressor();
      const master = ctx.createGain(); master.gain.value = webGain();
      master.connect(comp); comp.connect(ctx.destination);
      const len = ctx.sampleRate; const buf = ctx.createBuffer(1, len, ctx.sampleRate); const d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      state.current = { ...state.current, ctx, master, noise: buf };
      return true;
    } catch { return false; }
  }, []);

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

  // 실시간 Web Audio 합성 재생 (데스크톱 / <audio> 실패 시)
  const webStart = useCallback(() => {
    if (!ensureCtx()) return;
    const { ctx, master } = state.current;
    if (!ctx || !master) return;
    try { if (ctx.state !== 'running') ctx.resume().catch(() => {}); } catch {}
    master.gain.value = webGain();
    newBus();
    if (state.current.timer) clearInterval(state.current.timer);
    state.current.timer = window.setInterval(tick, 200);
    tick();
  }, [ensureCtx, newBus, tick]);

  // <audio> 모드 실패 → Web Audio 합성으로 전환
  const fallback = useCallback(() => {
    const s = el.current;
    if (!s.ok) return;
    s.ok = false;
    if (s.wd) { clearTimeout(s.wd); s.wd = null; }
    try { s.audio?.pause(); } catch {}
    state.current.trackIdx = s.want;
    if (state.current.playing) webStart();
  }, [webStart]);

  const playEl = useCallback((i: number) => {
    const s = el.current;
    s.want = i;
    const a = s.audio;
    if (!a) return;
    renderTrack(i).then(url => {
      if (!s.ok || s.want !== i || !state.current.playing) return;
      if (a.dataset.track === String(i) && !a.paused) return;
      a.dataset.track = String(i); a.src = url; a.loop = true; a.volume = volRef.current;
      if (s.ducked) return; // 발음이 끝나면 duck(false)에서 재생
      a.play().catch(() => { s.unlocked = false; if (++s.rej >= 2) fallback(); });
      // 재생이 실제로 진행되지 않으면 Web Audio로 전환
      if (s.wd) clearTimeout(s.wd);
      s.wd = window.setTimeout(() => {
        if (s.ok && s.want === i && state.current.playing && !document.hidden && !a.paused && a.currentTime < 0.3) fallback();
      }, 4500);
      // 나머지 곡은 천천히 미리 렌더링 (Day/Level 변경 시 즉시 전환)
      if (!s.prerendered) {
        s.prerendered = true;
        BGM_TRACKS.forEach((_, k) => { if (k !== i) setTimeout(() => { renderTrack(k).catch(() => {}); }, 3000 + k * 1500); });
      }
    }).catch(() => fallback());
  }, [fallback]);

  // 사용자 터치/클릭 안에서 호출되어야 함 (모바일 자동재생 제한)
  const unlockEl = useCallback(() => {
    const s = el.current;
    if (s.unlocking) return;
    if (!s.audio) {
      const a = new Audio();
      a.preload = 'auto';
      a.setAttribute('playsinline', '');
      a.onerror = () => { if (a.dataset.track) fallback(); };
      s.audio = a;
    }
    const a = s.audio;
    if (!a.src) a.src = URL.createObjectURL(toWav(new Float32Array(2205), 22050)); // 0.1초 무음
    s.unlocking = true;
    a.play().then(() => {
      s.unlocking = false; s.unlocked = true;
      playEl(s.want);
    }).catch(() => {
      s.unlocking = false;
      if (++s.rej >= 2) fallback();
    });
  }, [fallback, playEl]);

  const start = useCallback(() => {
    state.current.playing = true;
    setIsPlaying(true);
    const s = el.current;
    if (s.ok) {
      s.want = state.current.trackIdx;
      if (!s.unlocked) unlockEl(); else playEl(s.want);
      return;
    }
    webStart();
  }, [unlockEl, playEl, webStart]);

  const stop = useCallback(() => {
    const { ctx, bus } = state.current;
    state.current.playing = false;
    const s = el.current;
    if (s.wd) { clearTimeout(s.wd); s.wd = null; }
    try { s.audio?.pause(); } catch {}
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
    const s = el.current;
    if (s.ok) {
      s.want = idx;
      if (state.current.playing) { if (s.unlocked) playEl(idx); else unlockEl(); }
    } else if (state.current.playing) {
      try { if (state.current.ctx && state.current.ctx.state !== 'running') state.current.ctx.resume().catch(() => {}); } catch {}
      newBus();
    }
  }, [newBus, playEl, unlockEl]);

  const changeVolume = useCallback((v: number) => {
    setVolume(v);
    volRef.current = v;
    if (el.current.audio) el.current.audio.volume = v;
    if (state.current.master) state.current.master.gain.value = webGain();
  }, []);

  // 발음(TTS) 중 음악 멈춤 (원본 bgmDuck)
  // 모바일은 음악이 재생 중이면 발음이 안 나오는 경우가 있어서, 발음 동안 음악을 잠깐 멈춤
  const duck = useCallback((on: boolean) => {
    const s = el.current;
    s.ducked = on;
    if (s.duckT) { clearTimeout(s.duckT); s.duckT = null; }
    const resume = () => {
      const a = s.audio;
      if (a && s.ok && s.unlocked && !s.ducked && state.current.playing && !document.hidden && a.dataset.track) {
        a.volume = volRef.current;
        a.play().catch(() => {});
      }
    };
    if (s.ok && s.audio && s.unlocked) {
      if (on) {
        try { s.audio.pause(); } catch {}
        s.duckT = window.setTimeout(() => { s.ducked = false; resume(); }, 5000); // 종료 이벤트 누락 대비
      } else {
        s.duckT = window.setTimeout(resume, 250);
      }
    }
    const { ctx, master } = state.current;
    if (ctx && master) { try { master.gain.setTargetAtTime(webGain(), ctx.currentTime, 0.05); } catch {} }
  }, []);

  useEffect(() => {
    setSpeechDuckHandler(duck);
    return () => setSpeechDuckHandler(null);
  }, [duck]);

  // 모바일: 탭할 때마다 멈춘 음악 복구 (iOS 오디오 중단, 잠금 실패 등)
  useEffect(() => {
    const recover = () => {
      if (!state.current.playing) return;
      const s = el.current;
      if (s.ok) {
        if (!s.unlocked) unlockEl();
        else if (s.audio && s.audio.paused && !s.ducked && !document.hidden) s.audio.play().catch(() => {});
      } else {
        const ctx = state.current.ctx;
        try { if (ctx && ctx.state !== 'running') ctx.resume().catch(() => {}); } catch {}
      }
    };
    const onVisibility = () => {
      const s = el.current, ctx = state.current.ctx;
      try {
        if (document.hidden) {
          s.audio?.pause();
          ctx?.suspend().catch(() => {});
        } else if (state.current.playing) {
          if (s.ok && s.unlocked && !s.ducked) s.audio?.play().catch(() => {});
          if (!s.ok) ctx?.resume().catch(() => {});
        }
      } catch {}
    };
    document.addEventListener('click', recover, true);
    document.addEventListener('touchend', recover, true);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      document.removeEventListener('click', recover, true);
      document.removeEventListener('touchend', recover, true);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [unlockEl]);

  useEffect(() => {
    const s = state.current, e = el.current;
    return () => {
      if (s.timer) clearInterval(s.timer);
      if (e.wd) clearTimeout(e.wd);
      if (e.duckT) clearTimeout(e.duckT);
      try { e.audio?.pause(); } catch {}
    };
  }, []);

  return { isPlaying, trackIndex, volume, tracks: BGM_TRACKS, toggle, start, stop, changeTrack, changeVolume };
}
