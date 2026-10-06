/**
 * API 서비스 모듈
 *
 * axios를 사용한 HTTP 클라이언트 설정 및 API 호출 함수
 */
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import type { User, LoginResponse, Level, Day, DayDetail, Word } from '../types';

// API 기본 URL (환경변수에서 읽음)
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

// axios 인스턴스 생성
const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 요청 인터셉터: JWT 토큰 자동 추가
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 응답 인터셉터: 401 에러 시 로그아웃 처리 (로그인/회원가입 요청 제외)
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const requestUrl = error.config?.url || '';
    const isAuthRequest = requestUrl.includes('/auth/');

    // 인증 요청이 아닌 경우에만 리다이렉트
    if (error.response?.status === 401 && !isAuthRequest) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ==================== 인증 API ====================

/** 회원가입 */
export const register = async (username: string, password: string, name: string): Promise<User> => {
  const response = await api.post<User>('/auth/register', { username, password, name });
  return response.data;
};

/** 로그인 */
export const login = async (username: string, password: string): Promise<LoginResponse> => {
  const response = await api.post<LoginResponse>('/auth/login', { username, password });
  return response.data;
};

/** 현재 사용자 정보 조회 */
export const getCurrentUser = async (): Promise<User> => {
  const response = await api.get<User>('/auth/me');
  return response.data;
};

// ==================== 레벨 API ====================

/** 모든 레벨 조회 */
export const getLevels = async (): Promise<Level[]> => {
  const response = await api.get<Level[]>('/levels');
  return response.data;
};

/** 레벨 상세 조회 */
export const getLevel = async (levelId: number): Promise<Level> => {
  const response = await api.get<Level>(`/levels/${levelId}`);
  return response.data;
};

/** 레벨의 Day 목록 조회 */
export const getDaysByLevel = async (levelId: number): Promise<Day[]> => {
  const response = await api.get<Day[]>(`/levels/${levelId}/days`);
  return response.data;
};

/** 레벨의 모든 단어 조회 (퀴즈 오답용) */
export const getAllWordsByLevel = async (levelId: number): Promise<Word[]> => {
  const response = await api.get<Word[]>(`/levels/${levelId}/all-words`);
  return response.data;
};

/** 레벨 생성 (관리자) */
export const createLevel = async (level: { name: string; color: string; lightColor: string; orderIndex: number }): Promise<Level> => {
  const response = await api.post<Level>('/levels', level);
  return response.data;
};

/** 레벨 수정 (관리자) */
export const updateLevel = async (levelId: number, level: { name: string; color: string; lightColor: string; orderIndex: number }): Promise<Level> => {
  const response = await api.put<Level>(`/levels/${levelId}`, level);
  return response.data;
};

/** 레벨 삭제 (관리자) */
export const deleteLevel = async (levelId: number): Promise<void> => {
  await api.delete(`/levels/${levelId}`);
};

// ==================== Day API ====================

/** Day 상세 조회 (단어 포함) */
export const getDayDetail = async (dayId: number): Promise<DayDetail> => {
  const response = await api.get<DayDetail>(`/days/${dayId}`);
  return response.data;
};

/** Day 생성 (관리자) */
export const createDay = async (day: { levelId: number; dayNumber: number; title: string }): Promise<Day> => {
  const response = await api.post<Day>('/days', day);
  return response.data;
};

/** Day 수정 (관리자) */
export const updateDay = async (dayId: number, day: { levelId: number; dayNumber: number; title: string }): Promise<Day> => {
  const response = await api.put<Day>(`/days/${dayId}`, day);
  return response.data;
};

/** Day 삭제 (관리자) */
export const deleteDay = async (dayId: number): Promise<void> => {
  await api.delete(`/days/${dayId}`);
};

// ==================== 단어 API (관리자) ====================

/** 단어 생성 */
export const createWord = async (dayId: number, word: Omit<Word, 'id'>): Promise<Word> => {
  const response = await api.post<Word>(`/words?dayId=${dayId}`, word);
  return response.data;
};

/** 단어 일괄 생성 */
export const createWordsBulk = async (dayId: number, words: Omit<Word, 'id'>[]): Promise<Word[]> => {
  const response = await api.post<Word[]>('/words/bulk', { dayId, words });
  return response.data;
};

/** 단어 수정 */
export const updateWord = async (wordId: number, word: Omit<Word, 'id'>): Promise<Word> => {
  const response = await api.put<Word>(`/words/${wordId}`, word);
  return response.data;
};

/** 단어 삭제 */
export const deleteWord = async (wordId: number): Promise<void> => {
  await api.delete(`/words/${wordId}`);
};

// ==================== 학습 API ====================

export type AttemptType = 'LISTEN' | 'FLASH' | 'QUIZ';

export interface AttemptRequest {
  wordId: number;
  attemptType: AttemptType;
  correct?: boolean;
  selectedAnswer?: string;
}

export interface QuizResultRequest {
  dayId: number;
  correctCount: number;
  totalCount: number;
  attempts?: AttemptRequest[];
}

export interface UserStats {
  userId: number;
  userName: string;
  username: string;
  totalAttempts: number;
  listenCount: number;
  flashCount: number;
  quizAttempts: number;
  quizCorrect: number;
  quizWrong: number;
  accuracyRate: number;
  todayAttempts: number;
  lastStudyAt: string | null;
  createdAt: string;
}

export interface WrongWord {
  wordId: number;
  english: string;
  korean: string;
  wrongCount: number;
}

export interface QuizHistory {
  id: number;
  dayTitle: string;
  dayNumber: number;
  levelName: string;
  correctCount: number;
  totalCount: number;
  score: number;
  completedAt: string;
}

export interface UserDetailStats {
  stats: UserStats;
  wrongWords: WrongWord[];
  recentQuizzes: QuizHistory[];
}

/** 학습 기록 저장 */
export const recordAttempt = async (request: AttemptRequest): Promise<void> => {
  await api.post('/learning/attempt', request);
};

/** 퀴즈 결과 저장 */
export const saveQuizResult = async (request: QuizResultRequest): Promise<void> => {
  await api.post('/learning/quiz-result', request);
};

/** 내 학습 통계 조회 */
export const getMyStats = async (): Promise<UserStats> => {
  const response = await api.get<UserStats>('/learning/my-stats');
  return response.data;
};

/** 내 상세 학습 통계 조회 */
export const getMyDetailStats = async (): Promise<UserDetailStats> => {
  const response = await api.get<UserDetailStats>('/learning/my-stats/detail');
  return response.data;
};

// ==================== 관리자 API ====================

export interface AdminUser {
  id: number;
  username: string;
  name: string;
  role: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface OverallStats {
  totalUsers: number;
  activeUsersToday: number;
  totalAttempts: number;
  totalQuizzes: number;
  averageAccuracy: number;
}

/** 전체 사용자 목록 (관리자) */
export const getAdminUsers = async (): Promise<AdminUser[]> => {
  const response = await api.get<AdminUser[]>('/admin/users');
  return response.data;
};

/** 사용자 활성화 토글 (관리자) */
export const toggleUserActive = async (userId: number): Promise<AdminUser> => {
  const response = await api.patch<AdminUser>(`/admin/users/${userId}/active`);
  return response.data;
};

/** 사용자 역할 변경 (관리자) */
export const changeUserRole = async (userId: number, role: 'ADMIN' | 'STUDENT'): Promise<AdminUser> => {
  const response = await api.patch<AdminUser>(`/admin/users/${userId}/role?role=${role}`);
  return response.data;
};

/** 사용자 정보 수정 (관리자) */
export const updateUser = async (userId: number, data: { name?: string; username?: string }): Promise<AdminUser> => {
  const response = await api.put<AdminUser>(`/admin/users/${userId}`, data);
  return response.data;
};

/** 사용자 삭제 (관리자) */
export const deleteUser = async (userId: number): Promise<void> => {
  await api.delete(`/admin/users/${userId}`);
};

/** 전체 사용자 학습 통계 (관리자) */
export const getAllUserStats = async (): Promise<UserStats[]> => {
  const response = await api.get<UserStats[]>('/admin/stats/users');
  return response.data;
};

/** 특정 사용자 상세 통계 (관리자) */
export const getUserDetailStats = async (userId: number): Promise<UserDetailStats> => {
  const response = await api.get<UserDetailStats>(`/admin/stats/users/${userId}`);
  return response.data;
};

/** 전체 통계 요약 (관리자) */
export const getOverallStats = async (): Promise<OverallStats> => {
  const response = await api.get<OverallStats>('/admin/stats/overall');
  return response.data;
};

export default api;
