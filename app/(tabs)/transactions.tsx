/**
 * Transactions Screen
 * Shows all expenses and income with filters and search
 */

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { SwipeableTransactionItem } from '@/components/transactions/SwipeableTransactionItem';
import { DateRangePicker } from '@/components/common/DateRangePicker';
import { Select } from '@/components/common/Select';
import { Toast } from '@/components/common/Toast';
import * as SecureStore from 'expo-secure-store';
import { format } from 'date-fns';
import { useInfiniteTransactions, useSyncTransactions, groupTransactionsByDate, type Transaction } from '@/features/transactions/transaction.hooks';
import { useDeleteExpense } from '@/features/expenses/expense.hooks';
import { useDeleteIncome } from '@/features/income/income.hooks';
import type { TransactionFilters } from '@/features/transactions/transaction.hooks';

export default function TransactionsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ startDate?: string; endDate?: string; type?: string }>();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  // State
  const [filters, setFilters] = useState<TransactionFilters>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const appliedParamsRef = useRef(false);

  // Apply dashboard "View All" params once (same period/filters as home)
  useEffect(() => {
    if (appliedParamsRef.current) return;
    if (params.startDate && params.endDate) {
      setFilters((f) => ({
        ...f,
        startDate: params.startDate,
        endDate: params.endDate,
        type: (params.type as 'all' | 'expense' | 'income') || 'all',
      }));
      appliedParamsRef.current = true;
    }
  }, [params.startDate, params.endDate, params.type]);

  // Hooks - Cursor-based infinite scroll (filters applied on backend)
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    refetch,
    isFetching,
  } = useInfiniteTransactions({
    ...filters,
    search: searchQuery || undefined,
  });

  const transactions = data?.pages.flatMap((p) => p.transactions) ?? [];
  const totalTransactions = transactions.length;

  const syncTransactions = useSyncTransactions();
  const deleteExpense = useDeleteExpense();
  const deleteIncome = useDeleteIncome();

  // Sync transactions from server on mount (for offline access)
  useEffect(() => {
    syncTransactions.mutate();
  }, []);

  // Note: Removed useFocusEffect refetch because optimistic updates handle immediate display
  // The onSuccess invalidation will refetch when server sync completes

  // Filter options
  const typeOptions = [
    { label: 'All', value: 'all' },
    { label: 'Expenses', value: 'expense' },
    { label: 'Income', value: 'income' },
  ];

  // Group by date
  const groupedTransactions = useMemo(() => {
    return groupTransactionsByDate(transactions);
  }, [transactions]);

  // Flatten grouped transactions for FlatList with date headers
  const flatListData = useMemo(() => {
    const dateKeys = Object.keys(groupedTransactions);
    const items: Array<{ type: 'header' | 'transaction'; data: any; key: string }> = [];
    
    for (const dateKey of dateKeys) {
      // Add date header
      items.push({ type: 'header', data: dateKey, key: `header-${dateKey}` });
      // Add transactions for this date
      groupedTransactions[dateKey].forEach(transaction => {
        items.push({ type: 'transaction', data: transaction, key: transaction.id });
      });
    }
    
    return items;
  }, [groupedTransactions]);

  // Memoize totals (avoid O(n) on every render when list is large)
  const { totalIncome, totalExpenses } = useMemo(() => {
    let income = 0;
    let expenses = 0;
    for (let i = 0; i < transactions.length; i++) {
      const t = transactions[i];
      if (t.type === 'income') income += t.amount;
      else expenses += t.amount;
    }
    return { totalIncome: income, totalExpenses: expenses };
  }, [transactions]);

  const handleDelete = useCallback((transaction: Transaction) => {
    Alert.alert(
      'Delete Transaction',
      `Are you sure you want to delete this ${transaction.type}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // Show success message immediately
              setToastMessage('Transaction deleted successfully');
              setShowToast(true);
              
              // Perform deletion (optimistic update will remove from list immediately)
              if (transaction.type === 'expense') {
                await deleteExpense.mutateAsync(transaction.id);
              } else {
                await deleteIncome.mutateAsync(transaction.id);
              }
            } catch (error) {
              // If deletion fails, show error
              setToastMessage('Failed to delete transaction');
              setShowToast(true);
            }
          },
        },
      ]
    );
  }, [deleteExpense, deleteIncome, setToastMessage, setShowToast]);

  const handleEdit = useCallback(async (transaction: Transaction) => {
    try {
      // Save transaction to secure store for editing
      await SecureStore.setItemAsync('editingTransaction', JSON.stringify(transaction));
      // Navigate to add screen (which will detect edit mode)
      router.push('/(tabs)/add');
    } catch (error) {
      console.error('Error saving transaction for edit:', error);
      setToastMessage('Failed to open edit screen');
      setShowToast(true);
    }
  }, [router, setToastMessage, setShowToast]);

  const handleTransactionPress = useCallback(async (transaction: Transaction) => {
    try {
      await SecureStore.setItemAsync('transactionDetails', JSON.stringify(transaction));
      router.push(`/transactions/${transaction.id}`);
    } catch (error) {
      console.error('Error opening transaction details:', error);
    }
  }, [router]);

  const handleDateRangeSelect = (startDate: string, endDate: string) => {
    setFilters({
      ...filters,
      startDate,
      endDate,
    });
    setShowDatePicker(false);
  };

  const clearFilters = () => {
    setFilters({});
    setSearchQuery('');
  };

  const handleRefresh = async () => {
    // Sync from server first, then refetch local data
    await syncTransactions.mutateAsync();
    refetch();
  };

  const hasActiveFilters = filters.type || filters.startDate || filters.endDate || searchQuery;

  // Guard against multiple onEndReached fires (cursor pagination)
  const fetchingNextRef = useRef(false);
  const handleEndReached = useCallback(() => {
    if (fetchingNextRef.current || !hasNextPage || isFetchingNextPage) return;
    fetchingNextRef.current = true;
    fetchNextPage().finally(() => {
      fetchingNextRef.current = false;
    });
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const renderItem = useCallback(
    ({ item }: { item: { type: 'header' | 'transaction'; data: any; key: string } }) => {
      if (item.type === 'header') {
        return (
          <View className="px-6 py-2" style={{ backgroundColor: colors.background }}>
            <Text className="text-sm font-bold" style={{ color: colors.textSecondary }}>
              {item.data}
            </Text>
          </View>
        );
      }
      const transaction = item.data as Transaction;
      return (
        <SwipeableTransactionItem
          transaction={transaction}
          isExpense={transaction.type === 'expense'}
          onEdit={handleEdit as (t: Transaction) => void}
          onDelete={handleDelete as (t: Transaction) => void}
          onPress={handleTransactionPress as (t: Transaction) => void}
        />
      );
    },
    [colors.background, colors.textSecondary, handleEdit, handleDelete, handleTransactionPress]
  );

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        {/* Header */}
        <View className="px-6 pt-4 pb-3">
          <Text className="text-2xl font-bold" style={{ color: colors.text }}>
            Transactions
          </Text>
          <Text className="text-sm mt-1" style={{ color: colors.textSecondary }}>
            {totalTransactions > 0 ? `${totalTransactions} transaction${totalTransactions !== 1 ? 's' : ''}` : 'Transactions'}
          </Text>
        </View>

        {/* Search and Filters */}
        <View className="px-6 pb-3">
          {/* Search Bar */}
          <View
            className="flex-row items-center px-4 py-3 rounded-xl mb-3"
            style={{ backgroundColor: colors.backgroundSecondary }}
          >
            <Ionicons name="search" size={20} color={colors.textTertiary} />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search by description, category, amount..."
              placeholderTextColor={colors.textTertiary}
              className="flex-1 ml-2"
              style={{
                color: colors.text,
                fontSize: 15,
                lineHeight: 20,
                paddingVertical: 0,
              }}
            />
            {searchQuery && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color={colors.textTertiary} />
              </TouchableOpacity>
            )}
          </View>

          {/* Filter Buttons */}
          <View className="flex-row gap-2">
            <TouchableOpacity
              onPress={() => setShowFilters(!showFilters)}
              className="flex-row items-center px-4 py-2 rounded-xl"
              style={{
                backgroundColor: showFilters ? colors.primaryBackground : colors.backgroundSecondary,
              }}
              activeOpacity={0.7}
            >
              <Ionicons
                name="filter"
                size={16}
                color={showFilters ? colors.primary : colors.textSecondary}
              />
              <Text
                className="text-sm font-medium ml-2"
                style={{ color: showFilters ? colors.primary : colors.textSecondary }}
              >
                Filter
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setShowDatePicker(true)}
              className="flex-row items-center px-4 py-2 rounded-xl"
              style={{
                backgroundColor: (filters.startDate || filters.endDate)
                  ? colors.primaryBackground
                  : colors.backgroundSecondary,
              }}
              activeOpacity={0.7}
            >
              <Ionicons
                name="calendar"
                size={16}
                color={(filters.startDate || filters.endDate) ? colors.primary : colors.textSecondary}
              />
              <Text
                className="text-sm font-medium ml-2"
                style={{
                  color: (filters.startDate || filters.endDate) ? colors.primary : colors.textSecondary,
                }}
                numberOfLines={1}
              >
                {filters.startDate && filters.endDate
                  ? `${format(new Date(filters.startDate), 'MMM d')} - ${format(new Date(filters.endDate), 'MMM d, yyyy')}`
                  : 'Date'}
              </Text>
            </TouchableOpacity>

            {hasActiveFilters && (
              <TouchableOpacity
                onPress={clearFilters}
                className="flex-row items-center px-4 py-2 rounded-xl"
                style={{ backgroundColor: colors.backgroundSecondary }}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={16} color={colors.textSecondary} />
                <Text className="text-sm font-medium ml-2" style={{ color: colors.textSecondary }}>
                  Clear
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Filter Options */}
          {showFilters && (
            <View className="mt-3">
              <Select
                options={typeOptions}
                value={filters.type || 'all'}
                onChange={(value) => setFilters({ ...filters, type: value as any })}
                placeholder="Transaction type"
              />
            </View>
          )}
        </View>

        {/* Summary */}
        {transactions.length > 0 && (
          <View className="flex-row px-6 pb-3 gap-3">
            <View
              className="flex-1 p-3 rounded-xl"
              style={{ backgroundColor: `${colors.success}15` }}
            >
              <Text className="text-xs mb-1" style={{ color: colors.success }}>
                Income
              </Text>
              <Text className="text-base font-bold" style={{ color: colors.success }}>
                ₦{totalIncome.toLocaleString()}
              </Text>
            </View>
            <View
              className="flex-1 p-3 rounded-xl"
              style={{ backgroundColor: `${colors.error}15` }}
            >
              <Text className="text-xs mb-1" style={{ color: colors.error }}>
                Expenses
              </Text>
              <Text className="text-base font-bold" style={{ color: colors.error }}>
                ₦{totalExpenses.toLocaleString()}
              </Text>
            </View>
          </View>
        )}

        {/* Transaction List with Virtual Scrolling */}
        {(isLoading || (isFetching && transactions.length === 0)) ? (
          <View className="items-center justify-center py-20">
            <ActivityIndicator size="large" color={colors.primary} />
            <Text className="mt-4" style={{ color: colors.textSecondary }}>Loading...</Text>
          </View>
        ) : transactions.length === 0 ? (
          <View className="items-center justify-center py-20 px-6">
            <View
              className="w-20 h-20 rounded-full items-center justify-center mb-4"
              style={{ backgroundColor: colors.backgroundSecondary }}
            >
              <Ionicons name="receipt-outline" size={40} color={colors.textTertiary} />
            </View>
            <Text className="text-lg font-bold mb-2" style={{ color: colors.text }}>
              {hasActiveFilters ? 'No Results' : 'No Transactions'}
            </Text>
            <Text className="text-center" style={{ color: colors.textSecondary }}>
              {hasActiveFilters
                ? 'Try adjusting your filters'
                : 'Add your first transaction to get started'}
            </Text>
          </View>
          ) : (
            <FlatList
              data={flatListData}
              keyExtractor={(item) => item.key}
              renderItem={renderItem}
              refreshControl={
                <RefreshControl
                  refreshing={syncTransactions.isPending || (isFetching && !isLoading)}
                  onRefresh={handleRefresh}
                  tintColor={colors.primary}
                />
              }
              onEndReached={handleEndReached}
              onEndReachedThreshold={0.4}
              initialNumToRender={16}
              maxToRenderPerBatch={12}
              windowSize={6}
              removeClippedSubviews={true}
              ListFooterComponent={
                isFetchingNextPage ? (
                  <View className="py-4 items-center">
                    <ActivityIndicator size="small" color={colors.primary} />
                    <Text className="text-xs mt-2" style={{ color: colors.textTertiary }}>
                      Loading more...
                    </Text>
                  </View>
                ) : null
              }
              contentContainerStyle={{ paddingBottom: 20 }}
            />
          )}

        {/* Date Range Picker Modal */}
        <DateRangePicker
          visible={showDatePicker}
          onClose={() => setShowDatePicker(false)}
          onSelectRange={handleDateRangeSelect}
          initialStartDate={filters.startDate}
          initialEndDate={filters.endDate}
        />

        {/* Toast */}
        <Toast
          visible={showToast}
          message={toastMessage}
          type="success"
          onHide={() => setShowToast(false)}
        />
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}
