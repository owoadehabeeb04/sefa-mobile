/**
 * API Configuration
 */

export const API_CONFIG = {
  BASE_URL: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api/v1',
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
