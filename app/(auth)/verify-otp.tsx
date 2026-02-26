/**
 * OTP Verification Screen Route (for login flow)
 */

import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { OTPVerificationScreen } from '@/src/components/auth/OTPVerificationScreen';
import { useVerifyEmail, useResendOTP } from '@/features/auth/auth.hooks';
import { Ionicons } from '@expo/vector-icons';

export default function VerifyOTPRoute() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const email = (params.email as string) || '';
  const purpose = (params.purpose as 'signup' | 'forgot-password' | 'login') || 'signup';
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const verifyEmailMutation = useVerifyEmail();
  const resendOTPMutation = useResendOTP();

  const handleVerify = async (otp: string) => {
    try {
      await verifyEmailMutation.mutateAsync({ email, otp });
      // Navigate based on purpose
      if (purpose === 'login') {
        router.replace('/(tabs)');
      } else {
        router.replace('/(auth)/signup');
      }
    } catch (error) {
      throw error;
    }
  };

  const handleResend = async () => {
    try {
      await resendOTPMutation.mutateAsync({ email });
    } catch (error) {
      throw error;
    }
  };

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <TouchableOpacity
        onPress={() => router.back()}
        className="absolute top-12 left-6 z-10"
      >
        <Ionicons name="arrow-back" size={24} color={colors.text} />
      </TouchableOpacity>
      <OTPVerificationScreen
        email={email}
        onVerify={handleVerify}
        onResend={handleResend}
        purpose={purpose}
        isLoading={verifyEmailMutation.isPending}
        error={
          (verifyEmailMutation.error as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message
        }
      />
    </View>
  );
}
