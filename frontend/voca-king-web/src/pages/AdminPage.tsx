/**
 * 관리자 페이지
 * 레벨/Day/단어 관리 + 회원관리 + 학습통계
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
  getAdminUsers,
  toggleUserActive,
  changeUserRole,
  updateUser,
  deleteUser,
  getAllUserStats,
  getUserDetailStats,
  getOverallStats,
} from '../services/api';
import type { Word, Level, Day } from '../types';
import type { AdminUser, UserStats, UserDetailStats, OverallStats } from '../services/api';

type AdminTab = 'levels' | 'days' | 'words' | 'users' | 'stats';

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

  // 회원 관리 상태
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);

  // 학습 통계 상태
  const [userStats, setUserStats] = useState<UserStats[]>([]);
  const [selectedUserStats, setSelectedUserStats] = useState<UserDetailStats | null>(null);
  const [overallStats, setOverallStats] = useState<OverallStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);

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

  // 탭 변경 시 데이터 로드
  useEffect(() => {
    if (activeTab === 'users') {
      loadUsers();
    } else if (activeTab === 'stats') {
      loadStats();
    }
  }, [activeTab]);

  const loadUsers = async () => {
    setLoadingUsers(true);
    try {
      const data = await getAdminUsers();
      setUsers(data);
    } catch (error) {
      console.error('사용자 목록 로드 실패:', error);
    }
    setLoadingUsers(false);
  };

  const loadStats = async () => {
    setLoadingStats(true);
    try {
      const [statsData, overallData] = await Promise.all([
        getAllUserStats(),
        getOverallStats()
      ]);
      setUserStats(statsData);
      setOverallStats(overallData);
    } catch (error) {
      console.error('통계 로드 실패:', error);
    }
    setLoadingStats(false);
  };

  const handleViewUserStats = async (userId: number) => {
    try {
      const detail = await getUserDetailStats(userId);
      setSelectedUserStats(detail);
      setShowStatsModal(true);
    } catch (error) {
      alert('상세 통계를 불러오는데 실패했습니다.');
    }
  };

  const handleToggleUserActive = async (userId: number) => {
    try {
      await toggleUserActive(userId);
      loadUsers();
    } catch (error) {
      alert('상태 변경에 실패했습니다.');
    }
  };

  const handleChangeRole = async (userId: number, newRole: 'ADMIN' | 'STUDENT') => {
    if (!confirm(`역할을 ${newRole}로 변경하시겠습니까?`)) return;
    try {
      await changeUserRole(userId, newRole);
      loadUsers();
    } catch (error) {
      alert('역할 변경에 실패했습니다.');
    }
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;
    setIsSubmitting(true);
    try {
      // 이름/아이디 수정
      await updateUser(editingUser.id, { name: editingUser.name, username: editingUser.username });
      // 역할 변경 (원래 역할과 다르면)
      const originalUser = users.find(u => u.id === editingUser.id);
      if (originalUser && originalUser.role !== editingUser.role) {
        await changeUserRole(editingUser.id, editingUser.role as 'ADMIN' | 'STUDENT');
      }
      setEditingUser(null);
      setShowUserModal(false);
      loadUsers();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      alert(err.response?.data?.message || '사용자 수정에 실패했습니다.');
    }
    setIsSubmitting(false);
  };

  const handleDeleteUser = async (userId: number) => {
    if (!confirm('이 사용자를 삭제하시겠습니까? 모든 학습 기록도 삭제됩니다.')) return;
    try {
      await deleteUser(userId);
      loadUsers();
    } catch (error) {
      alert('사용자 삭제에 실패했습니다.');
    }
  };

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

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
  };

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
              관리자 대시보드
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
        background: 'rgba(255,255,255,0.05)',
        overflowX: 'auto'
      }}>
        {[
          { key: 'levels', label: '📊 레벨', color: '#FF6B6B' },
          { key: 'days', label: '📅 Day', color: '#4ECDC4' },
          { key: 'words', label: '📝 단어', color: '#FFCA57' },
          { key: 'users', label: '👥 회원', color: '#9B59B6' },
          { key: 'stats', label: '📈 통계', color: '#3498DB' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as AdminTab)}
            style={{
              padding: '12px 20px',
              borderRadius: '12px',
              border: 'none',
              background: activeTab === tab.key ? tab.color : 'rgba(255,255,255,0.1)',
              color: activeTab === tab.key ? '#fff' : 'rgba(255,255,255,0.7)',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s',
              whiteSpace: 'nowrap'
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

          {/* 회원 관리 */}
          {activeTab === 'users' && (
            <div style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: '#1B2A5B' }}>
                  회원 목록 <span style={{ color: '#888', fontWeight: 400 }}>({users.length}명)</span>
                </h2>
                <button
                  onClick={loadUsers}
                  style={{
                    padding: '8px 16px',
                    background: '#f0f0f0',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '13px',
                    cursor: 'pointer'
                  }}
                >
                  새로고침
                </button>
              </div>

              {loadingUsers ? (
                <div style={{ textAlign: 'center', padding: '60px', color: '#888' }}>로딩 중...</div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                    <thead>
                      <tr style={{ background: '#f8f9ff' }}>
                        <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #eee' }}>이름</th>
                        <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #eee' }}>아이디</th>
                        <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #eee' }}>역할</th>
                        <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #eee' }}>상태</th>
                        <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #eee' }}>가입일</th>
                        <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #eee' }}>관리</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((u) => (
                        <tr key={u.id} style={{ borderBottom: '1px solid #eee' }}>
                          <td style={{ padding: '12px', fontWeight: 600 }}>{u.name}</td>
                          <td style={{ padding: '12px', color: '#666' }}>{u.username}</td>
                          <td style={{ padding: '12px', textAlign: 'center' }}>
                            <span style={{
                              padding: '4px 10px',
                              borderRadius: '12px',
                              fontSize: '12px',
                              fontWeight: 600,
                              background: u.role === 'ADMIN' ? '#FFEBEE' : '#E3F2FD',
                              color: u.role === 'ADMIN' ? '#C62828' : '#1565C0'
                            }}>
                              {u.role === 'ADMIN' ? '관리자' : '학생'}
                            </span>
                          </td>
                          <td style={{ padding: '12px', textAlign: 'center' }}>
                            <span style={{
                              padding: '4px 10px',
                              borderRadius: '12px',
                              fontSize: '12px',
                              fontWeight: 600,
                              background: u.active ? '#E8F5E9' : '#FFEBEE',
                              color: u.active ? '#2E7D32' : '#C62828'
                            }}>
                              {u.active ? '활성' : '비활성'}
                            </span>
                          </td>
                          <td style={{ padding: '12px', color: '#888', fontSize: '13px' }}>
                            {formatDate(u.createdAt)}
                          </td>
                          <td style={{ padding: '12px', textAlign: 'center' }}>
                            <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', flexWrap: 'wrap' }}>
                              <button
                                onClick={() => { setEditingUser({ ...u }); setShowUserModal(true); }}
                                style={{
                                  padding: '6px 10px',
                                  background: '#FFF3E0',
                                  border: 'none',
                                  borderRadius: '6px',
                                  color: '#EF6C00',
                                  fontSize: '11px',
                                  fontWeight: 600,
                                  cursor: 'pointer'
                                }}
                              >
                                수정
                              </button>
                              <button
                                onClick={() => handleToggleUserActive(u.id)}
                                style={{
                                  padding: '6px 10px',
                                  background: u.active ? '#FFEBEE' : '#E8F5E9',
                                  border: 'none',
                                  borderRadius: '6px',
                                  color: u.active ? '#C62828' : '#2E7D32',
                                  fontSize: '11px',
                                  fontWeight: 600,
                                  cursor: 'pointer'
                                }}
                              >
                                {u.active ? '비활성화' : '활성화'}
                              </button>
                              <button
                                onClick={() => handleChangeRole(u.id, u.role === 'ADMIN' ? 'STUDENT' : 'ADMIN')}
                                style={{
                                  padding: '6px 10px',
                                  background: '#E3F2FD',
                                  border: 'none',
                                  borderRadius: '6px',
                                  color: '#1565C0',
                                  fontSize: '11px',
                                  fontWeight: 600,
                                  cursor: 'pointer'
                                }}
                              >
                                역할변경
                              </button>
                              <button
                                onClick={() => handleDeleteUser(u.id)}
                                style={{
                                  padding: '6px 10px',
                                  background: '#FFEBEE',
                                  border: 'none',
                                  borderRadius: '6px',
                                  color: '#C62828',
                                  fontSize: '11px',
                                  fontWeight: 600,
                                  cursor: 'pointer'
                                }}
                              >
                                삭제
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* 학습 통계 */}
          {activeTab === 'stats' && (
            <div style={{ padding: '24px' }}>
              {/* 전체 통계 요약 */}
              {overallStats && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '32px' }}>
                  <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: '16px', padding: '20px', color: '#fff' }}>
                    <div style={{ fontSize: '13px', opacity: 0.8 }}>총 회원</div>
                    <div style={{ fontSize: '32px', fontWeight: 800 }}>{overallStats.totalUsers}</div>
                  </div>
                  <div style={{ background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)', borderRadius: '16px', padding: '20px', color: '#fff' }}>
                    <div style={{ fontSize: '13px', opacity: 0.8 }}>오늘 활동</div>
                    <div style={{ fontSize: '32px', fontWeight: 800 }}>{overallStats.activeUsersToday}</div>
                  </div>
                  <div style={{ background: 'linear-gradient(135deg, #eb3349 0%, #f45c43 100%)', borderRadius: '16px', padding: '20px', color: '#fff' }}>
                    <div style={{ fontSize: '13px', opacity: 0.8 }}>총 학습</div>
                    <div style={{ fontSize: '32px', fontWeight: 800 }}>{overallStats.totalAttempts}</div>
                  </div>
                  <div style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', borderRadius: '16px', padding: '20px', color: '#fff' }}>
                    <div style={{ fontSize: '13px', opacity: 0.8 }}>총 퀴즈</div>
                    <div style={{ fontSize: '32px', fontWeight: 800 }}>{overallStats.totalQuizzes}</div>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: '#1B2A5B' }}>
                  학생별 학습 통계
                </h2>
                <button
                  onClick={loadStats}
                  style={{
                    padding: '8px 16px',
                    background: '#f0f0f0',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '13px',
                    cursor: 'pointer'
                  }}
                >
                  새로고침
                </button>
              </div>

              {loadingStats ? (
                <div style={{ textAlign: 'center', padding: '60px', color: '#888' }}>로딩 중...</div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                    <thead>
                      <tr style={{ background: '#f8f9ff' }}>
                        <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #eee' }}>이름</th>
                        <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #eee' }}>총 학습</th>
                        <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #eee' }}>발음</th>
                        <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #eee' }}>셀프</th>
                        <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #eee' }}>퀴즈</th>
                        <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #eee' }}>정답률</th>
                        <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #eee' }}>오늘</th>
                        <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #eee' }}>최근 학습</th>
                        <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #eee' }}>상세</th>
                      </tr>
                    </thead>
                    <tbody>
                      {userStats.map((stat) => (
                        <tr key={stat.userId} style={{ borderBottom: '1px solid #eee' }}>
                          <td style={{ padding: '12px', fontWeight: 600 }}>{stat.userName}</td>
                          <td style={{ padding: '12px', textAlign: 'center' }}>{stat.totalAttempts}</td>
                          <td style={{ padding: '12px', textAlign: 'center', color: '#666' }}>{stat.listenCount}</td>
                          <td style={{ padding: '12px', textAlign: 'center', color: '#666' }}>{stat.flashCount}</td>
                          <td style={{ padding: '12px', textAlign: 'center' }}>
                            <span style={{ color: '#2E7D32' }}>{stat.quizCorrect}</span>
                            <span style={{ color: '#888' }}>/</span>
                            <span style={{ color: '#C62828' }}>{stat.quizWrong}</span>
                          </td>
                          <td style={{ padding: '12px', textAlign: 'center' }}>
                            <span style={{
                              padding: '4px 10px',
                              borderRadius: '12px',
                              fontSize: '12px',
                              fontWeight: 700,
                              background: stat.accuracyRate >= 80 ? '#E8F5E9' : stat.accuracyRate >= 50 ? '#FFF3E0' : '#FFEBEE',
                              color: stat.accuracyRate >= 80 ? '#2E7D32' : stat.accuracyRate >= 50 ? '#EF6C00' : '#C62828'
                            }}>
                              {stat.accuracyRate}%
                            </span>
                          </td>
                          <td style={{ padding: '12px', textAlign: 'center', fontWeight: 600, color: stat.todayAttempts > 0 ? '#2E7D32' : '#888' }}>
                            {stat.todayAttempts}
                          </td>
                          <td style={{ padding: '12px', color: '#888', fontSize: '13px' }}>
                            {formatDate(stat.lastStudyAt)}
                          </td>
                          <td style={{ padding: '12px', textAlign: 'center' }}>
                            <button
                              onClick={() => handleViewUserStats(stat.userId)}
                              style={{
                                padding: '6px 12px',
                                background: '#E3F2FD',
                                border: 'none',
                                borderRadius: '6px',
                                color: '#1565C0',
                                fontSize: '12px',
                                fontWeight: 600,
                                cursor: 'pointer'
                              }}
                            >
                              상세보기
                            </button>
                          </td>
                        </tr>
                      ))}
                      {userStats.length === 0 && (
                        <tr>
                          <td colSpan={9} style={{ padding: '60px', textAlign: 'center', color: '#888' }}>
                            학습 기록이 없습니다
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

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
                <form onSubmit={handleAddWord} style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <input
                    type="text"
                    value={newWord.english}
                    onChange={(e) => setNewWord({ ...newWord, english: e.target.value })}
                    placeholder="영어 단어"
                    style={{
                      flex: 1,
                      minWidth: '150px',
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
                      minWidth: '150px',
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

      {/* 사용자 수정 모달 */}
      {showUserModal && editingUser && (
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
              회원 정보 수정
            </h3>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600, color: '#666' }}>이름</label>
              <input
                type="text"
                value={editingUser.name}
                onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                style={{ width: '100%', padding: '12px 16px', border: '2px solid #eee', borderRadius: '10px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600, color: '#666' }}>아이디</label>
              <input
                type="text"
                value={editingUser.username}
                onChange={(e) => setEditingUser({ ...editingUser, username: e.target.value })}
                style={{ width: '100%', padding: '12px 16px', border: '2px solid #eee', borderRadius: '10px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600, color: '#666' }}>역할</label>
              <select
                value={editingUser.role}
                onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                style={{ width: '100%', padding: '12px 16px', border: '2px solid #eee', borderRadius: '10px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
              >
                <option value="STUDENT">학생</option>
                <option value="ADMIN">관리자</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <button
                onClick={() => { setShowUserModal(false); setEditingUser(null); }}
                style={{ flex: 1, padding: '14px', background: '#f0f0f0', border: 'none', borderRadius: '10px', color: '#666', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}
              >
                취소
              </button>
              <button
                onClick={handleUpdateUser}
                disabled={isSubmitting}
                style={{ flex: 1, padding: '14px', background: 'linear-gradient(135deg, #9B59B6, #B07CC6)', border: 'none', borderRadius: '10px', color: '#fff', fontSize: '14px', fontWeight: 600, cursor: 'pointer', opacity: isSubmitting ? 0.5 : 1 }}
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 학습 통계 상세 모달 */}
      {showStatsModal && selectedUserStats && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          zIndex: 50,
          overflowY: 'auto'
        }}>
          <div style={{ background: '#fff', borderRadius: '20px', padding: '32px', width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: '#1B2A5B' }}>
                {selectedUserStats.stats.userName}님의 학습 통계
              </h3>
              <button
                onClick={() => setShowStatsModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#888' }}
              >
                ×
              </button>
            </div>

            {/* 통계 요약 */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '24px' }}>
              <div style={{ background: '#f8f9ff', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
                <div style={{ fontSize: '12px', color: '#888' }}>총 학습</div>
                <div style={{ fontSize: '24px', fontWeight: 800, color: '#1B2A5B' }}>{selectedUserStats.stats.totalAttempts}</div>
              </div>
              <div style={{ background: '#E8F5E9', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
                <div style={{ fontSize: '12px', color: '#888' }}>퀴즈 정답</div>
                <div style={{ fontSize: '24px', fontWeight: 800, color: '#2E7D32' }}>{selectedUserStats.stats.quizCorrect}</div>
              </div>
              <div style={{ background: '#FFEBEE', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
                <div style={{ fontSize: '12px', color: '#888' }}>퀴즈 오답</div>
                <div style={{ fontSize: '24px', fontWeight: 800, color: '#C62828' }}>{selectedUserStats.stats.quizWrong}</div>
              </div>
            </div>

            {/* 오답 노트 */}
            {selectedUserStats.wrongWords.length > 0 && (
              <div style={{ marginBottom: '24px' }}>
                <h4 style={{ margin: '0 0 12px', fontSize: '16px', fontWeight: 700, color: '#C62828' }}>
                  자주 틀리는 단어 (오답 노트)
                </h4>
                <div style={{ background: '#FFF8F8', borderRadius: '12px', padding: '16px' }}>
                  {selectedUserStats.wrongWords.slice(0, 10).map((word, idx) => (
                    <div key={word.wordId} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '8px 0',
                      borderBottom: idx < selectedUserStats.wrongWords.length - 1 ? '1px solid #FFE0E0' : 'none'
                    }}>
                      <div>
                        <span style={{ fontWeight: 600 }}>{word.english}</span>
                        <span style={{ color: '#888', marginLeft: '8px' }}>{word.korean}</span>
                      </div>
                      <span style={{ color: '#C62828', fontWeight: 600 }}>{word.wrongCount}회</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 최근 퀴즈 */}
            {selectedUserStats.recentQuizzes.length > 0 && (
              <div>
                <h4 style={{ margin: '0 0 12px', fontSize: '16px', fontWeight: 700, color: '#1B2A5B' }}>
                  최근 퀴즈 결과
                </h4>
                <div style={{ background: '#f8f9ff', borderRadius: '12px', padding: '16px' }}>
                  {selectedUserStats.recentQuizzes.slice(0, 10).map((quiz, idx) => (
                    <div key={quiz.id} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '8px 0',
                      borderBottom: idx < selectedUserStats.recentQuizzes.length - 1 ? '1px solid #eee' : 'none'
                    }}>
                      <div>
                        <span style={{ fontWeight: 600 }}>{quiz.levelName}</span>
                        <span style={{ color: '#888', marginLeft: '8px' }}>Day {quiz.dayNumber}</span>
                      </div>
                      <div>
                        <span style={{
                          padding: '4px 10px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: 700,
                          background: quiz.score >= 80 ? '#E8F5E9' : quiz.score >= 50 ? '#FFF3E0' : '#FFEBEE',
                          color: quiz.score >= 80 ? '#2E7D32' : quiz.score >= 50 ? '#EF6C00' : '#C62828'
                        }}>
                          {quiz.correctCount}/{quiz.totalCount} ({quiz.score}%)
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={() => setShowStatsModal(false)}
              style={{
                width: '100%',
                padding: '14px',
                background: '#f0f0f0',
                border: 'none',
                borderRadius: '10px',
                color: '#666',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                marginTop: '24px'
              }}
            >
              닫기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
