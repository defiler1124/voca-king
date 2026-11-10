/**
 * 동물 구출 팡팡 게임 (Stage 3)
 * 한글 뜻에 맞는 영어 단어를 든 동물을 탭해서 구출!
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { speak } from '../../utils/tts';
import type { Word } from '../../types';
import './AnimalGame.css';

interface Props {
  words: Word[];
  allWords: Word[];
  dayId: number;
  onFinish: (score: number, total: number) => void;
  onBack: () => void;
  onNextStage?: () => void;
}

const GAME_TIME = 60;
const FALL_TIME = 9;

const ANIMAL_TYPES = ['bear', 'cat', 'bunny', 'panda', 'dog', 'pig'] as const;
type AnimalType = typeof ANIMAL_TYPES[number];
type AnimalMood = 'idle' | 'happy' | 'angry';

const COLORS = ['#ff4d6d', '#ffb703', '#2ec4b6', '#4d9bff', '#b565ff', '#ff8a3d'];

function shuffleArray<T>(array: T[]): T[] {
  const a = [...array];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Audio context
let audioCtx: AudioContext | null = null;
function getAudioCtx() {
  if (!audioCtx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AC) audioCtx = new AC();
  }
  if (audioCtx?.state === 'suspended') audioCtx.resume();
  return audioCtx;
}

function playHappySound() {
  const ctx = getAudioCtx();
  if (!ctx) return;
  const now = ctx.currentTime;
  [784, 988, 1175, 1568].forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.15, now + i * 0.07);
    gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.07 + 0.2);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now + i * 0.07);
    osc.stop(now + i * 0.07 + 0.25);
  });
}

function playPopSound() {
  const ctx = getAudioCtx();
  if (!ctx) return;
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(700, now);
  osc.frequency.exponentialRampToValueAtTime(160, now + 0.16);
  gain.gain.setValueAtTime(0.3, now);
  gain.gain.exponentialRampToValueAtTime(0.01, now + 0.16);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.2);
}

function playAngrySound() {
  const ctx = getAudioCtx();
  if (!ctx) return;
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(220, now);
  osc.frequency.exponentialRampToValueAtTime(110, now + 0.3);
  gain.gain.setValueAtTime(0.15, now);
  gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.35);
}

// Animal SVG
function AnimalSVG({ type, mood, color }: { type: AnimalType; mood: AnimalMood; color: string }) {
  const configs: Record<AnimalType, { head: string; muz: string; nose: string }> = {
    bear: { head: '#b5835a', muz: '#f1d9b5', nose: '#3b2a1e' },
    cat: { head: '#ffb066', muz: '#fff1e0', nose: '#ff7f9c' },
    bunny: { head: '#ffffff', muz: '#fff0f3', nose: '#ff8fa3' },
    panda: { head: '#ffffff', muz: '#ffffff', nose: '#222' },
    dog: { head: '#d9a066', muz: '#f7e6c8', nose: '#222' },
    pig: { head: '#ffb3c1', muz: '#ff8fa3', nose: '#9b3a50' },
  };

  const cfg = configs[type];
  const ec = '#2b1d14';

  let eyes, mouth, extra: React.ReactNode = null;
  if (mood === 'happy') {
    eyes = <><path d="M31 63 Q38 51 45 63" stroke={ec} strokeWidth="4" fill="none" strokeLinecap="round"/><path d="M55 63 Q62 51 69 63" stroke={ec} strokeWidth="4" fill="none" strokeLinecap="round"/></>;
    mouth = <path d="M39 78 Q50 99 61 78 Z" fill="#7a1f2b" stroke="#5a1220" strokeWidth="1" strokeLinejoin="round"/>;
    extra = <><ellipse cx="27" cy="73" rx="7.5" ry="5.5" fill="#ff7d9d" opacity="0.7"/><ellipse cx="73" cy="73" rx="7.5" ry="5.5" fill="#ff7d9d" opacity="0.7"/></>;
  } else if (mood === 'angry') {
    eyes = <><ellipse cx="39" cy="62" rx="4.4" ry="4.8" fill={ec}/><ellipse cx="61" cy="62" rx="4.4" ry="4.8" fill={ec}/></>;
    mouth = <path d="M38 86 Q50 70 62 86 Q50 80 38 86 Z" fill="#7a1f2b"/>;
    extra = <><path d="M26 46 L46 58" stroke={ec} strokeWidth="5.5" strokeLinecap="round"/><path d="M74 46 L54 58" stroke={ec} strokeWidth="5.5" strokeLinecap="round"/></>;
  } else {
    eyes = <><ellipse cx="38" cy="60" rx="4.8" ry="5.4" fill={ec}/><circle cx="36.5" cy="58" r="1.8" fill="#fff"/><ellipse cx="62" cy="60" rx="4.8" ry="5.4" fill={ec}/><circle cx="60.5" cy="58" r="1.8" fill="#fff"/></>;
    mouth = <path d="M44 78 Q50 84 56 78" stroke={ec} strokeWidth="2.4" fill="none" strokeLinecap="round"/>;
    extra = <><ellipse cx="27" cy="73" rx="6.5" ry="4.6" fill="#ff7d9d" opacity="0.5"/><ellipse cx="73" cy="73" rx="6.5" ry="4.6" fill="#ff7d9d" opacity="0.5"/></>;
  }

  let ears;
  if (type === 'bear') {
    ears = <><circle cx="24" cy="38" r="11.5" fill={cfg.head}/><circle cx="24" cy="39" r="6" fill="#e9bfa0"/><circle cx="76" cy="38" r="11.5" fill={cfg.head}/><circle cx="76" cy="39" r="6" fill="#e9bfa0"/></>;
  } else if (type === 'cat') {
    ears = <><path d="M19 50 L22 17 L47 36 Z" fill={cfg.head}/><path d="M25 43 L26 26 L38 35 Z" fill="#ffb9cb"/><path d="M81 50 L78 17 L53 36 Z" fill={cfg.head}/><path d="M75 43 L74 26 L62 35 Z" fill="#ffb9cb"/></>;
  } else if (type === 'bunny') {
    ears = <><ellipse cx="36" cy="22" rx="9.5" ry="22" fill={cfg.head} stroke="#e0d2d6" strokeWidth="2"/><ellipse cx="36" cy="25" rx="4.8" ry="15" fill="#ffc3d3"/><ellipse cx="64" cy="22" rx="9.5" ry="22" fill={cfg.head} stroke="#e0d2d6" strokeWidth="2"/><ellipse cx="64" cy="25" rx="4.8" ry="15" fill="#ffc3d3"/></>;
  } else if (type === 'panda') {
    ears = <><circle cx="24" cy="38" r="11.5" fill="#2a2a33"/><circle cx="76" cy="38" r="11.5" fill="#2a2a33"/></>;
  } else if (type === 'dog') {
    ears = <><ellipse cx="19" cy="58" rx="10.5" ry="21" transform="rotate(12 19 58)" fill="#8a5a2b"/><ellipse cx="81" cy="58" rx="10.5" ry="21" transform="rotate(-12 81 58)" fill="#8a5a2b"/></>;
  } else if (type === 'pig') {
    ears = <><path d="M21 49 L23 23 L45 36 Z" fill="#ff9db0"/><path d="M79 49 L77 23 L55 36 Z" fill="#ff9db0"/></>;
  }

  const muz = type === 'pig' ? (
    <><ellipse cx="50" cy="72" rx="14.5" ry="10.5" fill="#ff93a8" stroke="#e86c86" strokeWidth="1.5"/><ellipse cx="45" cy="72" rx="2.2" ry="3" fill="#b4445e"/><ellipse cx="55" cy="72" rx="2.2" ry="3" fill="#b4445e"/></>
  ) : (
    <><ellipse cx="50" cy="74" rx="13.5" ry="9.8" fill={cfg.muz}/><ellipse cx="50" cy="69.5" rx="4.8" ry="3.4" fill={cfg.nose}/><ellipse cx="48.6" cy="68.3" rx="1.7" ry="0.9" fill="#fff" opacity="0.75"/></>
  );

  const patches = type === 'panda' ? (
    <><ellipse cx="36" cy="60" rx="9.5" ry="11.5" transform="rotate(-20 36 60)" fill="#2a2a33"/><ellipse cx="64" cy="60" rx="9.5" ry="11.5" transform="rotate(20 64 60)" fill="#2a2a33"/></>
  ) : null;

  return (
    <svg viewBox="0 -55 100 155" className="ag-animal-svg">
      {/* Parachute - dome with panels */}
      <defs>
        <linearGradient id={`chute-${color.slice(1)}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.4"/>
          <stop offset="50%" stopColor={color} stopOpacity="1"/>
          <stop offset="100%" stopColor={color} stopOpacity="0.8"/>
        </linearGradient>
      </defs>
      {/* Main canopy */}
      <ellipse cx="50" cy="-28" rx="44" ry="24" fill={`url(#chute-${color.slice(1)})`}/>
      {/* Panel dividers */}
      <path d="M50 -52 Q50 -28 50 -4" stroke="#fff" strokeWidth="1.5" opacity="0.6" fill="none"/>
      <path d="M20 -38 Q35 -28 50 -4" stroke="#fff" strokeWidth="1" opacity="0.4" fill="none"/>
      <path d="M80 -38 Q65 -28 50 -4" stroke="#fff" strokeWidth="1" opacity="0.4" fill="none"/>
      {/* Highlight */}
      <ellipse cx="35" cy="-35" rx="12" ry="8" fill="#fff" opacity="0.3"/>
      {/* Canopy edge */}
      <path d="M6 -28 Q50 5 94 -28" stroke={color} strokeWidth="3" fill="none" opacity="0.8"/>
      {/* Strings */}
      <line x1="10" y1="-20" x2="35" y2="32" stroke="#555" strokeWidth="1.5" opacity="0.7"/>
      <line x1="30" y1="-8" x2="42" y2="32" stroke="#555" strokeWidth="1.5" opacity="0.7"/>
      <line x1="70" y1="-8" x2="58" y2="32" stroke="#555" strokeWidth="1.5" opacity="0.7"/>
      <line x1="90" y1="-20" x2="65" y2="32" stroke="#555" strokeWidth="1.5" opacity="0.7"/>
      {/* Animal */}
      {ears}
      <ellipse cx="50" cy="62" rx="34" ry="30" fill={cfg.head}/>
      {patches}
      <ellipse cx="37" cy="45" rx="11" ry="5" transform="rotate(-24 37 45)" fill="#fff" opacity="0.35"/>
      {muz}
      {eyes}
      {mouth}
      {extra}
    </svg>
  );
}

interface FallingAnimal {
  word: string;
  type: AnimalType;
  color: string;
  slot: number;
  duration: number;
  mood: AnimalMood;
  status: 'falling' | 'correct' | 'wrong' | 'away';
}

export default function AnimalGame({ words, allWords, dayId, onFinish, onBack, onNextStage }: Props) {
  const [queue, setQueue] = useState<Word[]>([]);
  const [current, setCurrent] = useState<Word | null>(null);
  const [clean, setClean] = useState<Set<number>>(new Set());
  const [missed, setMissed] = useState<Word[]>([]);
  const [locked, setLocked] = useState(false);
  const [animals, setAnimals] = useState<FallingAnimal[]>([]);
  const [timeLeft, setTimeLeft] = useState(GAME_TIME);
  const [gameOver, setGameOver] = useState(false);
  const [stageClear, setStageClear] = useState(false);
  const [clearTime, setClearTime] = useState(0);
  const [countdown, setCountdown] = useState<number | null>(3);
  const [combo, setCombo] = useState(0);
  const [timePen, setTimePen] = useState<{ text: string; type: 'good' | 'bad' } | null>(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [showMiss, setShowMiss] = useState(false);
  const [burst, setBurst] = useState<{ x: number; y: number } | null>(null);
  const [questionId, setQuestionId] = useState(0);

  const initRef = useRef(false);
  const timerRef = useRef<number | null>(null);
  const fallTimerRef = useRef<number | null>(null);
  const fieldRef = useRef<HTMLDivElement>(null);
  const cleanRef = useRef<Set<number>>(new Set());
  const nextQuestionRef = useRef<() => void>(() => {});

  // cleanRef를 항상 최신 상태로 유지
  useEffect(() => {
    cleanRef.current = clean;
  }, [clean]);

  // Countdown
  useEffect(() => {
    if (countdown === null) return;
    if (countdown === 0) {
      setCountdown(null);
      setGameStarted(true);
      return;
    }
    const t = setTimeout(() => setCountdown(countdown - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  // Game start
  useEffect(() => {
    if (!gameStarted || initRef.current) return;
    initRef.current = true;
    const shuffled = shuffleArray(words);
    setQueue(shuffled);

    timerRef.current = window.setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          setGameOver(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (fallTimerRef.current) clearTimeout(fallTimerRef.current);
    };
  }, [gameStarted, words]);

  // Next question
  const nextQuestion = useCallback(() => {
    if (fallTimerRef.current) clearTimeout(fallTimerRef.current);
    if (gameOver) return;

    // cleanRef.current를 사용해서 최신 상태 확인
    const currentClean = cleanRef.current;

    // 모든 단어 완료 시 게임 오버
    if (currentClean.size >= words.length) {
      if (timerRef.current) clearInterval(timerRef.current);
      setGameOver(true);
      return;
    }

    // 큐가 비어있으면 남은 단어로 새로 생성
    let q = [...queue];
    if (q.length === 0) {
      q = shuffleArray(words.filter(w => !currentClean.has(w.id)));
    }

    // 큐에 단어가 없으면 게임 오버
    if (q.length === 0) {
      if (timerRef.current) clearInterval(timerRef.current);
      setGameOver(true);
      return;
    }

    const word = q.shift()!;
    setQueue(q);
    setCurrent(word);
    setLocked(false);
    setShowMiss(false);
    setBurst(null);
    setQuestionId(prev => prev + 1);

    // Build 4 options
    const pool = allWords.length > 0 ? allWords : words;
    const distractors = shuffleArray(pool.filter(w => w.english !== word.english)).slice(0, 3);
    const options = shuffleArray([word.english, ...distractors.map(d => d.english)]);

    const types = shuffleArray([...ANIMAL_TYPES]).slice(0, 4);
    const slots = shuffleArray([0, 1, 2, 3]);
    const colors = shuffleArray([...COLORS]);

    const newAnimals: FallingAnimal[] = options.map((opt, i) => ({
      word: opt,
      type: types[i],
      color: colors[i],
      slot: slots[i],
      duration: FALL_TIME + (i - 1.5) * 0.35,
      mood: 'idle' as AnimalMood,
      status: 'falling' as const,
    }));

    setAnimals(newAnimals);

    // Miss timer
    fallTimerRef.current = window.setTimeout(() => {
      handleMiss(word);
    }, (FALL_TIME + 1) * 1000);

  }, [queue, words, allWords, gameOver]);

  // nextQuestionRef 항상 최신 함수로 유지
  useEffect(() => {
    nextQuestionRef.current = nextQuestion;
  }, [nextQuestion]);

  useEffect(() => {
    // 큐가 비어있어도 아직 처리할 단어가 있으면 nextQuestion 호출
    if (gameStarted && !current && !gameOver && clean.size < words.length) {
      nextQuestion();
    }
  }, [gameStarted, current, nextQuestion, gameOver, clean.size, words.length]);

  useEffect(() => {
    if (gameOver) {
      const score = clean.size;
      const total = words.length;
      // 완벽 클리어 시 직접 localStorage에 저장
      if (score === total) {
        try {
          const saved = localStorage.getItem('voca-king-animal-cleared');
          const clearedDays: number[] = saved ? JSON.parse(saved) : [];
          if (!clearedDays.includes(dayId)) {
            clearedDays.push(dayId);
            localStorage.setItem('voca-king-animal-cleared', JSON.stringify(clearedDays));
          }
        } catch (e) {
          console.error('Failed to save animal clear state', e);
        }
      }
      onFinish(score, total);
    }
  }, [gameOver, clean.size, words.length, dayId, onFinish]);

  const handleMiss = (word: Word) => {
    if (gameOver || locked) return;
    setLocked(true);
    setShowMiss(true);

    // 콤보 리셋
    setCombo(0);

    // missed에 추가
    if (!missed.some(m => m.id === word.id)) {
      setMissed(prev => [...prev, word]);
    }

    // 완료 처리 + 큐에서 제거 (다시 출제되지 않도록)
    setClean(prev => new Set(prev).add(word.id));
    setQueue(prev => prev.filter(w => w.id !== word.id));

    // Show correct answer
    setAnimals(prev => prev.map(a => ({
      ...a,
      status: a.word === word.english ? 'correct' : 'away',
      mood: a.word === word.english ? 'happy' : a.mood,
    })));

    speak(word.english);

    // Penalty: -3초
    setTimeLeft(prev => Math.max(0, prev - 3));
    setTimePen({ text: '-3초!', type: 'bad' });
    setTimeout(() => setTimePen(null), 1000);

    // cleanRef 즉시 업데이트 (useEffect보다 먼저)
    cleanRef.current = new Set(cleanRef.current).add(word.id);

    // 다음 문제로
    setTimeout(() => {
      setLocked(false);
      setShowMiss(false);
      setCurrent(null);

      // 직접 nextQuestion 호출 (ref 사용으로 항상 최신 함수)
      if (cleanRef.current.size < words.length) {
        setTimeout(() => {
          nextQuestionRef.current();
        }, 50);
      }
    }, 1500);
  };

  const handlePick = (idx: number) => {
    if (locked || !current || gameOver) return;

    const animal = animals[idx];
    if (animal.status !== 'falling') return;

    const isCorrect = animal.word === current.english;

    if (isCorrect) {
      setLocked(true);
      if (fallTimerRef.current) clearTimeout(fallTimerRef.current);

      playHappySound();
      speak(current.english);

      // Update animal mood
      setAnimals(prev => prev.map((a, i) => ({
        ...a,
        status: i === idx ? 'correct' : 'away',
        mood: i === idx ? 'happy' : a.mood,
      })));

      // Burst effect
      if (fieldRef.current) {
        const btn = fieldRef.current.children[idx] as HTMLElement;
        if (btn) {
          const rect = btn.getBoundingClientRect();
          const fieldRect = fieldRef.current.getBoundingClientRect();
          setBurst({
            x: rect.left - fieldRect.left + rect.width / 2,
            y: rect.top - fieldRect.top + rect.height / 2,
          });
        }
      }

      // 정답 처리
      const isLastWord = clean.size + 1 >= words.length;
      setClean(prev => new Set(prev).add(current.id));
      const newCombo = combo + 1;
      setCombo(newCombo);

      // 5연속 정답 보너스: +3초
      if (newCombo > 0 && newCombo % 5 === 0) {
        setTimeLeft(prev => prev + 3);
        setTimePen({ text: '+3초!', type: 'good' });
        setTimeout(() => setTimePen(null), 1000);
      }

      if (isLastWord) {
        setTimeout(() => {
          playPopSound();
          if (timerRef.current) clearInterval(timerRef.current);
          setStageClear(true);
          setClearTime(GAME_TIME - timeLeft);
          setGameOver(true);
        }, 500);
        return;
      }

      setTimeout(() => {
        playPopSound();
      }, 400);

      setTimeout(() => {
        setCurrent(null);
        nextQuestion();
      }, 1000);

    } else {
      // 오답 처리: missed에 추가하고 다음 문제로
      if (!missed.some(m => m.id === current.id)) {
        setMissed(prev => [...prev, current]);
      }
      setClean(prev => new Set(prev).add(current.id)); // 완료 처리 (다시 안나오게)
      setCombo(0); // 콤보 리셋

      playAngrySound();

      setAnimals(prev => prev.map((a, i) =>
        i === idx ? { ...a, mood: 'angry', status: 'wrong' } : a
      ));

      // 오답 페널티: -3초 표시
      setTimePen({ text: '-3초!', type: 'bad' });
      setTimeout(() => setTimePen(null), 1000);
      setTimeLeft(prev => Math.max(0, prev - 3));

      // 마지막 단어인지 확인
      const isLastWord = clean.size + 1 >= words.length;
      if (isLastWord) {
        setTimeout(() => {
          if (timerRef.current) clearInterval(timerRef.current);
          setStageClear(true);
          setClearTime(GAME_TIME - timeLeft);
          setGameOver(true);
        }, 1000);
        return;
      }

      // 다음 문제로 이동
      setTimeout(() => {
        setCurrent(null);
        nextQuestion();
      }, 1000);
    }
  };

  const fusePercent = (timeLeft / GAME_TIME) * 100;

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // Star rating: 3 stars = no missed, 2 stars = 1-2 missed, 1 star = 3+ missed
  const getStars = () => {
    if (missed.length === 0) return '★★★';
    if (missed.length <= 2) return '★★☆';
    return '★☆☆';
  };

  return (
    <div className="ag-game">
      {/* Header */}
      <div className="ag-header">
        <button className="ag-back-btn" onClick={onBack}>← 목록으로</button>
        <div className="ag-title">🐻 동물 구출 팡팡</div>
        <div className="ag-progress-text">{clean.size} / {words.length}</div>
      </div>

      {/* Timer - hide when gameOver */}
      {!gameOver && (
        <div className="ag-timer-area">
          <div className="ag-timer-display">{formatTime(timeLeft)}</div>
          <div className="ag-fuse-bar">
            <div className="ag-fuse-fill" style={{ left: `${100 - fusePercent}%`, right: 0 }} />
            <div className="ag-fuse-fire" style={{ left: `${100 - fusePercent}%` }}>🔥</div>
            {timePen && <div className={`ag-time-pen ${timePen.type}`} style={{ left: `${100 - fusePercent}%` }}>{timePen.text}</div>}
            <div className="ag-fuse-bomb">💣</div>
          </div>
          {/* 콤보 - 타이머 오른쪽에 표시 */}
          <div className="ag-combo-area">{combo >= 2 && countdown === null ? `🔥 ${combo}연속!` : ''}</div>
        </div>
      )}

      {/* Countdown */}
      {countdown !== null && (
        <div className="ag-countdown">
          <div className="ag-countdown-num" key={countdown}>{countdown}</div>
        </div>
      )}

      {/* Game Over */}
      {gameOver && (
        <>
          {/* Timer frozen at top */}
          <div className="ag-timer-area">
            <div className="ag-timer-display">{formatTime(timeLeft)}</div>
            <div className="ag-fuse-bar">
              <div className="ag-fuse-fill" style={{ width: `${fusePercent}%` }} />
              <div className="ag-fuse-fire" style={{ left: `${fusePercent}%` }}>🔥</div>
              <div className="ag-fuse-bomb">💣</div>
            </div>
          </div>

          {stageClear ? (
            <div className="ag-clear">
              <div className="ag-clear-crown">👑</div>
              <div className="ag-clear-title">STAGE CLEAR!</div>
              <div className="ag-clear-stars">{getStars()}</div>
              <div className="ag-clear-time">{formatTime(clearTime)} 만에 클리어 (제한 {formatTime(GAME_TIME)})</div>
              {missed.length > 0 && (
                <div className="ag-clear-missed">
                  <div className="ag-clear-missed-title">다시 볼 단어</div>
                  <div className="ag-clear-missed-list">
                    {missed.map((w, i) => (
                      <span key={w.id}>{w.english} - {w.korean}{i < missed.length - 1 ? ', ' : ''}</span>
                    ))}
                  </div>
                </div>
              )}
              <div className="ag-clear-btns">
                <button className="ag-clear-btn secondary" onClick={() => window.location.reload()}>다시 하기</button>
                <button className="ag-clear-btn primary" onClick={onNextStage || onBack}>다음 스테이지 ▶</button>
                <button className="ag-clear-btn secondary" onClick={onBack}>목록</button>
              </div>
            </div>
          ) : (
            <div className="ag-result">
              <div className="ag-result-emoji">
                {clean.size >= words.length * 0.8 ? '🎉' : '🐻'}
              </div>
              <div className="ag-result-score">{clean.size} / {words.length}</div>
              <div className="ag-result-msg">
                {clean.size >= words.length * 0.8 ? '잘했어요!' : '다시 도전해요!'}
              </div>
              <button className="ag-result-btn" onClick={onBack}>목록으로</button>
            </div>
          )}
        </>
      )}

      {/* Game Scene */}
      {gameStarted && !gameOver && countdown === null && (
        <div className="ag-scene">
          {/* Question */}
          <div className="ag-question">
            <div className="ag-q-hint">이 뜻의 영어 단어를 든 동물을 톡!</div>
            <div className="ag-q-korean">{current?.korean}</div>
          </div>

          {/* Falling animals */}
          <div className="ag-field">
            <div className="ag-field-inner" ref={fieldRef}>
              {animals.map((animal, idx) => (
                <button
                  key={`${questionId}-${idx}`}
                  className={`ag-animal ${animal.status}`}
                  style={{
                    left: `${10 + animal.slot * 20}%`,
                    animationDuration: `${animal.duration}s`,
                  }}
                  onClick={() => handlePick(idx)}
                  disabled={animal.status !== 'falling' && animal.status !== 'wrong'}
                >
                  <div className="ag-animal-art">
                    <AnimalSVG type={animal.type} mood={animal.mood} color={animal.color} />
                  </div>
                  <div className={`ag-animal-tag ${animal.word.length > 11 ? 'xs' : animal.word.length > 7 ? 'sm' : ''}`}>
                    {animal.word}
                  </div>
                  {animal.status === 'wrong' && <span className="ag-rage">💢</span>}
                </button>
              ))}

              {/* Burst effect */}
              {burst && (
                <div className="ag-burst" style={{ left: burst.x, top: burst.y }}>
                  {['✨', '🎉', '⭐', '🎊', '💥', '🌟'].map((icon, i) => (
                    <span
                      key={i}
                      className="ag-spark"
                      style={{
                        '--angle': `${(i / 6) * 360}deg`,
                        '--dist': `${60 + Math.random() * 40}px`,
                      } as React.CSSProperties}
                    >
                      {icon}
                    </span>
                  ))}
                </div>
              )}

              {/* Miss message */}
              {showMiss && (
                <div className="ag-miss">
                  😵 놓쳤어요! 정답: <b>{current?.english}</b>
                </div>
              )}
            </div>
          </div>

          {/* Ground */}
          <div className="ag-ground" />
        </div>
      )}
    </div>
  );
}
