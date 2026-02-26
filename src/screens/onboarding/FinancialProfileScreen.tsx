/**
 * Financial Profile Screen - Setup user's financial profile
 */

import React, { useState } from 'react';
import { View, Text, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { SvgXml } from 'react-native-svg';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Input } from '@/src/components/common/Input';
import { Select } from '@/src/components/common/Select';
import { Button } from '@/src/components/common/Button';
import { Loading } from '@/src/components/common/Loading';
import { Toast, useToast } from '@/src/components/common/Toast';
import { useSetupProfile } from '@/features/onboarding/onboarding.hooks';
import { Ionicons } from '@expo/vector-icons';
import { sefaLogoSvg } from '@/assets/illustrations';

const incomeTypes = [
  { value: 'salary', label: 'Salary' },
  { value: 'business', label: 'Business' },
  { value: 'freelance', label: 'Freelance' },
  { value: 'mixed', label: 'Mixed' },
  { value: 'other', label: 'Other' },
] as const;

const incomeFrequencies = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'bi-weekly', label: 'Bi-weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'annually', label: 'Annually' },
] as const;

export default function FinancialProfileScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const { toastConfig, showToast, hideToast } = useToast();

  // Generate logo with primary color
  const getLogoSvg = (color: string) => {
    return sefaLogoSvg.replace('stroke="white"', `stroke="${color}"`);
  };

  // Format number with thousand separators
  const formatNumberWithCommas = (value: string): string => {
    // Remove all non-numeric characters except decimal point
    const numericValue = value.replace(/[^\d.]/g, '');
    
    // Split by decimal point
    const parts = numericValue.split('.');
    
    // Add commas to the integer part
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    
    // Return formatted value (limit to 2 decimal places if decimal exists)
    return parts.length > 1 ? `${parts[0]}.${parts[1].slice(0, 2)}` : parts[0];
  };

  // Remove commas for API submission
  const removeCommas = (value: string): string => {
    return value.replace(/,/g, '');
  };

  const [incomeType, setIncomeType] = useState<'salary' | 'business' | 'freelance' | 'mixed' | 'other' | ''>('');
  const [incomeFrequency, setIncomeFrequency] = useState<'weekly' | 'bi-weekly' | 'monthly' | 'quarterly' | 'annually' | ''>('');
  const [averageIncome, setAverageIncome] = useState('');
  const [goals, setGoals] = useState('');

  // Handle income input with formatting
  const handleIncomeChange = (value: string) => {
    const formatted = formatNumberWithCommas(value);
    setAverageIncome(formatted);
  };

  const setupProfileMutation = useSetupProfile();

  const handleContinue = async () => {
    if (!incomeType) {
      showToast('Please select your income type', 'error');
      return;
    }

    if (!incomeFrequency) {
      showToast('Please select your income frequency', 'error');
      return;
    }

    const financialGoals = goals.trim() ? goals.split(',').map(g => g.trim()).filter(Boolean) : [];

    try {
      const result = await setupProfileMutation.mutateAsync({
        incomeType: incomeType as any,
        incomeFrequency: incomeFrequency as any,
        averageIncome: averageIncome ? parseFloat(removeCommas(averageIncome)) : undefined,
        financialGoals: financialGoals.length > 0 ? financialGoals : undefined,
      });

      if (result.success) {
        // Small delay to allow query invalidation to complete
        setTimeout(() => {
          router.push('/(onboarding)/consent');
        }, 100);
      }
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to setup profile';
      showToast(errorMessage, 'error');
      console.error('Setup profile error:', error);
    }
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <Toast
          visible={toastConfig.visible}
          message={toastConfig.message}
          type={toastConfig.type}
          onHide={hideToast}
        />
        {setupProfileMutation.isPending && <Loading fullScreen message="Setting up your profile..." />}

        <ScrollView
          className="flex-1"
          contentContainerClassName="px-6"
          showsVerticalScrollIndicator={false}
        >
        {/* Logo with SEFA Text */}
        <View className="flex-row items-center pt-6 pb-6">
          <SvgXml
            xml={getLogoSvg(colors.primary)}
            width={40}
            height={42}
          />
          <Text
            className="text-2xl font-bold ml-3 mt-1"
            style={{ color: colors.primary }}
          >
            SEFA
          </Text>
        </View>

        <Text
          className="text-3xl font-bold mb-3"
          style={{ color: colors.text }}
        >
          Financial Profile
        </Text>
        <Text
          className="text-base mb-8 leading-6"
          style={{ color: colors.textSecondary }}
        >
          Help us understand your financial situation to provide personalized insights
        </Text>

        {/* Income Type */}
        <Select
          label="Income Type"
          value={incomeType}
          options={incomeTypes}
          onSelect={(value) => setIncomeType(value as any)}
          placeholder="Select your income type"
        />

        {/* Income Frequency */}
        <Select
          label="Income Frequency"
          value={incomeFrequency}
          options={incomeFrequencies}
          onSelect={(value) => setIncomeFrequency(value as any)}
          placeholder="Select how often you receive income"
        />

         {/* Average Income */}
         <Input
           label="Average Monthly Income"
           value={averageIncome}
           onChangeText={handleIncomeChange}
           placeholder="0"
           keyboardType="numeric"
           optional
           leftIcon={<Ionicons name="cash-outline" size={20} color={colors.textSecondary} />}
           containerClassName="mb-4"
         />

        {/* Financial Goals */}
        <Input
          label="Financial Goals"
          value={goals}
          onChangeText={setGoals}
          placeholder="e.g., Save for vacation, Pay off debt (comma separated)"
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          optional
          containerClassName="mb-8"
        />

        <Button
          title="Continue"
          onPress={handleContinue}
          fullWidth
          size="large"
          disabled={!incomeType || !incomeFrequency || setupProfileMutation.isPending}
        />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
