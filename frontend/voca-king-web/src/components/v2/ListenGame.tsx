/**
 * 듣고 고르기 게임 (Stage 4)
 * 영어 발음을 듣고 알맞은 한글 뜻 선택
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { speak } from '../../utils/tts';
import type { Word } from '../../types';
import './ListenGame.css';

interface Props {
  words: Word[];
  allWords: Word[];
  dayId: number;
  onFinish: (score: number, total: number) => void;
  onBack: () => void;
  onFinalTest?: () => void;
}

const GAME_TIME = 60;

function shuffleArray<T>(array: T[]): T[] {
  const a = [...array];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

interface Question {
  word: Word;
  choices: string[];
  correctIdx: number;
  answered: boolean;
}

// Audio context for sound effects
let audioCtx: AudioContext | null = null;
function getAudioCtx() {
  if (!audioCtx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AC) audioCtx = new AC();
  }
  if (audioCtx?.state === 'suspended') audioCtx.resume();
  return audioCtx;
}

// 모바일 오디오 언락 (컴포넌트 마운트 시 호출)
function unlockAudio() {
  // AudioContext 초기화
  getAudioCtx();

  // 무음 오디오 재생으로 HTML5 Audio 언락
  const silentAudio = new Audio('data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAABhgC7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7//////////////////////////////////////////////////////////////////8AAAAATGF2YzU4LjEzAAAAAAAAAAAAAAAAJAAAAAAAAAAAAYYoRwmHAAAAAAD/+1DEAAAGAAGn9AAAIgAANIAAAAQAAAGkAAAAIAAANIAAAARMQU1FMy4xMDBVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV');
  silentAudio.play().catch(() => {});

  // Web Speech API 초기화
  if ('speechSynthesis' in window) {
    window.speechSynthesis.getVoices();
  }
}

function playCorrectSound() {
  const ctx = getAudioCtx();
  if (!ctx) return;
  const now = ctx.currentTime;
  [523, 659, 784].forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.15, now + i * 0.08);
    gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.08 + 0.2);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now + i * 0.08);
    osc.stop(now + i * 0.08 + 0.25);
  });
}

function playWrongSound() {
  const ctx = getAudioCtx();
  if (!ctx) return;
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(200, now);
  osc.frequency.exponentialRampToValueAtTime(100, now + 0.3);
  gain.gain.setValueAtTime(0.12, now);
  gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.35);
}

export default function ListenGame({ words, allWords, dayId, onFinish, onBack, onFinalTest }: Props) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [rightCount, setRightCount] = useState(0);
  const [allMissed, setAllMissed] = useState<Word[]>([]);
  const [done, setDone] = useState<Set<number>>(new Set());
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [timeLeft, setTimeLeft] = useState(GAME_TIME);
  const [gameOver, setGameOver] = useState(false);
  const [stageClear, setStageClear] = useState(false);
  const [clearTime, setClearTime] = useState(0);
  const [showReady, setShowReady] = useState(true);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [combo, setCombo] = useState(0);
  const [timePen, setTimePen] = useState<{ text: string; type: 'good' | 'bad' } | null>(null);

  const timerRef = useRef<number | null>(null);
  const scoreRef = useRef(0);

  // Ready 버튼 클릭 시 오디오 언락 + 카운트다운 시작
  const handleReady = () => {
    unlockAudio();
    setShowReady(false);
    setCountdown(3);
  };

  // Build questions from words
  const buildQuestions = useCallback((wordList: Word[]): Question[] => {
    const pool = allWords.length > 0 ? allWords : words;
    return shuffleArray(wordList).map(word => {
      const distractors = shuffleArray(pool.filter(w => w.id !== word.id))
        .slice(0, 3)
        .map(w => w.korean);
      const choices = shuffleArray([word.korean, ...distractors]);
      const correctIdx = choices.indexOf(word.korean);
      return { word, choices, correctIdx, answered: false };
    });
  }, [allWords, words]);

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
    if (!gameStarted) return;
    const qs = buildQuestions(words);
    setQuestions(qs);
    setCurrentIdx(0);
    setRightCount(0);

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

    // Play first word
    setTimeout(() => {
      if (qs[0]) speak(qs[0].word.english);
    }, 300);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameStarted, words, buildQuestions]);

  // Game over effect
  useEffect(() => {
    if (gameOver) {
      const score = scoreRef.current;
      const total = words.length;
      // 완벽 클리어 시 직접 localStorage에 저장
      if (score === total) {
        try {
          const saved = localStorage.getItem('voca-king-listen-cleared');
          const clearedDays: number[] = saved ? JSON.parse(saved) : [];
          if (!clearedDays.includes(dayId)) {
            clearedDays.push(dayId);
            localStorage.setItem('voca-king-listen-cleared', JSON.stringify(clearedDays));
          }
        } catch (e) {
          console.error('Failed to save listen clear state', e);
        }
      }
      onFinish(score, total);
    }
  }, [gameOver, words.length, dayId, onFinish]);

  const handleSpeak = () => {
    const q = questions[currentIdx];
    if (q && !gameOver) {
      speak(q.word.english);
    }
  };

  const handleAnswer = (idx: number) => {
    if (gameOver || selectedIdx !== null) return;

    const q = questions[currentIdx];
    if (!q || q.answered) return;

    setSelectedIdx(idx);
    q.answered = true;

    const isCorrect = idx === q.correctIdx;

    if (isCorrect) {
      playCorrectSound();
      setRightCount(prev => prev + 1);
      scoreRef.current += 1;
      const newCombo = combo + 1;
      setCombo(newCombo);

      // 5연속 정답 보너스: +3초
      if (newCombo > 0 && newCombo % 5 === 0) {
        setTimeLeft(prev => prev + 3);
        setTimePen({ text: '+3초!', type: 'good' });
        setTimeout(() => setTimePen(null), 1000);
      }
    } else {
      playWrongSound();
      setCombo(0); // 콤보 리셋
      // 오답: missed에 추가
      if (!allMissed.some(w => w.id === q.word.id)) {
        setAllMissed(prev => [...prev, q.word]);
      }
      // 오답 페널티: -3초 표시
      setTimePen({ text: '-3초!', type: 'bad' });
      setTimeout(() => setTimePen(null), 1000);
      setTimeLeft(prev => Math.max(0, prev - 3));
    }

    // 완료 처리 (정답/오답 무관하게)
    setDone(prev => new Set(prev).add(q.word.id));
    setShowResult(true);

    // Next question after delay
    setTimeout(() => {
      setSelectedIdx(null);
      setShowResult(false);

      if (currentIdx < questions.length - 1) {
        // 다음 문제로
        const nextIdx = currentIdx + 1;
        setCurrentIdx(nextIdx);
        setTimeout(() => {
          if (questions[nextIdx]) speak(questions[nextIdx].word.english);
        }, 200);
      } else {
        // 모든 문제 완료 - 게임 종료
        if (timerRef.current) clearInterval(timerRef.current);
        setStageClear(true);
        setClearTime(GAME_TIME - timeLeft);
        setGameOver(true);
      }
    }, isCorrect ? 700 : 1300);
  };

  const currentQ = questions[currentIdx];
  const fusePercent = (timeLeft / GAME_TIME) * 100;
  const labels = ['A', 'B', 'C', 'D'];
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeDisplay = `${minutes}:${seconds.toString().padStart(2, '0')}`;

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // Star rating: 3 stars = no missed, 2 stars = 1-2 missed, 1 star = 3+ missed
  const getStars = () => {
    if (allMissed.length === 0) return '★★★';
    if (allMissed.length <= 2) return '★★☆';
    return '★☆☆';
  };

  return (
    <div className="ls-game">
      {/* Header */}
      <div className="ls-header">
        <button className="ls-back-btn" onClick={onBack}>← 목록</button>
        <div className="ls-title">🎧 듣고 고르기</div>
        <div className="ls-progress-text">{done.size} / {words.length}</div>
      </div>

      {/* Timer */}
      <div className="ls-timer-area">
        <div className="ls-timer-display">{timeDisplay}</div>
        <div className="ls-fuse-bar">
          <div className="ls-fuse-fill" style={{ left: `${100 - fusePercent}%`, right: 0 }} />
          <div className="ls-fuse-fire" style={{ left: `${100 - fusePercent}%` }}>🔥</div>
          {timePen && <div className={`ls-time-pen ${timePen.type}`} style={{ left: `${100 - fusePercent}%` }}>{timePen.text}</div>}
          <div className="ls-fuse-bomb">💣</div>
        </div>
        {/* 콤보 - 타이머 오른쪽에 표시 */}
        <div className="ls-combo-area">{combo >= 2 && gameStarted && countdown === null ? `🔥 ${combo}연속!` : ''}</div>
      </div>

      {/* Ready Screen */}
      {showReady && (
        <div className="ls-ready">
          <div className="ls-ready-emoji">🎧</div>
          <div className="ls-ready-title">듣고 고르기</div>
          <div className="ls-ready-desc">영어 발음을 듣고 알맞은 뜻을 선택하세요</div>
          <button className="ls-ready-btn" onClick={handleReady}>시작하기</button>
        </div>
      )}

      {/* Countdown */}
      {countdown !== null && (
        <div className="ls-countdown">
          <div className="ls-countdown-num" key={countdown}>{countdown}</div>
        </div>
      )}

      {/* Game Over */}
      {gameOver && (
        stageClear ? (
          <div className="ls-clear">
            <div className="ls-clear-crown">👑</div>
            <div className="ls-clear-title">STAGE CLEAR!</div>
            <div className="ls-clear-stars">{getStars()}</div>
            <div className="ls-clear-time">{formatTime(clearTime)} 만에 클리어 (제한 {formatTime(GAME_TIME)})</div>
            <div className="ls-clear-final-msg">🎉 4개 스테이지 모두 클리어! 파이널테스트에 도전하세요</div>
            {allMissed.length > 0 && (
              <div className="ls-clear-missed">
                <div className="ls-clear-missed-title">다시 볼 단어</div>
                <div className="ls-clear-missed-list">
                  {allMissed.map((w, i) => (
                    <span key={w.id}>{w.english} - {w.korean}{i < allMissed.length - 1 ? ', ' : ''}</span>
                  ))}
                </div>
              </div>
            )}
            <div className="ls-clear-btns">
              <button className="ls-clear-btn secondary" onClick={() => window.location.reload()}>다시 하기</button>
              <button className="ls-clear-btn primary" onClick={onFinalTest || onBack}>파이널테스트로 ▶</button>
              <button className="ls-clear-btn secondary" onClick={onBack}>목록</button>
            </div>
          </div>
        ) : (
          <div className="ls-result">
            <div className="ls-result-emoji">
              {done.size >= words.length * 0.8 ? '🎉' : '🎧'}
            </div>
            <div className="ls-result-score">{done.size} / {words.length}</div>
            <div className="ls-result-msg">
              {done.size >= words.length * 0.8 ? '잘했어요!' : '다시 도전해요!'}
            </div>
            <button className="ls-result-btn" onClick={onBack}>목록으로</button>
          </div>
        )
      )}

      {/* Game Scene */}
      {gameStarted && !gameOver && countdown === null && currentQ && (
        <div className="ls-scene">
          {/* Counter */}
          <div className="ls-counter">
            {currentIdx + 1} / {questions.length} · 맞은 개수 {rightCount}
          </div>

          {/* Question Card */}
          <div className="ls-card">
            <button className="ls-play-btn" onClick={handleSpeak}>🔊</button>
            <div className="ls-card-content">
              <div className="ls-word">
                {showResult ? currentQ.word.english : ' '}
              </div>
              <div className="ls-hint">
                발음을 듣고 알맞은 뜻을 고르세요 (🔊 다시 듣기)
              </div>
            </div>
          </div>

          {/* Choices */}
          <div className="ls-choices">
            {currentQ.choices.map((choice, idx) => {
              let className = 'ls-choice';
              if (showResult) {
                if (idx === currentQ.correctIdx) className += ' correct';
                else if (idx === selectedIdx) className += ' wrong';
              }
              return (
                <button
                  key={idx}
                  className={className}
                  onClick={() => handleAnswer(idx)}
                  disabled={showResult}
                >
                  <span className="ls-choice-label">{labels[idx]}</span>
                  <span className="ls-choice-text">{choice}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
