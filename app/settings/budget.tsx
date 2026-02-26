/**
 * Budget Settings Screen
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/constants/theme';
import { Button } from '@/components/common/Button';
import { Toast } from '@/components/common/Toast';
import { useBudget, useUpdateBudget } from '@/features/budget/budget.hooks';
import { useDashboardSummary } from '@/features/dashboard/dashboard.hooks';

const colors = Colors.light;

export default function BudgetSettingsScreen() {
  const router = useRouter();
  const { data: budgetData, isLoading: budgetLoading } = useBudget();
  const updateBudget = useUpdateBudget();
  const { data: summaryResponse, isLoading: summaryLoading } = useDashboardSummary({ period: 'month' });

  const [monthlyBudget, setMonthlyBudget] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  const currentLimit = budgetData?.monthlyBudgetLimit ?? null;
  const hasExistingBudget = currentLimit != null && currentLimit > 0;

  useEffect(() => {
    if (hasExistingBudget && !monthlyBudget) {
      setMonthlyBudget(currentLimit.toLocaleString('en-NG', { maximumFractionDigits: 0 }));
    }
  }, [currentLimit, hasExistingBudget]);

  const handleSaveBudget = async () => {
    const raw = monthlyBudget.replace(/,/g, '');
    const budget = parseFloat(raw);

    if (!raw || isNaN(budget) || budget <= 0) {
      setToastMessage('Please enter a valid budget amount');
      setToastType('error');
      setShowToast(true);
      return;
    }

    if (budget > 10000000) {
      setToastMessage('Budget cannot exceed ₦10,000,000');
      setToastType('error');
      setShowToast(true);
      return;
    }

    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await updateBudget.mutateAsync(budget);
      setToastMessage(hasExistingBudget ? 'Budget updated successfully' : 'Budget set successfully');
      setToastType('success');
      setShowToast(true);
      if (!hasExistingBudget) setMonthlyBudget(budget.toLocaleString('en-NG', { maximumFractionDigits: 0 }));
    } catch {
      setToastMessage('Failed to save budget. Please try again.');
      setToastType('error');
      setShowToast(true);
    }
  };

  const formatAmount = (value: string) => {
    const numericValue = value.replace(/[^0-9]/g, '');
    if (!numericValue) return '';
    return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  const handleAmountChange = (text: string) => {
    setMonthlyBudget(formatAmount(text));
  };

  const aiInsight = summaryResponse?.data?.aiInsight;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View
        className="flex-row items-center px-5 py-4 border-b"
        style={{ borderBottomColor: colors.border }}
      >
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text className="text-xl font-bold flex-1" style={{ color: colors.text }}>
          Budget Settings
        </Text>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 20 }}>
        <View
          className="p-5 rounded-2xl mb-6"
          style={{ backgroundColor: colors.primaryBackground }}
        >
          <View className="flex-row items-center mb-4">
            <Ionicons name="information-circle-outline" size={20} color={colors.primary} />
            <Text className="text-sm ml-2 flex-1" style={{ color: colors.textSecondary }}>
              Set your monthly spending limit. On the dashboard we use it for any period you pick — e.g. 2 months and 3 days = your monthly budget × (that length). You only set it once.
            </Text>
          </View>

          {budgetLoading ? (
            <View className="py-4 items-center">
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          ) : (
            <>
              {hasExistingBudget && (
                <Text className="text-sm mb-2" style={{ color: colors.textSecondary }}>
                  Current budget: ₦{Number(currentLimit).toLocaleString('en-NG')}
                </Text>
              )}
              <Text className="text-base font-semibold mb-2" style={{ color: colors.text }}>
                Monthly Budget
              </Text>
              <Text className="text-xs mb-4" style={{ color: colors.textTertiary }}>
                {hasExistingBudget ? 'Update your monthly spending limit' : 'Enter your monthly spending limit'}
              </Text>

              <View
                className="flex-row items-center rounded-xl border px-4 py-3 mb-4"
                style={{
                  borderColor: colors.border,
                  backgroundColor: colors.backgroundSecondary,
                }}
              >
                <Text className="text-lg font-semibold mr-2" style={{ color: colors.text }}>
                  ₦
                </Text>
                <TextInput
                  value={monthlyBudget}
                  onChangeText={handleAmountChange}
                  placeholder={hasExistingBudget ? String(Number(currentLimit).toLocaleString('en-NG')) : '0'}
                  placeholderTextColor={colors.textTertiary}
                  keyboardType="numeric"
                  className="flex-1"
                  style={{
                    color: colors.text,
                    fontSize: 18,
                    lineHeight: 22,
                    paddingVertical: 0,
                  }}
                />
              </View>

              <Button
                title={hasExistingBudget ? 'Update Budget' : 'Set Budget'}
                onPress={handleSaveBudget}
                loading={updateBudget.isPending}
                disabled={updateBudget.isPending}
                className="mt-2"
              />
            </>
          )}
        </View>

        {/* AI Recommendation */}
        <View
          className="p-5 rounded-2xl mb-6"
          style={{ backgroundColor: colors.backgroundSecondary }}
        >
          <View className="flex-row items-center mb-2">
            <Ionicons name="bulb" size={20} color={colors.primary} />
            <Text className="text-base font-semibold ml-2" style={{ color: colors.text }}>
              AI Recommendation
            </Text>
          </View>
          {summaryLoading ? (
            <View className="py-4 items-center">
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          ) : aiInsight ? (
            <ScrollView
              nestedScrollEnabled
              style={{ maxHeight: 220 }}
              showsVerticalScrollIndicator
            >
              <Text
                className="text-sm leading-5"
                style={{ color: colors.textSecondary }}
              >
                {aiInsight}
              </Text>
            </ScrollView>
          ) : (
            <Text className="text-sm" style={{ color: colors.textTertiary }}>
              Add income and expenses to get personalized budget tips.
            </Text>
          )}
        </View>

        <View
          className="p-5 rounded-2xl"
          style={{ backgroundColor: colors.backgroundSecondary }}
        >
          <Text className="text-base font-semibold mb-2" style={{ color: colors.text }}>
            Budget Tips
          </Text>
          <View className="mt-2">
            <Text className="text-sm mb-2" style={{ color: colors.textSecondary }}>
              • Review your past spending to set a realistic budget
            </Text>
            <Text className="text-sm mb-2" style={{ color: colors.textSecondary }}>
              • Update your budget monthly based on your needs
            </Text>
            <Text className="text-sm mb-2" style={{ color: colors.textSecondary }}>
              • Track your progress on the dashboard
            </Text>
            <Text className="text-sm" style={{ color: colors.textSecondary }}>
              • Set aside some buffer for unexpected expenses
            </Text>
          </View>
        </View>
      </ScrollView>

      <Toast
        visible={showToast}
        message={toastMessage}
        onHide={() => setShowToast(false)}
        type={toastType}
      />
    </SafeAreaView>
  );
}
