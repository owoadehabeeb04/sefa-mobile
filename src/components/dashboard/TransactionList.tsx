/**
 * Transaction List Component with Filter
 */

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import type { Transaction, TransactionFilterType } from '@/types/dashboard.types';
import { TransactionItem } from './TransactionItem';

interface TransactionListProps {
  transactions: Transaction[];
  currency?: string;
  onViewAll?: () => void;
}

export const TransactionList: React.FC<TransactionListProps> = ({
  transactions,
  currency = '₦',
  onViewAll,
}) => {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const [filter, setFilter] = useState<TransactionFilterType>('all');

  const filteredTransactions = transactions.filter((txn) => {
    if (filter === 'all') return true;
    if (filter === 'expenses') return txn.type === 'expense';
    if (filter === 'income') return txn.type === 'income';
    return true;
  });

  const filterOptions: { value: TransactionFilterType; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'expenses', label: 'Expenses' },
    { value: 'income', label: 'Income' },
  ];

  if (transactions.length === 0) {
    return (
      <View className="rounded-2xl p-5 items-center justify-center" style={{ backgroundColor: colors.backgroundSecondary, minHeight: 180 }}>
        <Ionicons name="receipt-outline" size={48} color={colors.textTertiary} style={{ marginBottom: 12 }} />
        <Text className="text-base font-medium" style={{ color: colors.textSecondary }}>
          No transactions yet
        </Text>
        <Text className="text-sm text-center mt-1" style={{ color: colors.textTertiary }}>
          Start adding expenses or income
        </Text>
      </View>
    );
  }

  return (
    <View>
      <View className="flex-row items-center justify-between mb-4">
        <Text className="text-lg font-bold" style={{ color: colors.text }}>
          Recent Activity
        </Text>
        {onViewAll && (
          <TouchableOpacity onPress={onViewAll} className="flex-row items-center">
            <Text className="text-sm font-medium mr-1" style={{ color: colors.primary }}>
              View All
            </Text>
            <Ionicons name="chevron-forward" size={16} color={colors.primary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="mb-4"
      >
        {filterOptions.map((option) => (
          <TouchableOpacity
            key={option.value}
            onPress={() => setFilter(option.value)}
            className="px-4 py-2 rounded-full mr-2"
            style={{
              backgroundColor:
                filter === option.value
                  ? colors.primary
                  : colors.backgroundSecondary,
            }}
          >
            <Text
              className="text-sm font-medium"
              style={{
                color:
                  filter === option.value
                    ? '#FFFFFF'
                    : colors.textSecondary,
              }}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Transactions */}
      <View className="rounded-2xl" style={{ backgroundColor: colors.backgroundSecondary }}>
        <View className="px-4">
          {filteredTransactions.length === 0 ? (
            <View className="py-8 items-center">
              <Text className="text-sm" style={{ color: colors.textSecondary }}>
                No {filter} transactions
              </Text>
            </View>
          ) : (
            filteredTransactions.map((transaction, index) => (
              <TransactionItem
                key={transaction.id}
                transaction={transaction}
                currency={currency}
              />
            ))
          )}
        </View>
      </View>
    </View>
  );
};
