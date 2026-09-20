/**
 * 단어/레벨/Day 상태 관리 스토어 (Zustand)
 */
import { create } from 'zustand';
import type { Level, Day, DayDetail, Word, ViewMode } from '../types';
import { getLevels, getDaysByLevel, getDayDetail, getAllWordsByLevel } from '../services/api';

interface WordState {
  // 상태
  levels: Level[];
  days: Day[];
  currentDay: DayDetail | null;
  currentLevelId: number | null;
  currentDayId: number | null;
  viewMode: ViewMode;
  allWordsInLevel: Word[]; // 퀴즈 오답용
  isLoading: boolean;
  error: string | null;

  // 액션
  fetchLevels: () => Promise<void>;
  fetchDays: (levelId: number) => Promise<void>;
  fetchDayDetail: (dayId: number) => Promise<void>;
  fetchAllWordsInLevel: (levelId: number) => Promise<void>;
  setCurrentLevel: (levelId: number) => Promise<void>;
  setCurrentDay: (dayId: number) => void;
  setViewMode: (mode: ViewMode) => void;
  clearError: () => void;
}

export const useWordStore = create<WordState>((set, get) => ({
  // 초기 상태
  levels: [],
  days: [],
  currentDay: null,
  currentLevelId: null,
  currentDayId: null,
  viewMode: 'list',
  allWordsInLevel: [],
  isLoading: false,
  error: null,

  // 모든 레벨 조회
  fetchLevels: async () => {
    set({ isLoading: true, error: null });
    try {
      const levels = await getLevels();
      set({ levels, isLoading: false });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : '레벨 조회에 실패했습니다';
      set({ error: message, isLoading: false });
    }
  },

  // 특정 레벨의 Day 목록 조회
  fetchDays: async (levelId: number) => {
    set({ isLoading: true, error: null });
    try {
      const days = await getDaysByLevel(levelId);
      set({ days, currentLevelId: levelId, isLoading: false });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Day 목록 조회에 실패했습니다';
      set({ error: message, isLoading: false });
    }
  },

  // Day 상세 조회 (단어 포함)
  fetchDayDetail: async (dayId: number) => {
    set({ isLoading: true, error: null });
    try {
      const currentDay = await getDayDetail(dayId);
      set({ currentDay, currentDayId: dayId, isLoading: false });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Day 조회에 실패했습니다';
      set({ error: message, isLoading: false });
    }
  },

  // 퀴즈 오답용 - 레벨의 모든 단어 조회
  fetchAllWordsInLevel: async (levelId: number) => {
    try {
      const allWordsInLevel = await getAllWordsByLevel(levelId);
      set({ allWordsInLevel });
    } catch (error: unknown) {
      console.error('전체 단어 조회 실패:', error);
    }
  },

  // 현재 레벨 설정
  setCurrentLevel: async (levelId: number) => {
    // 레벨 변경 시 days도 초기화하여 useEffect 타이밍 문제 해결
    set({ currentLevelId: levelId, currentDay: null, currentDayId: null, days: [] });

    // Days 조회 후 첫 번째 Day 자동 선택
    try {
      const days = await getDaysByLevel(levelId);
      set({ days });

      // 첫 번째 Day가 있으면 자동으로 선택
      if (days.length > 0) {
        const currentDay = await getDayDetail(days[0].id);
        set({ currentDay, currentDayId: days[0].id });
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Day 목록 조회에 실패했습니다';
      set({ error: message });
    }

    // 퀴즈용 전체 단어도 조회
    get().fetchAllWordsInLevel(levelId);
  },

  // 현재 Day 설정
  setCurrentDay: (dayId: number) => {
    set({ currentDayId: dayId });
    get().fetchDayDetail(dayId);
  },

  // 뷰 모드 변경
  setViewMode: (mode: ViewMode) => {
    set({ viewMode: mode });
  },

  // 에러 초기화
  clearError: () => set({ error: null }),
}));
