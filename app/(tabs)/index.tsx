/**
 * Dashboard Screen
 */

import React, { useState } from 'react';
import { Alert, View, Text, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuthStore } from '@/store/auth.store';
import { useDashboardSummary } from '@/features/dashboard/dashboard.hooks';
import { useUnreadCount } from '@/features/notifications/notification.hooks';
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton';
import { SummaryCard } from '@/components/dashboard/SummaryCard';
import { BudgetAlertCard } from '@/components/dashboard/BudgetAlertCard';
import { SpendingChart } from '@/components/dashboard/CategoryBar';
import { AIInsightCard } from '@/components/dashboard/AIInsightCard';
import { TransactionList } from '@/components/dashboard/TransactionList';
import { DateRangePicker } from '@/components/common/DateRangePicker';
import { AnimatedScreenSection, FadeUp } from '@/src/components/motion';
import { format } from 'date-fns';

export default function DashboardScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const { user } = useAuthStore();
  const { data: unreadCount = 0 } = useUnreadCount();
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [startDate, setStartDate] = useState<string | undefined>();
  const [endDate, setEndDate] = useState<string | undefined>();
  const [period, setPeriod] = useState<'today' | 'week' | 'month' | 'year' | 'custom'>('month');

  // Fetch dashboard data
  const { data, isLoading, isError, refetch, isRefetching } = useDashboardSummary({ 
    period: period === 'custom' ? 'custom' : period,
    startDate,
    endDate,
  });

  // Error state
  if (isError && !isLoading) {
    return (
      <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.background }}>
        <View className="flex-1 items-center justify-center px-6">
          <Ionicons name="alert-circle-outline" size={64} color={colors.error} style={{ marginBottom: 16 }} />
          <Text className="text-xl font-bold mb-2 text-center" style={{ color: colors.text }}>
            Unable to load dashboard
          </Text>
          <Text className="text-base text-center mb-6" style={{ color: colors.textSecondary }}>
            Please check your connection and try again
          </Text>
          <TouchableOpacity
            onPress={() => refetch()}
            className="px-6 py-3 rounded-full"
            style={{ backgroundColor: colors.primary }}
          >
            <Text className="text-base font-semibold" style={{ color: '#FFFFFF' }}>
              Retry
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.background }}>
        <DashboardSkeleton />
      </SafeAreaView>
    );
  }

  const dashboardData = data?.data;
  const currency = dashboardData?.summary.currency === 'NGN' ? '₦' : dashboardData?.summary.currency || '₦';

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {/* Header */}
        <FadeUp className="pt-4 pb-4">
          <View className="flex-row items-center justify-between mb-2">
            <View className="flex-1">
              <Text className="text-2xl font-bold" style={{ color: colors.text }}>
                Dashboard
              </Text>
              <Text className="text-sm mt-0.5" style={{ color: colors.textSecondary }}>
                {dashboardData?.period.label || 'This Month'}
              </Text>
            </View>
            <View className="flex-row items-center gap-2">
              <TouchableOpacity
                onPress={() => router.push('/(tabs)/notifications')}
                className="w-10 h-10 rounded-full items-center justify-center"
                style={{ backgroundColor: colors.backgroundSecondary }}
              >
                <Ionicons name="notifications-outline" size={22} color={colors.textSecondary} />
                {unreadCount > 0 && (
                  <View
                    style={{
                      position: 'absolute',
                      top: 2,
                      right: 2,
                      backgroundColor: '#DC2626',
                      borderRadius: 8,
                      minWidth: 16,
                      height: 16,
                      alignItems: 'center',
                      justifyContent: 'center',
                      paddingHorizontal: 3,
                    }}
                  >
                    <Text style={{ color: 'white', fontSize: 9, fontWeight: '700' }}>
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  // Navigate to settings tab
                  router.push('/(tabs)/settings');
                }}
                className="w-10 h-10 rounded-full items-center justify-center"
                style={{ backgroundColor: colors.backgroundSecondary }}
              >
                <Ionicons name="person-outline" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>

          {user?.name && (
            <Text className="text-base" style={{ color: colors.textSecondary }}>
              Welcome back, {user.name.split(' ')[0]} 👋
            </Text>
          )}
        </FadeUp>

        {/* Date Range Picker Button */}
        <AnimatedScreenSection index={0}>
          <TouchableOpacity
            onPress={() => setShowDatePicker(true)}
            className="flex-row items-center justify-between p-4 rounded-2xl mb-6"
            style={{ backgroundColor: colors.backgroundSecondary }}
            activeOpacity={0.7}
          >
            <View className="flex-row items-center flex-1">
              <View
                className="w-10 h-10 rounded-full items-center justify-center mr-3"
                style={{ backgroundColor: colors.primaryBackground }}
              >
                <Ionicons name="calendar" size={20} color={colors.primary} />
              </View>
              <View className="flex-1">
                <Text className="text-xs mb-0.5" style={{ color: colors.textTertiary }}>
                  Period
                </Text>
                <Text className="text-base font-semibold" style={{ color: colors.text }}>
                  {period === 'custom' && startDate && endDate
                    ? `${format(new Date(startDate), 'MMM dd')} - ${format(new Date(endDate), 'MMM dd, yyyy')}`
                    : dashboardData?.period.label || 'This Month'}
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
          </TouchableOpacity>
        </AnimatedScreenSection>

        {/* Date Range Picker Modal */}
        <DateRangePicker
          visible={showDatePicker}
          onClose={() => setShowDatePicker(false)}
          onSelectRange={(start, end) => {
            setStartDate(start);
            setEndDate(end);
            setPeriod('custom');
          }}
          initialStartDate={startDate}
          initialEndDate={endDate}
        />

        {/* Summary Cards */}
        <AnimatedScreenSection index={1}>
        <View className="flex-row flex-wrap gap-3 mb-6">
          <SummaryCard
            title="Income"
            amount={dashboardData?.summary.totalIncome || 0}
            currency={currency}
            icon="trending-up"
            change={dashboardData?.comparison.incomeChange || null}
            isPositive={parseFloat(dashboardData?.comparison.incomeChange || '0') >= 0}
          />
          <SummaryCard
            title="Expenses"
            amount={dashboardData?.summary.totalExpenses || 0}
            currency={currency}
            icon="trending-down"
            change={dashboardData?.comparison.expenseChange || null}
            isPositive={parseFloat(dashboardData?.comparison.expenseChange || '0') < 0}
          />
          <SummaryCard
            title="Balance"
            amount={dashboardData?.summary.balance || 0}
            currency={currency}
            icon="wallet"
          />
          <SummaryCard
            title="Savings"
            amount={dashboardData?.summary.savings || 0}
            currency={currency}
            icon="save"
          />
        </View>
        </AnimatedScreenSection>

        {/* Budget quick alert (scaled by period) + optional "This month" strip */}
        {dashboardData?.budget && (
          <AnimatedScreenSection index={2}>
            <BudgetAlertCard
              budget={dashboardData.budget}
              currency={currency}
              thisMonthBudget={dashboardData.thisMonthBudget ?? null}
            />
          </AnimatedScreenSection>
        )}

        {/* Add Expense Button */}
        <AnimatedScreenSection index={3}>
          <TouchableOpacity
            onPress={() => {
              // TODO: Navigate to add expense screen
              Alert.alert('Coming Soon', 'Add expense feature will be available soon!');
            }}
            className="flex-row items-center justify-center py-4 rounded-2xl mb-6"
            style={{ backgroundColor: colors.primary }}
            activeOpacity={0.8}
          >
            <Ionicons name="add-circle" size={24} color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text className="text-base font-semibold" style={{ color: '#FFFFFF' }}>
              Add Expense
            </Text>
          </TouchableOpacity>
        </AnimatedScreenSection>

        {/* Spending Chart */}
        <AnimatedScreenSection index={4}>
          <View className="mb-6">
            <SpendingChart
              categories={dashboardData?.topCategories || []}
              title="Top Spending"
              currency={currency}
            />
          </View>
        </AnimatedScreenSection>

        {/* AI Insight */}
        {dashboardData?.aiInsight && (
          <AnimatedScreenSection index={5}>
            <View className="mb-6">
              <AIInsightCard insight={dashboardData.aiInsight} />
            </View>
          </AnimatedScreenSection>
        )}

        {/* Recent Transactions */}
        <AnimatedScreenSection index={6}>
          <View className="mb-4">
            <TransactionList
              transactions={dashboardData?.recentTransactions || []}
              currency={currency}
              onViewAll={() => {
                const start = dashboardData?.period?.start ?? startDate;
                const end = dashboardData?.period?.end ?? endDate;
                router.push({
                  pathname: '/(tabs)/transactions',
                  params: {
                    ...(start && { startDate: start }),
                    ...(end && { endDate: end }),
                    type: 'all',
                  },
                });
              }}
            />
          </View>
        </AnimatedScreenSection>

        {/* Stats Footer */}
        {dashboardData?.counts && (
          <AnimatedScreenSection index={7} variant="slide">
            <View className="flex-row items-center justify-center py-4 mb-2">
              <Text className="text-xs" style={{ color: colors.textTertiary }}>
                {dashboardData.counts.totalTransactions} transactions •{' '}
                {dashboardData.counts.expenseCount} expenses •{' '}
                {dashboardData.counts.incomeCount} income
              </Text>
            </View>
          </AnimatedScreenSection>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
