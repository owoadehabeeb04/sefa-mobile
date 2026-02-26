/**
 * Summary Card Component
 */

import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface SummaryCardProps {
  title: string;
  amount: number;
  currency?: string;
  icon: keyof typeof Ionicons.glyphMap;
  change?: string | null;
  isPositive?: boolean;
}

export const SummaryCard: React.FC<SummaryCardProps> = ({
  title,
  amount,
  currency = '₦',
  icon,
  change,
  isPositive,
}) => {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const formatAmount = (value: number) => {
    return value.toLocaleString('en-NG', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  };

  return (
    <View
      className="flex-1 min-w-[45%] p-4 rounded-2xl"
      style={{ backgroundColor: colors.backgroundSecondary }}
    >
      <View className="flex-row items-center justify-between mb-2">
        <Text
          className="text-sm font-medium"
          style={{ color: colors.textSecondary }}
        >
          {title}
        </Text>
        <View
          className="w-8 h-8 rounded-full items-center justify-center"
          style={{ backgroundColor: colors.primaryBackground }}
        >
          <Ionicons name={icon} size={16} color={colors.primary} />
        </View>
      </View>

      <Text
        className="text-2xl font-bold mb-1"
        style={{ color: colors.text }}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {currency}{formatAmount(amount)}
      </Text>

      {change !== null && change !== undefined && (
        <View className="flex-row items-center">
          <Ionicons
            name={isPositive ? 'trending-up' : 'trending-down'}
            size={14}
            color={isPositive ? colors.success : colors.error}
          />
          <Text
            className="text-xs font-medium ml-1"
            style={{
              color: isPositive ? colors.success : colors.error,
            }}
          >
            {isPositive ? '+' : ''}{change}%
          </Text>
          <Text
            className="text-xs ml-1"
            style={{ color: colors.textTertiary }}
          >
            vs last period
          </Text>
        </View>
      )}
    </View>
  );
};
