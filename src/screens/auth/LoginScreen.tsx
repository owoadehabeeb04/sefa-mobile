/**
 * Login Screen
 */

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { useRouter } from 'expo-router';
import { SvgXml } from 'react-native-svg';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Input } from '@/src/components/common/Input';
import { PasswordInput } from '@/src/components/common/PasswordInput';
import { Button } from '@/src/components/common/Button';
import { Toast, useToast } from '@/src/components/common/Toast';
import { useLogin } from '@/features/auth/auth.hooks';
import { validateLogin } from '@/utils/validators';
import { Ionicons } from '@expo/vector-icons';
import { sefaLogoSvg } from '@/assets/illustrations';

export default function LoginScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { toastConfig, showToast, hideToast } = useToast();

  const loginMutation = useLogin();

  // Generate logo with primary color
  const getLogoSvg = (color: string) => {
    return sefaLogoSvg.replace('stroke="white"', `stroke="${color}"`);
  };

  const handleLogin = async () => {
    const validation = validateLogin({ email, password });
    
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setErrors({});

    try {
      const response = await loginMutation.mutateAsync({ email, password });
      
      console.log('🔐 Login response:', {
        success: response.success,
        requiresVerification: response.data?.requiresVerification,
        userVerified: response.data?.user?.isVerified,
        onboardingCompleted: response.data?.user?.onboardingCompleted,
      });
      
      // Check if user needs verification
      if (response.data?.requiresVerification) {
        console.log('🔐 Redirecting to verify-otp');
        router.push({
          pathname: '/(auth)/verify-otp',
          params: { email, purpose: 'login' },
        });
      } else {
        // Always redirect to tabs after successful login
        console.log('🔐 Redirecting to tabs');
        setTimeout(() => {
          router.replace('/(tabs)');
        }, 100);
      }
    } catch (error: any) {
      const message = error?.response?.data?.error?.message || 'Invalid email or password';
      setErrors({ email: message });
      showToast(message, 'error');
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
          {/* Logo + SEFA Text */}
          <View className="flex-row items-center">
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

          {/* Signup Button */}
          <TouchableOpacity
            onPress={() => router.push('/(auth)/signup')}
            className="px-4 py-2 rounded-lg"
            style={{ backgroundColor: colors.primaryBackground }}
          >
            <Text
              className="text-sm font-semibold"
              style={{ color: colors.primary }}
            >
              Sign Up
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
            Welcome back
          </Text>
          <Text
            className="text-base"
            style={{ color: colors.textSecondary }}
          >
            Sign in to your account
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
          error={errors.email}
        />

        <PasswordInput
          label="Password"
          value={password}
          onChangeText={setPassword}
          placeholder="Enter your password"
          error={errors.password}
        />

        <TouchableOpacity
          onPress={() => router.push('/(auth)/forgot-password')}
          className="self-end mb-6"
        >
          <Text
            className="text-sm font-medium"
            style={{ color: colors.primary }}
          >
            Forgot Password?
          </Text>
        </TouchableOpacity>

        <Button
          title="Sign In"
          onPress={handleLogin}
          fullWidth
          size="large"
          loading={loginMutation.isPending}
        />

        {/* Sign Up Link */}
        <View className="flex-row justify-center items-center mt-6">
          <Text
            className="text-base"
            style={{ color: colors.textSecondary }}
          >
            Don't have an account?{' '}
          </Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/signup')}>
            <Text
              className="text-base font-semibold"
              style={{ color: colors.primary }}
            >
              Sign Up
            </Text>
          </TouchableOpacity>
        </View>
      </View>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}
