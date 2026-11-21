/**
 * 게임 진도 스토어
 *
 * 사용자의 게임 클리어 상태를 서버에서 관리
 */
import { create } from 'zustand';
import { getProgressSummary, saveGameProgress, SaveProgressRequest } from '../services/api';

interface ProgressState {
  flashCleared: number[];
  listenCleared: number[];
  bananaCleared: number[];
  animalCleared: number[];
  isLoaded: boolean;
  isLoading: boolean;

  fetchProgress: () => Promise<void>;
  saveProgress: (data: SaveProgressRequest) => Promise<void>;
  isStageCleared: (dayId: number, gameType: SaveProgressRequest['gameType']) => boolean;
  reset: () => void;
}

export const useProgressStore = create<ProgressState>((set, get) => ({
  flashCleared: [],
  listenCleared: [],
  bananaCleared: [],
  animalCleared: [],
  isLoaded: false,
  isLoading: false,

  fetchProgress: async () => {
    if (get().isLoading) return;

    set({ isLoading: true });
    try {
      const summary = await getProgressSummary();
      set({
        flashCleared: summary.flashCleared || [],
        listenCleared: summary.listenCleared || [],
        bananaCleared: summary.bananaCleared || [],
        animalCleared: summary.animalCleared || [],
        isLoaded: true,
        isLoading: false,
      });
    } catch (error) {
      console.error('진도 로드 실패:', error);
      set({ isLoading: false });
    }
  },

  saveProgress: async (data) => {
    try {
      await saveGameProgress(data);

      // 로컬 상태 즉시 업데이트
      const state = get();
      if (data.gameType === 'FLASH' && !state.flashCleared.includes(data.dayId)) {
        set({ flashCleared: [...state.flashCleared, data.dayId] });
      } else if (data.gameType === 'LISTEN' && !state.listenCleared.includes(data.dayId)) {
        set({ listenCleared: [...state.listenCleared, data.dayId] });
      } else if (data.gameType === 'BANANA' && !state.bananaCleared.includes(data.dayId)) {
        set({ bananaCleared: [...state.bananaCleared, data.dayId] });
      } else if (data.gameType === 'ANIMAL' && !state.animalCleared.includes(data.dayId)) {
        set({ animalCleared: [...state.animalCleared, data.dayId] });
      }
    } catch (error) {
      console.error('진도 저장 실패:', error);
      throw error;
    }
  },

  isStageCleared: (dayId, gameType) => {
    const state = get();
    if (gameType === 'FLASH') return state.flashCleared.includes(dayId);
    if (gameType === 'LISTEN') return state.listenCleared.includes(dayId);
    if (gameType === 'BANANA') return state.bananaCleared.includes(dayId);
    if (gameType === 'ANIMAL') return state.animalCleared.includes(dayId);
    return false;
  },

  reset: () => {
    set({
      flashCleared: [],
      listenCleared: [],
      bananaCleared: [],
      animalCleared: [],
      isLoaded: false,
      isLoading: false,
    });
  },
}));
