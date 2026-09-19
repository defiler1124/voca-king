/**
 * VOCA KING 타입 정의
 */

// 사용자 역할
export type UserRole = 'ADMIN' | 'STUDENT';

// 사용자 정보
export interface User {
  id: number;
  email: string;
  name: string;
  role: UserRole;
}

// 로그인 응답
export interface LoginResponse {
  token: string;
  email: string;
  name: string;
  role: UserRole;
}

// 레벨 정보
export interface Level {
  id: number;
  name: string;
  color: string;
  lightColor: string;
  orderIndex: number;
  dayCount: number;
}

// Day 정보
export interface Day {
  id: number;
  levelId: number;
  dayNumber: number;
  title?: string;
  wordCount: number;
}

// Day 상세 (단어 포함)
export interface DayDetail {
  id: number;
  levelId: number;
  levelName: string;
  dayNumber: number;
  title?: string;
  words: Word[];
}

// 단어 정보
export interface Word {
  id: number;
  english: string;
  korean: string;
  orderIndex: number;
  example?: string;
  pronunciation?: string;
}

// 퀴즈 결과
export interface QuizResult {
  id: number;
  userId: number;
  dayId: number;
  correctCount: number;
  totalCount: number;
  score: number;
  completedAt: string;
}

// API 에러 응답
export interface ApiError {
  message: string;
  status: number;
}

// 뷰 모드
export type ViewMode = 'list' | 'card' | 'flash' | 'quiz';
