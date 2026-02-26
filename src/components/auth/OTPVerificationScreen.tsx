/**
 * OTP Verification Screen - Reusable component
 */

import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { OTPInput } from '@/src/components/common/OTPInput';
import { Button } from '@/src/components/common/Button';
import { Loading } from '@/src/components/common/Loading';
import { maskEmail } from '@/src/utils/formatters';

interface OTPVerificationScreenProps {
  email: string;
  onVerify: (otp: string) => Promise<void>;
  onResend: () => Promise<void>;
  purpose?: 'signup' | 'forgot-password' | 'login';
  isLoading?: boolean;
  error?: string;
}

export const OTPVerificationScreen: React.FC<OTPVerificationScreenProps> = ({
  email,
  onVerify,
  onResend,
  purpose = 'signup',
  isLoading = false,
  error,
}) => {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const [otp, setOtp] = useState('');
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setCanResend(true);
    }
  }, [timer]);

  const handleOTPComplete = async (otpCode: string) => {
    setOtp(otpCode);
    await onVerify(otpCode);
  };

  const handleResend = async () => {
    if (canResend) {
      setTimer(60);
      setCanResend(false);
      await onResend();
    }
  };

  const maskedEmail = maskEmail(email);

  return (
    <View
      className="flex-1 px-6 pt-8"
      style={{ backgroundColor: colors.background }}
    >
      <View className="mb-8">
        <Text
          className="text-3xl font-bold mb-2"
          style={{ color: colors.text }}
        >
          Enter 6-digit code
        </Text>
        <Text
          className="text-base"
          style={{ color: colors.textSecondary }}
        >
          We've sent the code to {maskedEmail}
        </Text>
      </View>

      <OTPInput
        length={6}
        onComplete={handleOTPComplete}
        error={error}
        disabled={isLoading}
      />

      <View className="mt-8 items-center">
        {timer > 0 ? (
          <Text
            className="text-sm"
            style={{ color: colors.textTertiary }}
          >
            Resend code in {timer}s
          </Text>
        ) : (
          <TouchableOpacity onPress={handleResend} disabled={isLoading}>
            <Text
              className="text-sm font-semibold"
              style={{ color: colors.primary }}
            >
              Resend code
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {isLoading && (
        <View className="mt-6">
          <Loading message="Verifying..." />
        </View>
      )}
    </View>
  );
};
