import {
  useInfiniteQuery,
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { notificationService } from './notification.service';
import type { AppNotification, NotificationFilters } from './notification.types';

const QUERY_KEYS = {
  all: ['notifications'] as const,
  list: (filters?: NotificationFilters) => ['notifications', 'list', filters] as const,
  unread: ['notifications', 'unread-count'] as const,
  detail: (id: string) => ['notifications', 'detail', id] as const,
};

/**
 * Infinite-scroll notifications list
 */
export function useNotifications(filters: Omit<NotificationFilters, 'page'> = {}) {
  console.log('🔔 useNotifications hook called, filters:', filters);
  return useInfiniteQuery({
    queryKey: QUERY_KEYS.list(filters),
    queryFn: async ({ pageParam = 1 }) => {
      console.log('🔔 Fetching notifications page:', pageParam);
      try {
        const result = await notificationService.getNotifications({ ...filters, page: pageParam as number, limit: 20 });
        console.log('🔔 Notifications result:', JSON.stringify(result, null, 2));
        return result;
      } catch (error: any) {
        console.error('🔔 Notifications fetch ERROR:', error?.message, error?.response?.status, JSON.stringify(error?.response?.data));
        throw error;
      }
    },
    getNextPageParam: (lastPage) => {
      const { page, hasMore } = lastPage.data.pagination;
      return hasMore ? page + 1 : undefined;
    },
    initialPageParam: 1,
    staleTime: 30_000,
  });
}

/**
 * Unread badge count — polled every 60s
 */
export function useUnreadCount() {
  return useQuery({
    queryKey: QUERY_KEYS.unread,
    queryFn: notificationService.getUnreadCount,
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
}

/**
 * Single notification detail
 */
export function useNotification(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.detail(id),
    queryFn: () => notificationService.getNotification(id),
    enabled: !!id,
  });
}

/**
 * Mark a single notification as read
 */
export function useMarkAsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationService.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.unread });
    },
  });
}

/**
 * Mark all notifications as read
 */
export function useMarkAllRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => notificationService.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.unread });
    },
  });
}

/**
 * Delete a notification
 */
export function useDeleteNotification() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationService.deleteNotification(id),
    onMutate: async (id) => {
      // Optimistic removal from cache
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.all });
      const previousData = queryClient.getQueryData(QUERY_KEYS.list());
      queryClient.setQueriesData({ queryKey: QUERY_KEYS.list() }, (old: any) => {
        if (!old?.pages) return old;
        return {
          ...old,
          pages: old.pages.map((page: any) => ({
            ...page,
            data: {
              ...page.data,
              notifications: page.data.notifications.filter(
                (n: AppNotification) => (n._id ?? n.id) !== id,
              ),
            },
          })),
        };
      });
      return { previousData };
    },
    onError: (_err, _id, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(QUERY_KEYS.list(), context.previousData);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.unread });
    },
  });
}

/**
 * Register Expo push token
 */
export function useRegisterPushToken() {
  return useMutation({
    mutationFn: ({ token, deviceType }: { token: string; deviceType?: string }) =>
      notificationService.registerPushToken(token, deviceType),
  });
}
