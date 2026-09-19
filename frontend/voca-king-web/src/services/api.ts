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

// 응답 인터셉터: 401 에러 시 로그아웃 처리
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ==================== 인증 API ====================

/** 회원가입 */
export const register = async (email: string, password: string, name: string): Promise<User> => {
  const response = await api.post<User>('/auth/register', { email, password, name });
  return response.data;
};

/** 로그인 */
export const login = async (email: string, password: string): Promise<LoginResponse> => {
  const response = await api.post<LoginResponse>('/auth/login', { email, password });
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

export default api;
