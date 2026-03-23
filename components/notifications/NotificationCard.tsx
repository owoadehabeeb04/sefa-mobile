import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatDistanceToNowStrict } from 'date-fns';
import type { AppNotification, NotificationIcon } from '@/features/notifications/notification.types';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface NotificationCardProps {
  notification: AppNotification;
  onPress: () => void;
  onDelete: () => void;
}

const ICON_MAP: Record<NotificationIcon, { name: string; bg: string; color: string }> = {
  alert: { name: 'warning-outline', bg: '#FEF3C7', color: '#D97706' },
  warning: { name: 'alert-circle-outline', bg: '#FEE2E2', color: '#DC2626' },
  info: { name: 'information-circle-outline', bg: '#DBEAFE', color: '#2563EB' },
  success: { name: 'checkmark-circle-outline', bg: '#D1FAE5', color: '#059669' },
  money: { name: 'cash-outline', bg: '#D1FAE5', color: '#059669' },
  import: { name: 'cloud-download-outline', bg: '#EDE9FE', color: '#7C3AED' },
  goal: { name: 'star-outline', bg: '#FEF3C7', color: '#D97706' },
};

const URGENCY_COLORS = {
  instant: '#DC2626',
  daily: '#D97706',
  weekly: '#6B7280',
};

const formatAmount = (amount?: number): string => {
  if (!amount) return '';
  return `₦${amount.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;
};

const formatRelativeTime = (createdAt?: string, fallback?: string) => {
  if (!createdAt) {
    return fallback ?? 'Just now';
  }

  const created = new Date(createdAt);
  if (Number.isNaN(created.getTime())) {
    return fallback ?? 'Just now';
  }

  const diffMs = Date.now() - created.getTime();
  if (diffMs < 60_000) {
    return 'Just now';
  }

  return `${formatDistanceToNowStrict(created)} ago`;
};

export const NotificationCard: React.FC<NotificationCardProps> = ({
  notification,
  onPress,
  onDelete,
}) => {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const [relativeTime, setRelativeTime] = useState(() =>
    formatRelativeTime(notification.createdAt, notification.timeAgo),
  );

  const iconConfig = ICON_MAP[notification.icon] ?? ICON_MAP.info;
  const isUnread = !notification.isRead;

  useEffect(() => {
    const updateRelativeTime = () => {
      setRelativeTime(formatRelativeTime(notification.createdAt, notification.timeAgo));
    };

    updateRelativeTime();
    const interval = setInterval(updateRelativeTime, 60_000);

    return () => clearInterval(interval);
  }, [notification.createdAt, notification.timeAgo]);

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      className="mx-4 mb-2"
    >
      <View
        className="flex-row p-4 rounded-xl"
        style={{
          backgroundColor: isUnread ? `${colors.primary}08` : colors.backgroundSecondary,
          borderWidth: 1,
          borderColor: isUnread ? `${colors.primary}25` : colors.border,
        }}
      >
        {/* Unread dot */}
        {isUnread && (
          <View
            className="absolute top-4 left-4 w-2 h-2 rounded-full"
            style={{ backgroundColor: colors.primary }}
          />
        )}

        {/* Icon */}
        <View
          className="w-10 h-10 rounded-xl items-center justify-center mr-3 flex-shrink-0"
          style={{ backgroundColor: iconConfig.bg }}
        >
          <Ionicons name={iconConfig.name as any} size={20} color={iconConfig.color} />
        </View>

        {/* Content */}
        <View className="flex-1 min-w-0">
          <View className="flex-row items-start justify-between mb-0.5">
            <Text
              className="text-sm font-semibold flex-1 mr-2"
              style={{ color: colors.text }}
              numberOfLines={1}
            >
              {notification.title}
            </Text>
            <TouchableOpacity
              onPress={onDelete}
              hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
            >
              <Ionicons name="close" size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <Text
            className="text-xs mb-2 leading-4"
            style={{ color: colors.textSecondary }}
            numberOfLines={2}
          >
            {notification.message}
          </Text>

          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-2">
              {/* Amount badge */}
              {notification.amount ? (
                <View
                  className="px-1.5 py-0.5 rounded-md"
                  style={{ backgroundColor: `${iconConfig.color}15` }}
                >
                  <Text className="text-[10px] font-bold" style={{ color: iconConfig.color }}>
                    {formatAmount(notification.amount)}
                  </Text>
                </View>
              ) : null}

              {/* Category badge */}
              {notification.category ? (
                <View
                  className="px-1.5 py-0.5 rounded-md"
                  style={{ backgroundColor: colors.border }}
                >
                  <Text className="text-[10px]" style={{ color: colors.textSecondary }}>
                    {notification.category}
                  </Text>
                </View>
              ) : null}
            </View>

            <View className="flex-row items-center gap-2">
              {/* Urgency dot */}
              <View
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: URGENCY_COLORS[notification.urgency] }}
              />
              <Text className="text-[10px]" style={{ color: colors.textSecondary }}>
                {relativeTime}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};
