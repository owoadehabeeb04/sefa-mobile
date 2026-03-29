/**
 * Auth Store - Zustand state management for authentication
 */

import { create } from 'zustand';
import {
  storeTokens,
  clearTokens,
  getStoredRefreshToken,
  getStoredToken,
  registerAuthFailureHandler,
} from '@/services/api';
import type { User } from '@/features/auth/auth.types';

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  didRestoreSession: boolean;
  
  // Actions
  setAuth: (user: User, token: string, refreshToken: string) => Promise<void>;
  setUser: (user: User) => void;
  initializeAuth: () => Promise<void>;
  logout: () => Promise<void>;
  clearAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: true,
  didRestoreSession: false,

  initializeAuth: async () => {
    try {
      const storedRefreshToken = await getStoredRefreshToken();
      const storedToken = await getStoredToken();

      if (storedToken && storedRefreshToken) {
        set({
          token: storedToken,
          refreshToken: storedRefreshToken,
          isAuthenticated: true,
          isLoading: false,
          didRestoreSession: true,
        });
      } else {
        await clearTokens();
        set({
          token: null,
          refreshToken: null,
          isAuthenticated: false,
          isLoading: false,
          didRestoreSession: false,
        });
      }
    } catch (error) {
      console.error('Error initializing auth:', error);
      set({
        token: null,
        refreshToken: null,
        isAuthenticated: false,
        isLoading: false,
        didRestoreSession: false,
      });
    }
  },

  setAuth: async (user, token, refreshToken) => {
    try {
      // Store tokens securely
      await storeTokens(token, refreshToken);
      
      set({
        user,
        token,
        refreshToken,
        isAuthenticated: true,
        isLoading: false,
        didRestoreSession: false,
      });
    } catch (error) {
      console.error('Failed to store authentication tokens:', error);
      // Don't update state if token storage fails
      set({
        isLoading: false,
      });
      throw error; // Re-throw to let the caller handle it
    }
  },

  setUser: (user) => {
    const state = get();
    set({ 
      user,
      // Update isAuthenticated based on user and token
      isAuthenticated: !!user && !!state.token,
    });
  },

  logout: async () => {
    await clearTokens();
    set({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      didRestoreSession: false,
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
      didRestoreSession: false,
    });
  },
}));

registerAuthFailureHandler(async () => {
  useAuthStore.setState({
    user: null,
    token: null,
    refreshToken: null,
    isAuthenticated: false,
    isLoading: false,
    didRestoreSession: false,
  });
});
