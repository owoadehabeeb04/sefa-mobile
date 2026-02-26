/**
 * Category Bar Chart Component (Horizontal)
 */

import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import type { CategoryBreakdown } from '@/types/dashboard.types';

interface CategoryBarProps {
  category: CategoryBreakdown;
  maxAmount: number;
  currency?: string;
}

export const CategoryBar: React.FC<CategoryBarProps> = ({
  category,
  maxAmount,
  currency = '₦',
}) => {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const barWidth = maxAmount > 0 ? (category.total / maxAmount) * 100 : 0;

  const formatAmount = (value: number) => {
    return value.toLocaleString('en-NG', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  };

  return (
    <View className="mb-4">
      <View className="flex-row items-center justify-between mb-2">
        <View className="flex-row items-center flex-1">
          <View
            className="w-8 h-8 rounded-full items-center justify-center mr-3"
            style={{ backgroundColor: `${category.color}15` }}
          >
            <Ionicons
              name={category.icon as any || 'folder-outline'}
              size={16}
              color={category.color}
            />
          </View>
          <Text
            className="text-sm font-medium flex-1"
            style={{ color: colors.text }}
            numberOfLines={1}
          >
            {category.name}
          </Text>
        </View>
        <Text
          className="text-sm font-semibold ml-2"
          style={{ color: colors.text }}
        >
          {currency}{formatAmount(category.total)}
        </Text>
      </View>

      <View className="flex-row items-center">
        <View
          className="h-2 rounded-full flex-1 mr-2"
          style={{ backgroundColor: colors.backgroundTertiary }}
        >
          <View
            className="h-full rounded-full"
            style={{
              width: `${barWidth}%`,
              backgroundColor: category.color,
            }}
          />
        </View>
        <Text
          className="text-xs font-medium w-10 text-right"
          style={{ color: colors.textSecondary }}
        >
          {category.percentage}%
        </Text>
      </View>
    </View>
  );
};

interface SpendingChartProps {
  categories: CategoryBreakdown[];
  title?: string;
  currency?: string;
}

export const SpendingChart: React.FC<SpendingChartProps> = ({
  categories,
  title = 'Top Spending',
  currency = '₦',
}) => {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  if (categories.length === 0) {
    return (
      <View
        className="rounded-2xl p-5 items-center justify-center"
        style={{ 
          backgroundColor: colors.backgroundSecondary,
          minHeight: 200,
        }}
      >
        <Ionicons
          name="pie-chart-outline"
          size={48}
          color={colors.textTertiary}
          style={{ marginBottom: 12 }}
        />
        <Text className="text-base font-medium" style={{ color: colors.textSecondary }}>
          No expenses yet
        </Text>
        <Text className="text-sm text-center mt-1" style={{ color: colors.textTertiary }}>
          Start tracking to see spending breakdown
        </Text>
      </View>
    );
  }

  const maxAmount = Math.max(...categories.map((c) => c.total));

  return (
    <View
      className="rounded-2xl p-5"
      style={{ backgroundColor: colors.backgroundSecondary }}
    >
      <Text className="text-lg font-bold mb-4" style={{ color: colors.text }}>
        {title}
      </Text>

      {categories.map((category) => (
        <CategoryBar
          key={category.id}
          category={category}
          maxAmount={maxAmount}
          currency={currency}
        />
      ))}
    </View>
  );
};
