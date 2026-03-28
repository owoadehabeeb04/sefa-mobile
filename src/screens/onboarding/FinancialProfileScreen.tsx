/**
 * Onboarding setup screen
 * Lets users optionally set a monthly budget and required consent.
 */

import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { SvgXml } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Button } from '@/src/components/common/Button';
import { Loading } from '@/src/components/common/Loading';
import { Toast, useToast } from '@/src/components/common/Toast';
import {
  useCompleteOnboarding,
  useOnboardingStatus,
  useRecordConsent,
} from '@/features/onboarding/onboarding.hooks';
import { useBudget, useUpdateBudget } from '@/features/budget/budget.hooks';
import { sefaLogoSvg } from '@/assets/illustrations';

const MAX_BUDGET = 50000000;

const formatAmount = (value: string) => {
  const numericValue = value.replace(/[^0-9]/g, '');
  if (!numericValue) return '';
  return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

const parseBudget = (value: string) => {
  const raw = value.replace(/,/g, '').trim();

  if (!raw) {
    return { amount: null, error: null };
  }

  const budget = Number(raw);

  if (!Number.isFinite(budget) || budget <= 0) {
    return { amount: null, error: 'Please enter a valid budget amount' };
  }

  if (budget > MAX_BUDGET) {
    return { amount: null, error: 'Budget cannot exceed ₦50,000,000' };
  }

  return { amount: budget, error: null };
};

export default function OnboardingSetupScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const { toastConfig, showToast, hideToast } = useToast();
  const { data: budgetData, isLoading: budgetLoading } = useBudget();
  const { data: onboardingData } = useOnboardingStatus();
  const updateBudgetMutation = useUpdateBudget();
  const recordConsentMutation = useRecordConsent();
  const completeOnboardingMutation = useCompleteOnboarding();

  const currentLimit = budgetData?.monthlyBudgetLimit ?? null;
  const hasExistingBudget = currentLimit != null && currentLimit > 0;
  const initialConsent = onboardingData?.data?.steps?.consentGiven ?? false;
  const categoriesInitialized = onboardingData?.data?.steps?.categoriesInitialized ?? false;
  const isSubmitting =
    updateBudgetMutation.isPending
    || recordConsentMutation.isPending
    || completeOnboardingMutation.isPending;

  const [monthlyBudget, setMonthlyBudget] = useState('');
  const [consentGiven, setConsentGiven] = useState(initialConsent);

  useEffect(() => {
    if (hasExistingBudget && !monthlyBudget) {
      setMonthlyBudget(currentLimit.toLocaleString('en-NG', { maximumFractionDigits: 0 }));
    }
  }, [currentLimit, hasExistingBudget, monthlyBudget]);

  useEffect(() => {
    if (initialConsent) {
      setConsentGiven(true);
    }
  }, [initialConsent]);

  const getLogoSvg = (color: string) => {
    return sefaLogoSvg.replace('stroke="white"', `stroke="${color}"`);
  };

  const finishOnboarding = async ({ skipBudget = false }: { skipBudget?: boolean } = {}) => {
    if (!consentGiven) {
      showToast('Please accept the consent to continue', 'error');
      return;
    }

    const { amount, error } = parseBudget(monthlyBudget);

    if (!skipBudget && error) {
      showToast(error, 'error');
      return;
    }

    try {
      if (!skipBudget && amount != null) {
        await updateBudgetMutation.mutateAsync(amount);
      }

      if (!initialConsent || !categoriesInitialized) {
        await recordConsentMutation.mutateAsync({ dataAnalysis: true });
      }

      const completeResult = await completeOnboardingMutation.mutateAsync();

      if (completeResult.success) {
        router.replace('/(tabs)');
      }
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message
        || error?.message
        || 'Failed to complete onboarding';
      showToast(errorMessage, 'error');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <Toast
          visible={toastConfig.visible}
          message={toastConfig.message}
          type={toastConfig.type}
          onHide={hideToast}
        />

        {isSubmitting && <Loading fullScreen message="Finishing setup..." />}

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingTop: 24, paddingBottom: 24 }}>
            <SvgXml xml={getLogoSvg(colors.primary)} width={40} height={42} />
            <Text
              style={{
                color: colors.primary,
                fontSize: 28,
                fontWeight: '700',
                marginLeft: 12,
                marginTop: 2,
              }}
            >
              SEFA
            </Text>
          </View>

          <Text
            style={{
              color: colors.text,
              fontSize: 30,
              lineHeight: 38,
              fontWeight: '700',
              marginBottom: 10,
            }}
          >
            Finish your setup
          </Text>
          <Text
            style={{
              color: colors.textSecondary,
              fontSize: 15,
              lineHeight: 24,
              marginBottom: 28,
            }}
          >
            Add a monthly budget now if you want smarter spending guidance from the start. You can skip it and update it later in Settings.
          </Text>

          <View
            style={{
              backgroundColor: colors.primaryBackground,
              borderRadius: 24,
              padding: 20,
              marginBottom: 18,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <Ionicons name="wallet-outline" size={20} color={colors.primary} />
              <Text
                style={{
                  color: colors.text,
                  fontSize: 18,
                  fontWeight: '700',
                  marginLeft: 10,
                }}
              >
                Monthly budget
              </Text>
            </View>

            <Text
              style={{
                color: colors.textSecondary,
                fontSize: 14,
                lineHeight: 22,
                marginBottom: 16,
              }}
            >
              Recommended, not required. We use this to compare your spending and keep your dashboard grounded in a real monthly target.
            </Text>

            {budgetLoading ? (
              <View style={{ paddingVertical: 12, alignItems: 'center' }}>
                <ActivityIndicator size="small" color={colors.primary} />
              </View>
            ) : (
              <>
                {hasExistingBudget && (
                  <Text
                    style={{
                      color: colors.textSecondary,
                      fontSize: 13,
                      marginBottom: 10,
                    }}
                  >
                    Current budget: ₦{Number(currentLimit).toLocaleString('en-NG')}
                  </Text>
                )}

                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    borderRadius: 18,
                    borderWidth: 1,
                    borderColor: colors.border,
                    backgroundColor: colors.background,
                    paddingHorizontal: 16,
                    paddingVertical: 14,
                  }}
                >
                  <Text
                    style={{
                      color: colors.text,
                      fontSize: 18,
                      fontWeight: '700',
                      marginRight: 10,
                    }}
                  >
                    ₦
                  </Text>
                  <TextInput
                    value={monthlyBudget}
                    onChangeText={(text) => setMonthlyBudget(formatAmount(text))}
                    placeholder={hasExistingBudget ? String(Number(currentLimit).toLocaleString('en-NG')) : '0'}
                    placeholderTextColor={colors.textTertiary}
                    keyboardType="numeric"
                    style={{
                      color: colors.text,
                      flex: 1,
                      fontSize: 18,
                      paddingVertical: 0,
                    }}
                  />
                </View>

                <Text
                  style={{
                    color: colors.textTertiary,
                    fontSize: 12,
                    lineHeight: 18,
                    marginTop: 10,
                  }}
                >
                  Optional during setup. Maximum allowed is ₦50,000,000.
                </Text>
              </>
            )}
          </View>

          <View
            style={{
              backgroundColor: colors.backgroundSecondary,
              borderRadius: 24,
              padding: 20,
              marginBottom: 24,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 14 }}>
              <Ionicons name="shield-checkmark-outline" size={20} color={colors.primary} />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text
                  style={{
                    color: colors.text,
                    fontSize: 18,
                    fontWeight: '700',
                    marginBottom: 6,
                  }}
                >
                  Data analysis consent
                </Text>
                <Text
                  style={{
                    color: colors.textSecondary,
                    fontSize: 14,
                    lineHeight: 22,
                  }}
                >
                  SEFA analyzes your transactions to categorize spending, surface patterns, and generate personalized insights. Your data stays protected and you can review your settings later.
                </Text>
              </View>
            </View>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => setConsentGiven((current) => !current)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                borderRadius: 18,
                borderWidth: 1,
                borderColor: consentGiven ? colors.primary : colors.border,
                backgroundColor: consentGiven ? colors.primaryBackground : colors.background,
                paddingHorizontal: 14,
                paddingVertical: 14,
              }}
            >
              <View
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 8,
                  borderWidth: 1.5,
                  borderColor: consentGiven ? colors.primary : colors.border,
                  backgroundColor: consentGiven ? colors.primary : 'transparent',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 12,
                }}
              >
                {consentGiven ? (
                  <Ionicons name="checkmark" size={16} color={colors.textInverse} />
                ) : null}
              </View>
              <Text
                style={{
                  color: colors.text,
                  flex: 1,
                  fontSize: 14,
                  lineHeight: 21,
                }}
              >
                I agree to SEFA analyzing my financial data to provide budgeting and insight features.
              </Text>
            </TouchableOpacity>
          </View>

          <Button
            title="Finish Setup"
            onPress={() => finishOnboarding()}
            fullWidth
            size="large"
            disabled={isSubmitting}
          />

          <Button
            title="Skip Budget for Now"
            onPress={() => finishOnboarding({ skipBudget: true })}
            fullWidth
            size="large"
            variant="outline"
            disabled={isSubmitting}
            className="mt-3"
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
