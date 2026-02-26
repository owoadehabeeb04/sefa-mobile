/**
 * Notification Preferences Service
 */

import api from '@/services/api';
import { API_ENDPOINTS } from '@/config/api';
import type { NotificationPreferences, NotificationPreferencesResponse } from './notificationPreferences.types';

const mapPreferencesFromApi = (prefs: any): NotificationPreferences => ({
  id: prefs._id ?? prefs.id,
  pushEnabled: prefs.pushEnabled ?? true,
  transactionAlerts: prefs.transactionAlerts ?? true,
  budgetWarnings: prefs.budgetWarnings ?? true,
  weeklyReports: prefs.weeklyReports ?? true,
  goalUpdates: prefs.goalUpdates ?? true,
  importNotifications: prefs.importNotifications ?? true,
  maxNotificationsPerDay: prefs.maxNotificationsPerDay ?? 10,
  dailyDigestEnabled: prefs.dailyDigestEnabled ?? false,
  dailyDigestTime: prefs.dailyDigestTime ?? '09:00',
  weeklySummaryEnabled: prefs.weeklySummaryEnabled ?? true,
  weeklySummaryDay: prefs.weeklySummaryDay ?? 0,
  weeklySummaryTime: prefs.weeklySummaryTime ?? '20:00',
  quietHoursEnabled: prefs.quietHoursEnabled ?? false,
  quietHoursStart: prefs.quietHoursStart ?? '22:00',
  quietHoursEnd: prefs.quietHoursEnd ?? '07:00',
  largeTransactionMinAmount: prefs.largeTransactionMinAmount ?? 10000,
  budgetWarningThreshold: prefs.budgetWarningThreshold ?? 80,
  timezone: prefs.timezone ?? 'Africa/Lagos',
});

export const getNotificationPreferences = async (): Promise<NotificationPreferences> => {
  const response = await api.get<NotificationPreferencesResponse>(API_ENDPOINTS.NOTIFICATIONS.PREFERENCES);
  return mapPreferencesFromApi(response.data.data);
};

export const updateNotificationPreferences = async (
  input: Partial<NotificationPreferences>
): Promise<NotificationPreferences> => {
  const response = await api.patch<NotificationPreferencesResponse>(
    API_ENDPOINTS.NOTIFICATIONS.PREFERENCES,
    input
  );
  return mapPreferencesFromApi(response.data.data);
};
