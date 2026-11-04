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

export default function ListenGame({ words, allWords, dayId, onFinish, onBack }: Props) {
  const [round, setRound] = useState(1);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [rightCount, setRightCount] = useState(0);
  const [wrongWords, setWrongWords] = useState<Word[]>([]);
  const [allMissed, setAllMissed] = useState<Word[]>([]);
  const [done, setDone] = useState<Set<number>>(new Set());
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [timeLeft, setTimeLeft] = useState(GAME_TIME);
  const [gameOver, setGameOver] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(3);
  const [gameStarted, setGameStarted] = useState(false);
  const [showRetry, setShowRetry] = useState(false);

  const timerRef = useRef<number | null>(null);
  const scoreRef = useRef(0);

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
    setWrongWords([]);
    setRound(1);

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
      setDone(prev => new Set(prev).add(q.word.id));
      scoreRef.current += 1;
    } else {
      playWrongSound();
      setWrongWords(prev => [...prev, q.word]);
      if (!allMissed.some(w => w.id === q.word.id)) {
        setAllMissed(prev => [...prev, q.word]);
      }
      // Penalty
      setTimeLeft(prev => Math.max(0, prev - 3));
    }

    setShowResult(true);

    // Next question after delay
    setTimeout(() => {
      setSelectedIdx(null);
      setShowResult(false);

      if (currentIdx < questions.length - 1) {
        const nextIdx = currentIdx + 1;
        setCurrentIdx(nextIdx);
        // Speak next word
        setTimeout(() => {
          if (questions[nextIdx]) speak(questions[nextIdx].word.english);
        }, 200);
      } else {
        // Round finished
        if (wrongWords.length > 0 || (idx !== q.correctIdx)) {
          // Has wrong answers - start new round
          const newWrongWords = idx !== q.correctIdx
            ? [...wrongWords, q.word]
            : wrongWords;

          if (newWrongWords.length > 0) {
            setShowRetry(true);
            setTimeout(() => {
              setShowRetry(false);
              setRound(prev => prev + 1);
              const newQs = buildQuestions(newWrongWords);
              setQuestions(newQs);
              setCurrentIdx(0);
              setWrongWords([]);
              // Speak first word of new round
              setTimeout(() => {
                if (newQs[0]) speak(newQs[0].word.english);
              }, 200);
            }, 1500);
          } else {
            // All correct
            if (timerRef.current) clearInterval(timerRef.current);
            setGameOver(true);
          }
        } else {
          // All correct this round
          if (timerRef.current) clearInterval(timerRef.current);
          setGameOver(true);
        }
      }
    }, isCorrect ? 700 : 1300);
  };

  const currentQ = questions[currentIdx];
  const fusePercent = (timeLeft / GAME_TIME) * 100;
  const labels = ['A', 'B', 'C', 'D'];
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeDisplay = `${minutes}:${seconds.toString().padStart(2, '0')}`;

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
          <div className="ls-fuse-fill" style={{ width: `${fusePercent}%` }} />
          <div className="ls-fuse-fire" style={{ left: `calc(${fusePercent}% + 2px)` }}>🔥</div>
          <div className="ls-fuse-bomb">💣</div>
        </div>
      </div>

      {/* Countdown */}
      {countdown !== null && (
        <div className="ls-countdown">
          <div className="ls-countdown-num" key={countdown}>{countdown}</div>
        </div>
      )}

      {/* Game Over */}
      {gameOver && (
        <div className="ls-result">
          <div className="ls-result-emoji">
            {done.size === words.length ? '👑' : done.size >= words.length * 0.8 ? '🎉' : '🎧'}
          </div>
          <div className="ls-result-score">{done.size} / {words.length}</div>
          <div className="ls-result-msg">
            {done.size === words.length ? '완벽해요!' : done.size >= words.length * 0.8 ? '잘했어요!' : '다시 도전해요!'}
          </div>
          <button className="ls-result-btn" onClick={onBack}>목록으로</button>
        </div>
      )}

      {/* Retry message */}
      {showRetry && (
        <div className="ls-retry">
          <div className="ls-retry-emoji">🔁</div>
          <div className="ls-retry-title">틀린 {wrongWords.length + (selectedIdx !== null && selectedIdx !== currentQ?.correctIdx ? 1 : 0)}개를 다시 풀어봐요!</div>
          <div className="ls-retry-sub">모두 맞힐 때까지 계속돼요</div>
        </div>
      )}

      {/* Game Scene */}
      {gameStarted && !gameOver && countdown === null && !showRetry && currentQ && (
        <div className="ls-scene">
          {/* Counter */}
          <div className="ls-counter">
            {round > 1 && <span className="ls-round">🔁 {round}라운드 · 틀린 문제 다시! · </span>}
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
