/**
 * Transaction Item Component
 */

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import type { Transaction } from '@/types/dashboard.types';

interface TransactionItemProps {
  transaction: Transaction;
  currency?: string;
  onPress?: () => void;
}

export const TransactionItem: React.FC<TransactionItemProps> = ({
  transaction,
  currency = '₦',
  onPress,
}) => {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const formatAmount = (value: number) => {
    return value.toLocaleString('en-NG', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const isExpense = transaction.type === 'expense';
  const iconColor = transaction.color || (isExpense ? colors.error : colors.success);

  return (
    <TouchableOpacity
      onPress={onPress}
      className="flex-row items-center py-3"
      style={{
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
      }}
      activeOpacity={0.7}
    >
      <View
        className="w-10 h-10 rounded-full items-center justify-center mr-3"
        style={{ backgroundColor: `${iconColor}15` }}
      >
        <Ionicons
          name={transaction.icon as any || (isExpense ? 'remove-circle' : 'add-circle')}
          size={20}
          color={iconColor}
        />
      </View>

      <View className="flex-1">
        <Text
          className="text-sm font-semibold mb-0.5"
          style={{ color: colors.text }}
          numberOfLines={1}
        >
          {transaction.category}
        </Text>
        {transaction.description && (
          <Text
            className="text-xs"
            style={{ color: colors.textTertiary }}
            numberOfLines={1}
          >
            {transaction.description}
          </Text>
        )}
      </View>

      <View className="items-end">
        <Text
          className="text-sm font-bold"
          style={{
            color: isExpense ? colors.error : colors.success,
          }}
        >
          {isExpense ? '-' : '+'}{currency}{formatAmount(transaction.amount)}
        </Text>
        <Text
          className="text-xs mt-0.5"
          style={{ color: colors.textTertiary }}
        >
          {formatDate(transaction.date)}
        </Text>
      </View>
    </TouchableOpacity>
  );
};
