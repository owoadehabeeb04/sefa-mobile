/**
 * Budget Alert Card - scaled by period; optional "This month" strip (Option C)
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import type { BudgetSummary, ThisMonthBudgetSummary } from '@/types/dashboard.types';

interface BudgetAlertCardProps {
  budget: BudgetSummary;
  currency?: string;
  thisMonthBudget?: ThisMonthBudgetSummary | null;
  onLayout?: () => void;
}

const statusConfig: Record<
  BudgetSummary['status'],
  { label: string; icon: keyof typeof Ionicons.glyphMap; color: string }
> = {
  on_track: {
    label: 'On track',
    icon: 'checkmark-circle',
    color: '#22c55e',
  },
  approaching: {
    label: 'Approaching limit',
    icon: 'warning',
    color: '#eab308',
  },
  over: {
    label: 'Over budget',
    icon: 'alert-circle',
    color: '#ef4444',
  },
};

function formatPeriodDescription(periodLabel: string, periodDays?: number): string {
  if (periodLabel === 'This Month') return '';
  if (periodDays != null && periodDays >= 1) {
    if (periodDays <= 7) return `${periodDays} day${periodDays === 1 ? '' : 's'}`;
    const months = Math.floor(periodDays / 30);
    const days = periodDays % 30;
    if (months === 0) return `${periodDays} days`;
    if (days === 0) return `${months} month${months === 1 ? '' : 's'}`;
    return `${months} month${months === 1 ? '' : 's'} ${days} day${days === 1 ? '' : 's'}`;
  }
  return periodLabel;
}

export const BudgetAlertCard: React.FC<BudgetAlertCardProps> = ({
  budget,
  currency = '₦',
  thisMonthBudget = null,
  onLayout,
}) => {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const config = statusConfig[budget.status];
  const progressAnim = useRef(new Animated.Value(0)).current;
  const hapticFired = useRef(false);

  const isScaledPeriod = budget.monthlyBudgetLimit != null && !budget.isCurrentMonth;
  const periodDesc = isScaledPeriod && budget.periodLabel != null
    ? formatPeriodDescription(budget.periodLabel, budget.periodDays)
    : '';

  useEffect(() => {
    const target = Math.min(100, budget.percentUsed) / 100;
    Animated.timing(progressAnim, {
      toValue: target,
      duration: 600,
      useNativeDriver: false,
    }).start();
  }, [budget.percentUsed, progressAnim]);

  useEffect(() => {
    if (budget.status === 'over' && !hapticFired.current) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      hapticFired.current = true;
    } else if (budget.status === 'approaching' && !hapticFired.current) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      hapticFired.current = true;
    }
  }, [budget.status]);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View className="mb-6" onLayout={onLayout}>
      <View
        className="rounded-2xl p-4"
        style={{
          backgroundColor: colors.backgroundSecondary,
          borderWidth: 1,
          borderColor: `${config.color}30`,
        }}
      >
        <View className="flex-row items-center justify-between mb-2">
          <View className="flex-row items-center">
            <View
              className="w-8 h-8 rounded-full items-center justify-center mr-2"
              style={{ backgroundColor: `${config.color}20` }}
            >
              <Ionicons name={config.icon} size={18} color={config.color} />
            </View>
            <Text className="text-sm font-semibold" style={{ color: colors.text }}>
              {budget.isCurrentMonth ? 'Budget this month' : 'Budget for this period'}
            </Text>
          </View>
          <Text className="text-sm font-semibold" style={{ color: config.color }}>
            {config.label}
          </Text>
        </View>
        {isScaledPeriod && periodDesc ? (
          <Text className="text-xs mb-2" style={{ color: colors.textTertiary }}>
            From your {currency}{budget.monthlyBudgetLimit!.toLocaleString('en-NG')}/month over {periodDesc}
          </Text>
        ) : null}
        <View className="h-2 rounded-full overflow-hidden mb-2" style={{ backgroundColor: colors.border }}>
          <Animated.View
            style={{
              height: '100%',
              width: progressWidth,
              backgroundColor: config.color,
              borderRadius: 999,
            }}
          />
        </View>
        <View className="flex-row justify-between">
          <Text className="text-xs" style={{ color: colors.textTertiary }}>
            {currency}{budget.used.toLocaleString('en-NG')} of {currency}{budget.limit.toLocaleString('en-NG')}
          </Text>
          <Text className="text-xs font-medium" style={{ color: colors.text }}>
            {budget.status === 'over'
              ? `${currency}${(budget.used - budget.limit).toLocaleString('en-NG')} over`
              : `${currency}${budget.left.toLocaleString('en-NG')} left`}
          </Text>
        </View>
      </View>

      {/* Option C: This month strip when viewing another period */}
      {thisMonthBudget != null && (
        <View
          className="flex-row items-center justify-between mt-2 px-4 py-2 rounded-xl"
          style={{ backgroundColor: colors.primaryBackground, borderWidth: 1, borderColor: colors.border }}
        >
          <Text className="text-xs font-medium" style={{ color: colors.textSecondary }}>
            This month
          </Text>
          <Text className="text-xs" style={{ color: colors.text }}>
            {currency}{thisMonthBudget.used.toLocaleString('en-NG')} of {currency}{thisMonthBudget.limit.toLocaleString('en-NG')}
            {thisMonthBudget.status === 'over'
              ? ` (${currency}${(thisMonthBudget.used - thisMonthBudget.limit).toLocaleString('en-NG')} over)`
              : thisMonthBudget.status === 'approaching'
                ? ' — almost at limit'
                : ''}
          </Text>
        </View>
      )}
    </View>
  );
};
