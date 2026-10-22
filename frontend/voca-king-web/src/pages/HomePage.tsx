/**
 * 홈 페이지 (메인 학습 페이지)
 * test.html 원본 디자인 정확히 구현
 */
import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useWordStore } from '../stores/wordStore';
import { speak, initTTS } from '../utils/tts';
import { recordAttempt, saveQuizResult, getMyDetailStats } from '../services/api';
import type { Word } from '../types';
import type { AttemptRequest, UserDetailStats } from '../services/api';

type ViewMode = 'cards' | 'flash' | 'final' | 'stats';

export default function HomePage() {
  const { user, logout } = useAuthStore();
  const {
    levels,
    days,
    currentDay,
    currentLevelId,
    fetchLevels,
    setCurrentLevel,
    setCurrentDay,
    allWordsInLevel,
  } = useWordStore();
  const navigate = useNavigate();

  const [viewMode, setViewMode] = useState<ViewMode>('cards');
  const [playingWordId, setPlayingWordId] = useState<number | null>(null);
  const [flashIndex, setFlashIndex] = useState(0);
  const [showKorean, setShowKorean] = useState(false);
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizChoices, setQuizChoices] = useState<string[]>([]);
  const [quizAnswered, setQuizAnswered] = useState(false);
  const [quizCorrect, setQuizCorrect] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [quizAttempts, setQuizAttempts] = useState<AttemptRequest[]>([]);
  const [shuffledQuizWords, setShuffledQuizWords] = useState<Word[]>([]);
  const [myStats, setMyStats] = useState<UserDetailStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  // 스크롤 컨테이너 refs
  const levelScrollRef = useRef<HTMLDivElement>(null);
  const dayScrollRef = useRef<HTMLDivElement>(null);

  // 스크롤 함수
  const scrollContainer = (ref: React.RefObject<HTMLDivElement | null>, direction: 'left' | 'right') => {
    if (ref.current) {
      const scrollAmount = 200;
      ref.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    fetchLevels();
    initTTS();
  }, [fetchLevels]);

  useEffect(() => {
    if (levels.length > 0 && !currentLevelId) {
      setCurrentLevel(levels[0].id);
    }
  }, [levels, currentLevelId, setCurrentLevel]);

  useEffect(() => {
    if (days.length > 0 && !currentDay) {
      setCurrentDay(days[0].id);
    }
  }, [days, currentDay, setCurrentDay]);

  // Day 변경 시 셀프테스트/파이널테스트 초기화
  useEffect(() => {
    setFlashIndex(0);
    setShowKorean(false);
    // 파이널테스트 초기화
    setShuffledQuizWords([]);
    setQuizIndex(0);
    setQuizScore(0);
    setQuizFinished(false);
    setQuizChoices([]);
  }, [currentDay?.id]);

  const currentLevel = levels.find((l) => l.id === currentLevelId);

  const handleSpeak = async (word: Word) => {
    setPlayingWordId(word.id);
    await speak(word.english);
    setPlayingWordId(null);
    // 학습 기록 저장
    recordAttempt({ wordId: word.id, attemptType: 'LISTEN', correct: true }).catch(() => {});
  };

  const toggleFlashKr = () => {
    if (!showKorean && currentDay) {
      speak(currentDay.words[flashIndex].english);
      // 셀프테스트 학습 기록
      recordAttempt({
        wordId: currentDay.words[flashIndex].id,
        attemptType: 'FLASH',
        correct: true
      }).catch(() => {});
    }
    setShowKorean(!showKorean);
  };

  const flashPrev = () => {
    if (currentDay) {
      // 첫 번째 카드면 마지막으로, 아니면 이전으로
      const prevIndex = flashIndex <= 0 ? currentDay.words.length - 1 : flashIndex - 1;
      setFlashIndex(prevIndex);
      setShowKorean(false);
    }
  };

  const flashNext = () => {
    if (currentDay) {
      // 마지막 카드면 첫 번째로, 아니면 다음으로
      const nextIndex = flashIndex >= currentDay.words.length - 1 ? 0 : flashIndex + 1;
      setFlashIndex(nextIndex);
      setShowKorean(false);
    }
  };

  const buildQuizQuestion = useCallback((idx: number, words: Word[]) => {
    if (!words || !words[idx]) return;
    const correctWord = words[idx];
    const correctAnswer = correctWord.korean;

    // allWordsInLevel이 비어있으면 현재 Day 단어 사용
    const wordPool = allWordsInLevel.length > 0 ? allWordsInLevel : words;
    const otherWords = wordPool.filter(w => w.korean !== correctAnswer);
    const shuffled = otherWords.sort(() => Math.random() - 0.5).slice(0, 3);
    const distractors = shuffled.map(w => w.korean);
    const choices = [correctAnswer, ...distractors].sort(() => Math.random() - 0.5);

    setQuizChoices(choices);
    setQuizAnswered(false);
    setSelectedAnswer(null);
  }, [allWordsInLevel]);

  const startQuiz = useCallback(() => {
    if (!currentDay) return;
    // 단어 순서를 랜덤으로 섞기
    const shuffled = [...currentDay.words].sort(() => Math.random() - 0.5);
    setShuffledQuizWords(shuffled);
    setQuizIndex(0);
    setQuizScore(0);
    setQuizFinished(false);
    setQuizAnswered(false);
    setSelectedAnswer(null);
    setQuizAttempts([]);
    // 약간의 딜레이 후 첫 문제 빌드 (상태 업데이트 대기)
    setTimeout(() => {
      buildQuizQuestion(0, shuffled);
    }, 50);
  }, [currentDay, buildQuizQuestion]);

  // 파이널테스트 뷰에서 currentDay가 로드되면 퀴즈 시작
  useEffect(() => {
    if (viewMode === 'final' && currentDay && currentDay.words.length > 0 && shuffledQuizWords.length === 0) {
      startQuiz();
    }
  }, [viewMode, currentDay, shuffledQuizWords.length, startQuiz]);

  const selectQuizAnswer = (answer: string) => {
    if (quizAnswered || shuffledQuizWords.length === 0) return;
    const currentWord = shuffledQuizWords[quizIndex];
    const correctAnswer = currentWord.korean;
    const isCorrect = answer === correctAnswer;
    setSelectedAnswer(answer);
    setQuizAnswered(true);
    setQuizCorrect(isCorrect);

    const newScore = isCorrect ? quizScore + 1 : quizScore;
    if (isCorrect) setQuizScore(newScore);

    // 퀴즈 시도 기록 추가
    const attempt: AttemptRequest = {
      wordId: currentWord.id,
      attemptType: 'QUIZ',
      correct: isCorrect,
      selectedAnswer: isCorrect ? undefined : answer
    };
    const newAttempts = [...quizAttempts, attempt];
    setQuizAttempts(newAttempts);

    setTimeout(() => {
      if (quizIndex < shuffledQuizWords.length - 1) {
        const nextIdx = quizIndex + 1;
        setQuizIndex(nextIdx);
        buildQuizQuestion(nextIdx, shuffledQuizWords);
      } else {
        setQuizFinished(true);
        // 퀴즈 결과 저장
        if (currentDay) {
          saveQuizResult({
            dayId: currentDay.id,
            correctCount: newScore,
            totalCount: shuffledQuizWords.length,
            attempts: newAttempts
          }).catch(() => {});
        }
      }
    }, 1000);
  };

  const fetchMyStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const data = await getMyDetailStats();
      setMyStats(data);
    } catch (error) {
      console.error('통계 조회 실패:', error);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const handleViewChange = (mode: ViewMode) => {
    setViewMode(mode);
    if (mode === 'flash') {
      setFlashIndex(0);
      setShowKorean(false);
    } else if (mode === 'final') {
      startQuiz();
    } else if (mode === 'stats') {
      fetchMyStats();
    }
  };

  const currentDayIndex = days.findIndex(d => d.id === currentDay?.id);

  return (
    <div className="flex flex-col min-h-screen" style={{ background: '#f8f9ff' }}>
      {/* 브랜드 탑바 - 네이비 배경 */}
      <div style={{ padding: '4px 16px', fontSize: '12px', color: '#AEB8DE', background: '#1B2A5B' }}>
        🔥Voca King by 플로우어학원
      </div>

      {/* 헤더 - 네이비 배경 */}
      <header style={{
        padding: '12px 16px',
        background: '#1B2A5B',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 900, margin: 0, color: '#fff' }}>
            VOCA <span style={{ color: '#FFCA57' }}>KING</span> 👑
          </h1>
          {currentDay && (
            <span style={{
              padding: '4px 12px',
              background: '#D32F3F',
              color: '#fff',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: 700
            }}>
              Day {currentDay.dayNumber}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '13px', color: '#AEB8DE' }}>🌿 {user?.name}</span>
          {user?.role === 'ADMIN' && (
            <button
              onClick={() => navigate('/admin')}
              style={{
                padding: '4px 12px',
                background: '#FFCA57',
                color: '#1B2A5B',
                border: 'none',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              관리자
            </button>
          )}
          <button
            onClick={logout}
            style={{
              padding: '4px 12px',
              background: 'rgba(255,255,255,0.1)',
              color: '#AEB8DE',
              border: 'none',
              borderRadius: '6px',
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            로그아웃
          </button>
        </div>
      </header>

      {/* 레벨 선택 - 화살표 + 슬라이드 */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        background: '#fff',
        padding: '8px 8px',
        borderBottom: '1px solid #eee'
      }}>
        <button
          onClick={() => scrollContainer(levelScrollRef, 'left')}
          style={{
            width: '28px',
            height: '28px',
            border: 'none',
            background: 'transparent',
            color: '#999',
            fontSize: '18px',
            cursor: 'pointer',
            flexShrink: 0
          }}
        >
          ‹
        </button>
        <div
          ref={levelScrollRef}
          style={{ flex: 1, overflowX: 'auto', scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          className="hide-scrollbar"
        >
          <div style={{ display: 'flex', gap: '8px', padding: '4px 8px', whiteSpace: 'nowrap' }}>
            {levels.map((level) => (
              <button
                key={level.id}
                onClick={() => setCurrentLevel(level.id)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '20px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: currentLevelId === level.id ? '2px solid #D32F3F' : '2px solid #ddd',
                  background: '#fff',
                  color: currentLevelId === level.id ? '#D32F3F' : '#666',
                  transition: 'all 0.2s',
                  flexShrink: 0
                }}
              >
                {level.name}
              </button>
            ))}
          </div>
        </div>
        <button
          onClick={() => scrollContainer(levelScrollRef, 'right')}
          style={{
            width: '28px',
            height: '28px',
            border: 'none',
            background: 'transparent',
            color: '#999',
            fontSize: '18px',
            cursor: 'pointer',
            flexShrink: 0
          }}
        >
          ›
        </button>
      </div>

      {/* Day 선택 - 화살표 + 슬라이드 */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        background: '#fff',
        padding: '8px 8px',
        borderBottom: '1px solid #eee'
      }}>
        <button
          onClick={() => scrollContainer(dayScrollRef, 'left')}
          style={{
            width: '28px',
            height: '28px',
            border: 'none',
            background: 'transparent',
            color: '#999',
            fontSize: '18px',
            cursor: 'pointer',
            flexShrink: 0
          }}
        >
          ‹
        </button>
        <div
          ref={dayScrollRef}
          style={{ flex: 1, overflowX: 'auto', scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          className="hide-scrollbar"
        >
          <div style={{ display: 'flex', gap: '8px', padding: '4px 8px', whiteSpace: 'nowrap' }}>
            {days.map((day) => (
              <button
                key={day.id}
                onClick={() => setCurrentDay(day.id)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '16px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: 'none',
                  background: currentDay?.id === day.id ? '#3B5998' : '#f0f0f0',
                  color: currentDay?.id === day.id ? '#fff' : '#666',
                  transition: 'all 0.2s',
                  flexShrink: 0
                }}
              >
                Day {day.dayNumber}
              </button>
            ))}
          </div>
        </div>
        <button
          onClick={() => scrollContainer(dayScrollRef, 'right')}
          style={{
            width: '28px',
            height: '28px',
            border: 'none',
            background: 'transparent',
            color: '#999',
            fontSize: '18px',
            cursor: 'pointer',
            flexShrink: 0
          }}
        >
          ›
        </button>
      </div>

      {/* 뷰 네비게이션 - 원본과 동일 */}
      <div style={{
        display: 'flex',
        background: '#fff',
        borderBottom: '1px solid #eee'
      }}>
        <button
          onClick={() => handleViewChange('cards')}
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px',
            padding: '12px 0',
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            color: viewMode === 'cards' ? '#D32F3F' : '#888',
            borderBottom: viewMode === 'cards' ? '2px solid #D32F3F' : '2px solid transparent',
            fontSize: '12px',
            fontWeight: 600
          }}
        >
          <span style={{ fontSize: '16px' }}>🏠</span>
          발음연습
        </button>
        <div style={{ width: '1px', background: '#eee' }} />
        <button
          onClick={() => handleViewChange('flash')}
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px',
            padding: '12px 0',
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            color: viewMode === 'flash' ? '#FFCA57' : '#888',
            borderBottom: viewMode === 'flash' ? '2px solid #FFCA57' : '2px solid transparent',
            fontSize: '12px',
            fontWeight: 600
          }}
        >
          <span style={{ fontSize: '16px' }}>⚡</span>
          셀프테스트
        </button>
        <div style={{ width: '1px', background: '#eee' }} />
        <button
          onClick={() => handleViewChange('final')}
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px',
            padding: '12px 0',
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            color: viewMode === 'final' ? '#C9302C' : '#888',
            borderBottom: viewMode === 'final' ? '2px solid #C9302C' : '2px solid transparent',
            fontSize: '12px',
            fontWeight: 600
          }}
        >
          <span style={{ fontSize: '16px' }}>🏆</span>
          파이널테스트
        </button>
        <div style={{ width: '1px', background: '#eee' }} />
        <button
          onClick={() => handleViewChange('stats')}
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px',
            padding: '12px 0',
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            color: viewMode === 'stats' ? '#3B5998' : '#888',
            borderBottom: viewMode === 'stats' ? '2px solid #3B5998' : '2px solid transparent',
            fontSize: '12px',
            fontWeight: 600
          }}
        >
          <span style={{ fontSize: '16px' }}>📊</span>
          통계
        </button>
      </div>

      {/* 힌트 */}
      {viewMode === 'cards' && (
        <div style={{
          textAlign: 'center',
          fontSize: '13px',
          color: '#888',
          padding: '12px',
          background: '#f8f9ff'
        }}>
          각 단어를 클릭하고 발음을 따라해보세요.
        </div>
      )}

      {/* 컨텐츠 영역 */}
      <div style={{ flex: 1, overflowY: 'auto', background: '#f8f9ff' }}>
        {currentDay && currentDay.words.length > 0 ? (
          <>
            {/* 카드 뷰 (발음연습) - 원본과 동일 */}
            {viewMode === 'cards' && (
              <div style={{ padding: '16px' }}>
                {currentDay.words.map((word, idx) => (
                  <div
                    key={word.id}
                    onClick={() => handleSpeak(word)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '16px',
                      padding: '16px 20px',
                      background: '#fff',
                      borderRadius: '16px',
                      marginBottom: '12px',
                      cursor: 'pointer',
                      boxShadow: playingWordId === word.id
                        ? '0 0 0 2px #D32F3F'
                        : '0 1px 3px rgba(0,0,0,0.08)',
                      transition: 'all 0.2s'
                    }}
                  >
                    {/* 번호 원 */}
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      background: currentLevel?.color || '#D32F3F',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: '14px',
                      flexShrink: 0
                    }}>
                      {idx + 1}
                    </div>

                    {/* 단어 정보 */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: '17px', color: '#222' }}>
                        {word.english}
                      </div>
                      <div style={{ fontSize: '14px', color: '#666', marginTop: '2px' }}>
                        {word.korean}
                      </div>
                    </div>

                    {/* 스피커 아이콘 - 원본과 동일한 스타일 */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSpeak(word);
                      }}
                      style={{
                        width: '36px',
                        height: '36px',
                        border: 'none',
                        background: 'transparent',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}
                    >
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="#999">
                        <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* 플래시카드 뷰 */}
            {viewMode === 'flash' && (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                padding: '20px',
                gap: '16px'
              }}>
                <div style={{ fontSize: '14px', color: '#888', fontWeight: 600 }}>
                  {flashIndex + 1} / {currentDay.words.length}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', width: '100%', maxWidth: '400px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                    <button
                      onClick={flashPrev}
                      style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '50%',
                        background: '#e0e0e0',
                        border: 'none',
                        fontSize: '18px',
                        cursor: 'pointer'
                      }}
                    >
                      ◀
                    </button>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#888' }}>BACK</span>
                  </div>

                  <div
                    onClick={toggleFlashKr}
                    style={{
                      flex: 1,
                      background: '#1B2A5B',
                      borderRadius: '24px',
                      padding: '40px 24px',
                      textAlign: 'center',
                      cursor: 'pointer',
                      minHeight: '180px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}
                  >
                    <div style={{ fontSize: '13px', color: '#8899cc', fontWeight: 600 }}>
                      #{flashIndex + 1}
                    </div>
                    <div style={{ fontSize: '28px', fontWeight: 900, color: '#fff' }}>
                      {currentDay.words[flashIndex].english}
                    </div>
                    {showKorean ? (
                      <div style={{ fontSize: '16px', color: '#aabbdd', marginTop: '8px' }}>
                        {currentDay.words[flashIndex].korean}
                      </div>
                    ) : (
                      <div style={{ fontSize: '12px', color: '#8899cc', marginTop: '16px' }}>
                        탭하여 뜻 보기 👆
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                    <button
                      onClick={flashNext}
                      style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '50%',
                        background: '#D32F3F',
                        border: 'none',
                        fontSize: '18px',
                        color: '#fff',
                        cursor: 'pointer'
                      }}
                    >
                      ▶
                    </button>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#D32F3F' }}>NEXT</span>
                  </div>
                </div>
              </div>
            )}

            {/* 퀴즈 뷰 */}
            {viewMode === 'final' && shuffledQuizWords.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '20px' }}>
                {!quizFinished ? (
                  <>
                    <div style={{ textAlign: 'center', fontSize: '14px', color: '#888', fontWeight: 600, marginBottom: '16px' }}>
                      {quizIndex + 1} / {shuffledQuizWords.length}
                    </div>
                    <div style={{
                      background: '#1B2A5B',
                      borderRadius: '24px',
                      padding: '32px',
                      textAlign: 'center',
                      marginBottom: '24px'
                    }}>
                      <div style={{ fontSize: '28px', fontWeight: 900, color: '#fff', marginBottom: '8px' }}>
                        {shuffledQuizWords[quizIndex].english}
                      </div>
                      <div style={{ fontSize: '13px', color: '#aabbdd' }}>
                        알맞은 한글 뜻을 고르세요
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {quizChoices.map((choice, idx) => {
                        const labels = ['A', 'B', 'C', 'D'];
                        const isCorrectAnswer = choice === shuffledQuizWords[quizIndex].korean;
                        const isSelectedWrong = quizAnswered && selectedAnswer === choice && !isCorrectAnswer;

                        let bg = '#fff';
                        let border = '2px solid #eee';
                        let badgeBg = '#f0f0f0';
                        let badgeColor = '#666';
                        let textColor = '#333';

                        if (quizAnswered && isCorrectAnswer) {
                          bg = '#E8F5E9';
                          border = '2px solid #2E7D32';
                          badgeBg = '#2E7D32';
                          badgeColor = '#fff';
                          textColor = '#1B5E20';
                        } else if (isSelectedWrong) {
                          bg = '#FFEBEE';
                          border = '2px solid #C62828';
                          badgeBg = '#C62828';
                          badgeColor = '#fff';
                          textColor = '#B71C1C';
                        }

                        return (
                          <button
                            key={idx}
                            onClick={() => selectQuizAnswer(choice)}
                            disabled={quizAnswered}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '12px',
                              padding: '14px 16px',
                              borderRadius: '14px',
                              background: bg,
                              border: border,
                              cursor: quizAnswered ? 'default' : 'pointer',
                              textAlign: 'left',
                              transition: 'all 0.15s'
                            }}
                          >
                            <div style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '50%',
                              background: badgeBg,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 700,
                              fontSize: '14px',
                              color: badgeColor,
                              flexShrink: 0
                            }}>
                              {labels[idx]}
                            </div>
                            <span style={{ fontSize: '15px', color: textColor, fontWeight: 500 }}>{choice}</span>
                          </button>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                    gap: '16px'
                  }}>
                    <div style={{ fontSize: '60px' }}>
                      {quizScore === shuffledQuizWords.length ? '🎉' : quizScore >= shuffledQuizWords.length * 0.7 ? '👍' : '💪'}
                    </div>
                    <div style={{ fontSize: '40px', fontWeight: 900, color: '#1B2A5B' }}>
                      {quizScore} / {shuffledQuizWords.length}
                    </div>
                    <div style={{ fontSize: '16px', color: '#888' }}>
                      {quizScore === shuffledQuizWords.length ? '완벽해요!' : quizScore >= shuffledQuizWords.length * 0.7 ? '잘했어요!' : '다시 도전해보세요!'}
                    </div>
                    <button
                      onClick={startQuiz}
                      style={{
                        marginTop: '16px',
                        padding: '12px 32px',
                        background: '#D32F3F',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '16px',
                        fontSize: '16px',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      다시 도전하기
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* 통계 뷰 */}
            {viewMode === 'stats' && (
              <div style={{ padding: '20px' }}>
                {statsLoading ? (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>
                    통계를 불러오는 중...
                  </div>
                ) : myStats ? (
                  <>
                    {/* 통계 카드 */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '24px' }}>
                      <div style={{
                        background: '#E3F2FD',
                        borderRadius: '16px',
                        padding: '20px 16px',
                        textAlign: 'center'
                      }}>
                        <div style={{ fontSize: '12px', color: '#1565C0', fontWeight: 600, marginBottom: '8px' }}>총 학습</div>
                        <div style={{ fontSize: '28px', fontWeight: 900, color: '#0D47A1' }}>{myStats.stats.totalAttempts.toLocaleString()}</div>
                      </div>
                      <div style={{
                        background: '#E8F5E9',
                        borderRadius: '16px',
                        padding: '20px 16px',
                        textAlign: 'center'
                      }}>
                        <div style={{ fontSize: '12px', color: '#2E7D32', fontWeight: 600, marginBottom: '8px' }}>퀴즈 정답</div>
                        <div style={{ fontSize: '28px', fontWeight: 900, color: '#1B5E20' }}>{myStats.stats.quizCorrect.toLocaleString()}</div>
                      </div>
                      <div style={{
                        background: '#FFEBEE',
                        borderRadius: '16px',
                        padding: '20px 16px',
                        textAlign: 'center'
                      }}>
                        <div style={{ fontSize: '12px', color: '#C62828', fontWeight: 600, marginBottom: '8px' }}>퀴즈 오답</div>
                        <div style={{ fontSize: '28px', fontWeight: 900, color: '#B71C1C' }}>{myStats.stats.quizWrong.toLocaleString()}</div>
                      </div>
                    </div>

                    {/* 오답 노트 */}
                    {myStats.wrongWords.length > 0 && (
                      <div style={{ marginBottom: '24px' }}>
                        <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#C62828', marginBottom: '12px' }}>
                          자주 틀리는 단어 (오답 노트)
                        </h3>
                        <div style={{
                          background: '#fff',
                          borderRadius: '16px',
                          overflow: 'hidden',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
                        }}>
                          {myStats.wrongWords.map((word, idx) => (
                            <div
                              key={word.wordId}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '14px 20px',
                                borderBottom: idx < myStats.wrongWords.length - 1 ? '1px solid #f0f0f0' : 'none'
                              }}
                            >
                              <div>
                                <span style={{ fontWeight: 700, color: '#222', marginRight: '12px' }}>{word.english}</span>
                                <span style={{ color: '#666' }}>{word.korean}</span>
                              </div>
                              <span style={{ fontSize: '14px', fontWeight: 700, color: '#C62828' }}>{word.wrongCount}회</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 최근 퀴즈 결과 */}
                    {myStats.recentQuizzes.length > 0 && (
                      <div>
                        <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#1B2A5B', marginBottom: '12px' }}>
                          최근 퀴즈 결과
                        </h3>
                        <div style={{
                          background: '#fff',
                          borderRadius: '16px',
                          overflow: 'hidden',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
                        }}>
                          {myStats.recentQuizzes.map((quiz, idx) => (
                            <div
                              key={idx}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '14px 20px',
                                borderBottom: idx < myStats.recentQuizzes.length - 1 ? '1px solid #f0f0f0' : 'none'
                              }}
                            >
                              <div>
                                <span style={{ fontWeight: 600, color: '#222' }}>{quiz.levelName} - Day {quiz.dayNumber}</span>
                                <span style={{ fontSize: '12px', color: '#888', marginLeft: '12px' }}>
                                  {new Date(quiz.completedAt).toLocaleDateString('ko-KR')}
                                </span>
                              </div>
                              <div style={{
                                padding: '4px 12px',
                                borderRadius: '20px',
                                background: quiz.score >= 80 ? '#E8F5E9' : quiz.score >= 60 ? '#FFF8E1' : '#FFEBEE',
                                color: quiz.score >= 80 ? '#2E7D32' : quiz.score >= 60 ? '#F57F17' : '#C62828',
                                fontSize: '13px',
                                fontWeight: 700
                              }}>
                                {quiz.correctCount}/{quiz.totalCount} ({quiz.score}점)
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {myStats.wrongWords.length === 0 && myStats.recentQuizzes.length === 0 && (
                      <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>
                        아직 퀴즈 기록이 없습니다. 파이널테스트를 진행해보세요!
                      </div>
                    )}
                  </>
                ) : (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>
                    통계를 불러올 수 없습니다.
                  </div>
                )}
              </div>
            )}
          </>
        ) : viewMode === 'stats' ? (
          // 통계 뷰는 Day 선택과 무관하게 표시
          <div style={{ padding: '20px' }}>
            {statsLoading ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>
                통계를 불러오는 중...
              </div>
            ) : myStats ? (
              <>
                {/* 통계 카드 */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '24px' }}>
                  <div style={{
                    background: '#E3F2FD',
                    borderRadius: '16px',
                    padding: '20px 16px',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '12px', color: '#1565C0', fontWeight: 600, marginBottom: '8px' }}>총 학습</div>
                    <div style={{ fontSize: '28px', fontWeight: 900, color: '#0D47A1' }}>{myStats.stats.totalAttempts.toLocaleString()}</div>
                  </div>
                  <div style={{
                    background: '#E8F5E9',
                    borderRadius: '16px',
                    padding: '20px 16px',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '12px', color: '#2E7D32', fontWeight: 600, marginBottom: '8px' }}>퀴즈 정답</div>
                    <div style={{ fontSize: '28px', fontWeight: 900, color: '#1B5E20' }}>{myStats.stats.quizCorrect.toLocaleString()}</div>
                  </div>
                  <div style={{
                    background: '#FFEBEE',
                    borderRadius: '16px',
                    padding: '20px 16px',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '12px', color: '#C62828', fontWeight: 600, marginBottom: '8px' }}>퀴즈 오답</div>
                    <div style={{ fontSize: '28px', fontWeight: 900, color: '#B71C1C' }}>{myStats.stats.quizWrong.toLocaleString()}</div>
                  </div>
                </div>

                {myStats.wrongWords.length === 0 && myStats.recentQuizzes.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>
                    아직 퀴즈 기록이 없습니다. 파이널테스트를 진행해보세요!
                  </div>
                )}
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>
                통계를 불러올 수 없습니다.
              </div>
            )}
          </div>
        ) : (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: '#888'
          }}>
            단어를 불러오는 중...
          </div>
        )}
      </div>

      {/* 푸터 */}
      <footer style={{
        padding: '12px 16px',
        textAlign: 'center',
        background: '#fff',
        borderTop: '1px solid #eee'
      }}>
        <div style={{ fontSize: '11px', color: '#888' }}>
          © 2026 플로우어학원. All Rights Reserved.
        </div>
      </footer>
    </div>
  );
}
