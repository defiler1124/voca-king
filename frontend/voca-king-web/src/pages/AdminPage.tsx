/**
 * 관리자 페이지
 * 트렌디한 UI - 레벨/Day/단어 관리
 */
import { useEffect, useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useWordStore } from '../stores/wordStore';
import {
  createWord,
  updateWord,
  deleteWord,
  createLevel,
  updateLevel,
  deleteLevel,
  createDay,
  updateDay,
  deleteDay,
} from '../services/api';
import type { Word, Level, Day } from '../types';

type AdminTab = 'levels' | 'days' | 'words';

export default function AdminPage() {
  const { user, logout } = useAuthStore();
  const {
    levels,
    days,
    currentDay,
    currentLevelId,
    fetchLevels,
    setCurrentLevel,
    setCurrentDay,
    fetchDayDetail,
  } = useWordStore();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<AdminTab>('words');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 레벨 관리 상태
  const [editingLevel, setEditingLevel] = useState<Level | null>(null);
  const [newLevel, setNewLevel] = useState({ name: '', color: '#D32F3F', lightColor: '#FFE5E5', orderIndex: 1 });
  const [showLevelModal, setShowLevelModal] = useState(false);

  // Day 관리 상태
  const [editingDay, setEditingDay] = useState<Day | null>(null);
  const [newDay, setNewDay] = useState({ dayNumber: 1, title: '' });
  const [showDayModal, setShowDayModal] = useState(false);

  // 단어 관리 상태
  const [editingWord, setEditingWord] = useState<Word | null>(null);
  const [newWord, setNewWord] = useState({ english: '', korean: '' });
  const [showWordModal, setShowWordModal] = useState(false);

  useEffect(() => {
    if (user && user.role !== 'ADMIN') {
      navigate('/');
    }
  }, [user, navigate]);

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

  // 레벨 CRUD
  const handleCreateLevel = async (e: FormEvent) => {
    e.preventDefault();
    if (!newLevel.name.trim()) return;
    setIsSubmitting(true);
    try {
      await createLevel({ ...newLevel, name: newLevel.name.trim(), orderIndex: levels.length + 1 });
      setNewLevel({ name: '', color: '#D32F3F', lightColor: '#FFE5E5', orderIndex: levels.length + 2 });
      setShowLevelModal(false);
      fetchLevels();
    } catch (error) {
      alert('레벨 생성에 실패했습니다.');
    }
    setIsSubmitting(false);
  };

  const handleUpdateLevel = async () => {
    if (!editingLevel) return;
    setIsSubmitting(true);
    try {
      await updateLevel(editingLevel.id, editingLevel);
      setEditingLevel(null);
      setShowLevelModal(false);
      fetchLevels();
    } catch (error) {
      alert('레벨 수정에 실패했습니다.');
    }
    setIsSubmitting(false);
  };

  const handleDeleteLevel = async (levelId: number) => {
    if (!confirm('이 레벨과 하위 모든 데이터를 삭제할까요?')) return;
    try {
      await deleteLevel(levelId);
      fetchLevels();
    } catch (error) {
      alert('레벨 삭제에 실패했습니다.');
    }
  };

  // Day CRUD
  const handleCreateDay = async (e: FormEvent) => {
    e.preventDefault();
    if (!currentLevelId || !newDay.title.trim()) return;
    setIsSubmitting(true);
    try {
      await createDay({ levelId: currentLevelId, dayNumber: newDay.dayNumber, title: newDay.title.trim() });
      setNewDay({ dayNumber: days.length + 1, title: '' });
      setShowDayModal(false);
      setCurrentLevel(currentLevelId);
    } catch (error) {
      alert('Day 생성에 실패했습니다.');
    }
    setIsSubmitting(false);
  };

  const handleUpdateDay = async () => {
    if (!editingDay || !currentLevelId) return;
    setIsSubmitting(true);
    try {
      await updateDay(editingDay.id, { levelId: currentLevelId, dayNumber: editingDay.dayNumber, title: editingDay.title || '' });
      setEditingDay(null);
      setShowDayModal(false);
      setCurrentLevel(currentLevelId);
    } catch (error) {
      alert('Day 수정에 실패했습니다.');
    }
    setIsSubmitting(false);
  };

  const handleDeleteDay = async (dayId: number) => {
    if (!confirm('이 Day와 모든 단어를 삭제할까요?')) return;
    try {
      await deleteDay(dayId);
      if (currentLevelId) setCurrentLevel(currentLevelId);
    } catch (error) {
      alert('Day 삭제에 실패했습니다.');
    }
  };

  // 단어 CRUD
  const handleAddWord = async (e: FormEvent) => {
    e.preventDefault();
    if (!currentDay || !newWord.english.trim() || !newWord.korean.trim()) return;
    setIsSubmitting(true);
    try {
      await createWord(currentDay.id, { english: newWord.english.trim(), korean: newWord.korean.trim(), orderIndex: currentDay.words.length + 1 });
      setNewWord({ english: '', korean: '' });
      fetchDayDetail(currentDay.id);
    } catch (error) {
      alert('단어 추가에 실패했습니다.');
    }
    setIsSubmitting(false);
  };

  const handleUpdateWord = async () => {
    if (!editingWord || !currentDay) return;
    setIsSubmitting(true);
    try {
      await updateWord(editingWord.id, editingWord);
      setEditingWord(null);
      setShowWordModal(false);
      fetchDayDetail(currentDay.id);
    } catch (error) {
      alert('단어 수정에 실패했습니다.');
    }
    setIsSubmitting(false);
  };

  const handleDeleteWord = async (wordId: number) => {
    if (!currentDay || !confirm('삭제할까요?')) return;
    try {
      await deleteWord(wordId);
      fetchDayDetail(currentDay.id);
    } catch (error) {
      alert('단어 삭제에 실패했습니다.');
    }
  };

  const currentLevel = levels.find((l) => l.id === currentLevelId);

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #1B2A5B 0%, #2D4373 100%)' }}>
      {/* 헤더 */}
      <header style={{
        padding: '16px 24px',
        background: 'rgba(255,255,255,0.1)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid rgba(255,255,255,0.1)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            onClick={() => navigate('/')}
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: 'none',
              color: '#fff',
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              fontSize: '18px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            ←
          </button>
          <div>
            <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 800, color: '#fff' }}>
              VOCA KING <span style={{ color: '#FFCA57' }}>Admin</span>
            </h1>
            <p style={{ margin: 0, fontSize: '13px', color: 'rgba(255,255,255,0.6)' }}>
              레벨, Day, 단어를 관리하세요
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.8)' }}>👤 {user?.name}</span>
          <button
            onClick={logout}
            style={{
              padding: '8px 16px',
              background: 'rgba(255,255,255,0.15)',
              border: 'none',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            로그아웃
          </button>
        </div>
      </header>

      {/* 탭 메뉴 */}
      <div style={{
        display: 'flex',
        gap: '8px',
        padding: '16px 24px',
        background: 'rgba(255,255,255,0.05)'
      }}>
        {[
          { key: 'levels', label: '📊 레벨 관리', color: '#FF6B6B' },
          { key: 'days', label: '📅 Day 관리', color: '#4ECDC4' },
          { key: 'words', label: '📝 단어 관리', color: '#FFCA57' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as AdminTab)}
            style={{
              padding: '12px 24px',
              borderRadius: '12px',
              border: 'none',
              background: activeTab === tab.key ? tab.color : 'rgba(255,255,255,0.1)',
              color: activeTab === tab.key ? '#fff' : 'rgba(255,255,255,0.7)',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 컨텐츠 영역 */}
      <div style={{ padding: '24px' }}>
        <div style={{
          background: '#fff',
          borderRadius: '20px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
          overflow: 'hidden',
          minHeight: 'calc(100vh - 220px)'
        }}>

          {/* 레벨 관리 */}
          {activeTab === 'levels' && (
            <div style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: '#1B2A5B' }}>
                  레벨 목록 <span style={{ color: '#888', fontWeight: 400 }}>({levels.length}개)</span>
                </h2>
                <button
                  onClick={() => { setEditingLevel(null); setShowLevelModal(true); }}
                  style={{
                    padding: '10px 20px',
                    background: 'linear-gradient(135deg, #FF6B6B, #FF8E8E)',
                    border: 'none',
                    borderRadius: '10px',
                    color: '#fff',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  + 새 레벨
                </button>
              </div>

              <div style={{ display: 'grid', gap: '12px' }}>
                {levels.map((level) => (
                  <div
                    key={level.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '16px',
                      padding: '16px 20px',
                      background: '#f8f9ff',
                      borderRadius: '12px',
                      border: '1px solid #eee'
                    }}
                  >
                    <div style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '12px',
                      background: level.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                      fontWeight: 700,
                      fontSize: '16px'
                    }}>
                      {level.orderIndex}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: '16px', color: '#222' }}>{level.name}</div>
                      <div style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>
                        {level.dayCount || 0}개 Day
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => { setEditingLevel({ ...level }); setShowLevelModal(true); }}
                        style={{ padding: '8px 16px', background: '#E3F2FD', border: 'none', borderRadius: '8px', color: '#1976D2', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
                      >
                        수정
                      </button>
                      <button
                        onClick={() => handleDeleteLevel(level.id)}
                        style={{ padding: '8px 16px', background: '#FFEBEE', border: 'none', borderRadius: '8px', color: '#D32F2F', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Day 관리 */}
          {activeTab === 'days' && (
            <div>
              {/* 레벨 선택 */}
              <div style={{ padding: '16px 24px', borderBottom: '1px solid #eee', overflowX: 'auto' }}>
                <div style={{ display: 'flex', gap: '8px', whiteSpace: 'nowrap' }}>
                  {levels.map((level) => (
                    <button
                      key={level.id}
                      onClick={() => setCurrentLevel(level.id)}
                      style={{
                        padding: '8px 16px',
                        borderRadius: '20px',
                        border: currentLevelId === level.id ? `2px solid ${level.color}` : '2px solid #eee',
                        background: currentLevelId === level.id ? level.lightColor : '#fff',
                        color: currentLevelId === level.id ? level.color : '#666',
                        fontSize: '13px',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      {level.name}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                  <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: '#1B2A5B' }}>
                    {currentLevel?.name} <span style={{ color: '#888', fontWeight: 400 }}>({days.length}개 Day)</span>
                  </h2>
                  <button
                    onClick={() => { setEditingDay(null); setNewDay({ dayNumber: days.length + 1, title: '' }); setShowDayModal(true); }}
                    style={{
                      padding: '10px 20px',
                      background: 'linear-gradient(135deg, #4ECDC4, #6EE7DE)',
                      border: 'none',
                      borderRadius: '10px',
                      color: '#fff',
                      fontSize: '14px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    + 새 Day
                  </button>
                </div>

                <div style={{ display: 'grid', gap: '12px' }}>
                  {days.map((day) => (
                    <div
                      key={day.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px',
                        padding: '16px 20px',
                        background: '#f8f9ff',
                        borderRadius: '12px',
                        border: '1px solid #eee'
                      }}
                    >
                      <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '12px',
                        background: currentLevel?.color || '#4ECDC4',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                        fontWeight: 700,
                        fontSize: '14px'
                      }}>
                        Day {day.dayNumber}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: '16px', color: '#222' }}>{day.title}</div>
                        <div style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>
                          {day.wordCount || 0}개 단어
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => { setEditingDay({ ...day }); setShowDayModal(true); }}
                          style={{ padding: '8px 16px', background: '#E3F2FD', border: 'none', borderRadius: '8px', color: '#1976D2', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
                        >
                          수정
                        </button>
                        <button
                          onClick={() => handleDeleteDay(day.id)}
                          style={{ padding: '8px 16px', background: '#FFEBEE', border: 'none', borderRadius: '8px', color: '#D32F2F', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
                        >
                          삭제
                        </button>
                      </div>
                    </div>
                  ))}
                  {days.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '60px 20px', color: '#888' }}>
                      등록된 Day가 없습니다
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 단어 관리 */}
          {activeTab === 'words' && (
            <div>
              {/* 레벨 선택 */}
              <div style={{ padding: '16px 24px', borderBottom: '1px solid #eee', overflowX: 'auto' }}>
                <div style={{ display: 'flex', gap: '8px', whiteSpace: 'nowrap' }}>
                  {levels.map((level) => (
                    <button
                      key={level.id}
                      onClick={() => setCurrentLevel(level.id)}
                      style={{
                        padding: '8px 16px',
                        borderRadius: '20px',
                        border: currentLevelId === level.id ? `2px solid ${level.color}` : '2px solid #eee',
                        background: currentLevelId === level.id ? level.lightColor : '#fff',
                        color: currentLevelId === level.id ? level.color : '#666',
                        fontSize: '13px',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      {level.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Day 선택 */}
              <div style={{ padding: '12px 24px', borderBottom: '1px solid #eee', overflowX: 'auto' }}>
                <div style={{ display: 'flex', gap: '8px', whiteSpace: 'nowrap' }}>
                  {days.map((day) => (
                    <button
                      key={day.id}
                      onClick={() => setCurrentDay(day.id)}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '16px',
                        border: 'none',
                        background: currentDay?.id === day.id ? (currentLevel?.color || '#FFCA57') : '#f0f0f0',
                        color: currentDay?.id === day.id ? '#fff' : '#666',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      Day {day.dayNumber} ({day.wordCount})
                    </button>
                  ))}
                </div>
              </div>

              {/* 단어 추가 폼 */}
              <div style={{ padding: '16px 24px', borderBottom: '1px solid #eee', background: '#fafbff' }}>
                <form onSubmit={handleAddWord} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <input
                    type="text"
                    value={newWord.english}
                    onChange={(e) => setNewWord({ ...newWord, english: e.target.value })}
                    placeholder="영어 단어"
                    style={{
                      flex: 1,
                      padding: '12px 16px',
                      border: '2px solid #eee',
                      borderRadius: '10px',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  />
                  <input
                    type="text"
                    value={newWord.korean}
                    onChange={(e) => setNewWord({ ...newWord, korean: e.target.value })}
                    placeholder="한글 뜻"
                    style={{
                      flex: 1,
                      padding: '12px 16px',
                      border: '2px solid #eee',
                      borderRadius: '10px',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  />
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    style={{
                      padding: '12px 24px',
                      background: 'linear-gradient(135deg, #FFCA57, #FFD980)',
                      border: 'none',
                      borderRadius: '10px',
                      color: '#1B2A5B',
                      fontSize: '14px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      opacity: isSubmitting ? 0.5 : 1
                    }}
                  >
                    + 추가
                  </button>
                </form>
              </div>

              {/* 단어 목록 */}
              <div style={{ padding: '24px' }}>
                {currentDay && currentDay.words.length > 0 ? (
                  <div style={{ display: 'grid', gap: '8px' }}>
                    {currentDay.words.map((word, idx) => (
                      <div
                        key={word.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '16px',
                          padding: '14px 20px',
                          background: idx % 2 === 0 ? '#fff' : '#f8f9ff',
                          borderRadius: '10px',
                          border: '1px solid #eee'
                        }}
                      >
                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '8px',
                          background: currentLevel?.color || '#FFCA57',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#fff',
                          fontWeight: 700,
                          fontSize: '13px'
                        }}>
                          {idx + 1}
                        </div>
                        <div style={{ flex: 1, fontWeight: 600, fontSize: '15px', color: '#222' }}>
                          {word.english}
                        </div>
                        <div style={{ flex: 1, fontSize: '14px', color: '#666' }}>
                          {word.korean}
                        </div>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            onClick={() => { setEditingWord({ ...word }); setShowWordModal(true); }}
                            style={{ padding: '6px 12px', background: '#E3F2FD', border: 'none', borderRadius: '6px', color: '#1976D2', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                          >
                            수정
                          </button>
                          <button
                            onClick={() => handleDeleteWord(word.id)}
                            style={{ padding: '6px 12px', background: '#FFEBEE', border: 'none', borderRadius: '6px', color: '#D32F2F', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                          >
                            삭제
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '60px 20px', color: '#888' }}>
                    {days.length === 0 ? '먼저 Day를 추가하세요' : '등록된 단어가 없습니다'}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 레벨 모달 */}
      {showLevelModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          zIndex: 50
        }}>
          <div style={{ background: '#fff', borderRadius: '20px', padding: '32px', width: '100%', maxWidth: '420px' }}>
            <h3 style={{ margin: '0 0 24px', fontSize: '20px', fontWeight: 700, color: '#1B2A5B' }}>
              {editingLevel ? '레벨 수정' : '새 레벨 추가'}
            </h3>
            <form onSubmit={editingLevel ? (e) => { e.preventDefault(); handleUpdateLevel(); } : handleCreateLevel}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600, color: '#666' }}>레벨 이름</label>
                <input
                  type="text"
                  value={editingLevel ? editingLevel.name : newLevel.name}
                  onChange={(e) => editingLevel ? setEditingLevel({ ...editingLevel, name: e.target.value }) : setNewLevel({ ...newLevel, name: e.target.value })}
                  placeholder="예: Lv.1 Newbie"
                  style={{ width: '100%', padding: '12px 16px', border: '2px solid #eee', borderRadius: '10px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600, color: '#666' }}>메인 컬러</label>
                  <input
                    type="color"
                    value={editingLevel ? editingLevel.color : newLevel.color}
                    onChange={(e) => editingLevel ? setEditingLevel({ ...editingLevel, color: e.target.value }) : setNewLevel({ ...newLevel, color: e.target.value })}
                    style={{ width: '100%', height: '44px', border: '2px solid #eee', borderRadius: '10px', cursor: 'pointer' }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600, color: '#666' }}>배경 컬러</label>
                  <input
                    type="color"
                    value={editingLevel ? editingLevel.lightColor : newLevel.lightColor}
                    onChange={(e) => editingLevel ? setEditingLevel({ ...editingLevel, lightColor: e.target.value }) : setNewLevel({ ...newLevel, lightColor: e.target.value })}
                    style={{ width: '100%', height: '44px', border: '2px solid #eee', borderRadius: '10px', cursor: 'pointer' }}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <button
                  type="button"
                  onClick={() => { setShowLevelModal(false); setEditingLevel(null); }}
                  style={{ flex: 1, padding: '14px', background: '#f0f0f0', border: 'none', borderRadius: '10px', color: '#666', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{ flex: 1, padding: '14px', background: 'linear-gradient(135deg, #FF6B6B, #FF8E8E)', border: 'none', borderRadius: '10px', color: '#fff', fontSize: '14px', fontWeight: 600, cursor: 'pointer', opacity: isSubmitting ? 0.5 : 1 }}
                >
                  {editingLevel ? '저장' : '추가'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Day 모달 */}
      {showDayModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          zIndex: 50
        }}>
          <div style={{ background: '#fff', borderRadius: '20px', padding: '32px', width: '100%', maxWidth: '420px' }}>
            <h3 style={{ margin: '0 0 24px', fontSize: '20px', fontWeight: 700, color: '#1B2A5B' }}>
              {editingDay ? 'Day 수정' : '새 Day 추가'}
            </h3>
            <form onSubmit={editingDay ? (e) => { e.preventDefault(); handleUpdateDay(); } : handleCreateDay}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600, color: '#666' }}>Day 번호</label>
                <input
                  type="number"
                  min={1}
                  value={editingDay ? editingDay.dayNumber : newDay.dayNumber}
                  onChange={(e) => editingDay ? setEditingDay({ ...editingDay, dayNumber: parseInt(e.target.value) }) : setNewDay({ ...newDay, dayNumber: parseInt(e.target.value) })}
                  style={{ width: '100%', padding: '12px 16px', border: '2px solid #eee', borderRadius: '10px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600, color: '#666' }}>제목</label>
                <input
                  type="text"
                  value={editingDay ? editingDay.title : newDay.title}
                  onChange={(e) => editingDay ? setEditingDay({ ...editingDay, title: e.target.value }) : setNewDay({ ...newDay, title: e.target.value })}
                  placeholder="예: 기초 단어"
                  style={{ width: '100%', padding: '12px 16px', border: '2px solid #eee', borderRadius: '10px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <button
                  type="button"
                  onClick={() => { setShowDayModal(false); setEditingDay(null); }}
                  style={{ flex: 1, padding: '14px', background: '#f0f0f0', border: 'none', borderRadius: '10px', color: '#666', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{ flex: 1, padding: '14px', background: 'linear-gradient(135deg, #4ECDC4, #6EE7DE)', border: 'none', borderRadius: '10px', color: '#fff', fontSize: '14px', fontWeight: 600, cursor: 'pointer', opacity: isSubmitting ? 0.5 : 1 }}
                >
                  {editingDay ? '저장' : '추가'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 단어 수정 모달 */}
      {showWordModal && editingWord && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          zIndex: 50
        }}>
          <div style={{ background: '#fff', borderRadius: '20px', padding: '32px', width: '100%', maxWidth: '420px' }}>
            <h3 style={{ margin: '0 0 24px', fontSize: '20px', fontWeight: 700, color: '#1B2A5B' }}>단어 수정</h3>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600, color: '#666' }}>영어 단어</label>
              <input
                type="text"
                value={editingWord.english}
                onChange={(e) => setEditingWord({ ...editingWord, english: e.target.value })}
                style={{ width: '100%', padding: '12px 16px', border: '2px solid #eee', borderRadius: '10px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600, color: '#666' }}>한글 뜻</label>
              <input
                type="text"
                value={editingWord.korean}
                onChange={(e) => setEditingWord({ ...editingWord, korean: e.target.value })}
                style={{ width: '100%', padding: '12px 16px', border: '2px solid #eee', borderRadius: '10px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <button
                onClick={() => { setShowWordModal(false); setEditingWord(null); }}
                style={{ flex: 1, padding: '14px', background: '#f0f0f0', border: 'none', borderRadius: '10px', color: '#666', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}
              >
                취소
              </button>
              <button
                onClick={handleUpdateWord}
                disabled={isSubmitting}
                style={{ flex: 1, padding: '14px', background: 'linear-gradient(135deg, #FFCA57, #FFD980)', border: 'none', borderRadius: '10px', color: '#1B2A5B', fontSize: '14px', fontWeight: 600, cursor: 'pointer', opacity: isSubmitting ? 0.5 : 1 }}
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
