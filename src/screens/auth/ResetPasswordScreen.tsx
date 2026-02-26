/**
 * Reset Password Screen
 */

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SvgXml } from 'react-native-svg';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { PasswordInput } from '@/src/components/common/PasswordInput';
import { Button } from '@/src/components/common/Button';
import { Toast, useToast } from '@/src/components/common/Toast';
import { OTPVerificationScreen } from '@/src/components/auth/OTPVerificationScreen';
import { useResetPassword, useResendOTP } from '@/features/auth/auth.hooks';
import { validatePassword } from '@/utils/validators';
import { Ionicons } from '@expo/vector-icons';
import { sefaLogoSvg } from '@/assets/illustrations';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const email = (params.email as string) || '';
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const [step, setStep] = useState<'otp' | 'password'>('otp');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { toastConfig, showToast, hideToast } = useToast();

  const resetPasswordMutation = useResetPassword();
  const resendOTPMutation = useResendOTP();

  // Generate logo with primary color
  const getLogoSvg = (color: string) => {
    return sefaLogoSvg.replace('stroke="white"', `stroke="${color}"`);
  };

  const handleVerifyOTP = async (otpCode: string) => {
    setOtp(otpCode);
    setStep('password');
  };

  const handleResendOTP = async () => {
    try {
      await resendOTPMutation.mutateAsync({ email });
      showToast('New OTP sent to your email', 'success');
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { error?: { message?: string } } } };
      showToast(axiosError?.response?.data?.error?.message || 'Failed to resend OTP', 'error');
      throw error;
    }
  };

  const handleResetPassword = async () => {
    const newErrors: Record<string, string> = {};

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      newErrors.password = passwordValidation.errors[0];
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      const firstError = Object.values(newErrors)[0];
      if (firstError) showToast(firstError, 'error');
      return;
    }

    setErrors({});

    try {
      await resetPasswordMutation.mutateAsync({
        email,
        otp,
        newPassword: password,
      });
      showToast('Password reset successfully', 'success');
      router.replace('/(auth)/login');
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { error?: { message?: string } } } };
      const message = axiosError?.response?.data?.error?.message || 'Failed to reset password';
      setErrors({ password: message });
      showToast(message, 'error');
    }
  };

  if (step === 'otp') {
    return (
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ backgroundColor: colors.background }}
      >
        <Toast
          visible={toastConfig.visible}
          message={toastConfig.message}
          type={toastConfig.type}
          onHide={hideToast}
        />
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View className="flex-1">
        {/* Logo Header */}
        <View className="px-6 pt-12 pb-4">
          <View className="flex-row items-center justify-between">
            {/* Back Button + Logo + SEFA Text */}
            <View className="flex-row items-center">
              <TouchableOpacity
                onPress={() => router.back()}
                className="mr-4"
              >
                <Ionicons name="arrow-back" size={24} color={colors.text} />
              </TouchableOpacity>
              <SvgXml
                xml={getLogoSvg(colors.primary)}
                width={32}
                height={34}
              />
              <Text
                className="text-xl font-bold ml-2"
                style={{ color: colors.primary }}
              >
                SEFA
              </Text>
            </View>

            {/* Login Button */}
            <TouchableOpacity
              onPress={() => router.push('/(auth)/login')}
              className="px-4 py-2 rounded-lg"
              style={{ backgroundColor: colors.primaryBackground }}
            >
              <Text
                className="text-sm font-semibold"
                style={{ color: colors.primary }}
              >
                Login
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <OTPVerificationScreen
          email={email}
          onVerify={handleVerifyOTP}
          onResend={handleResendOTP}
          purpose="forgot-password"
          isLoading={resendOTPMutation.isPending}
        />
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView
      className="flex-1"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ backgroundColor: colors.background }}
    >
      <Toast
        visible={toastConfig.visible}
        message={toastConfig.message}
        type={toastConfig.type}
        onHide={hideToast}
      />
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View className="flex-1">
      {/* Logo Header */}
      <View className="px-6 pt-12 pb-4">
        <View className="flex-row items-center justify-between">
          {/* Back Button + Logo + SEFA Text */}
          <View className="flex-row items-center">
            <TouchableOpacity
              onPress={() => setStep('otp')}
              className="mr-4"
            >
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
            <SvgXml
              xml={getLogoSvg(colors.primary)}
              width={32}
              height={34}
            />
            <Text
              className="text-xl font-bold ml-2"
              style={{ color: colors.primary }}
            >
              SEFA
            </Text>
          </View>

          {/* Login Button */}
          <TouchableOpacity
            onPress={() => router.push('/(auth)/login')}
            className="px-4 py-2 rounded-lg"
            style={{ backgroundColor: colors.primaryBackground }}
          >
            <Text
              className="text-sm font-semibold"
              style={{ color: colors.primary }}
            >
              Login
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View className="flex-1 px-6 pt-8">
        <View className="mb-8">
          <Text
            className="text-3xl font-bold mb-2"
            style={{ color: colors.text }}
          >
            Create New Password
          </Text>
          <Text
            className="text-base"
            style={{ color: colors.textSecondary }}
          >
            Enter your new password below
          </Text>
        </View>

        <PasswordInput
          label="New Password"
          value={password}
          onChangeText={setPassword}
          placeholder="Enter new password"
          error={errors.password}
        />

        <PasswordInput
          label="Confirm Password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholder="Confirm new password"
          error={errors.confirmPassword}
        />

        <Button
          title="Reset Password"
          onPress={handleResetPassword}
          fullWidth
          size="large"
          loading={resetPasswordMutation.isPending}
          className="mt-4"
        />
      </View>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}
