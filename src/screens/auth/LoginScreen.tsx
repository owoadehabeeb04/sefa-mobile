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
import { AnimatedScreenSection, FadeUp, ScaleIn } from '@/src/components/motion';
import { useLogin } from '@/features/auth/auth.hooks';
import { getOnboardingStatus } from '@/features/onboarding/onboarding.service';
import { getOnboardingRoute } from '@/features/auth/auth-routing';
import { validateLogin } from '@/utils/validators';
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

      if (response.data?.requiresVerification) {
        router.replace({
          pathname: '/(auth)/verify-otp',
          params: { email, purpose: 'login' },
        });
      } else {
        if (response.data?.user?.onboardingCompleted) {
          router.replace('/(tabs)');
          return;
        }

        const onboardingStatus = await getOnboardingStatus();
        router.replace(getOnboardingRoute(onboardingStatus.data));
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
      <ScaleIn style={{ paddingHorizontal: 24, paddingTop: 48, paddingBottom: 16 }}>
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
      </ScaleIn>

      <View className="flex-1 px-6 pt-8">
        {/* Header */}
        <FadeUp style={{ marginBottom: 32 }}>
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
        </FadeUp>

        {/* Form */}
        <AnimatedScreenSection index={0}>
          <Input
            label="Your email"
            value={email}
            onChangeText={setEmail}
            placeholder="johndoe@mail.com"
            keyboardType="email-address"
            autoCapitalize="none"
            error={errors.email}
          />
        </AnimatedScreenSection>

        <AnimatedScreenSection index={1}>
          <PasswordInput
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="Enter your password"
            error={errors.password}
          />
        </AnimatedScreenSection>

        <AnimatedScreenSection index={2} variant="slide">
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
        </AnimatedScreenSection>

        <AnimatedScreenSection index={3}>
          <Button
            title="Sign In"
            onPress={handleLogin}
            fullWidth
            size="large"
            loading={loginMutation.isPending}
          />
        </AnimatedScreenSection>

        {/* Sign Up Link */}
        <AnimatedScreenSection index={4} style={{ marginTop: 24 }}>
          <View className="flex-row justify-center items-center">
            <Text
              className="text-base"
              style={{ color: colors.textSecondary }}
            >
              Don&apos;t have an account?{' '}
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
        </AnimatedScreenSection>
      </View>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}
