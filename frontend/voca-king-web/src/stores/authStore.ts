/**
 * 인증 상태 관리 스토어 (Zustand)
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../types';
import { login as apiLogin, register as apiRegister, getCurrentUser } from '../services/api';

interface AuthState {
  // 상태
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;

  // 액션
  login: (username: string, password: string) => Promise<User>;
  register: (username: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // 초기 상태
      user: null,
      token: null,
      isLoading: false,
      error: null,

      // 로그인
      login: async (username: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await apiLogin(username, password);
          const user: User = {
            id: 0, // API 응답에 ID가 없으면 0으로 설정
            username: response.username,
            name: response.name,
            role: response.role,
          };
          localStorage.setItem('token', response.token);
          set({ user, token: response.token, isLoading: false });
          return user;
        } catch (error: unknown) {
          // Axios 에러에서 서버 메시지 추출
          const err = error as { response?: { data?: { error?: string } } };
          const message = err.response?.data?.error || '로그인에 실패했습니다';
          set({ error: message, isLoading: false });
          throw error;
        }
      },

      // 회원가입
      register: async (username: string, password: string, name: string) => {
        set({ isLoading: true, error: null });
        try {
          await apiRegister(username, password, name);
          set({ isLoading: false });
        } catch (error: unknown) {
          // Axios 에러에서 서버 메시지 추출
          const err = error as { response?: { data?: { error?: string } } };
          const message = err.response?.data?.error || '회원가입에 실패했습니다';
          set({ error: message, isLoading: false });
          throw error;
        }
      },

      // 로그아웃
      logout: () => {
        localStorage.removeItem('token');
        set({ user: null, token: null });
      },

      // 인증 상태 확인
      checkAuth: async () => {
        const token = localStorage.getItem('token');
        if (!token) {
          set({ user: null, token: null });
          return;
        }

        try {
          const user = await getCurrentUser();
          set({ user, token });
        } catch {
          localStorage.removeItem('token');
          set({ user: null, token: null });
        }
      },

      // 에러 초기화
      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ token: state.token }),
    }
  )
);
