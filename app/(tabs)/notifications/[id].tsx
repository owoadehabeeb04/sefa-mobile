/**
 * Notification Detail Screen
 * Shows full notification with AI advice and related transaction info.
 */
import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useNotification, useDeleteNotification } from '@/features/notifications/notification.hooks';
import type { NotificationIcon } from '@/features/notifications/notification.types';

const ICON_MAP: Record<NotificationIcon, { name: string; bg: string; color: string }> = {
  alert: { name: 'warning-outline', bg: '#FEF3C7', color: '#D97706' },
  warning: { name: 'alert-circle-outline', bg: '#FEE2E2', color: '#DC2626' },
  info: { name: 'information-circle-outline', bg: '#DBEAFE', color: '#2563EB' },
  success: { name: 'checkmark-circle-outline', bg: '#D1FAE5', color: '#059669' },
  money: { name: 'cash-outline', bg: '#D1FAE5', color: '#059669' },
  import: { name: 'cloud-download-outline', bg: '#EDE9FE', color: '#7C3AED' },
  goal: { name: 'star-outline', bg: '#FEF3C7', color: '#D97706' },
};

const TYPE_LABELS: Record<string, string> = {
  transaction_alert: 'Transaction Alert',
  weekly_summary: 'Weekly Summary',
  budget_warning: 'Budget Warning',
  spending_insight: 'Spending Insight',
  goal_progress: 'Goal Progress',
  import_complete: 'Import Complete',
};

const formatAmount = (amount?: number) =>
  amount ? `₦${amount.toLocaleString('en-NG', { minimumFractionDigits: 2 })}` : null;

const formatDate = (iso: string) => {
  try {
    return new Date(iso).toLocaleDateString('en-NG', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
};

export default function NotificationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const { data: notification, isLoading, isError } = useNotification(id);
  const deleteNotification = useDeleteNotification();

  const handleDelete = () => {
    Alert.alert('Delete notification', 'Remove this notification permanently?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          const nid = notification?._id ?? notification?.id ?? id;
          deleteNotification.mutate(nid, {
            onSuccess: () => router.back(),
          });
        },
      },
    ]);
  };

  const handleViewTransaction = () => {
    if (!notification?.transactionId) return;
    router.push(`/transactions/${notification.transactionId}` as any);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (isError || !notification) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <View className="flex-row items-center px-5 py-4">
          <TouchableOpacity onPress={() => router.back()} className="mr-4">
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text className="text-lg font-semibold" style={{ color: colors.text }}>
            Notification
          </Text>
        </View>
        <View className="flex-1 items-center justify-center px-10">
          <Ionicons name="alert-circle-outline" size={48} color={colors.textSecondary} />
          <Text className="text-base font-medium mt-4" style={{ color: colors.text }}>
            Notification not found
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const iconConfig = ICON_MAP[notification.icon] ?? ICON_MAP.info;
  const typeLabel = TYPE_LABELS[notification.type] ?? notification.type;
  const amountText = formatAmount(notification.amount);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View
        className="flex-row items-center justify-between px-5 py-4 border-b"
        style={{ borderBottomColor: colors.border }}
      >
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text className="text-lg font-semibold flex-1" style={{ color: colors.text }}>
          {typeLabel}
        </Text>
        <TouchableOpacity onPress={handleDelete} disabled={deleteNotification.isPending}>
          <Ionicons name="trash-outline" size={20} color="#DC2626" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 48 }} showsVerticalScrollIndicator={false}>
        {/* Icon + Title block */}
        <View className="items-center px-6 pt-8 pb-6">
          <View
            className="w-16 h-16 rounded-2xl items-center justify-center mb-4"
            style={{ backgroundColor: iconConfig.bg }}
          >
            <Ionicons name={iconConfig.name as any} size={32} color={iconConfig.color} />
          </View>
          <Text className="text-xl font-bold text-center mb-2" style={{ color: colors.text }}>
            {notification.title}
          </Text>
          <Text className="text-sm text-center leading-5" style={{ color: colors.textSecondary }}>
            {notification.message}
          </Text>
        </View>

        {/* Transaction details card */}
        {(amountText || notification.category || notification.transactionType) && (
          <View
            className="mx-5 rounded-2xl p-4 mb-4"
            style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }}
          >
            <Text className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: colors.textSecondary }}>
              Transaction Details
            </Text>

            {amountText && (
              <View className="flex-row justify-between mb-2">
                <Text className="text-sm" style={{ color: colors.textSecondary }}>Amount</Text>
                <Text className="text-sm font-bold" style={{ color: colors.text }}>{amountText}</Text>
              </View>
            )}

            {notification.category && (
              <View className="flex-row justify-between mb-2">
                <Text className="text-sm" style={{ color: colors.textSecondary }}>Category</Text>
                <Text className="text-sm font-medium" style={{ color: colors.text }}>{notification.category}</Text>
              </View>
            )}

            {notification.transactionType && (
              <View className="flex-row justify-between">
                <Text className="text-sm" style={{ color: colors.textSecondary }}>Type</Text>
                <Text
                  className="text-sm font-medium capitalize"
                  style={{ color: notification.transactionType === 'income' ? '#059669' : '#DC2626' }}
                >
                  {notification.transactionType}
                </Text>
              </View>
            )}

            {notification.transactionId && (
              <TouchableOpacity
                onPress={handleViewTransaction}
                className="mt-4 py-2.5 rounded-xl items-center"
                style={{ backgroundColor: `${colors.primary}12` }}
              >
                <Text className="text-sm font-semibold" style={{ color: colors.primary }}>
                  View Transaction →
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* AI Advice card */}
        {notification.aiAdvice ? (
          <View
            className="mx-5 rounded-2xl p-4 mb-4"
            style={{ backgroundColor: `${colors.primary}08`, borderWidth: 1, borderColor: `${colors.primary}20` }}
          >
            <View className="flex-row items-center mb-3">
              <View
                className="w-6 h-6 rounded-lg items-center justify-center mr-2"
                style={{ backgroundColor: colors.primary }}
              >
                <Ionicons name="sparkles" size={12} color="white" />
              </View>
              <Text className="text-xs font-bold uppercase tracking-wider" style={{ color: colors.primary }}>
                AI Insight
              </Text>
            </View>
            <Text className="text-sm leading-5" style={{ color: colors.text }}>
              {notification.aiAdvice}
            </Text>
          </View>
        ) : null}

        {/* Risk score */}
        {notification.riskScore != null && notification.riskScore > 0 ? (
          <View
            className="mx-5 rounded-2xl p-4 mb-4"
            style={{ backgroundColor: colors.backgroundSecondary, borderWidth: 1, borderColor: colors.border }}
          >
            <Text className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: colors.textSecondary }}>
              Risk Score
            </Text>
            <View className="flex-row items-center gap-3">
              <View
                className="flex-1 h-2 rounded-full"
                style={{ backgroundColor: colors.border }}
              >
                <View
                  className="h-2 rounded-full"
                  style={{
                    width: `${notification.riskScore}%`,
                    backgroundColor:
                      notification.riskScore > 70
                        ? '#DC2626'
                        : notification.riskScore > 40
                        ? '#D97706'
                        : '#059669',
                  }}
                />
              </View>
              <Text className="text-sm font-bold w-10 text-right" style={{ color: colors.text }}>
                {notification.riskScore}
              </Text>
            </View>
          </View>
        ) : null}

        {/* Metadata */}
        <View className="mx-5 px-1">
          <Text className="text-xs" style={{ color: colors.textSecondary }}>
            Received {formatDate(notification.createdAt)}
          </Text>
          {notification.readAt ? (
            <Text className="text-xs mt-1" style={{ color: colors.textSecondary }}>
              Read {formatDate(notification.readAt)}
            </Text>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
