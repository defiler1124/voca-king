/**
 * Stage 2: 바나나 받아먹기 게임
 * 정답 바나나는 원숭이가 냠냠, 오답은 손으로 퍽! 쳐서 날림
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { speak } from '../../utils/tts';
import type { Word } from '../../types';
import './BananaGame.css';

interface Props {
  words: Word[];
  allWords: Word[];
  dayId: number;
  onFinish: (score: number, total: number) => void;
  onBack: () => void;
  onNextStage?: () => void;
}

type MonkeyMood = 'idle' | 'happy' | 'eat' | 'angry';

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const GAME_TIME = 60;

// 효과음 (Web Audio API)
let audioCtx: AudioContext | null = null;
function getAudioCtx() {
  if (!audioCtx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AC) audioCtx = new AC();
  }
  return audioCtx;
}

function playCorrectSound() {
  const ctx = getAudioCtx();
  if (!ctx) return;
  const now = ctx.currentTime;
  // 상승 멜로디
  [0, 0.1, 0.2].forEach((delay, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 523 + i * 130; // C5, E5, G5
    gain.gain.setValueAtTime(0.15, now + delay);
    gain.gain.exponentialRampToValueAtTime(0.01, now + delay + 0.15);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now + delay);
    osc.stop(now + delay + 0.2);
  });
}

function playWrongSound() {
  const ctx = getAudioCtx();
  if (!ctx) return;
  const now = ctx.currentTime;
  // 낮은 버저음
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sawtooth';
  osc.frequency.value = 150;
  gain.gain.setValueAtTime(0.12, now);
  gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.35);
}

export default function BananaGame({ words, allWords, dayId, onFinish, onBack, onNextStage }: Props) {
  const [queue, setQueue] = useState<Word[]>([]);
  const [current, setCurrent] = useState<Word | null>(null);
  const [clean, setClean] = useState<Set<number>>(new Set());
  const [missed, setMissed] = useState<Word[]>([]);
  const [banana, setBanana] = useState(0);
  const [combo, setCombo] = useState(0);
  const [locked, setLocked] = useState(true);
  const [options, setOptions] = useState<[string, string]>(['', '']);
  const [correctIdx, setCorrectIdx] = useState(0);
  const [mood, setMood] = useState<MonkeyMood>('idle');
  const [dropReady, setDropReady] = useState(false);
  const [pickedIdx, setPickedIdx] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [slapDir, setSlapDir] = useState<'l' | 'r' | null>(null);
  const [timeLeft, setTimeLeft] = useState(GAME_TIME);
  const [gameOver, setGameOver] = useState(false);
  const [stageClear, setStageClear] = useState(false);
  const [clearTime, setClearTime] = useState(0);
  const [throwStyle, setThrowStyle] = useState<React.CSSProperties>({});
  const [timePen, setTimePen] = useState<{ text: string; type: 'good' | 'bad' } | null>(null);
  const [countdown, setCountdown] = useState<number | null>(3);
  const [gameStarted, setGameStarted] = useState(false);

  const initRef = useRef(false);
  const timerRef = useRef<number | null>(null);
  const monkeyRef = useRef<HTMLDivElement>(null);
  const bananaRefs = useRef<(HTMLButtonElement | null)[]>([null, null]);
  const scoreRef = useRef(0);

  // 카운트다운
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

  // 게임 시작 후 초기화
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
    };
  }, [gameStarted, words]);

  // 다음 문제
  const nextQuestion = useCallback(() => {
    if (gameOver) return;
    if (clean.size >= words.length) {
      if (timerRef.current) clearInterval(timerRef.current);
      setGameOver(true);
      return;
    }

    let q = [...queue];
    if (q.length === 0) {
      q = shuffleArray(words.filter(w => !clean.has(w.id)));
    }

    const word = q.shift()!;
    setQueue(q);
    setCurrent(word);
    setLocked(false);
    setPickedIdx(null);
    setIsCorrect(null);
    setSlapDir(null);
    setDropReady(false);
    setThrowStyle({});

    const pool = allWords.length > 0 ? allWords : words;
    const distractors = shuffleArray(pool.filter(w => w.korean !== word.korean));
    const wrong = distractors.length > 0 ? distractors[0].korean : '—';
    const cIdx = Math.random() < 0.5 ? 0 : 1;
    setCorrectIdx(cIdx);
    setOptions(cIdx === 0 ? [word.korean, wrong] : [wrong, word.korean]);

    setTimeout(() => setDropReady(true), 50);
    speak(word.english);
  }, [queue, clean, words, allWords, gameOver]);

  useEffect(() => {
    if (gameStarted && queue.length > 0 && !current && !gameOver) {
      nextQuestion();
    }
  }, [gameStarted, queue, current, nextQuestion, gameOver]);

  useEffect(() => {
    if (gameOver) {
      const score = scoreRef.current;
      const total = words.length;
      // 완벽 클리어 시 직접 localStorage에 저장
      if (score === total) {
        try {
          const saved = localStorage.getItem('voca-king-banana-cleared');
          const clearedDays: number[] = saved ? JSON.parse(saved) : [];
          if (!clearedDays.includes(dayId)) {
            clearedDays.push(dayId);
            localStorage.setItem('voca-king-banana-cleared', JSON.stringify(clearedDays));
          }
        } catch (e) {
          console.error('Failed to save banana clear state', e);
        }
      }
      onFinish(score, total);
    }
  }, [gameOver, words.length, dayId, onFinish]);

  // 선택 처리
  const handlePick = (idx: number) => {
    if (locked || !current || gameOver) return;
    setLocked(true);
    setPickedIdx(idx);

    const ok = idx === correctIdx;
    setIsCorrect(ok);

    // 바나나 → 원숭이 날아가는 애니메이션 계산
    const bn = bananaRefs.current[idx];
    const mk = monkeyRef.current;
    if (bn && mk) {
      const bnRect = bn.getBoundingClientRect();
      const mkRect = mk.getBoundingClientRect();
      const dx = (mkRect.left + mkRect.width / 2) - (bnRect.left + bnRect.width / 2);
      const dy = (mkRect.top + mkRect.height * 0.5) - (bnRect.top + bnRect.height / 2);
      setThrowStyle({
        '--throw-dx': `${dx}px`,
        '--throw-dy': `${dy}px`,
        '--slap-x': idx === 0 ? '-200px' : '200px',
      } as React.CSSProperties);
    }

    if (ok) {
      // 정답
      playCorrectSound();
      setMood('eat');
      setTimeout(() => setMood('happy'), 500);

      const isLastWord = clean.size + 1 >= words.length;
      setClean(prev => new Set(prev).add(current.id));
      const newCombo = combo + 1;
      setCombo(newCombo);
      scoreRef.current += 1;
      setBanana(prev => prev + 1);

      // 5연속 정답 보너스: +3초
      if (newCombo > 0 && newCombo % 5 === 0) {
        setTimeLeft(prev => prev + 3);
        setTimePen({ text: '+3초!', type: 'good' });
        setTimeout(() => setTimePen(null), 1000);
      }

      setTimeout(() => {
        setMood('idle');
        if (isLastWord) {
          if (timerRef.current) clearInterval(timerRef.current);
          setStageClear(true);
          setClearTime(GAME_TIME - timeLeft);
          setGameOver(true);
        } else {
          nextQuestion();
        }
      }, 900);
    } else {
      // 오답: missed에 추가하고 다음 문제로
      playWrongSound();
      setSlapDir(idx === 0 ? 'l' : 'r');
      setMood('angry');
      setCombo(0);

      // 오답 페널티: -2초
      setTimeLeft(prev => Math.max(0, prev - 2));
      setTimePen({ text: '-2초!', type: 'bad' });
      setTimeout(() => setTimePen(null), 1000);

      if (!missed.some(m => m.id === current.id)) {
        setMissed(prev => [...prev, current]);
      }
      setClean(prev => new Set(prev).add(current.id)); // 완료 처리

      const isLastWord = clean.size + 1 >= words.length;

      setTimeout(() => {
        setMood('idle');
        setSlapDir(null);
        if (isLastWord) {
          if (timerRef.current) clearInterval(timerRef.current);
          setStageClear(true);
          setClearTime(GAME_TIME - timeLeft);
          setGameOver(true);
        } else {
          nextQuestion();
        }
      }, 800);
    }
  };

  const getSizeClass = (text: string) => {
    if (text.length > 14) return 'xs';
    if (text.length > 8) return 'sm';
    return '';
  };

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

  const fusePercent = (timeLeft / GAME_TIME) * 100;

  // 카운트다운 화면
  if (countdown !== null) {
    return (
      <div className="bn-game">
        <div className="bn-header">
          <button className="bn-back-btn" onClick={onBack}>← 목록</button>
          <div className="bn-title">🍌 바나나 받아먹기</div>
          <div className="bn-progress-text">0 / {words.length}</div>
        </div>
        <div className="bn-timer-area">
          <div className="bn-timer-display">{formatTime(GAME_TIME)}</div>
          <div className="bn-fuse-bar">
            <div className="bn-fuse-fill" style={{ width: '100%' }} />
            <div className="bn-fuse-fire" style={{ left: '100%' }}>🔥</div>
            <div className="bn-fuse-bomb">💣</div>
          </div>
        </div>
        <div className="bn-countdown">
          <div className="bn-countdown-num">{countdown}</div>
        </div>
      </div>
    );
  }

  if (gameOver) {
    return (
      <div className="bn-game">
        {/* 헤더 - 타이머 고정 표시 */}
        <div className="bn-header">
          <button className="bn-back-btn" onClick={onBack}>← 목록</button>
          <div className="bn-title">🍌 바나나 받아먹기</div>
          <div className="bn-progress-text">{clean.size} / {words.length}</div>
        </div>
        <div className="bn-timer-area">
          <div className="bn-timer-display">{formatTime(timeLeft)}</div>
          {timePen && <div className={`bn-time-pen ${timePen.type}`}>{timePen.text}</div>}
          <div className="bn-fuse-bar">
            <div className="bn-fuse-fill" style={{ width: `${fusePercent}%` }} />
            <div className="bn-fuse-fire" style={{ left: `${fusePercent}%` }}>🔥</div>
            <div className="bn-fuse-bomb">💣</div>
          </div>
        </div>

        {/* 콤보 표시 */}
        {combo >= 2 && !gameOver && (
          <div className="bn-combo">🔥 {combo}연속!</div>
        )}

        {stageClear ? (
          <div className="bn-clear">
            <div className="bn-clear-crown">👑</div>
            <div className="bn-clear-title">STAGE CLEAR!</div>
            <div className="bn-clear-stars">{getStars()}</div>
            <div className="bn-clear-time">{formatTime(clearTime)} 만에 클리어 (제한 {formatTime(GAME_TIME)})</div>
            {missed.length > 0 && (
              <div className="bn-clear-missed">
                <div className="bn-clear-missed-title">다시 볼 단어</div>
                <div className="bn-clear-missed-list">
                  {missed.map((w, i) => (
                    <span key={w.id}>{w.english} - {w.korean}{i < missed.length - 1 ? ', ' : ''}</span>
                  ))}
                </div>
              </div>
            )}
            <div className="bn-clear-btns">
              <button className="bn-clear-btn secondary" onClick={() => window.location.reload()}>다시 하기</button>
              <button className="bn-clear-btn primary" onClick={onNextStage || onBack}>다음 스테이지 ▶</button>
              <button className="bn-clear-btn secondary" onClick={onBack}>목록</button>
            </div>
          </div>
        ) : (
          <div className="bn-result">
            <div className="bn-result-emoji">
              {clean.size >= words.length * 0.8 ? '🎉' : '🍌'}
            </div>
            <div className="bn-result-score">{clean.size} / {words.length}</div>
            <div className="bn-result-msg">
              {clean.size >= words.length * 0.8 ? '잘했어요!' : '다시 도전해요!'}
            </div>
            <button className="bn-result-btn" onClick={onBack}>← 게임 목록</button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bn-game">
      {/* 헤더 */}
      <div className="bn-header">
        <button className="bn-back-btn" onClick={onBack}>← 목록</button>
        <div className="bn-title">🍌 바나나 받아먹기</div>
        <div className="bn-progress-text">{clean.size} / {words.length}</div>
      </div>

      {/* 타이머 */}
      <div className="bn-timer-area">
        <div className="bn-timer-display">{formatTime(timeLeft)}</div>
        <div className="bn-fuse-bar">
          <div className="bn-fuse-fill" style={{ width: `${fusePercent}%` }} />
          <div className="bn-fuse-fire" style={{ left: `${fusePercent}%` }}>🔥</div>
          <div className="bn-fuse-bomb">💣</div>
        </div>
      </div>

      {/* 바나나 점수 */}
      <div className="bn-score-row">
        <span className="bn-banana-count">🍌 {banana}</span>
        {combo >= 2 && <span className="bn-combo">🔥 {combo}연속!</span>}
      </div>

      {/* 단어 카드 */}
      <div className="bn-word-card">
        <button className="bn-speak-btn" onClick={() => current && speak(current.english)}>🔊</button>
        <div className="bn-english">{current?.english || ''}</div>
      </div>

      {/* 안내 */}
      <div className="bn-hint">알맞은 뜻의 바나나를 탭해서 원숭이에게 주세요! 🍌</div>

      {/* 게임 씬 */}
      <div className="bn-scene">
        {/* 바나나들 */}
        <div className="bn-bananas">
          {[0, 1].map(idx => (
            <button
              key={idx}
              ref={el => { bananaRefs.current[idx] = el; }}
              className={`bn-banana ${dropReady ? 'drop' : ''} ${pickedIdx === idx ? (isCorrect ? 'throw' : 'slapped') : ''}`}
              onClick={() => handlePick(idx)}
              disabled={locked}
              style={pickedIdx === idx ? throwStyle : undefined}
            >
              <BananaSVG />
              <span className={`bn-banana-text ${getSizeClass(options[idx])}`}>{options[idx]}</span>
            </button>
          ))}
        </div>

        {/* 원숭이 */}
        <div className="bn-monkey-area">
          <div className="bn-monkey-wrap" ref={monkeyRef}>
            <div className={`bn-monkey ${mood}`}>
              <MonkeySVG mood={mood} />
            </div>
            <div className={`bn-hand ${slapDir ? `slap-${slapDir}` : ''}`}>✋🏾</div>
            <span className={`bn-rage ${mood === 'angry' ? 'show' : ''}`}>💢</span>
          </div>
          <div className="bn-ground" />
        </div>
      </div>
    </div>
  );
}

function MonkeySVG({ mood }: { mood: MonkeyMood }) {
  const D = '#8b5a2b', F = '#f6d7ac', K = '#2b1d14', OL = '#5a3615';

  const vkEye = (cx: number, cy: number, rx: number, ry: number) => (
    <>
      <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={K}/>
      <ellipse cx={cx + 1.5} cy={cy - 1.5} rx={rx * 0.35} ry={ry * 0.35} fill="#fff"/>
    </>
  );

  let eyes, brows = null, mouth, extra = null;

  if (mood === 'happy') {
    eyes = (
      <>
        <path d="M38 58 Q46 46 54 58" stroke={K} strokeWidth="4.5" fill="none" strokeLinecap="round"/>
        <path d="M66 58 Q74 46 82 58" stroke={K} strokeWidth="4.5" fill="none" strokeLinecap="round"/>
      </>
    );
    mouth = (
      <>
        <path d="M47 77 Q60 99 73 77 Z" fill="#7a1f2b" stroke="#5a1220" strokeWidth="1" strokeLinejoin="round"/>
        <ellipse cx="60" cy="89" rx="7.5" ry="4.2" fill="#ff8aa0"/>
      </>
    );
    extra = (
      <>
        <ellipse cx="33" cy="72" rx="8" ry="5.5" fill="url(#vk-bl)"/>
        <ellipse cx="87" cy="72" rx="8" ry="5.5" fill="url(#vk-bl)"/>
      </>
    );
  } else if (mood === 'eat') {
    eyes = (
      <>
        <path d="M38 56 Q46 45 54 56" stroke={K} strokeWidth="4.5" fill="none" strokeLinecap="round"/>
        <path d="M66 56 Q74 45 82 56" stroke={K} strokeWidth="4.5" fill="none" strokeLinecap="round"/>
      </>
    );
    mouth = (
      <>
        <ellipse cx="60" cy="80" rx="19" ry="17" fill="#6b1522" stroke="#4a0d18" strokeWidth="2"/>
        <path d="M45 71 Q60 78 75 71 Q74 66 60 66 Q46 66 45 71 Z" fill="#fff"/>
        <ellipse cx="60" cy="90" rx="12" ry="6.5" fill="#ff7f98"/>
        <path d="M60 84 V93" stroke="#e45a78" strokeWidth="1.5"/>
      </>
    );
    extra = (
      <>
        <ellipse cx="31" cy="70" rx="8" ry="5.5" fill="url(#vk-bl)"/>
        <ellipse cx="89" cy="70" rx="8" ry="5.5" fill="url(#vk-bl)"/>
      </>
    );
  } else if (mood === 'angry') {
    eyes = (
      <>
        {vkEye(47, 59, 4.8, 5.2)}
        {vkEye(73, 59, 4.8, 5.2)}
      </>
    );
    brows = (
      <>
        <path d="M33 43 L56 54" stroke={K} strokeWidth="6" strokeLinecap="round"/>
        <path d="M87 43 L64 54" stroke={K} strokeWidth="6" strokeLinecap="round"/>
      </>
    );
    mouth = (
      <>
        <path d="M45 90 Q60 71 75 90 Q60 82 45 90 Z" fill="#7a1f2b"/>
        <path d="M52 84 L55 88 L58 83 M62 83 L65 88 L68 84" stroke="#fff" strokeWidth="2.2" fill="none" strokeLinejoin="round"/>
      </>
    );
    extra = <circle cx="60" cy="55" r="40" fill="url(#vk-rg)"/>;
  } else {
    eyes = (
      <>
        {vkEye(47, 57, 5.2, 5.8)}
        {vkEye(73, 57, 5.2, 5.8)}
      </>
    );
    mouth = <path d="M50 78 Q60 88 70 78" stroke={K} strokeWidth="3" fill="none" strokeLinecap="round"/>;
  }

  return (
    <svg viewBox="0 0 120 140" style={{ width: '100%', height: 'auto', display: 'block' }}>
      <defs>
        <radialGradient id="mk-g" cx="45%" cy="35%">
          <stop offset="0%" stopColor="#b8864a"/>
          <stop offset="100%" stopColor={D}/>
        </radialGradient>
        <radialGradient id="vk-bl" cx="50%" cy="50%">
          <stop offset="0%" stopColor="#ffb0c0"/>
          <stop offset="100%" stopColor="#ff8090" stopOpacity="0"/>
        </radialGradient>
        <radialGradient id="vk-rg" cx="50%" cy="50%">
          <stop offset="0%" stopColor="#ff3030" stopOpacity="0.25"/>
          <stop offset="100%" stopColor="#ff0000" stopOpacity="0"/>
        </radialGradient>
      </defs>

      {/* 꼬리 */}
      <path d="M90 118 Q116 112 110 88" stroke={OL} strokeWidth="11" fill="none" strokeLinecap="round"/>
      <path d="M90 118 Q116 112 110 88" stroke={D} strokeWidth="7.5" fill="none" strokeLinecap="round"/>

      {/* 몸통 */}
      <ellipse cx="60" cy="114" rx="31" ry="20" fill="url(#mk-g)" stroke={OL} strokeWidth="2"/>
      <ellipse cx="60" cy="116" rx="19" ry="13" fill={F}/>
      <ellipse cx="54" cy="111" rx="9" ry="4" fill="#fff" opacity="0.35"/>

      {/* 귀 */}
      <circle cx="17" cy="56" r="14" fill="url(#mk-g)" stroke={OL} strokeWidth="2"/>
      <circle cx="17" cy="57" r="8" fill={F}/>
      <circle cx="103" cy="56" r="14" fill="url(#mk-g)" stroke={OL} strokeWidth="2"/>
      <circle cx="103" cy="57" r="8" fill={F}/>

      {/* 머리 */}
      <circle cx="60" cy="55" r="40" fill="url(#mk-g)" stroke={OL} strokeWidth="2"/>

      {/* 얼굴 */}
      <path d="M60 41 C40 28 21 50 34 69 C38 92 82 92 86 69 C99 50 80 28 60 41 Z" fill={F} stroke="#e0b685" strokeWidth="1"/>
      <ellipse cx="42" cy="26" rx="14" ry="5" transform="rotate(-24 42 26)" fill="#fff" opacity="0.28"/>

      {/* 콧구멍 */}
      <ellipse cx="56" cy="71" rx="1.8" ry="2.4" fill="#6b3f1c"/>
      <ellipse cx="64" cy="71" rx="1.8" ry="2.4" fill="#6b3f1c"/>

      {mouth}
      {eyes}
      {brows}
      {extra}
    </svg>
  );
}

// 바나나 이미지 (HTML 원본 PNG)
const BANANA_PNG = 'data:image/png;base64,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';

function BananaSVG() {
  return (
    <img
      className="bn-banana-img"
      src={BANANA_PNG}
      alt=""
    />
  );
}
