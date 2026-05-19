import { create } from 'zustand';

interface AuthState {
  isLoggedIn: boolean;
  nickname: string | null;
  login: (nickname: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isLoggedIn: false,
  nickname: null,
  login: (nickname: string) => {
    set({ isLoggedIn: true, nickname });
  },
  logout: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('nickname');
    set({ isLoggedIn: false, nickname: null });
  },
}));
