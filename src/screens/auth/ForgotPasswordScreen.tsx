/**
 * Forgot Password Screen
 */

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { useRouter } from 'expo-router';
import { SvgXml } from 'react-native-svg';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Input } from '@/src/components/common/Input';
import { Button } from '@/src/components/common/Button';
import { Toast, useToast } from '@/src/components/common/Toast';
import { useForgotPassword } from '@/features/auth/auth.hooks';
import { validateEmail } from '@/utils/validators';
import { Ionicons } from '@expo/vector-icons';
import { sefaLogoSvg } from '@/assets/illustrations';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const { toastConfig, showToast, hideToast } = useToast();

  const forgotPasswordMutation = useForgotPassword();

  // Generate logo with primary color
  const getLogoSvg = (color: string) => {
    return sefaLogoSvg.replace('stroke="white"', `stroke="${color}"`);
  };

  const handleSendOTP = async () => {
    if (!email) {
      setError('Email is required');
      showToast('Email is required', 'error');
      return;
    }

    if (!validateEmail(email)) {
      setError('Email is invalid');
      showToast('Please enter a valid email address', 'error');
      return;
    }

    setError('');

    try {
      await forgotPasswordMutation.mutateAsync({ email });
      showToast('OTP sent to your email', 'success');
      router.push({
        pathname: '/(auth)/reset-password',
        params: { email },
      });
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { error?: { message?: string } } } };
      const errorMessage = axiosError?.response?.data?.error?.message || 'Failed to send OTP';
      setError(errorMessage);
      showToast(errorMessage, 'error');
    }
  };

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

      <View className="flex-1 px-6 pt-8">
        {/* Header */}
        <View className="mb-8">
          <Text
            className="text-3xl font-bold mb-2"
            style={{ color: colors.text }}
          >
            Reset Password
          </Text>
          <Text
            className="text-base"
            style={{ color: colors.textSecondary }}
          >
            Enter the email address associated with your account
          </Text>
        </View>

        {/* Form */}
        <Input
          label="Your email"
          value={email}
          onChangeText={setEmail}
          placeholder="johndoe@mail.com"
          keyboardType="email-address"
          autoCapitalize="none"
          error={error}
        />

        <Button
          title="Continue"
          onPress={handleSendOTP}
          fullWidth
          size="large"
          loading={forgotPasswordMutation.isPending}
          className="mt-4"
        />

        {/* Back to Sign In */}
        <TouchableOpacity
          onPress={() => router.back()}
          className="self-center mt-6"
        >
          <Text
            className="text-base font-medium"
            style={{ color: colors.primary }}
          >
            Back to Sign In
          </Text>
        </TouchableOpacity>
      </View>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}
