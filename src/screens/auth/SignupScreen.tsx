/**
 * Signup Screen - 4-step sliding flow
 */

import React, { useState, useRef } from 'react';
import { View, Text, ScrollView, Dimensions, Animated, TouchableOpacity, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { useRouter } from 'expo-router';
import { SvgXml } from 'react-native-svg';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Input } from '@/src/components/common/Input';
import { PasswordInput } from '@/src/components/common/PasswordInput';
import { Button } from '@/src/components/common/Button';
import { Loading } from '@/src/components/common/Loading';
import { Toast, useToast } from '@/src/components/common/Toast';
import { OTPVerificationScreen } from '@/src/components/auth/OTPVerificationScreen';
import { useRegister, useVerifyEmail, useResendOTP } from '@/features/auth/auth.hooks';
import { validateRegistration, validateEmail as validateEmailUtil } from '@/utils/validators';
import { Ionicons } from '@expo/vector-icons';
import {
  createAccountIllustration,
  securePasswordIllustration,
  verificationSuccessIllustration,
  sefaLogoSvg,
} from '@/assets/illustrations';

const { width } = Dimensions.get('window');

type SignupStep = 'details' | 'password' | 'otp' | 'success';

export default function SignupScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const [step, setStep] = useState<SignupStep>('details');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const slideAnim = useRef(new Animated.Value(0)).current;
  const { toastConfig, showToast, hideToast } = useToast();

  const registerMutation = useRegister();
  const verifyEmailMutation = useVerifyEmail();
  const resendOTPMutation = useResendOTP() as ReturnType<typeof useResendOTP>;

  // Generate logo with primary color
  const getLogoSvg = (color: string) => {
    return sefaLogoSvg.replace('stroke="white"', `stroke="${color}"`);
  };

  const handleNextFromDetails = () => {
    if (!name.trim()) {
      showToast('Please enter your full name', 'error');
      return;
    }
    
    if (!email.trim()) {
      showToast('Please enter your email address', 'error');
      return;
    }
    
    if (!validateEmailUtil(email)) {
      showToast('Please enter a valid email address', 'error');
      return;
    }

    setStep('password');
    Animated.timing(slideAnim, {
      toValue: -width,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const handleNextFromPassword = async () => {
    if (!password) {
      showToast('Please enter a password', 'error');
      return;
    }

    if (password.length < 8) {
      showToast('Password must be at least 8 characters', 'error');
      return;
    }

    // Check for uppercase letter
    if (!/[A-Z]/.test(password)) {
      showToast('Password must contain at least one uppercase letter', 'error');
      return;
    }

    // Check for lowercase letter
    if (!/[a-z]/.test(password)) {
      showToast('Password must contain at least one lowercase letter', 'error');
      return;
    }

    // Check for number
    if (!/\d/.test(password)) {
      showToast('Password must contain at least one number', 'error');
      return;
    }

    if (!confirmPassword) {
      showToast('Please confirm your password', 'error');
      return;
    }

    if (password !== confirmPassword) {
      showToast('Passwords do not match', 'error');
      return;
    }

    try {
      console.log('📝 Registering with:', { name: name.trim(), email, passwordLength: password.length });
      
      await registerMutation.mutateAsync({
        name: name.trim(),
        email,
        password,
      });
      
      setStep('otp');
      Animated.timing(slideAnim, {
        toValue: -width * 2,
        duration: 300,
        useNativeDriver: true,
      }).start();
      showToast('OTP sent to your email', 'success');
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { error?: { message?: string; details?: any[] } } } };
      console.error('❌ Registration error:', axiosError?.response?.data);
      
      // Show detailed validation errors if available
      if (axiosError?.response?.data?.error?.details) {
        const validationErrors = axiosError.response.data.error.details
          .map((err: any) => err.msg)
          .join(', ');
        showToast(validationErrors, 'error');
      } else {
        showToast(
          axiosError?.response?.data?.error?.message || 'Registration failed. Please try again',
          'error'
        );
      }
    }
  };

  const handleVerifyOTP = async (otp: string) => {
    try {
      await verifyEmailMutation.mutateAsync({ email, otp });
      setStep('success');
      Animated.timing(slideAnim, {
        toValue: -width * 3,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } catch (error: any) {
      throw error;
    }
  };

  const handleResendOTP = async () => {
    try {
      await resendOTPMutation.mutateAsync({ email });
    } catch (error) {
      throw error;
    }
  };

  const handleContinue = () => {
      router.replace('/(tabs)');
  };

  return (
    <KeyboardAvoidingView
      className="flex-1"
      style={{ backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <Toast
        visible={toastConfig.visible}
        message={toastConfig.message}
        type={toastConfig.type}
        onHide={hideToast}
      />
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View className="flex-1">
      {/* Header with Logo and Login Button */}
      <View className="px-6 pt-12 pb-4">
        <View className="flex-row items-center justify-between mb-4">
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

          {/* Login Button */}
          {step !== 'success' && (
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
          )}
        </View>

        {/* Back Button and Step Indicator */}
        <View className="flex-row items-center">
          {step !== 'details' && step !== 'success' && (
            <TouchableOpacity
              onPress={() => {
                if (step === 'password') {
                  setStep('details');
                  Animated.timing(slideAnim, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                  }).start();
                } else if (step === 'otp') {
                  setStep('password');
                  Animated.timing(slideAnim, {
                    toValue: -width,
                    duration: 300,
                    useNativeDriver: true,
                  }).start();
                }
              }}
              className="mr-3"
            >
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
          )}
          
          {/* Step Text Indicator */}
          <Text
            className="text-sm font-medium"
            style={{ color: colors.textSecondary }}
          >
            Step {step === 'details' ? '1' : step === 'password' ? '2' : step === 'otp' ? '3' : '4'} of 4
          </Text>
          
          {/* Dot indicators */}
          <View className="flex-row ml-3">
            {[1, 2, 3, 4].map((num) => (
              <View
                key={num}
                className={`w-2 h-2 rounded-full mx-1`}
                style={{
                  backgroundColor:
                    num <= (step === 'details' ? 1 : step === 'password' ? 2 : step === 'otp' ? 3 : 4)
                      ? colors.primary
                      : colors.border,
                }}
              />
            ))}
          </View>
        </View>
      </View>

      {/* Sliding Container - FIXED */}
      <View className="flex-1" style={{ overflow: 'hidden' }}>
        <Animated.View
          className="flex-row"
          style={{
            transform: [{ translateX: slideAnim }],
            width: width * 4,
          }}
        >
        {/* Step 1: Name + Email */}
        <View style={{ width }} className="px-6 justify-center">
          <Text
            className="text-3xl font-bold mb-2"
            style={{ color: colors.text }}
          >
            Create Account
          </Text>
          <Text
            className="text-base mb-8"
            style={{ color: colors.textSecondary }}
          >
            Let's get started with your details
          </Text>

          <Input
            label="Full name"
            value={name}
            onChangeText={setName}
            placeholder="John Doe"
            autoCapitalize="words"
          />

          <Input
            label="Your email"
            value={email}
            onChangeText={setEmail}
            placeholder="johndoe@mail.com"
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Button
            title="Continue"
            onPress={handleNextFromDetails}
            fullWidth
            size="large"
            className="mt-4"
          />
        </View>

        {/* Step 2: Password + Confirm Password */}
        <View style={{ width }} className="px-6 justify-center">
          <Text
            className="text-3xl font-bold mb-2"
            style={{ color: colors.text }}
          >
            Secure Your Account
          </Text>
          <Text
            className="text-base mb-4"
            style={{ color: colors.textSecondary }}
          >
            Create a strong password
          </Text>
          
          {/* Password Requirements */}
          <View className="mb-6 p-4 rounded-xl" style={{ backgroundColor: colors.backgroundSecondary }}>
            <Text className="text-xs font-semibold mb-2" style={{ color: colors.textSecondary }}>
              Password must contain:
            </Text>
            <View className="space-y-1">
              <View className="flex-row items-center">
                <Ionicons 
                  name={password.length >= 8 ? "checkmark-circle" : "ellipse-outline"} 
                  size={16} 
                  color={password.length >= 8 ? colors.primary : colors.textTertiary} 
                />
                <Text className="text-xs ml-2" style={{ color: colors.textSecondary }}>
                  At least 8 characters
                </Text>
              </View>
              <View className="flex-row items-center">
                <Ionicons 
                  name={/[A-Z]/.test(password) ? "checkmark-circle" : "ellipse-outline"} 
                  size={16} 
                  color={/[A-Z]/.test(password) ? colors.primary : colors.textTertiary} 
                />
                <Text className="text-xs ml-2" style={{ color: colors.textSecondary }}>
                  One uppercase letter
                </Text>
              </View>
              <View className="flex-row items-center">
                <Ionicons 
                  name={/[a-z]/.test(password) ? "checkmark-circle" : "ellipse-outline"} 
                  size={16} 
                  color={/[a-z]/.test(password) ? colors.primary : colors.textTertiary} 
                />
                <Text className="text-xs ml-2" style={{ color: colors.textSecondary }}>
                  One lowercase letter
                </Text>
              </View>
              <View className="flex-row items-center">
                <Ionicons 
                  name={/\d/.test(password) ? "checkmark-circle" : "ellipse-outline"} 
                  size={16} 
                  color={/\d/.test(password) ? colors.primary : colors.textTertiary} 
                />
                <Text className="text-xs ml-2" style={{ color: colors.textSecondary }}>
                  One number
                </Text>
              </View>
            </View>
          </View>

          <PasswordInput
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="Enter your password"
          />

          <PasswordInput
            label="Confirm Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Confirm your password"
          />

          <Button
            title="Continue"
            onPress={handleNextFromPassword}
            fullWidth
            size="large"
            loading={registerMutation.isPending}
            className="mt-4"
          />
        </View>

        {/* Step 3: OTP Verification */}
        <View style={{ width }}>
          <OTPVerificationScreen
            email={email}
            onVerify={handleVerifyOTP}
            onResend={handleResendOTP}
            purpose="signup"
            isLoading={verifyEmailMutation.isPending}
            error={
              (verifyEmailMutation.error as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message
            }
          />
        </View>

        {/* Step 4: Success */}
        <View style={{ width }} className="px-6 justify-center items-center">
          {/* Success Illustration */}
          <View className="mb-6">
            <SvgXml xml={verificationSuccessIllustration} width={150} height={150} />
          </View>

          <Text
            className="text-3xl font-bold mb-4"
            style={{ color: colors.text }}
          >
            Email Verified!
          </Text>
          <Text
            className="text-base mb-8 text-center"
            style={{ color: colors.textSecondary }}
          >
            Your account has been created successfully
          </Text>
          <Button
            title="Continue"
            onPress={handleContinue}
            fullWidth
            size="large"
          />
        </View>
      </Animated.View>
      </View>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}
