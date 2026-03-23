/**
 * API Service - Axios instance with interceptors
 */

import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig, isAxiosError } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { API_CONFIG, API_BASE_URL_CANDIDATES } from '../config/api';

const GENERIC_ERROR_MESSAGE = 'An error occurred';

const toUserSafeError = (error: unknown): Error => {
  if (isAxiosError(error)) {
    const serverMessage = error.response?.data?.error?.message
      || error.response?.data?.message
      || error.message
      || GENERIC_ERROR_MESSAGE;

    const safeError = new Error(serverMessage) as Error & {
      status?: number;
      code?: string;
      response?: AxiosError['response'];
      original?: AxiosError;
    };

    safeError.status = error.response?.status;
    safeError.code = error.code;
    safeError.response = error.response;
    safeError.original = error;

    return safeError;
  }

  return new Error(GENERIC_ERROR_MESSAGE);
};

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Token storage keys
const TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'auth_refresh_token';

/**
 * Discover the first reachable backend URL from the candidate list.
 * Tries each candidate's /health endpoint with a short timeout.
 * Updates the axios instance baseURL when a working one is found.
 */
let discoveryDone = false;
export const discoverBaseURL = async (): Promise<string> => {
  if (discoveryDone) return api.defaults.baseURL!;

  for (const candidate of API_BASE_URL_CANDIDATES) {
    // Health endpoint is at the root (strip /api/v1)
    const root = candidate.replace(/\/api\/v1\/?$/, '');
    try {
      await axios.get(`${root}/health`, { timeout: 3000 });
      api.defaults.baseURL = candidate;
      API_CONFIG.BASE_URL = candidate;
      discoveryDone = true;
      console.log(`✅ API connected: ${candidate}`);
      return candidate;
    } catch {
      console.log(`⏭️  ${candidate} unreachable, trying next...`);
    }
  }

  // None reachable — keep the first candidate so requests at least attempt something
  discoveryDone = true;
  console.warn('⚠️ No backend reachable, using default:', api.defaults.baseURL);
  return api.defaults.baseURL!;
};

// Kick off discovery immediately and store the promise
const discoveryPromise = discoverBaseURL();

/**
 * Get stored access token
 */
export const getStoredToken = async (): Promise<string | null> => {
  try {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch (error) {
    console.error('Error getting token:', error);
    return null;
  }
};

/**
 * Get stored refresh token
 */
export const getStoredRefreshToken = async (): Promise<string | null> => {
  try {
    return await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
  } catch (error) {
    console.error('Error getting refresh token:', error);
    return null;
  }
};

/**
 * Store tokens securely
 */
export const storeTokens = async (token: string, refreshToken: string): Promise<void> => {
  try {
    // Validate that tokens are strings and not empty
    if (!token || typeof token !== 'string') {
      throw new Error('Invalid token: token must be a non-empty string');
    }
    if (!refreshToken || typeof refreshToken !== 'string') {
      throw new Error('Invalid refreshToken: refreshToken must be a non-empty string');
    }

    await SecureStore.setItemAsync(TOKEN_KEY, token);
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
  } catch (error) {
    console.error('Error storing tokens:', error);
    throw error;
  }
};

/**
 * Clear stored tokens
 */
export const clearTokens = async (): Promise<void> => {
  try {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
  } catch (error) {
    console.error('Error clearing tokens:', error);
  }
};

// Request interceptor - Ensure discovery is done, then add token
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    // Wait for URL discovery before any request
    await discoveryPromise;
    config.baseURL = API_CONFIG.BASE_URL;

    const token = await getStoredToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // If error is 401 and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = await getStoredRefreshToken();
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        // Try to refresh token
        const response = await axios.post(
          `${API_CONFIG.BASE_URL}/auth/refresh-token`,
          { refreshToken }
        );

        const { token } = response.data.data;
        
        // Validate token before storing
        if (!token || typeof token !== 'string') {
          throw new Error('Invalid token received from refresh endpoint');
        }
        
        // Store new token
        await SecureStore.setItemAsync(TOKEN_KEY, token);

        // Retry original request with new token
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${token}`;
        }
        
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed - clear tokens and redirect to login
        await clearTokens();
        return Promise.reject(toUserSafeError(refreshError));
      }
    }

    return Promise.reject(toUserSafeError(error));
  }
);

export default api;
