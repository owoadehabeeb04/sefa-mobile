/**
 * Push Notification Service
 * Handles Expo push token registration, permission requests,
 * and foreground/background notification listeners.
 */
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { notificationService } from '@/features/notifications/notification.service';

// Configure how notifications are shown when app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export const PushNotificationService = {
  /**
   * Request permissions and get Expo push token.
   * Returns null on simulators or if permission is denied.
   */
  registerForPushNotifications: async (): Promise<string | null> => {
    if (!Device.isDevice) {
      console.log('[Push] Physical device required for push notifications');
      return null;
    }

    // Android channel setup
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'SEFA Notifications',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#3629B7',
      });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('[Push] Permission not granted');
      return null;
    }

    try {
      const tokenData = await Notifications.getExpoPushTokenAsync();
      return tokenData.data;
    } catch (error) {
      console.error('[Push] Failed to get push token:', error);
      return null;
    }
  },

  /**
   * Register token with backend, then register on device.
   */
  registerAndSync: async (): Promise<void> => {
    try {
      const token = await PushNotificationService.registerForPushNotifications();
      if (token) {
        await notificationService.registerPushToken(token, Platform.OS);
        console.log('[Push] Token registered:', token.slice(0, 30) + '...');
      }
    } catch (error) {
      console.error('[Push] Register and sync failed:', error);
    }
  },

  /**
   * Add listener for notifications received while app is in foreground.
   * Returns a subscription that should be removed on cleanup.
   */
  addForegroundListener: (
    handler: (notification: Notifications.Notification) => void,
  ) => {
    return Notifications.addNotificationReceivedListener(handler);
  },

  /**
   * Add listener for when user taps a notification (any app state).
   * Returns a subscription that should be removed on cleanup.
   */
  addResponseListener: (
    handler: (response: Notifications.NotificationResponse) => void,
  ) => {
    return Notifications.addNotificationResponseReceivedListener(handler);
  },

  /**
   * Clear the badge count.
   */
  clearBadge: async (): Promise<void> => {
    await Notifications.setBadgeCountAsync(0);
  },

  /**
   * Set badge count to a specific number.
   */
  setBadge: async (count: number): Promise<void> => {
    await Notifications.setBadgeCountAsync(count);
  },
};
