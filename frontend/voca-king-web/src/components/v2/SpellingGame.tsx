/**
 * 스펠링 연습 게임 (Stage 4)
 * 1단계: 보고 3번 따라쓰기 + 기억해서 1번
 * 2단계: 글자 블록 맞추기
 *
 * 애니메이션: keyFly, popBurst, combo, praise, perfect
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { speak } from '../../utils/tts';
import { useProgressStore } from '../../stores/progressStore';
import type { Word } from '../../types';
import './SpellingGame.css';

interface Props {
  words: Word[];
  allWords: Word[];
  dayId: number;
  onFinish: (score: number, total: number) => void;
  onBack: () => void;
  onFinalTest?: () => void;
}

// 알파벳 발음 매핑
const ABC: Record<string, string> = {
  a:'A', b:'bee', c:'see', d:'dee', e:'ee', f:'ef', g:'jee',
  h:'aitch', i:'eye', j:'jay', k:'kay', l:'el', m:'em', n:'en',
  o:'oh', p:'pee', q:'cue', r:'are', s:'ess', t:'tee', u:'you',
  v:'vee', w:'double you', x:'ex', y:'why', z:'zee'
};

interface SpellWord {
  w: string;
  ko: string;
  pair: Word;
  chars: { ch: string; slot: boolean }[];
  L: string[];
  low: string[];
}

function createSpellWord(word: Word): SpellWord {
  const chars = [...word.english].map(ch => ({
    ch,
    slot: /[a-zA-Z]/.test(ch)
  }));
  const L = chars.filter(c => c.slot).map(c => c.ch);
  return {
    w: word.english,
    ko: word.korean,
    pair: word,
    chars,
    L,
    low: L.map(c => c.toLowerCase())
  };
}

function shuffleArray<T>(array: T[]): T[] {
  const a = [...array];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ===== Audio =====
let audioCtx: AudioContext | null = null;
function getAudioCtx() {
  if (!audioCtx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AC) audioCtx = new AC();
  }
  if (audioCtx?.state === 'suspended') audioCtx.resume();
  return audioCtx;
}

function sxTone(ctx: AudioContext, time: number, freq: number, dur: number, type: OscillatorType, vol: number) {
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, time);
  g.gain.setValueAtTime(vol, time);
  g.gain.exponentialRampToValueAtTime(0.001, time + dur);
  o.connect(g);
  g.connect(ctx.destination);
  o.start(time);
  o.stop(time + dur);
}

function sfxWhoosh() {
  const c = getAudioCtx();
  if (!c) return;
  const t = c.currentTime;
  const o = c.createOscillator(), g = c.createGain();
  o.type = 'sine';
  o.frequency.setValueAtTime(500, t);
  o.frequency.exponentialRampToValueAtTime(1500, t + 0.22);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.09, t + 0.05);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.24);
  o.connect(g); g.connect(c.destination);
  o.start(t); o.stop(t + 0.26);
}

function sfxPopKey(n: number = 0) {
  const c = getAudioCtx();
  if (!c) return;
  const t = c.currentTime;
  const up = Math.min(n, 8) * 0.06;
  [880, 1320].forEach((f, i) => sxTone(c, t + 0.02 + i * 0.05, f * (1 + up), 0.12, 'triangle', 0.16));
}

function sfxGood() {
  const c = getAudioCtx();
  if (!c) return;
  const t = c.currentTime;
  [784, 1175].forEach((f, i) => sxTone(c, t + i * 0.07, f, 0.16, 'triangle', 0.22));
  sxTone(c, t + 0.14, 1568, 0.18, 'sine', 0.1);
}

function sfxBad() {
  const c = getAudioCtx();
  if (!c) return;
  const t = c.currentTime;
  sxTone(c, t, 220, 0.16, 'square', 0.13);
  sxTone(c, t + 0.18, 165, 0.28, 'square', 0.13);
}

function sfxCombo(n: number) {
  const c = getAudioCtx();
  if (!c) return;
  const t = c.currentTime;
  const base = [523, 659, 784, 1047, 1319, 1568, 2093];
  const up = Math.min(n, 8) * 0.06;
  base.slice(0, 4 + Math.min(3, Math.floor(n / 3))).forEach((f, i) => {
    sxTone(c, t + i * 0.06, f * (1 + up), 0.2, 'triangle', 0.2);
    sxTone(c, t + i * 0.06, f * 2 * (1 + up), 0.12, 'sine', 0.05);
  });
  if (n >= 5) sxTone(c, t + 0.45, 2637, 0.4, 'sine', 0.1);
}

function sfxYay(lv: number) {
  const c = getAudioCtx();
  if (!c) return;
  const t = c.currentTime;
  const notes = lv >= 2 ? [659, 784, 1047, 1319, 1568, 2093] : [784, 1047, 1319, 1568];
  notes.forEach((f, i) => {
    sxTone(c, t + i * 0.065, f, 0.22, 'triangle', 0.2);
    sxTone(c, t + i * 0.065, f * 2, 0.14, 'sine', 0.05);
  });
  const end = t + notes.length * 0.065;
  [0, 1, 2, 3, 4, 5].slice(0, lv >= 2 ? 6 : 3).forEach(i => sxTone(c, end + i * 0.05, 2400 + Math.random() * 1800, 0.1, 'sine', 0.06));
}

function sfxFanfare() {
  const c = getAudioCtx();
  if (!c) return;
  const t = c.currentTime;
  const mel: [number, number, number][] = [
    [523, 0, 0.14], [659, 0.14, 0.14], [784, 0.28, 0.14],
    [1047, 0.42, 0.3], [784, 0.78, 0.12], [1047, 0.92, 0.5],
    [1319, 1.5, 0.18], [1568, 1.7, 0.18], [2093, 1.9, 0.7]
  ];
  mel.forEach(([f, d, l]) => {
    sxTone(c, t + d, f, l + 0.1, 'triangle', 0.22);
    sxTone(c, t + d, f / 2, l + 0.1, 'sine', 0.1);
  });
  [[523, 659, 784], [659, 784, 1047]].forEach((ch, k) => ch.forEach(f => sxTone(c, t + 0.42 + k * 0.5, f, 0.45, 'sine', 0.06)));
  for (let k = 0; k < 10; k++) sxTone(c, t + 1.9 + k * 0.07, 2000 + Math.random() * 2400, 0.12, 'sine', 0.05);
}

function buzz(ms: number) {
  try { navigator.vibrate && navigator.vibrate(ms); } catch (e) { /* ignore */ }
}

// ===== 메시지 =====
const PRAISE1 = ['Great! 🎉', 'Good job! 👍', 'Nice! ✨', 'Yay! 🥳', 'Super! 🌟', 'Awesome! 💫', 'Cool! 😎', 'Well done! 💛'];
const PRAISE2 = ['Amazing! 🤩', 'Perfect! 💯', '기억력 대장! 🧠', '스펠링 마법사! 🪄', '최고 중의 최고! 🏆', '스펠링 킹! 👑', '박수 짝짝짝! 👏', '머릿속에 쏙! 💡', '너무 자랑스러워! 🥹', '우와, 완벽해! 🌈'];
const COMBO_MSG1 = ['🔥 신난다!', '💪 계속 가 보자!', '✨ 점점 빨라져!', '🎵 리듬 탔어!'];
const COMBO_MSG2 = ['⚡ 눈부신 실력!', '🚀 하늘까지 날아올라!', '🌟 멈출 수가 없어!'];
const COMBO_MSG3 = ['🌈 스펠링 왕 탄생!', '👑 전설이 되는 중!', '🦄 아무도 못 말려!'];

type GamePhase = 'intro' | 'stage1-intro' | 'type' | 'stage2-intro' | 'build' | 'retry-intro' | 'result';

// ===== 애니메이션 헬퍼 =====
function createKeyFly(
  startRect: DOMRect,
  endRect: DOMRect,
  char: string,
  onLand: () => void
) {
  const fly = document.createElement('div');
  fly.className = 'key-fly';
  fly.textContent = char.toLowerCase();
  fly.style.cssText = `left:${startRect.left}px;top:${startRect.top}px;width:${startRect.width}px;height:${startRect.height}px`;
  document.body.appendChild(fly);

  const dx = endRect.left + endRect.width / 2 - (startRect.left + startRect.width / 2);
  const dy = endRect.top + endRect.height / 2 - (startRect.top + startRect.height / 2);
  const lift = Math.min(-60, dy * 0.35 - 40);
  const spin = (Math.random() < 0.5 ? -1 : 1) * 200;

  sfxWhoosh();

  const anim = fly.animate([
    { transform: 'translate(0,0) scale(1) rotate(0deg)' },
    { transform: `translate(${dx * 0.5}px,${dy * 0.5 + lift}px) scale(1.35) rotate(${spin / 2}deg)`, offset: 0.55 },
    { transform: `translate(${dx}px,${dy}px) scale(0.9) rotate(${spin}deg)` }
  ], { duration: 330, easing: 'cubic-bezier(.3,.6,.4,1)' });

  let done = false;
  const boom = () => {
    if (done) return;
    done = true;
    onLand();
    fly.classList.add('boom');
    fly.animate([
      { transform: `translate(${dx}px,${dy}px) scale(0.9)`, opacity: 1 },
      { transform: `translate(${dx}px,${dy}px) scale(3.2)`, opacity: 0.9, offset: 0.55 },
      { transform: `translate(${dx}px,${dy}px) scale(5)`, opacity: 0 }
    ], { duration: 340, easing: 'ease-out' }).onfinish = () => fly.remove();
    setTimeout(() => fly.remove(), 600);
  };

  anim.onfinish = boom;
  setTimeout(boom, 700);
}

function createPopBurst(cx: number, cy: number) {
  const cols = ['#ff5fa2', '#ffcf3f', '#57d16b', '#4fb3ff', '#a77bff', '#ff8a3d'];
  const shapes = ['★', '✦', '●', '♥'];

  // Ring
  const ring = document.createElement('div');
  ring.className = 'pop-ring';
  ring.style.cssText = `left:${cx}px;top:${cy}px`;
  document.body.appendChild(ring);
  setTimeout(() => ring.remove(), 500);

  // Particles
  for (let i = 0; i < 12; i++) {
    const p = document.createElement('div');
    const ang = (i / 12) * Math.PI * 2 + Math.random() * 0.4;
    const d = 90 + Math.random() * 70;
    p.className = 'pop-bit';
    p.textContent = shapes[i % shapes.length];
    p.style.cssText = `left:${cx}px;top:${cy}px;color:${cols[i % cols.length]};font-size:${18 + Math.random() * 14}px`;
    document.body.appendChild(p);

    p.animate([
      { transform: 'translate(-50%,-50%) scale(0.4)', opacity: 1 },
      { transform: `translate(calc(-50% + ${Math.cos(ang) * d}px), calc(-50% + ${Math.sin(ang) * d}px)) scale(1.1) rotate(${Math.random() * 360}deg)`, opacity: 0 }
    ], { duration: 520 + Math.random() * 200, easing: 'cubic-bezier(.2,.8,.3,1)' }).onfinish = () => p.remove();
  }
}

function createConfetti(n: number, container: HTMLElement) {
  const cols = ['#ff5c7a', '#ffd54a', '#36c26a', '#4f8bff', '#b065ff', '#ff9f43'];
  for (let i = 0; i < n; i++) {
    const c = document.createElement('i');
    c.className = 'conf-bit';
    c.style.cssText = `left:${Math.random() * 100}%;background:${pick(cols)};animation-duration:${1.6 + Math.random() * 1.6}s;animation-delay:${Math.random() * 0.4}s`;
    container.appendChild(c);
  }
}

export default function SpellingGame({ words, dayId, onFinish, onBack, onFinalTest }: Props) {
  const { saveProgress } = useProgressStore();
  const gameRef = useRef<HTMLDivElement>(null);
  const slotsRef = useRef<HTMLDivElement>(null);

  // 게임 상태
  const [phase, setPhase] = useState<GamePhase>('stage1-intro');
  const [round, setRound] = useState<SpellWord[]>([]);
  const [wordIdx, setWordIdx] = useState(0);
  const [rep, setRep] = useState(0);
  const [tpos, setTpos] = useState(0);
  const [buildPos, setBuildPos] = useState(0);
  const [filledSlots, setFilledSlots] = useState<string[]>([]);
  const [tiles, setTiles] = useState<{ ch: string; used: boolean }[]>([]);
  const [slotPop, setSlotPop] = useState<number | null>(null);

  // 통계
  const [miss, setMiss] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestCombo, setBestCombo] = useState(0);
  const [badWords, setBadWords] = useState<Set<string>>(new Set());
  const [roundNo, setRoundNo] = useState(1);
  const [tMiss, setTMiss] = useState(0);
  const [repBad, setRepBad] = useState(false);
  const [comboBad, setComboBad] = useState(false);  // 1단계 전체에서 실수 여부
  const [buildBad, setBuildBad] = useState(false);
  const [slotMiss, setSlotMiss] = useState(0);

  // UI 상태
  const [locked, setLocked] = useState(false);
  const [showCombo, setShowCombo] = useState<{ n: number; msg: string; tier: number } | null>(null);
  const [showPraise, setShowPraise] = useState<{ text: string; lv: number } | null>(null);
  const [badKey, setBadKey] = useState<string | null>(null);
  const [hintIdx, setHintIdx] = useState<number | null>(null);
  const [peekIdx, setPeekIdx] = useState<number | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [confettiCount, setConfettiCount] = useState(50);
  const [perfect, setPerfect] = useState(false);
  const [slotsDone, setSlotsDone] = useState(false);

  const currentWord = round[wordIdx];
  const isQuizRep = rep === 3;

  // 게임 시작
  useEffect(() => {
    const shuffled = shuffleArray(words).map(createSpellWord);
    setRound(shuffled);
  }, [words]);

  // 글자 발음
  const sayLetters = useCallback((text: string) => {
    const pronunciation = text.toLowerCase().split('').map(ch => ABC[ch] || ch).join(', ');
    speak(pronunciation);
  }, []);

  // 슬롯 팝 애니메이션 리셋
  useEffect(() => {
    if (slotPop !== null) {
      const timer = setTimeout(() => setSlotPop(null), 400);
      return () => clearTimeout(timer);
    }
  }, [slotPop]);

  // 1단계 시작
  const startStage1 = useCallback(() => {
    setPhase('type');
    setWordIdx(0);
    setRep(0);
    setTpos(0);
    setFilledSlots([]);
    setTMiss(0);
    setRepBad(false);
    setComboBad(false);  // comboBad 초기화
    setPeekIdx(null);
    setSlotsDone(false);
    setLocked(false);  // locked 해제
    if (round[0]) {
      setTimeout(() => speak(round[0].w), 600);  // 시작 시 단어 발음
    }
  }, [round]);

  // 2단계 시작
  const startStage2 = useCallback(() => {
    setPhase('build');
    setWordIdx(0);
    setBuildPos(0);
    setFilledSlots([]);
    setBuildBad(false);
    setHintIdx(null);
    setSlotMiss(0);
    setSlotsDone(false);
    setLocked(false);  // 중요: locked 해제
    setStreak(0);      // 콤보 초기화 (2단계부터 새로 시작)
    if (round[0]) {
      const abc = 'abcdefghijklmnopqrstuvwxyz'.split('').filter(c => !round[0].low.includes(c));
      const tileChars = shuffleArray([...round[0].low, ...shuffleArray(abc).slice(0, 2)]);
      setTiles(tileChars.map(ch => ({ ch, used: false })));
      setTimeout(() => speak(round[0].w), 600);  // 시작 시 단어 발음
    }
  }, [round]);

  // 단어 완성 축하 - 원본처럼 항상 칭찬 + 콘페티
  const wordCelebrate = useCallback((lv: number) => {
    sfxYay(lv);

    if (slotsRef.current) {
      const rect = slotsRef.current.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;

      // 칭찬 메시지 (슬롯 위에 표시)
      const praiseText = pick(lv >= 2 ? PRAISE2 : PRAISE1);
      const praise = document.createElement('div');
      praise.className = `wc-praise lv-${lv}`;
      praise.textContent = praiseText;
      praise.style.cssText = `left:${cx}px;top:${cy - 80}px`;
      document.body.appendChild(praise);
      setTimeout(() => praise.remove(), 1500);

      // 링 버스트 효과
      const ring1 = document.createElement('div');
      ring1.className = 'wc-ring';
      ring1.style.cssText = `left:${cx}px;top:${cy}px`;
      document.body.appendChild(ring1);
      setTimeout(() => ring1.remove(), 800);

      const ring2 = document.createElement('div');
      ring2.className = 'wc-ring r2';
      ring2.style.cssText = `left:${cx}px;top:${cy}px`;
      document.body.appendChild(ring2);
      setTimeout(() => ring2.remove(), 920);

      // 이모지 파티클
      const em = lv >= 2 ? ['🌟', '💖', '🎉', '👑', '🌈', '💎', '🍭'] : ['⭐', '✨', '💛', '🎈', '💗'];
      const pCount = lv >= 2 ? 22 : 12;
      for (let i = 0; i < pCount; i++) {
        const p = document.createElement('span');
        p.className = 'wc-p';
        p.textContent = pick(em);
        const a = Math.PI * 2 * i / pCount + Math.random() * 0.3;
        const d = (lv >= 2 ? 130 : 90) + Math.random() * 60;
        p.style.cssText = `left:${cx}px;top:${cy}px;font-size:${18 + Math.random() * 16}px;--dx:${Math.cos(a) * d}px;--dy:${Math.sin(a) * d}px`;
        document.body.appendChild(p);
        setTimeout(() => p.remove(), 1100);
      }
    }

    // 콘페티 항상 표시 (원본: lv1=22개, lv2=70개)
    setShowConfetti(true);
    setConfettiCount(lv >= 2 ? 70 : 22);
    setTimeout(() => setShowConfetti(false), 1800);
  }, []);

  // 콤보 효과
  const triggerCombo = useCallback((n: number) => {
    const tier = n >= 8 ? 3 : n >= 5 ? 2 : 1;
    const msg = tier === 3 ? pick(COMBO_MSG3) : tier === 2 ? pick(COMBO_MSG2) : pick(COMBO_MSG1);
    setShowCombo({ n, msg, tier });
    sfxCombo(n);

    if (tier >= 2) {
      setShowConfetti(true);
      setConfettiCount(30 * tier);
      setTimeout(() => setShowConfetti(false), 1800);
    }

    setTimeout(() => setShowCombo(null), 1600);
  }, []);

  // 타이핑 키 입력
  const handleTypeKey = useCallback((key: string, btnElement?: HTMLButtonElement) => {
    if (locked || phase !== 'type' || !currentWord) return;

    const want = currentWord.low[tpos];
    if (key === want) {
      const newFilled = [...filledSlots, currentWord.L[tpos]];
      setFilledSlots(newFilled);
      setTMiss(0);

      // 슬롯 요소 찾기
      const slots = slotsRef.current?.querySelectorAll('.sp-slot');
      const targetSlot = slots?.[tpos];

      if (btnElement && targetSlot) {
        const startRect = btnElement.getBoundingClientRect();
        const endRect = targetSlot.getBoundingClientRect();

        createKeyFly(startRect, endRect, currentWord.L[tpos], () => {
          setSlotPop(tpos);
          sfxPopKey(tpos);
          const rect = targetSlot.getBoundingClientRect();
          createPopBurst(rect.left + rect.width / 2, rect.top + rect.height / 2);
        });
      } else {
        setSlotPop(tpos);
        sfxPopKey(tpos);
      }

      if (tpos < currentWord.L.length - 1) {
        setTpos(tpos + 1);
        setTimeout(() => sayLetters(key), 160);
        return;
      }

      // 단어 완성
      setLocked(true);
      setSlotsDone(true);

      setTimeout(() => {
        sayLetters(key);
        setTimeout(() => speak(currentWord.w), 700);  // 글자 발음 후 단어 발음까지 텀
      }, 300);

      if (isQuizRep) {
        // 원본: repBad와 comboBad 둘 다 없어야 lv2
        const isClean = !repBad && !comboBad;
        if (isClean) {
          setStreak(s => {
            const newStreak = s + 1;
            setBestCombo(b => Math.max(b, newStreak));
            if (newStreak >= 2) {
              setTimeout(() => triggerCombo(newStreak), 300);
            }
            return newStreak;
          });
          setTimeout(() => wordCelebrate(2), 350);
        } else {
          setStreak(0);
          setTimeout(() => wordCelebrate(1), 350);
        }

        // 콤보면 1700ms, 아니면 900ms (원본 타이밍)
        const waitTime = isClean && streak >= 1 ? 1700 : 900;
        setTimeout(() => {
          if (wordIdx < round.length - 1) {
            setWordIdx(wordIdx + 1);
            setRep(0);
            setTpos(0);
            setFilledSlots([]);
            setRepBad(false);
            setComboBad(false);  // 다음 단어로 이동 시 초기화
            setPeekIdx(null);
            setSlotsDone(false);
            setLocked(false);
            setTimeout(() => speak(round[wordIdx + 1].w), 800);  // 다음 단어 발음 간격 늘림
          } else {
            setPhase('stage2-intro');
          }
        }, waitTime + 1200);  // 전환 시간 늘림
      } else {
        // 1,2,3번 반복에서도 칭찬 효과 (원본과 동일)
        setTimeout(() => wordCelebrate(1), 350);

        setTimeout(() => {
          setRep(rep + 1);
          setTpos(0);
          setFilledSlots([]);
          setSlotsDone(false);
          setLocked(false);
          // 단어는 위에서 이미 읽었으므로 여기서 다시 읽지 않음
        }, 900);
      }
    } else {
      sfxBad();
      buzz(80);
      setStreak(0);
      setComboBad(true);  // 1단계 어디서든 실수하면 comboBad
      setBadKey(key);
      setTimeout(() => setBadKey(null), 400);
      setTMiss(t => t + 1);

      if (isQuizRep) {
        setMiss(m => m + 1);
        setRepBad(true);
        setBadWords(prev => new Set(prev).add(currentWord.w));
        if (tMiss >= 1) {
          setPeekIdx(tpos);
        }
      }
    }
  }, [locked, phase, currentWord, tpos, filledSlots, isQuizRep, repBad, comboBad, streak, wordIdx, round, tMiss, rep, sayLetters, triggerCombo, wordCelebrate]);

  // 블록 탭
  const handleTileTap = useCallback((idx: number, btnElement?: HTMLButtonElement) => {
    if (locked || phase !== 'build' || !currentWord) return;

    const tile = tiles[idx];
    if (tile.used) return;

    const want = currentWord.low[buildPos];
    if (tile.ch === want) {
      const newTiles = [...tiles];
      newTiles[idx].used = true;
      setTiles(newTiles);
      setFilledSlots([...filledSlots, currentWord.L[buildPos]]);
      setHintIdx(null);
      setSlotMiss(0);

      // 슬롯 요소 찾기
      const slots = slotsRef.current?.querySelectorAll('.sp-slot');
      const targetSlot = slots?.[buildPos];

      if (btnElement && targetSlot) {
        const startRect = btnElement.getBoundingClientRect();
        const endRect = targetSlot.getBoundingClientRect();

        createKeyFly(startRect, endRect, currentWord.L[buildPos], () => {
          setSlotPop(buildPos);
          sfxPopKey(buildPos);
          const rect = targetSlot.getBoundingClientRect();
          createPopBurst(rect.left + rect.width / 2, rect.top + rect.height / 2);
        });
      } else {
        sfxGood();
        setSlotPop(buildPos);
      }

      if (buildPos < currentWord.L.length - 1) {
        setBuildPos(buildPos + 1);
        setTimeout(() => sayLetters(tile.ch), 180);
        return;
      }

      // 단어 완성
      setLocked(true);
      setSlotsDone(true);
      const isClean = !buildBad;

      setTimeout(() => {
        sayLetters(tile.ch);
        setTimeout(() => speak(currentWord.w), 700);  // 글자 발음 후 단어 발음까지 텀
      }, 300);

      // 콤보 처리
      if (isClean) {
        setStreak(s => {
          const newStreak = s + 1;
          setBestCombo(b => Math.max(b, newStreak));
          if (newStreak >= 2) {
            setTimeout(() => triggerCombo(newStreak), 300);
          }
          return newStreak;
        });
        setTimeout(() => wordCelebrate(2), 350);
      } else {
        setStreak(0);
        setTimeout(() => wordCelebrate(1), 350);
      }

      // 콤보면 1700ms, 아니면 1200ms (다음 단어 발음 간격 확보)
      const waitTime = isClean && streak >= 1 ? 1700 : 1200;
      setTimeout(() => {
        if (wordIdx < round.length - 1) {
          const nextWord = round[wordIdx + 1];
          setWordIdx(wordIdx + 1);
          setBuildPos(0);
          setFilledSlots([]);
          setBuildBad(false);
          setHintIdx(null);
          setSlotMiss(0);
          setSlotsDone(false);
          const abc = 'abcdefghijklmnopqrstuvwxyz'.split('').filter(c => !nextWord.low.includes(c));
          const tileChars = shuffleArray([...nextWord.low, ...shuffleArray(abc).slice(0, 2)]);
          setTiles(tileChars.map(ch => ({ ch, used: false })));
          setLocked(false);
          setTimeout(() => speak(nextWord.w), 800);  // 다음 단어 발음 간격 늘림
        } else {
          endRound();
        }
      }, waitTime);
    } else {
      sfxBad();
      buzz(80);
      // 틀린 글자 발음 (원본과 동일)
      setTimeout(() => sayLetters(tile.ch), 450);
      setMiss(m => m + 1);
      setBuildBad(true);
      setBadWords(prev => new Set(prev).add(currentWord.w));
      setStreak(0);
      setBadKey(tile.ch);
      setTimeout(() => setBadKey(null), 400);
      setSlotMiss(s => s + 1);

      if (slotMiss >= 1) {
        const hintTileIdx = tiles.findIndex(t => !t.used && t.ch === want);
        if (hintTileIdx !== -1) setHintIdx(hintTileIdx);
      }
    }
  }, [locked, phase, currentWord, tiles, buildPos, filledSlots, buildBad, streak, wordIdx, round, sayLetters, slotMiss, triggerCombo, wordCelebrate]);

  // 라운드 종료
  const endRound = useCallback(() => {
    const badList = round.filter(w => badWords.has(w.w));

    if (badList.length === 0) {
      if (miss === 0) {
        // PERFECT! 효과 (원본과 동일)
        setPerfect(true);
        sfxFanfare();
        // 콘페티 3회 (원본: 0ms, 900ms, 1800ms에 각 120개)
        setShowConfetti(true);
        setConfettiCount(120);
        setTimeout(() => { setShowConfetti(true); setConfettiCount(120); }, 900);
        setTimeout(() => { setShowConfetti(true); setConfettiCount(100); }, 1800);
        setTimeout(() => {
          setPerfect(false);
          setShowConfetti(false);
          finishGame();
        }, 3700);
      } else {
        // 실수 있으면 바로 결과
        sfxYay(1);
        finishGame();
      }
    } else {
      setRoundNo(r => r + 1);
      setRound(shuffleArray(badList));
      setBadWords(new Set());
      setPhase('retry-intro');
    }
  }, [round, badWords, miss]);

  // 게임 완료
  const finishGame = useCallback(() => {
    const score = words.length;
    const total = words.length;
    const stars = miss === 0 ? 3 : miss <= 2 ? 2 : 1;

    saveProgress({
      dayId,
      gameType: 'LISTEN',
      score,
      totalWords: total,
      stars,
      clearTime: 0,
    }).catch(e => console.error('Failed to save spelling progress', e));

    setPhase('result');
  }, [words.length, miss, dayId, saveProgress]);

  // 키보드 이벤트
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (phase === 'type' && /^[a-z]$/i.test(e.key) && !e.ctrlKey && !e.metaKey) {
        const btn = document.querySelector(`.kb-key[data-c="${e.key.toLowerCase()}"]`) as HTMLButtonElement;
        handleTypeKey(e.key.toLowerCase(), btn || undefined);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [phase, handleTypeKey]);

  const sizeClass = currentWord && currentWord.L.length > 11 ? 'xs' : currentWord && currentWord.L.length > 8 ? 'sm' : '';
  const kbRows = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm'];

  return (
    <div className="spelling-game" ref={gameRef}>
      {/* 배경 데코 */}
      <div className="sp-bg">
        {['🐠', '🐙', '🐚', '🫧', '🐳', '🦀'].map((emoji, i) => (
          <span key={i} style={{ animationDelay: `${i * 0.5}s` }}>{emoji}</span>
        ))}
      </div>

      {/* 헤더 */}
      <div className="sp-header">
        <button className="sp-back" onClick={onBack}>‹ 목록</button>
        <div className="sp-title">🔤 스펠링 연습</div>
        <div className="sp-header-spacer"></div>
      </div>

      {/* 단계 표시 */}
      {(phase === 'stage1-intro' || phase === 'type' || phase === 'stage2-intro' || phase === 'build') && (
        <div className="sp-stage-bar">
          <div className="sp-stage-pill">
            {(phase === 'stage1-intro' || phase === 'type') && `1단계 ${wordIdx} / ${round.length}`}
            {(phase === 'stage2-intro' || phase === 'build') && `2단계 ${wordIdx} / ${round.length}`}
          </div>
        </div>
      )}

      {/* 콘텐츠 */}
      <div className="sp-content">
        {/* 게임 시작 인트로 */}
        {phase === 'intro' && (
          <div className="sp-intro">
            <div className="sp-intro-emoji">🔤</div>
            <div className="sp-intro-title">스펠링 연습</div>
            <div className="sp-intro-desc">
              단어를 보고 <b>3번</b> 따라 쓰고,<br/>
              뜻만 보고 <b>1번</b> 기억해서 써요!<br/>
              그 다음 글자 블록을 맞춰요!
            </div>
            <div className="sp-intro-count">단어 {words.length}개</div>
            <button className="sp-start-btn" onClick={() => setPhase('stage1-intro')}>START ▶</button>
          </div>
        )}

        {/* 1단계 인트로 */}
        {phase === 'stage1-intro' && (
          <div className="sp-intro">
            <div className="sp-intro-emoji">✏️</div>
            <div className="sp-intro-title">{roundNo > 1 ? `🔁 다시 도전 ${roundNo - 1}회차 · ` : ''}1단계</div>
            <div className="sp-intro-desc">
              단어를 보고 <b>3번</b> 따라 쓰고,<br/>
              뜻만 보고 <b>1번</b> 기억해서 써요!
            </div>
            <div className="sp-intro-count">단어 {round.length}개</div>
            <button className="sp-start-btn" onClick={startStage1}>START ▶</button>
          </div>
        )}

        {/* 1단계: 타이핑 */}
        {phase === 'type' && currentWord && (
          <div className="sp-wrap">
            <div className={`sp-card${isQuizRep ? ' recall' : ''}`} onClick={() => speak(currentWord.w)}>
              {/* 단어 + 뜻 가로 배치 */}
              <div className="sp-word-row">
                <div className={`ty-model ${sizeClass}${isQuizRep ? ' hide' : ''}`}>
                  {currentWord.chars.map((c, i) => {
                    if (!c.slot) return c.ch === ' ' ? <span key={i} className="sep gap"></span> : <span key={i} className="sep">{c.ch}</span>;
                    const slotIdx = currentWord.chars.slice(0, i).filter(x => x.slot).length;
                    const isCur = slotIdx === tpos && !slotsDone;
                    const isFilled = slotIdx < filledSlots.length;
                    const showPeek = isQuizRep && peekIdx === slotIdx;
                    return (
                      <span key={i} className={`lt${isCur ? ' cur' : ''}${isFilled ? ' ok' : ''}${showPeek ? ' peek' : ''}`}>
                        {isQuizRep && !isFilled && !showPeek ? '?' : c.ch}
                      </span>
                    );
                  })}
                </div>
                <div className="sp-ko">{currentWord.ko}</div>
              </div>
              {/* 슬롯 */}
              <div className={`sp-slots ty ${sizeClass}${slotsDone ? ' done' : ''}`} ref={slotsRef}>
                {currentWord.chars.map((c, i) => {
                  if (!c.slot) return c.ch === ' ' ? <span key={i} className="sep gap"></span> : <span key={i} className="sep">{c.ch}</span>;
                  const slotIdx = currentWord.chars.slice(0, i).filter(x => x.slot).length;
                  const isCur = slotIdx === tpos && !slotsDone;
                  const isFilled = slotIdx < filledSlots.length;
                  const isPop = slotPop === slotIdx;
                  return (
                    <span key={i} className={`sp-slot c${slotIdx % 5}${isFilled ? ' fill' : ''}${isCur ? ' cur' : ''}${isPop ? ' pop' : ''}`}>
                      {filledSlots[slotIdx] || ''}
                    </span>
                  );
                })}
              </div>
            </div>

            <div className="rep-dots">
              {[0, 1, 2, 3].map(r => (
                <span key={r} className={`${r < rep ? 'on' : ''}${r === rep ? ' cur' : ''}${r === 3 ? ' last' : ''}`}>
                  {r < 3 ? r + 1 : 'quiz'}
                </span>
              )).reduce((acc: React.ReactNode[], cur, i) => {
                if (i > 0) acc.push(<i key={`sep-${i}`}>›</i>);
                acc.push(cur);
                return acc;
              }, [])}
            </div>

            <div className="sp-step">
              <b>1단계</b> {isQuizRep ? '이번엔 뜻만 보고 기억해서 써요!' : `단어를 보고 똑같이 쳐요 (${rep + 1}/3)`}
            </div>

            <div className="kb">
              {kbRows.map((row, ri) => (
                <div key={ri} className="kb-row">
                  {row.split('').map(ch => (
                    <button
                      key={ch}
                      data-c={ch}
                      className={`kb-key${badKey === ch ? ' bad' : ''}`}
                      onClick={(e) => handleTypeKey(ch, e.currentTarget)}
                    >
                      {ch}
                    </button>
                  ))}
                </div>
              ))}
            </div>

            <div className="sp-prog">
              {round.map((_, i) => (
                <i key={i} className={`${i < wordIdx ? 'on' : ''}${i === wordIdx ? ' cur' : ''}`}></i>
              ))}
            </div>
          </div>
        )}

        {/* 2단계 인트로 */}
        {phase === 'stage2-intro' && (
          <div className="sp-intro">
            <div className="sp-intro-emoji">🧩</div>
            <div className="sp-intro-title">2단계</div>
            <div className="sp-intro-desc">
              이번엔 단어를 안 보고<br/>
              글자 블록을 순서대로 맞춰요!
            </div>
            <div className="sp-intro-count">단어 {round.length}개</div>
            <button className="sp-start-btn" onClick={startStage2}>START ▶</button>
          </div>
        )}

        {/* 2단계: 블록 맞추기 */}
        {phase === 'build' && currentWord && (
          <div className="sp-wrap">
            <div className="sp-card" onClick={() => speak(currentWord.w)}>
              {/* 뜻만 표시 (단어는 안 보여줌) */}
              <div className="sp-word-row build">
                <div className="sp-ko">{currentWord.ko}</div>
              </div>
              {/* 슬롯 */}
              <div className={`sp-slots ${sizeClass}${slotsDone ? ' done' : ''}`} ref={slotsRef}>
                {currentWord.chars.map((c, i) => {
                  if (!c.slot) return c.ch === ' ' ? <span key={i} className="sep gap"></span> : <span key={i} className="sep">{c.ch}</span>;
                  const slotIdx = currentWord.chars.slice(0, i).filter(x => x.slot).length;
                  const isCur = slotIdx === buildPos && !slotsDone;
                  const isFilled = slotIdx < filledSlots.length;
                  const isPop = slotPop === slotIdx;
                  return (
                    <span key={i} className={`sp-slot c${slotIdx % 5}${isFilled ? ' fill' : ''}${isCur ? ' cur' : ''}${isPop ? ' pop' : ''}`}>
                      {filledSlots[slotIdx] || ''}
                    </span>
                  );
                })}
              </div>
            </div>

            <div className="sp-pool">
              {tiles.map((tile, i) => (
                <button
                  key={i}
                  className={`sp-tile${tile.used ? ' used' : ''}${badKey === tile.ch ? ' bad' : ''}${hintIdx === i ? ' hint' : ''}`}
                  onClick={(e) => handleTileTap(i, e.currentTarget)}
                  disabled={tile.used}
                >
                  {tile.ch}
                </button>
              ))}
            </div>

            <div className="sp-prog">
              {round.map((_, i) => (
                <i key={i} className={`${i < wordIdx ? 'on' : ''}${i === wordIdx ? ' cur' : ''}`}></i>
              ))}
            </div>
          </div>
        )}

        {/* 재도전 인트로 */}
        {phase === 'retry-intro' && (
          <div className="sp-intro">
            <div className="sp-intro-emoji">💪</div>
            <div className="sp-intro-title">거의 다 왔어요!</div>
            <div className="sp-intro-desc">
              헷갈렸던 단어 <b>{round.length}개</b>를<br/>
              1단계부터 다시 연습해요
            </div>
            <div className="retry-words">
              {round.map((w, i) => (
                <span key={i}>{w.w}</span>
              ))}
            </div>
            <button className="sp-start-btn" onClick={() => setPhase('stage1-intro')}>다음 ▶</button>
          </div>
        )}

        {/* 결과 화면 */}
        {phase === 'result' && (
          <div className="sp-result">
            <div className="sp-result-emoji">🎉</div>
            <div className="sp-result-title">스펠링 완성!</div>
            <div className="sp-result-score">
              단어 {words.length}개 완료!
              {miss === 0 ? ' 한 번도 안 틀렸어요! 💯' : ` (틀린 횟수 ${miss}번)`}
            </div>
            {bestCombo >= 2 && (
              <div className="sp-result-combo">최고 콤보: {bestCombo} 🔥</div>
            )}
            <div className="sp-result-stars">
              {'⭐'.repeat(miss === 0 ? 3 : miss <= 2 ? 2 : 1)}
            </div>
            <div className="sp-result-btns">
              <button className="sp-btn" onClick={onBack}>돌아가기</button>
              {onFinalTest && (
                <button className="sp-btn main" onClick={onFinalTest}>파이널 테스트 →</button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 콤보 효과 */}
      {showCombo && (
        <div className={`combo-fx tier-${showCombo.tier}`}>
          <div className="combo-rays"></div>
          <div className="combo-core">
            <div className="combo-n">{showCombo.n}</div>
            <div className="combo-label">COMBO!</div>
            <div className="combo-msg">{showCombo.msg}</div>
          </div>
          {Array.from({ length: 10 + showCombo.tier * 6 }).map((_, i) => {
            const em = showCombo.tier === 3 ? ['🌈', '👑', '💎', '🌟', '🦄'] : showCombo.tier === 2 ? ['⚡', '🌟', '💥', '✨'] : ['🔥', '⭐', '✨'];
            const a = Math.random() * Math.PI * 2;
            const r = 110 + Math.random() * 120;
            return (
              <span key={i} className="combo-p" style={{
                '--dx': `${Math.cos(a) * r}px`,
                '--dy': `${Math.sin(a) * r}px`,
                animationDelay: `${Math.random() * 0.15}s`
              } as React.CSSProperties}>{pick(em)}</span>
            );
          })}
        </div>
      )}

      {/* 칭찬 효과 */}
      {showPraise && (
        <div className={`praise-popup lv-${showPraise.lv}`}>{showPraise.text}</div>
      )}

      {/* 콘페티 */}
      {showConfetti && (
        <div className="confetti-box">
          {Array.from({ length: confettiCount }).map((_, i) => (
            <i key={i} className="conf-bit" style={{
              left: `${Math.random() * 100}%`,
              background: ['#ff5c7a', '#ffd54a', '#36c26a', '#4f8bff', '#b065ff', '#ff9f43'][i % 6],
              animationDuration: `${1.6 + Math.random() * 1.6}s`,
              animationDelay: `${Math.random() * 0.4}s`,
            }} />
          ))}
        </div>
      )}

      {/* 퍼펙트 효과 */}
      {perfect && (
        <div className="perfect-overlay">
          <div className="perfect-rays"></div>
          <div className="perfect-core">
            <div className="perfect-crown">👑</div>
            <div className="perfect-title">VOCA KING!</div>
            <div className="perfect-subtitle">PERFECT!</div>
            <div className="perfect-sub">한 번도 안 틀렸어요! 최고의 스펠링 왕 👑</div>
          </div>
          {Array.from({ length: 36 }).map((_, i) => (
            <span key={i} className="mega-rain" style={{
              left: `${Math.random() * 100}%`,
              fontSize: `${22 + Math.random() * 26}px`,
              animationDuration: `${1.6 + Math.random() * 1.4}s`,
              animationDelay: `${Math.random() * 1.6}s`,
            }}>
              {['🌟', '🎉', '💖', '👑', '🦄', '🌈', '🍭', '🎈'][i % 8]}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
