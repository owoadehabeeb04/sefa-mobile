/**
 * Notifications Tab Screen
 * Infinite-scroll list of all in-app notifications, grouped by date.
 */
import React, { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { NotificationCard } from '@/components/notifications/NotificationCard';
import {
  useNotifications,
  useMarkAllRead,
  useDeleteNotification,
} from '@/features/notifications/notification.hooks';
import type { AppNotification, NotificationGroup } from '@/features/notifications/notification.types';

// ─── Date grouping helper ──────────────────────────────────────────────────────

function groupNotificationsByDate(notifications: AppNotification[]): NotificationGroup[] {
  const groups: NotificationGroup[] = [];
  const groupMap = new Map<string, AppNotification[]>();

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86_400_000);
  const weekAgo = new Date(today.getTime() - 7 * 86_400_000);

  for (const n of notifications) {
    const d = new Date(n.createdAt);
    const dateOnly = new Date(d.getFullYear(), d.getMonth(), d.getDate());

    let label: string;
    if (dateOnly.getTime() === today.getTime()) label = 'Today';
    else if (dateOnly.getTime() === yesterday.getTime()) label = 'Yesterday';
    else if (dateOnly.getTime() > weekAgo.getTime()) label = 'This Week';
    else label = 'Older';

    if (!groupMap.has(label)) groupMap.set(label, []);
    groupMap.get(label)!.push(n);
  }

  for (const label of ['Today', 'Yesterday', 'This Week', 'Older']) {
    const data = groupMap.get(label);
    if (data?.length) groups.push({ label, data });
  }

  return groups;
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function NotificationsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isRefetching,
    refetch,
  } = useNotifications();

  const markAllRead = useMarkAllRead();
  const deleteNotification = useDeleteNotification();
  console.log('Raw notification data:', data);
  // Flatten all pages into a single list
  const allNotifications = useMemo<AppNotification[]>(
    () => data?.pages.flatMap((p) => p.data.notifications) ?? [],
    [data],
  );
console.log('All notifications:', allNotifications);
  const unreadCount = data?.pages[0]?.data.summary.unreadCount ?? 0;
  const groups = useMemo(() => groupNotificationsByDate(allNotifications), [allNotifications]);

  const handleMarkAllRead = useCallback(() => {
    if (unreadCount === 0) return;
    markAllRead.mutate();
  }, [markAllRead, unreadCount]);

  const handleDelete = useCallback(
    (id: string) => {
      Alert.alert('Delete notification', 'Remove this notification?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteNotification.mutate(id),
        },
      ]);
    },
    [deleteNotification],
  );

  const handlePress = useCallback(
    (n: AppNotification) => {
      const id = n._id ?? n.id;
      router.push(`/(tabs)/notifications/${id}` as any);
    },
    [router],
  );

  const renderItem = useCallback(
    ({ item }: { item: AppNotification | { _groupLabel: string } }) => {
      if ('_groupLabel' in item) {
        return (
          <Text
            className="text-xs font-semibold uppercase tracking-wider mx-4 mt-5 mb-2"
            style={{ color: colors.textSecondary }}
          >
            {item._groupLabel}
          </Text>
        );
      }
      const id = item._id ?? item.id;
      return (
        <NotificationCard
          notification={item}
          onPress={() => handlePress(item)}
          onDelete={() => handleDelete(id)}
        />
      );
    },
    [colors, handlePress, handleDelete],
  );

  // Build a flat list with group-label sentinel objects
  const flatData = useMemo(() => {
    const result: (AppNotification | { _groupLabel: string })[] = [];
    for (const g of groups) {
      result.push({ _groupLabel: g.label });
      result.push(...g.data);
    }
    return result;
  }, [groups]);

  const keyExtractor = useCallback((item: any, index: number) => {
    if (item._groupLabel) return `group-${item._groupLabel}`;
    return item._id ?? item.id ?? String(index);
  }, []);

  const ListFooter = () => {
    if (isFetchingNextPage) {
      return <ActivityIndicator color={colors.primary} className="py-6" />;
    }
    if (!hasNextPage && allNotifications.length > 0) {
      return (
        <Text className="text-center text-xs py-6" style={{ color: colors.textSecondary }}>
          All caught up!
        </Text>
      );
    }
    return null;
  };

  const ListEmpty = () => {
    if (isLoading) return null;
    return (
      <View className="flex-1 items-center justify-center px-10 pt-20">
        <View
          className="w-20 h-20 rounded-full items-center justify-center mb-5"
          style={{ backgroundColor: `${colors.primary}12` }}
        >
          <Ionicons name="notifications-outline" size={36} color={colors.primary} />
        </View>
        <Text className="text-lg font-bold mb-2 text-center" style={{ color: colors.text }}>
          No notifications yet
        </Text>
        <Text className="text-sm text-center leading-5" style={{ color: colors.textSecondary }}>
          Your transaction alerts, budget warnings, and spending insights will appear here.
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View
        className="flex-row items-center justify-between px-5 py-4 border-b"
        style={{ borderBottomColor: colors.border }}
      >
        <View className="flex-row items-center gap-2">
          <TouchableOpacity onPress={() => router.back()} className="mr-2">
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text className="text-2xl font-bold" style={{ color: colors.text }}>
            Notifications
          </Text>
          {unreadCount > 0 && (
            <View
              className="px-2 py-0.5 rounded-full"
              style={{ backgroundColor: colors.primary }}
            >
              <Text className="text-white text-xs font-bold">{unreadCount}</Text>
            </View>
          )}
        </View>

        {unreadCount > 0 && (
          <TouchableOpacity onPress={handleMarkAllRead} disabled={markAllRead.isPending}>
            <Text className="text-sm font-medium" style={{ color: colors.primary }}>
              {markAllRead.isPending ? 'Marking…' : 'Mark all read'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Loading state */}
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={flatData}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={colors.primary}
            />
          }
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) fetchNextPage();
          }}
          onEndReachedThreshold={0.3}
          ListEmptyComponent={ListEmpty}
          ListFooterComponent={ListFooter}
          contentContainerStyle={{ paddingBottom: 32, flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}
