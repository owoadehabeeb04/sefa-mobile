/**
 * Auth Store - Zustand state management for authentication
 */

import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { storeTokens, clearTokens } from '@/services/api';
import type { User } from '@/features/auth/auth.types';

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // Actions
  setAuth: (user: User, token: string, refreshToken: string) => Promise<void>;
  setUser: (user: User) => void;
  logout: () => Promise<void>;
  clearAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: true,

  setAuth: async (user, token, refreshToken) => {
    // Store tokens securely
    await storeTokens(token, refreshToken);
    
    set({
      user,
      token,
      refreshToken,
      isAuthenticated: true,
      isLoading: false,
    });
  },

  setUser: (user) => {
    set({ user });
  },

  logout: async () => {
    await clearTokens();
    set({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
    });
  },

  clearAuth: async () => {
    await clearTokens();
    set({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
    });
  },
}));
