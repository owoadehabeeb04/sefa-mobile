/**
 * API Configuration
 */

// Candidate base URLs in priority order (first reachable one wins)
export const API_BASE_URL_CANDIDATES = [
  process.env.EXPO_PUBLIC_API_URL,          // .env override (highest priority)
  'http://172.20.10.4:3000/api/v1',         // Hotspot IP
  'http://192.168.181.103:3000/api/v1',     // Wi-Fi IP
  'http://10.0.2.2:3000/api/v1',            // Android emulator
  'http://localhost:3000/api/v1',            // iOS simulator / web
].filter(Boolean) as string[];

export const API_CONFIG = {
  BASE_URL: API_BASE_URL_CANDIDATES[0] || 'http://localhost:3000/api/v1',
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
} as const;
