/**
 * VOCA KING V2 홈 페이지
 * 숲/지도 테마 UI + 게임형 학습
 */
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useWordStore } from '../stores/wordStore';
import { speak, initTTS } from '../utils/tts';
import { recordAttempt, saveQuizResult } from '../services/api';
import type { Word } from '../types';
import type { AttemptRequest } from '../services/api';
import SceneBackground from '../components/v2/SceneBackground';
import BananaGame from '../components/v2/BananaGame';
import AnimalGame from '../components/v2/AnimalGame';
import ListenGame from '../components/v2/ListenGame';
import { useBgm } from '../hooks/useBgm';
import '../styles/v2-theme.css';

// Audio context for quiz sound effects
let quizAudioCtx: AudioContext | null = null;
function getQuizAudioCtx() {
  if (!quizAudioCtx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AC) quizAudioCtx = new AC();
  }
  if (quizAudioCtx?.state === 'suspended') quizAudioCtx.resume();
  return quizAudioCtx;
}

function playCorrectSound() {
  const ctx = getQuizAudioCtx();
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
  const ctx = getQuizAudioCtx();
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

type ViewMode = 'cards' | 'selftest' | 'final';
type GameType = 'flash' | 'match' | 'pop' | 'listen' | null;

// SVG 아이콘 컴포넌트들
const FlashIcon = () => (
  <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" width="48" height="48">
    <rect x="10" y="14" width="34" height="42" rx="7" transform="rotate(-12 27 35)" fill="#9aa0ff" stroke="#6b72d6" strokeWidth="2"/>
    <rect x="18" y="10" width="34" height="42" rx="7" transform="rotate(8 35 31)" fill="#fff" stroke="#8b92e8" strokeWidth="2"/>
    <path d="M28 24 H44 M28 32 H40" stroke="#8b92e8" strokeWidth="3.5" strokeLinecap="round"/>
    <path d="M50 6 l2.4 5.6 5.6 2.4-5.6 2.4L50 22l-2.4-5.6L42 14l5.6-2.4z" fill="#ffd54a" stroke="#e0a000" strokeWidth="1.2" strokeLinejoin="round"/>
  </svg>
);

const ListenIcon = () => (
  <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" width="48" height="48">
    <path d="M12 38 V32 a20 20 0 0 1 40 0 V38" fill="none" stroke="#2f7fa8" strokeWidth="5" strokeLinecap="round"/>
    <rect x="7" y="34" width="12" height="20" rx="6" fill="#4cc2e8" stroke="#2f7fa8" strokeWidth="2.5"/>
    <rect x="45" y="34" width="12" height="20" rx="6" fill="#4cc2e8" stroke="#2f7fa8" strokeWidth="2.5"/>
    <path d="M32 30 q4 4 0 8 M37 26 q8 8 0 16" stroke="#ff8aa0" strokeWidth="3.2" fill="none" strokeLinecap="round"/>
    <circle cx="26" cy="34" r="3" fill="#ff8aa0"/>
  </svg>
);

const BananaIcon = () => (
  <span style={{ fontSize: '38px', lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '48px', height: '48px' }}>🍌</span>
);

const BearIcon = () => (
  <span style={{ fontSize: '38px', lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '48px', height: '48px' }}>🐻</span>
);

const STAGE_ICONS: Record<string, React.FC> = {
  flash: FlashIcon,
  match: BananaIcon,
  pop: BearIcon,
  listen: ListenIcon,
};

const GAME_STAGES = [
  { id: 'flash' as const, no: 1, name: '플래시카드', theme: 'v2-t-flash' },
  { id: 'match' as const, no: 2, name: '바나나 받아먹기', theme: 'v2-t-match' },
  { id: 'pop' as const, no: 3, name: '동물 구출 팡팡', theme: 'v2-t-pop' },
  { id: 'listen' as const, no: 4, name: '듣고 고르기', theme: 'v2-t-listen' },
];

const LEVEL_EMOJIS: Record<number, string> = {
  1: '🐣', 2: '🐥', 3: '🌱', 4: '🚀', 5: '🧱',
  6: '🧭', 7: '🦄', 8: '🐲', 9: '👑', 10: '💎', 11: '🏆', 12: '🏆'
};

export default function HomePageV2() {
  const { user, logout } = useAuthStore();
  const {
    levels, days, currentDay, currentLevelId,
    fetchLevels, setCurrentLevel, setCurrentDay, allWordsInLevel,
  } = useWordStore();

  const [viewMode, setViewMode] = useState<ViewMode>('cards');
  const [activeGame, setActiveGame] = useState<GameType>(null);
  const [playingWordId, setPlayingWordId] = useState<number | null>(null);
  const [flashIndex, setFlashIndex] = useState(0);
  const [showKorean, setShowKorean] = useState(false);
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizChoices, setQuizChoices] = useState<string[]>([]);
  const [quizAnswered, setQuizAnswered] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [quizAttempts, setQuizAttempts] = useState<AttemptRequest[]>([]);
  const [shuffledQuizWords, setShuffledQuizWords] = useState<Word[]>([]);
  const [showMusicPanel, setShowMusicPanel] = useState(false);
  const [seenCards, setSeenCards] = useState<Set<number>>(new Set());
  const [flashReplaying, setFlashReplaying] = useState(false); // 다시하기 모드
  const [flashClearedDays, setFlashClearedDays] = useState<Set<number>>(() => {
    try {
      const saved = localStorage.getItem('voca-king-flash-cleared');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch { return new Set(); }
  });
  const [bananaClearedDays, setBananaClearedDays] = useState<Set<number>>(() => {
    try {
      const saved = localStorage.getItem('voca-king-banana-cleared');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch { return new Set(); }
  });
  const [animalClearedDays, setAnimalClearedDays] = useState<Set<number>>(() => {
    try {
      const saved = localStorage.getItem('voca-king-animal-cleared');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch { return new Set(); }
  });
  const [listenClearedDays, setListenClearedDays] = useState<Set<number>>(() => {
    try {
      const saved = localStorage.getItem('voca-king-listen-cleared');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch { return new Set(); }
  });

  const dayScrollRef = useRef<HTMLDivElement>(null);
  const levelScrollRef = useRef<HTMLDivElement>(null);
  const [levelDragging, setLevelDragging] = useState(false);
  const [levelStartX, setLevelStartX] = useState(0);
  const [levelScrollLeft, setLevelScrollLeft] = useState(0);
  const [dayDragging, setDayDragging] = useState(false);
  const [dayStartX, setDayStartX] = useState(0);
  const [dayScrollLeftPos, setDayScrollLeftPos] = useState(0);
  const bgm = useBgm();
  const bgmStartRef = useRef(bgm.start);
  bgmStartRef.current = bgm.start;

  // 첫 클릭 시 배경음악 자동 재생 (브라우저 정책상 사용자 상호작용 필요)
  useEffect(() => {
    let started = false;
    const startBgmOnFirstClick = () => {
      if (!started) {
        started = true;
        bgmStartRef.current();
      }
      document.removeEventListener('click', startBgmOnFirstClick);
      document.removeEventListener('touchstart', startBgmOnFirstClick);
    };
    document.addEventListener('click', startBgmOnFirstClick);
    document.addEventListener('touchstart', startBgmOnFirstClick);
    return () => {
      document.removeEventListener('click', startBgmOnFirstClick);
      document.removeEventListener('touchstart', startBgmOnFirstClick);
    };
  }, []);

  useEffect(() => { fetchLevels(); initTTS(); }, [fetchLevels]);
  useEffect(() => { if (levels.length > 0 && !currentLevelId) setCurrentLevel(levels[0].id); }, [levels, currentLevelId, setCurrentLevel]);
  useEffect(() => { if (days.length > 0 && !currentDay) setCurrentDay(days[0].id); }, [days, currentDay, setCurrentDay]);
  useEffect(() => {
    setFlashIndex(0); setShowKorean(false); setShuffledQuizWords([]);
    setQuizIndex(0); setQuizScore(0); setQuizFinished(false); setQuizChoices([]);
    setActiveGame(null); setSeenCards(new Set());
  }, [currentDay?.id, currentLevelId]);

  // 게임에서 돌아올 때 localStorage에서 클리어 상태 다시 읽기
  useEffect(() => {
    if (activeGame === null) {
      try {
        const savedBanana = localStorage.getItem('voca-king-banana-cleared');
        if (savedBanana) setBananaClearedDays(new Set(JSON.parse(savedBanana)));
        const savedAnimal = localStorage.getItem('voca-king-animal-cleared');
        if (savedAnimal) setAnimalClearedDays(new Set(JSON.parse(savedAnimal)));
        const savedListen = localStorage.getItem('voca-king-listen-cleared');
        if (savedListen) setListenClearedDays(new Set(JSON.parse(savedListen)));
      } catch { /* ignore */ }
    }
  }, [activeGame]);

  // 현재 Day의 클리어 여부
  const flashCleared = currentDay ? (seenCards.size >= currentDay.words.length || flashClearedDays.has(currentDay.id)) : false;
  const bananaCleared = currentDay ? bananaClearedDays.has(currentDay.id) : false;
  const animalCleared = currentDay ? animalClearedDays.has(currentDay.id) : false;
  const listenCleared = currentDay ? listenClearedDays.has(currentDay.id) : false;

  // 모든 카드를 보면 클리어 상태 저장 + 다시하기 모드 해제
  useEffect(() => {
    if (currentDay && seenCards.size >= currentDay.words.length) {
      if (!flashClearedDays.has(currentDay.id)) {
        const newSet = new Set(flashClearedDays).add(currentDay.id);
        setFlashClearedDays(newSet);
        localStorage.setItem('voca-king-flash-cleared', JSON.stringify([...newSet]));
      }
      setFlashReplaying(false); // 다시하기 완료
    }
  }, [seenCards.size, currentDay, flashClearedDays]);

  // 바나나 게임 클리어 핸들러 (시간 내 완주 시 클리어)
  const handleBananaFinish = useCallback((_score: number, _total: number) => {
    // BananaGame에서 직접 localStorage에 저장하므로, 여기서는 state만 동기화
    // activeGame이 null이 될 때 localStorage에서 다시 읽음
  }, []);

  // 동물 게임 클리어 핸들러 (시간 내 완주 시 클리어)
  const handleAnimalFinish = useCallback((_score: number, _total: number) => {
    // AnimalGame에서 직접 localStorage에 저장하므로, 여기서는 state만 동기화
    // activeGame이 null이 될 때 localStorage에서 다시 읽음
  }, []);

  // 듣고 고르기 클리어 핸들러 (시간 내 완주 시 클리어)
  const handleListenFinish = useCallback((_score: number, _total: number) => {
    // ListenGame에서 직접 localStorage에 저장하므로, 여기서는 state만 동기화
    // activeGame이 null이 될 때 localStorage에서 다시 읽음
  }, []);

  const currentLevel = levels.find((l) => l.id === currentLevelId);
  const levelIndex = levels.findIndex((l) => l.id === currentLevelId);
  const dayIndex = currentDay ? (currentDay.dayNumber || 1) - 1 : 0;

  const handleSpeak = async (word: Word) => {
    setPlayingWordId(word.id);
    await speak(word.english);
    setPlayingWordId(null);
    recordAttempt({ wordId: word.id, attemptType: 'LISTEN', correct: true }).catch(() => {});
  };

  const toggleFlashKr = () => {
    if (!showKorean && currentDay) {
      speak(currentDay.words[flashIndex].english);
      recordAttempt({ wordId: currentDay.words[flashIndex].id, attemptType: 'FLASH', correct: true }).catch(() => {});
      setSeenCards(prev => new Set(prev).add(flashIndex));
    }
    setShowKorean(!showKorean);
  };

  const flashPrev = () => { if (currentDay) { setFlashIndex(flashIndex <= 0 ? currentDay.words.length - 1 : flashIndex - 1); setShowKorean(false); } };
  const flashNext = () => { if (currentDay) { setFlashIndex(flashIndex >= currentDay.words.length - 1 ? 0 : flashIndex + 1); setShowKorean(false); } };

  const buildQuizQuestion = useCallback((idx: number, words: Word[]) => {
    if (!words || !words[idx]) return;
    const correctAnswer = words[idx].korean;
    const wordPool = allWordsInLevel.length > 0 ? allWordsInLevel : words;
    const distractors = wordPool.filter(w => w.korean !== correctAnswer).sort(() => Math.random() - 0.5).slice(0, 3).map(w => w.korean);
    setQuizChoices([correctAnswer, ...distractors].sort(() => Math.random() - 0.5));
    setQuizAnswered(false); setSelectedAnswer(null);
  }, [allWordsInLevel]);

  const startQuiz = useCallback(() => {
    if (!currentDay) return;
    const shuffled = [...currentDay.words].sort(() => Math.random() - 0.5);
    setShuffledQuizWords(shuffled); setQuizIndex(0); setQuizScore(0);
    setQuizFinished(false); setQuizAnswered(false); setSelectedAnswer(null); setQuizAttempts([]);
    setTimeout(() => buildQuizQuestion(0, shuffled), 50);
  }, [currentDay, buildQuizQuestion]);

  useEffect(() => {
    if (viewMode === 'final' && currentDay && currentDay.words.length > 0 && shuffledQuizWords.length === 0) startQuiz();
  }, [viewMode, currentDay, shuffledQuizWords.length, startQuiz]);

  const selectQuizAnswer = (answer: string) => {
    if (quizAnswered || shuffledQuizWords.length === 0) return;
    const currentWord = shuffledQuizWords[quizIndex];
    const isCorrect = answer === currentWord.korean;
    setSelectedAnswer(answer); setQuizAnswered(true);
    // Play sound effect
    if (isCorrect) playCorrectSound(); else playWrongSound();
    const newScore = isCorrect ? quizScore + 1 : quizScore;
    if (isCorrect) setQuizScore(newScore);
    const attempt: AttemptRequest = { wordId: currentWord.id, attemptType: 'QUIZ', correct: isCorrect, selectedAnswer: isCorrect ? undefined : answer };
    const newAttempts = [...quizAttempts, attempt];
    setQuizAttempts(newAttempts);
    setTimeout(() => {
      if (quizIndex < shuffledQuizWords.length - 1) { setQuizIndex(quizIndex + 1); buildQuizQuestion(quizIndex + 1, shuffledQuizWords); }
      else { setQuizFinished(true); if (currentDay) saveQuizResult({ dayId: currentDay.id, correctCount: newScore, totalCount: shuffledQuizWords.length, attempts: newAttempts }).catch(() => {}); }
    }, 1000);
  };

  const scrollDays = (dir: 'left' | 'right') => { dayScrollRef.current?.scrollBy({ left: dir === 'left' ? -200 : 200, behavior: 'smooth' }); };

  const scrollLevels = (dir: 'left' | 'right') => { levelScrollRef.current?.scrollBy({ left: dir === 'left' ? -150 : 150, behavior: 'smooth' }); };
  const onLevelMouseDown = (e: React.MouseEvent) => {
    setLevelDragging(true);
    setLevelStartX(e.pageX - (levelScrollRef.current?.offsetLeft || 0));
    setLevelScrollLeft(levelScrollRef.current?.scrollLeft || 0);
  };
  const onLevelMouseMove = (e: React.MouseEvent) => {
    if (!levelDragging) return;
    e.preventDefault();
    const x = e.pageX - (levelScrollRef.current?.offsetLeft || 0);
    const walk = (x - levelStartX) * 1.5;
    if (levelScrollRef.current) levelScrollRef.current.scrollLeft = levelScrollLeft - walk;
  };
  const onLevelMouseUp = () => setLevelDragging(false);

  const onDayMouseDown = (e: React.MouseEvent) => {
    setDayDragging(true);
    setDayStartX(e.pageX - (dayScrollRef.current?.offsetLeft || 0));
    setDayScrollLeftPos(dayScrollRef.current?.scrollLeft || 0);
  };
  const onDayMouseMove = (e: React.MouseEvent) => {
    if (!dayDragging) return;
    e.preventDefault();
    const x = e.pageX - (dayScrollRef.current?.offsetLeft || 0);
    const walk = (x - dayStartX) * 1.5;
    if (dayScrollRef.current) dayScrollRef.current.scrollLeft = dayScrollLeftPos - walk;
  };
  const onDayMouseUp = () => setDayDragging(false);

  return (
    <div className="v2-container">
      <SceneBackground levelIndex={levelIndex >= 0 ? levelIndex : 0} dayIndex={dayIndex} />

      {/* Header */}
      <header className="v2-header">
        <div className="v2-header-top">
          <div className="v2-brand-badge"><span>👑</span> VOCA KING <span style={{opacity:.6}}>by</span> <span style={{fontWeight:800}}>플로우어학원</span></div>
          <button className="v2-logout-btn" onClick={logout}>로그아웃</button>
        </div>
        <div className="v2-title-row">
          <h1 className="v2-title">📘 Day {currentDay?.dayNumber || 1} 단어 연습</h1>
        </div>
      </header>

      {/* Level Bar */}
      <div className="v2-lv-wrap">
        <button className="v2-lv-arrow left" onClick={() => scrollLevels('left')}>‹</button>
        <div
          className={`v2-lv-bar ${levelDragging ? 'dragging' : ''}`}
          ref={levelScrollRef}
          onMouseDown={onLevelMouseDown}
          onMouseMove={onLevelMouseMove}
          onMouseUp={onLevelMouseUp}
          onMouseLeave={onLevelMouseUp}
        >
          {levels.map((level, idx) => (
            <button key={level.id} className={`v2-lv-chip ${currentLevelId === level.id ? 'active' : ''}`} onClick={() => setCurrentLevel(level.id)}>
              <b>{LEVEL_EMOJIS[idx + 1] || '📚'} {level.name.replace('Lv.', '').replace(' Voca King', '').replace(' Grand Master', '').replace(' Legend', '').replace(' Master', '').replace(' Newbie', '')}</b>
              <span>{level.name.includes('Voca King') ? 'Voca King' : level.name.includes('Grand Master') ? 'Grand Master' : level.name.includes('Legend') ? 'Legend' : level.name.includes('Master') ? 'Master' : 'Newbie'}</span>
            </button>
          ))}
        </div>
        <button className="v2-lv-arrow right" onClick={() => scrollLevels('right')}>›</button>
      </div>

      {/* Tabs */}
      <div className="v2-tabs-wrap">
        <div className="v2-tabs">
          <button className={`v2-tab-btn ${viewMode === 'cards' ? 'active' : ''}`} onClick={() => { setViewMode('cards'); setActiveGame(null); }}>🃏 발음연습</button>
          <button className={`v2-tab-btn ${viewMode === 'selftest' ? 'active' : ''}`} onClick={() => { setViewMode('selftest'); setActiveGame(null); }}>⚡ 셀프테스트</button>
          <button className={`v2-tab-btn ${viewMode === 'final' ? 'active' : ''}`} onClick={() => setViewMode('final')}>🏆 파이널테스트</button>
        </div>
      </div>

      {/* Day Selector */}
      <div className="v2-day-wrap">
        <button className="v2-day-arrow" onClick={() => scrollDays('left')}>‹</button>
        <div
          className={`v2-day-selector ${dayDragging ? 'dragging' : ''}`}
          ref={dayScrollRef}
          onMouseDown={onDayMouseDown}
          onMouseMove={onDayMouseMove}
          onMouseUp={onDayMouseUp}
          onMouseLeave={onDayMouseUp}
        >
          {days.map((day) => (
            <button key={day.id} className={`v2-day-chip ${currentDay?.id === day.id ? 'active' : ''}`} onClick={() => setCurrentDay(day.id)}>Day {day.dayNumber}</button>
          ))}
        </div>
        <button className="v2-day-arrow" onClick={() => scrollDays('right')}>›</button>
      </div>

      {/* Content */}
      {viewMode === 'cards' && (
        <>
          <div className="v2-practice-hint">각 단어를 클릭하고 발음을 따라해보세요.</div>
          <div className="v2-word-scroll">
            <div className="v2-card-grid">
              {currentDay?.words.map((word, idx) => (
                <div key={word.id} className={`v2-big-card ${playingWordId === word.id ? 'playing' : ''}`} onClick={() => handleSpeak(word)}>
                  <div className="v2-card-num" style={{ background: currentLevel?.color || '#D32F3F' }}>{idx + 1}</div>
                  <div className="v2-card-body">
                    <div className="v2-card-en">{word.english}</div>
                    <div className="v2-card-kr">{word.korean}</div>
                  </div>
                  <button className="v2-card-speak" onClick={(e) => { e.stopPropagation(); handleSpeak(word); }}>🔊</button>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {viewMode === 'selftest' && !activeGame && (
        <div className="v2-word-scroll">
          <div className="v2-hub-desc">플래시카드로 익히고, 3개 스테이지는 제한 시간 안에 클리어!</div>
          <div className="v2-hub-grid">
            {GAME_STAGES.map((stage) => {
              const isCleared = (stage.id === 'flash' && flashCleared) ||
                                (stage.id === 'match' && bananaCleared) ||
                                (stage.id === 'pop' && animalCleared) ||
                                (stage.id === 'listen' && listenCleared);
              // 이미 클리어한 스테이지는 절대 잠기지 않음
              const isLocked = !isCleared && (
                               (stage.id === 'match' && !flashCleared) ||
                               (stage.id === 'pop' && !bananaCleared) ||
                               (stage.id === 'listen' && !animalCleared));
              const IconComponent = STAGE_ICONS[stage.id];
              return (
                <button
                  key={stage.id}
                  className={`v2-hub-card ${stage.theme} ${isLocked ? 'locked' : ''}`}
                  onClick={() => !isLocked && setActiveGame(stage.id)}
                  disabled={isLocked}
                >
                  {isLocked && <div className="lock-icon">🔒</div>}
                  <div className="stage-icon"><IconComponent /></div>
                  <div className="no">STAGE {stage.no}</div>
                  <div className="name">{stage.name}</div>
                  <div className="clear-status">{isCleared ? '✔ 클리어' : ''}</div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {viewMode === 'selftest' && activeGame === 'flash' && currentDay && (
        <div className="v2-flash-fullscreen">
          <div className="v2-flash-header">
            <button className="v2-flash-back" onClick={() => setActiveGame(null)}>← 목록</button>
            <div className="v2-flash-title">📝 플래시카드</div>
            <div className="v2-flash-progress">{seenCards.size} / {currentDay.words.length}</div>
          </div>
          {flashCleared && !flashReplaying ? (
            <div className="v2-flash-clear">
              <div className="v2-flash-clear-crown">👑</div>
              <div className="v2-flash-clear-title">STAGE CLEAR!</div>
              <div className="v2-flash-clear-stars">★★★</div>
              <div className="v2-flash-clear-msg">모든 카드를 확인했어요! 시간 제한 없이 편하게 복습했어요.</div>
              <div className="v2-flash-clear-btns">
                <button className="v2-flash-clear-btn secondary" onClick={() => {
                  // 다시 하기: 카드 상태 초기화 + 다시하기 모드 활성화
                  setSeenCards(new Set());
                  setFlashIndex(0);
                  setShowKorean(false);
                  setFlashReplaying(true);
                }}>다시 하기</button>
                <button className="v2-flash-clear-btn primary" onClick={() => setActiveGame('match')}>다음 스테이지 ▶</button>
                <button className="v2-flash-clear-btn secondary" onClick={() => setActiveGame(null)}>목록</button>
              </div>
            </div>
          ) : (
            <div className="v2-flash-content">
              <div className="v2-flash-guide">카드를 탭해서 뜻을 확인하세요 (모든 카드를 확인하면 클리어)</div>
              <div className={`v2-flash-card ${showKorean ? 'open' : ''}`} onClick={toggleFlashKr}>
                <div className="v2-flash-num">{flashIndex + 1} / {currentDay.words.length}</div>
                <div className="v2-flash-en">{currentDay.words[flashIndex].english}</div>
                {showKorean ? (
                  <div className="v2-flash-kr">{currentDay.words[flashIndex].korean}</div>
                ) : (
                  <>
                    <div className="v2-flash-question">?</div>
                    <div className="v2-flash-hint">뜻을 떠올린 뒤 탭 👆</div>
                  </>
                )}
              </div>
              <div className="v2-flash-nav">
                <button className="v2-flash-btn" onClick={flashPrev}>◀</button>
                <button className="v2-flash-btn speak" onClick={() => speak(currentDay.words[flashIndex].english)}>🔊</button>
                <button className="v2-flash-btn" onClick={flashNext}>▶</button>
              </div>
              <div className="v2-flash-dots">
                {currentDay.words.map((_, idx) => (
                  <span
                    key={idx}
                    className={`v2-flash-dot ${seenCards.has(idx) ? 'seen' : ''} ${idx === flashIndex ? 'current' : ''}`}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {viewMode === 'selftest' && activeGame === 'match' && currentDay && (
        <BananaGame
          words={currentDay.words}
          allWords={allWordsInLevel}
          dayId={currentDay.id}
          onFinish={handleBananaFinish}
          onBack={() => setActiveGame(null)}
          onNextStage={() => setActiveGame('pop')}
        />
      )}

      {viewMode === 'selftest' && activeGame === 'pop' && currentDay && (
        <AnimalGame
          words={currentDay.words}
          allWords={allWordsInLevel}
          dayId={currentDay.id}
          onFinish={handleAnimalFinish}
          onBack={() => setActiveGame(null)}
          onNextStage={() => setActiveGame('listen')}
        />
      )}

      {viewMode === 'selftest' && activeGame === 'listen' && currentDay && (
        <ListenGame
          words={currentDay.words}
          allWords={allWordsInLevel}
          dayId={currentDay.id}
          onFinish={handleListenFinish}
          onBack={() => setActiveGame(null)}
          onFinalTest={() => { setActiveGame(null); setViewMode('final'); }}
        />
      )}

      {viewMode === 'selftest' && activeGame && activeGame !== 'flash' && activeGame !== 'match' && activeGame !== 'pop' && activeGame !== 'listen' && (
        <div className="v2-game-wrap">
          <div className="v2-result">
            <div className="stage-icon">{STAGE_ICONS[activeGame] && React.createElement(STAGE_ICONS[activeGame])}</div>
            <div className="score">{GAME_STAGES.find(s => s.id === activeGame)?.name}</div>
            <div className="msg">곧 출시됩니다!</div>
            <button className="v2-result-btn" onClick={() => setActiveGame(null)}>← 돌아가기</button>
          </div>
        </div>
      )}

      {viewMode === 'final' && currentDay && (
        <div className="v2-game-wrap">
          {!quizFinished ? (
            <>
              <div className="v2-counter">{quizIndex + 1} / {shuffledQuizWords.length || currentDay.words.length}</div>
              {shuffledQuizWords[quizIndex] && (
                <>
                  <div className="v2-quiz-card">
                    <div className="v2-quiz-word">{shuffledQuizWords[quizIndex].english}</div>
                    <div className="v2-quiz-sub">알맞은 한글 뜻을 고르세요</div>
                  </div>
                  <div className="v2-quiz-choices">
                    {quizChoices.map((choice, idx) => {
                      const isCorrect = shuffledQuizWords[quizIndex]?.korean === choice;
                      let className = 'v2-quiz-choice';
                      if (quizAnswered) { if (isCorrect) className += ' correct'; else if (selectedAnswer === choice) className += ' wrong'; }
                      const labels = ['A', 'B', 'C', 'D'];
                      return (
                        <button key={idx} className={className} onClick={() => selectQuizAnswer(choice)} disabled={quizAnswered}>
                          <span className="v2-quiz-choice-label">{labels[idx]}</span>
                          <span className="v2-quiz-choice-text">{choice}</span>
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="v2-result">
              <div className="emoji">{quizScore === shuffledQuizWords.length ? '👑' : quizScore >= shuffledQuizWords.length * 0.8 ? '🎉' : '😊'}</div>
              <div className="score">{quizScore} / {shuffledQuizWords.length}</div>
              <div className="msg">{quizScore === shuffledQuizWords.length ? '완벽해요!' : quizScore >= shuffledQuizWords.length * 0.8 ? '잘했어요!' : '다시 도전해요!'}</div>
              <button className="v2-result-btn" onClick={startQuiz}>다시 도전</button>
            </div>
          )}
        </div>
      )}

      {/* Music Player */}
      <div className="v2-music-fab" onClick={() => setShowMusicPanel(!showMusicPanel)}>
        {bgm.isPlaying ? '🎵' : '🔇'}
      </div>
      {showMusicPanel && (
        <div className="v2-music-panel">
          <div className="v2-music-header">
            <span>🎶 배경음악</span>
            <button className="v2-music-close" onClick={() => setShowMusicPanel(false)}>✕</button>
          </div>
          <div className="v2-music-tracks">
            {bgm.tracks.map((track, idx) => (
              <button
                key={track.name}
                className={`v2-music-track ${bgm.trackIndex === idx ? 'active' : ''}`}
                onClick={() => { bgm.changeTrack(idx); if (!bgm.isPlaying) bgm.start(); }}
              >
                <span className="emoji">{track.emoji}</span>
                <span className="name">{track.ko}</span>
              </button>
            ))}
          </div>
          <div className="v2-music-controls">
            <button className="v2-music-play" onClick={bgm.toggle}>
              {bgm.isPlaying ? '⏸️ 정지' : '▶️ 재생'}
            </button>
            <div className="v2-music-volume">
              <span>🔊</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={bgm.volume}
                onChange={(e) => bgm.changeVolume(parseFloat(e.target.value))}
              />
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="v2-footer">
        <div className="v2-footer-deco left">🌻</div>
        <div className="v2-footer-content">
          <div className="brand">👑 Voca King by 플로우어학원</div>
          <div className="copyright">© 2026 플로우어학원. All Rights Reserved.</div>
          <div className="legal">본 앱의 모든 콘텐츠는 저작권법의 보호를 받습니다. 무단 복제·배포·상업적 이용 시 민·형사상 책임을 질 수 있습니다.</div>
        </div>
        <div className="v2-footer-deco right">🌳</div>
      </footer>
    </div>
  );
}
