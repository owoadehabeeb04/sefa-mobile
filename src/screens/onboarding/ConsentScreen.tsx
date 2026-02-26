/**
 * Consent Screen - Accept data analysis consent
 */

import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SvgXml } from 'react-native-svg';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Button } from '@/src/components/common/Button';
import { Loading } from '@/src/components/common/Loading';
import { Toast, useToast } from '@/src/components/common/Toast';
import { useRecordConsent, useCompleteOnboarding } from '@/features/onboarding/onboarding.hooks';
import { Ionicons } from '@expo/vector-icons';
import { sefaLogoSvg } from '@/assets/illustrations';

export default function ConsentScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const { toastConfig, showToast, hideToast } = useToast();

  // Generate logo with primary color
  const getLogoSvg = (color: string) => {
    return sefaLogoSvg.replace('stroke="white"', `stroke="${color}"`);
  };

  const [consentGiven, setConsentGiven] = useState(false);

  const recordConsentMutation = useRecordConsent();
  const completeOnboardingMutation = useCompleteOnboarding();

  const handleContinue = async () => {
    if (!consentGiven) {
      showToast('Please accept the consent to continue', 'error');
      return;
    }

    try {
      // Record consent (this also initializes categories automatically)
      const consentResult = await recordConsentMutation.mutateAsync({
        dataAnalysis: consentGiven,
      });

      if (consentResult.success) {
        // Complete onboarding
        const completeResult = await completeOnboardingMutation.mutateAsync();

        if (completeResult.success) {
          // Small delay to allow query invalidation to complete
          setTimeout(() => {
            router.replace('/(tabs)');
          }, 100);
        }
      }
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to complete onboarding';
      showToast(errorMessage, 'error');
      console.error('Complete onboarding error:', error);
    }
  };

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <Toast
        visible={toastConfig.visible}
        message={toastConfig.message}
        type={toastConfig.type}
        onHide={hideToast}
      />
      {(recordConsentMutation.isPending || completeOnboardingMutation.isPending) && (
        <Loading fullScreen message="Completing setup..." />
      )}

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
          Data Privacy & Consent
        </Text>
        <Text
          className="text-base mb-8 leading-6"
          style={{ color: colors.textSecondary }}
        >
          We respect your privacy and need your consent to provide personalized insights
        </Text>

        {/* Consent Card */}
        <View
          className="p-6 rounded-2xl mb-6"
          style={{ backgroundColor: colors.backgroundSecondary }}
        >
          <View className="flex-row items-start mb-4">
            <Ionicons name="shield-checkmark" size={24} color={colors.primary} />
            <View className="flex-1 ml-3">
              <Text
                className="text-lg font-bold mb-2"
                style={{ color: colors.text }}
              >
                Data Analysis Consent
              </Text>
              <Text
                className="text-sm leading-6 mb-4"
                style={{ color: colors.textSecondary }}
              >
                By accepting, you allow SEFA to analyze your financial data to provide:
              </Text>
            </View>
          </View>

          <View className="space-y-3">
            {[
              'Personalized budget recommendations',
              'Spending pattern insights',
              'Financial goal tracking',
              'Smart expense categorization',
            ].map((benefit, index) => (
              <View key={index} className="flex-row items-center">
                <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                <Text
                  className="text-sm ml-2 flex-1"
                  style={{ color: colors.text }}
                >
                  {benefit}
                </Text>
              </View>
            ))}
          </View>

          <View
            className="mt-4 p-4 rounded-xl"
            style={{ backgroundColor: colors.primaryBackground }}
          >
            <Text
              className="text-xs leading-5"
              style={{ color: colors.textSecondary }}
            >
              Your data is encrypted and stored securely. We never share your financial information with third parties. You can revoke this consent at any time in settings.
            </Text>
          </View>
        </View>

        {/* Consent Checkbox */}
        <TouchableOpacity
          onPress={() => setConsentGiven(!consentGiven)}
          className="flex-row items-center mb-8 p-4 rounded-xl"
          style={{ backgroundColor: colors.backgroundSecondary }}
        >
          <View
            className={`
              w-6 h-6 rounded-lg border-2 items-center justify-center mr-3
              ${consentGiven ? '' : 'border-2'}
            `}
            style={{
              backgroundColor: consentGiven ? colors.primary : 'transparent',
              borderColor: consentGiven ? colors.primary : colors.border,
            }}
          >
            {consentGiven && (
              <Ionicons name="checkmark" size={16} color={colors.textInverse} />
            )}
          </View>
          <Text
            className="flex-1 text-sm"
            style={{ color: colors.text }}
          >
            I understand and accept the data analysis consent terms
          </Text>
        </TouchableOpacity>

        <Button
          title="Complete Setup"
          onPress={handleContinue}
          fullWidth
          size="large"
          disabled={!consentGiven || recordConsentMutation.isPending || completeOnboardingMutation.isPending}
        />
      </ScrollView>
    </View>
  );
}
