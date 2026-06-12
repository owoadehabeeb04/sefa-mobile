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
import { AnimatedScreenSection, FadeUp } from '@/src/components/motion';
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

    if (budget > 50000000) {
      setToastMessage('Budget cannot exceed ₦50,000,000');
      setToastType('error');
      setShowToast(true);
      return;
    }

    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await updateBudget.mutateAsync(budget);
      setToastMessage(hasExistingBudget ? 'Budget updated' : 'Budget set');
      setToastType('success');
      setShowToast(true);
      if (!hasExistingBudget) {
        setMonthlyBudget(budget.toLocaleString('en-NG', { maximumFractionDigits: 0 }));
      }
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

  const aiInsight = summaryResponse?.data?.aiInsight;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <FadeUp
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 20,
          paddingVertical: 14,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12, padding: 2 }}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text, flex: 1 }}>
          Budget
        </Text>
      </FadeUp>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Budget Input Card */}
        <AnimatedScreenSection
          index={0}
          style={{
            backgroundColor: colors.primaryBackground,
            borderRadius: 20,
            padding: 20,
            marginBottom: 16,
          }}
        >
          {budgetLoading ? (
            <View style={{ paddingVertical: 24, alignItems: 'center' }}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          ) : (
            <>
              <Text style={{ fontSize: 13, color: colors.textSecondary, marginBottom: 16, lineHeight: 19 }}>
                {hasExistingBudget
                  ? `Current limit: ₦${Number(currentLimit).toLocaleString('en-NG')}`
                  : 'Set your monthly spending limit to track budget progress.'}
              </Text>

              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: colors.border,
                  backgroundColor: colors.backgroundSecondary,
                  paddingHorizontal: 14,
                  paddingVertical: 14,
                  marginBottom: 16,
                }}
              >
                <Text style={{ fontSize: 18, fontWeight: '600', color: colors.text, marginRight: 8 }}>
                  ₦
                </Text>
                <TextInput
                  value={monthlyBudget}
                  onChangeText={(text) => setMonthlyBudget(formatAmount(text))}
                  placeholder={hasExistingBudget ? String(Number(currentLimit).toLocaleString('en-NG')) : '0'}
                  placeholderTextColor={colors.textTertiary}
                  keyboardType="numeric"
                  style={{ flex: 1, color: colors.text, fontSize: 18 }}
                />
              </View>

              <Button
                title={hasExistingBudget ? 'Update Budget' : 'Set Budget'}
                onPress={handleSaveBudget}
                loading={updateBudget.isPending}
                disabled={updateBudget.isPending}
              />
            </>
          )}
        </AnimatedScreenSection>

        {/* AI Recommendation */}
        <AnimatedScreenSection
          index={1}
          style={{
            backgroundColor: colors.backgroundSecondary,
            borderRadius: 20,
            padding: 20,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
            <Ionicons name="bulb-outline" size={18} color={colors.primary} />
            <Text style={{ fontSize: 15, fontWeight: '600', color: colors.text, marginLeft: 8 }}>
              SEFA Recommendation
            </Text>
          </View>

          {summaryLoading ? (
            <View style={{ paddingVertical: 16, alignItems: 'center' }}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          ) : aiInsight ? (
            <Text
              style={{ fontSize: 13, color: colors.textSecondary, lineHeight: 20 }}
              numberOfLines={5}
            >
              {aiInsight}
            </Text>
          ) : (
            <Text style={{ fontSize: 13, color: colors.textTertiary }}>
              Add income and expenses to get personalized budget recommendations.
            </Text>
          )}
        </AnimatedScreenSection>
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
