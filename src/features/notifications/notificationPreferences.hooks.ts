/**
 * Notification Preferences Hooks
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getNotificationPreferences, updateNotificationPreferences } from './notificationPreferences.service';
import type { NotificationPreferences } from './notificationPreferences.types';

export const NOTIFICATION_PREFERENCES_QUERY_KEY = ['notification-preferences'];

export const useNotificationPreferences = () => {
  return useQuery({
    queryKey: NOTIFICATION_PREFERENCES_QUERY_KEY,
    queryFn: getNotificationPreferences,
  });
};

export const useUpdateNotificationPreferences = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Partial<NotificationPreferences>) => updateNotificationPreferences(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_PREFERENCES_QUERY_KEY });
    },
  });
};
