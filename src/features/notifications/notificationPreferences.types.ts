export interface NotificationPreferences {
  id?: string;
  pushEnabled: boolean;
  transactionAlerts: boolean;
  budgetWarnings: boolean;
  weeklyReports: boolean;
  goalUpdates: boolean;
  importNotifications: boolean;
  maxNotificationsPerDay: number;
  dailyDigestEnabled: boolean;
  dailyDigestTime: string;
  weeklySummaryEnabled: boolean;
  weeklySummaryDay: number;
  weeklySummaryTime: string;
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
  largeTransactionMinAmount: number;
  budgetWarningThreshold: number;
  timezone?: string;
}

export interface NotificationPreferencesResponse {
  success: boolean;
  data: NotificationPreferences;
  message?: string;
  timestamp?: string;
}
