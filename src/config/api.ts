/**
 * API Configuration
 */

import Constants from 'expo-constants';
import { Platform } from 'react-native';

const LEGACY_LAN_CANDIDATES = [
  'http://172.20.10.4:3000/api/v1',
  'http://192.168.181.103:3000/api/v1',
];

const stripPort = (value: string): string => value.replace(/:\d+$/, '').replace(/^\[(.*)\]$/, '$1');

const extractHost = (value?: string | null): string | null => {
  if (!value) return null;

  const trimmed = value.trim();
  if (!trimmed) return null;

  try {
    return stripPort(new URL(trimmed).host);
  } catch {
    return stripPort(trimmed.split('/')[0] || '');
  }
};

const getExpoHost = (): string | null => {
  return (
    extractHost(Constants.expoConfig?.hostUri) ||
    extractHost(Constants.linkingUri) ||
    extractHost(Constants.experienceUrl) ||
    extractHost(Constants.manifest2?.extra?.expoClient?.hostUri)
  );
};

const getAutoDetectedApiBaseUrl = (): string | null => {
  const expoHost = getExpoHost();

  if (!expoHost) {
    return null;
  }

  if (Platform.OS === 'android' && (expoHost === 'localhost' || expoHost === '127.0.0.1')) {
    return 'http://10.0.2.2:3000/api/v1';
  }

  return `http://${expoHost}:3000/api/v1`;
};

const unique = (values: (string | null | undefined)[]): string[] =>
  Array.from(new Set(values.filter(Boolean) as string[]));

// Candidate base URLs in priority order (first reachable one wins)
export const API_BASE_URL_CANDIDATES = unique([
  process.env.EXPO_PUBLIC_API_URL,          // Manual override when targeting a remote/staging API
  getAutoDetectedApiBaseUrl(),              // Expo Go / dev build host -> backend on same machine
  Platform.OS === 'android' ? 'http://10.0.2.2:3000/api/v1' : null, // Android emulator
  'http://127.0.0.1:3000/api/v1',           // iOS simulator / local machine
  'http://localhost:3000/api/v1',           // web / fallback
  ...LEGACY_LAN_CANDIDATES,                 // Older saved LAN IPs
]);

export const API_CONFIG = {
  BASE_URL: API_BASE_URL_CANDIDATES[0] || 'http://127.0.0.1:3000/api/v1',
  TIMEOUT: 30000, // 30 seconds
};

export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    REGISTER: '/auth/register',
    LOGIN: '/auth/login',
    VERIFY_EMAIL: '/auth/verify-email',
    RESEND_OTP: '/auth/resend-otp',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
    REFRESH_TOKEN: '/auth/refresh-token',
    LOGOUT: '/auth/logout',
    ME: '/auth/me',
    PROFILE: '/auth/profile',
  },
  
  // Onboarding
  ONBOARDING: {
    SETUP_PROFILE: '/onboarding/profile',
    RECORD_CONSENT: '/onboarding/consent',
    COMPLETE: '/onboarding/complete',
  },

  // Dashboard
  DASHBOARD: {
    SUMMARY: '/dashboard/summary',
    TRENDS: '/dashboard/spending-trends',
    STATS: '/dashboard/stats',
    BUDGET: '/dashboard/budget',
  },

  // Expenses
  EXPENSES: {
    BASE: '/expenses',
    BULK: '/expenses/bulk',
  },

  // Income
  INCOME: {
    BASE: '/income',
    BULK: '/income/bulk',
  },

  // Categories
  CATEGORIES: {
    BASE: '/categories',
  },

  // Transactions (unified expenses and income)
  TRANSACTIONS: {
    BASE: '/transactions',
  },

  // Bank connections and imports
  BANK: {
    CONNECT: '/bank/connect',
    CONNECTIONS: '/bank/connections',
    UPLOAD: '/bank/upload',
    IMPORTS: '/bank/imports',
    IMPORT_STATUS: '/bank/import',
    UNDO_IMPORT: '/bank/import',
  },

  // Sync operations (bank connections)
  SYNC: {
    ALL: '/sync/all',
    CONNECTION: '/sync/connections',
    CONNECTION_SETTINGS: '/sync/connections',
    CONNECTION_STATUS: '/sync/connections',
    CONNECTION_CANCEL: '/sync/connections',
    HISTORY: '/sync/history',
    LOGS: '/sync/logs',
    STATS: '/sync/stats',
    RETRY: '/sync/retry',
  },

  // Notifications
  NOTIFICATIONS: {
    LIST: '/notifications',
    UNREAD_COUNT: '/notifications/unread-count',
    READ_ALL: '/notifications/read-all',
    REGISTER_TOKEN: '/notifications/register-token',
    PREFERENCES: '/notifications/preferences',
  },

  // AI insights hub
  INSIGHTS: {
    HUB: '/insights/hub',
    HEALTH_SCORE: '/insights/health-score',
    FORECAST: '/insights/forecast',
    WHAT_IF: '/insights/what-if',
    CHAT: '/insights/chat',
    FEEDBACK: '/insights/feedback',
  },
} as const;
