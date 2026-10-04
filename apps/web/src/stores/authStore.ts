'use client';

import { create } from 'zustand';
import { api } from '../lib/api';

export interface User {
  id: string;
  fullName: string;
  email: string;
  role: 'SUPER_ADMIN' | 'INSTRUCTOR' | 'COMMANDER' | 'TEAM_OPERATOR' | 'OBSERVER';
  avatarInitials: string;
  themePreference: string;
  twoFactorEnabled: boolean;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  theme: 'dark' | 'light';
  setUser: (user: User | null) => void;
  setTheme: (theme: 'dark' | 'light') => void;
  initAuth: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: true,
  theme: 'light',

  setUser: (user) => {
    set({ user });
    if (typeof window !== 'undefined') {
      if (user) {
        localStorage.setItem('nd_user', JSON.stringify(user));
      } else {
        localStorage.removeItem('nd_user');
      }
    }
  },

  setTheme: (_theme) => {
    set({ theme: 'light' });
    if (typeof window !== 'undefined') {
      localStorage.setItem('nd_theme', 'light');
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    }
  },

  initAuth: async () => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('nd_theme', 'light');
        document.documentElement.classList.remove('dark');
        document.documentElement.classList.add('light');

        // 1. Immediately restore cached user from localStorage to eliminate flicker & prevent instant kickout
        const cachedUserStr = localStorage.getItem('nd_user');
        if (cachedUserStr) {
          try {
            const cachedUser = JSON.parse(cachedUserStr);
            set({ user: cachedUser, isLoading: false, theme: 'light' });
          } catch {}
        }
      }

      // 2. Check if accessToken is available in memory or localStorage
      const token = api.getToken();
      if (token) {
        try {
          const data = await api.get('/auth/me');
          if (data?.user) {
            set({ user: data.user, isLoading: false, theme: 'light' });
            if (typeof window !== 'undefined') {
              localStorage.setItem('nd_user', JSON.stringify(data.user));
            }
            return;
          }
        } catch {
          // Access token might be expired, fall through to refresh
        }
      }

      // 3. Try refreshing session
      const success = await api.refreshToken();
      if (success) {
        const data = await api.get('/auth/me');
        if (data?.user) {
          set({ user: data.user, isLoading: false, theme: 'light' });
          if (typeof window !== 'undefined') {
            localStorage.setItem('nd_user', JSON.stringify(data.user));
          }
          return;
        }
      }

      // If both token and refresh failed and there's no valid session, clear
      if (!api.getToken()) {
        set({ user: null });
        if (typeof window !== 'undefined') {
          localStorage.removeItem('nd_user');
        }
      }
    } catch {
      // not logged in
    } finally {
      set({ isLoading: false });
    }
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch {}
    api.setToken(null);
    api.setRefreshToken(null);
    set({ user: null });
    if (typeof window !== 'undefined') {
      localStorage.removeItem('nd_user');
      window.location.href = '/login';
    }
  },
}));
