import api from '@/services/api';
import { API_ENDPOINTS } from '@/config/api';
import type {
  NotificationsResponse,
  UnreadCountResponse,
  AppNotification,
  NotificationFilters,
} from './notification.types';

export const notificationService = {
  /**
   * Fetch paginated notifications list
   */
  getNotifications: async (filters: NotificationFilters = {}): Promise<NotificationsResponse> => {
    const params = new URLSearchParams();
    if (filters.page) params.set('page', String(filters.page));
    if (filters.limit) params.set('limit', String(filters.limit));
    if (filters.status) params.set('status', filters.status);
    if (filters.type) params.set('type', filters.type);

    const query = params.toString();
    const url = query
      ? `${API_ENDPOINTS.NOTIFICATIONS.LIST}?${query}`
      : API_ENDPOINTS.NOTIFICATIONS.LIST;

    const response = await api.get<NotificationsResponse>(url);
    console.log('[NotificationService] getNotifications response:', JSON.stringify(response.data, null, 2));
    return response.data;
  },

  /**
   * Fetch unread badge count
   */
  getUnreadCount: async (): Promise<number> => {
    const response = await api.get<UnreadCountResponse>(
      API_ENDPOINTS.NOTIFICATIONS.UNREAD_COUNT,
    );
    console.log('[NotificationService] unreadCount response:', JSON.stringify(response.data, null, 2));
    return response.data.data.count;
  },

  /**
   * Get single notification by ID (auto-marks read on backend)
   */
  getNotification: async (id: string): Promise<AppNotification> => {
    const response = await api.get<{ success: boolean; data: { notification: AppNotification } }>(
      `${API_ENDPOINTS.NOTIFICATIONS.LIST}/${id}`,
    );
    return response.data.data.notification;
  },

  /**
   * Mark a single notification as read
   */
  markAsRead: async (id: string): Promise<void> => {
    await api.patch(
      `${API_ENDPOINTS.NOTIFICATIONS.LIST}/${id}/read`,
    );
  },

  /**
   * Mark all notifications as read
   */
  markAllAsRead: async (): Promise<{ updatedCount: number }> => {
    const response = await api.patch<{ success: boolean; data: { updatedCount: number } }>(
      API_ENDPOINTS.NOTIFICATIONS.READ_ALL,
    );
    return response.data.data;
  },

  /**
   * Delete a notification
   */
  deleteNotification: async (id: string): Promise<void> => {
    await api.delete(`${API_ENDPOINTS.NOTIFICATIONS.LIST}/${id}`);
  },

  /**
   * Register Expo push token
   */
  registerPushToken: async (expoPushToken: string, deviceType?: string): Promise<void> => {
    await api.post(API_ENDPOINTS.NOTIFICATIONS.REGISTER_TOKEN, {
      expoPushToken,
      deviceType: deviceType ?? 'mobile',
    });
  },
};
