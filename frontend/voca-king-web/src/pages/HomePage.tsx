/**
 * 홈 페이지 (메인 학습 페이지)
 * test.html 원본 디자인 정확히 구현
 */
import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useWordStore } from '../stores/wordStore';
import { speak } from '../utils/tts';
import type { Word } from '../types';

type ViewMode = 'cards' | 'flash' | 'final';

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

  useEffect(() => {
    fetchLevels();
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

  const currentLevel = levels.find((l) => l.id === currentLevelId);

  const handleSpeak = async (word: Word) => {
    setPlayingWordId(word.id);
    await speak(word.english);
    setPlayingWordId(null);
  };

  const toggleFlashKr = () => {
    if (!showKorean && currentDay) {
      speak(currentDay.words[flashIndex].english);
    }
    setShowKorean(!showKorean);
  };

  const flashPrev = () => {
    if (flashIndex > 0) {
      setFlashIndex(flashIndex - 1);
      setShowKorean(false);
    }
  };

  const flashNext = () => {
    if (currentDay && flashIndex < currentDay.words.length - 1) {
      setFlashIndex(flashIndex + 1);
      setShowKorean(false);
    }
  };

  const startQuiz = useCallback(() => {
    setQuizIndex(0);
    setQuizScore(0);
    setQuizFinished(false);
    setQuizAnswered(false);
    buildQuizQuestion(0);
  }, []);

  const buildQuizQuestion = (idx: number) => {
    if (!currentDay || !currentDay.words[idx]) return;
    const correctWord = currentDay.words[idx];
    const correctAnswer = correctWord.korean;

    // allWordsInLevel이 비어있으면 현재 Day 단어 사용
    const wordPool = allWordsInLevel.length > 0 ? allWordsInLevel : currentDay.words;
    const otherWords = wordPool.filter(w => w.korean !== correctAnswer);
    const shuffled = otherWords.sort(() => Math.random() - 0.5).slice(0, 3);
    const distractors = shuffled.map(w => w.korean);
    const choices = [correctAnswer, ...distractors].sort(() => Math.random() - 0.5);

    setQuizChoices(choices);
    setQuizAnswered(false);
    setSelectedAnswer(null);
  };

  const selectQuizAnswer = (answer: string) => {
    if (quizAnswered || !currentDay) return;
    const correctAnswer = currentDay.words[quizIndex].korean;
    const isCorrect = answer === correctAnswer;
    setSelectedAnswer(answer);
    setQuizAnswered(true);
    setQuizCorrect(isCorrect);
    if (isCorrect) setQuizScore(quizScore + 1);
    setTimeout(() => {
      if (quizIndex < currentDay.words.length - 1) {
        const nextIdx = quizIndex + 1;
        setQuizIndex(nextIdx);
        buildQuizQuestion(nextIdx);
      } else {
        setQuizFinished(true);
      }
    }, 1000);
  };

  const handleViewChange = (mode: ViewMode) => {
    setViewMode(mode);
    if (mode === 'flash') {
      setFlashIndex(0);
      setShowKorean(false);
    } else if (mode === 'final') {
      startQuiz();
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

      {/* 레벨 선택 - 원본과 동일 (pill 버튼, 테두리만) */}
      <div style={{
        overflowX: 'auto',
        background: '#fff',
        padding: '12px 16px',
        borderBottom: '1px solid #eee'
      }} className="hide-scrollbar">
        <div style={{ display: 'flex', gap: '8px', whiteSpace: 'nowrap' }}>
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
                transition: 'all 0.2s'
              }}
            >
              {level.name}
            </button>
          ))}
        </div>
      </div>

      {/* Day 선택 - 원본과 동일 (화살표 + pill 버튼) */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        background: '#fff',
        padding: '8px 8px',
        borderBottom: '1px solid #eee'
      }}>
        <button
          onClick={() => currentDayIndex > 0 && setCurrentDay(days[currentDayIndex - 1].id)}
          disabled={currentDayIndex <= 0}
          style={{
            width: '24px',
            height: '24px',
            border: 'none',
            background: 'transparent',
            color: currentDayIndex <= 0 ? '#ccc' : '#999',
            fontSize: '16px',
            cursor: currentDayIndex <= 0 ? 'default' : 'pointer'
          }}
        >
          ‹
        </button>
        <div style={{ flex: 1, overflowX: 'auto' }} className="hide-scrollbar">
          <div style={{ display: 'flex', gap: '8px', padding: '0 8px', whiteSpace: 'nowrap' }}>
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
                  transition: 'all 0.2s'
                }}
              >
                Day {day.dayNumber}
              </button>
            ))}
          </div>
        </div>
        <button
          onClick={() => currentDayIndex < days.length - 1 && setCurrentDay(days[currentDayIndex + 1].id)}
          disabled={currentDayIndex >= days.length - 1}
          style={{
            width: '24px',
            height: '24px',
            border: 'none',
            background: 'transparent',
            color: currentDayIndex >= days.length - 1 ? '#ccc' : '#999',
            fontSize: '16px',
            cursor: currentDayIndex >= days.length - 1 ? 'default' : 'pointer'
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
                      disabled={flashIndex === 0}
                      style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '50%',
                        background: '#e0e0e0',
                        border: 'none',
                        fontSize: '18px',
                        cursor: flashIndex === 0 ? 'default' : 'pointer',
                        opacity: flashIndex === 0 ? 0.3 : 1
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
                      disabled={flashIndex === currentDay.words.length - 1}
                      style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '50%',
                        background: '#D32F3F',
                        border: 'none',
                        fontSize: '18px',
                        color: '#fff',
                        cursor: flashIndex === currentDay.words.length - 1 ? 'default' : 'pointer',
                        opacity: flashIndex === currentDay.words.length - 1 ? 0.3 : 1
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
            {viewMode === 'final' && (
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '20px' }}>
                {!quizFinished ? (
                  <>
                    <div style={{ textAlign: 'center', fontSize: '14px', color: '#888', fontWeight: 600, marginBottom: '16px' }}>
                      {quizIndex + 1} / {currentDay.words.length}
                    </div>
                    <div style={{
                      background: '#1B2A5B',
                      borderRadius: '24px',
                      padding: '32px',
                      textAlign: 'center',
                      marginBottom: '24px'
                    }}>
                      <div style={{ fontSize: '28px', fontWeight: 900, color: '#fff', marginBottom: '8px' }}>
                        {currentDay.words[quizIndex].english}
                      </div>
                      <div style={{ fontSize: '13px', color: '#aabbdd' }}>
                        알맞은 한글 뜻을 고르세요
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {quizChoices.map((choice, idx) => {
                        const labels = ['A', 'B', 'C', 'D'];
                        const isCorrectAnswer = choice === currentDay.words[quizIndex].korean;
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
                      {quizScore === currentDay.words.length ? '🎉' : quizScore >= currentDay.words.length * 0.7 ? '👍' : '💪'}
                    </div>
                    <div style={{ fontSize: '40px', fontWeight: 900, color: '#1B2A5B' }}>
                      {quizScore} / {currentDay.words.length}
                    </div>
                    <div style={{ fontSize: '16px', color: '#888' }}>
                      {quizScore === currentDay.words.length ? '완벽해요!' : quizScore >= currentDay.words.length * 0.7 ? '잘했어요!' : '다시 도전해보세요!'}
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
          </>
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
