/**
 * Change Password Screen
 */

import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import { Button } from '@/components/common/Button';
import { Toast } from '@/components/common/Toast';
import api from '@/services/api';
import { API_ENDPOINTS } from '@/config/api';
import { useAuthStore } from '@/store/auth.store';

const colors = Colors.light;

export default function ChangePasswordScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  const validatePassword = (password: string): string | null => {
    if (password.length < 8) {
      return 'Password must be at least 8 characters';
    }
    if (!/[A-Z]/.test(password)) {
      return 'Password must contain at least one uppercase letter';
    }
    if (!/[a-z]/.test(password)) {
      return 'Password must contain at least one lowercase letter';
    }
    if (!/[0-9]/.test(password)) {
      return 'Password must contain at least one number';
    }
    return null;
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      setToastMessage('Please fill in all fields');
      setToastType('error');
      setShowToast(true);
      return;
    }

    if (newPassword !== confirmPassword) {
      setToastMessage('New passwords do not match');
      setToastType('error');
      setShowToast(true);
      return;
    }

    const validationError = validatePassword(newPassword);
    if (validationError) {
      setToastMessage(validationError);
      setToastType('error');
      setShowToast(true);
      return;
    }

    setIsLoading(true);
    try {
      // First verify current password by attempting login
      try {
        await api.post(API_ENDPOINTS.AUTH.LOGIN, {
          email: user?.email,
          password: currentPassword,
        });
      } catch (error: any) {
        setToastMessage('Current password is incorrect');
        setToastType('error');
        setShowToast(true);
        setIsLoading(false);
        return;
      }

      // Use forgot password flow to reset password
      // Step 1: Request OTP
      await api.post(API_ENDPOINTS.AUTH.FORGOT_PASSWORD, {
        email: user?.email,
      });

      // Show alert to enter OTP
      Alert.prompt(
        'Enter OTP',
        'We sent an OTP to your email. Please enter it to confirm password change.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Confirm',
            onPress: async (otp: any) => {
              if (!otp || otp.length !== 6) {
                setToastMessage('Please enter a valid 6-digit OTP');
                setToastType('error');
                setShowToast(true);
                return;
              }

              try {
                // Step 2: Reset password with OTP
                await api.post(API_ENDPOINTS.AUTH.RESET_PASSWORD, {
                  email: user?.email,
                  otp: otp.trim(),
                  newPassword: newPassword,
                });

                setToastMessage('Password changed successfully');
                setToastType('success');
                setShowToast(true);
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
                
                setTimeout(() => {
                  router.back();
                }, 1500);
              } catch (error: any) {
                setToastMessage(error?.response?.data?.message || 'Failed to change password');
                setToastType('error');
                setShowToast(true);
              }
            },
          },
        ],
        'plain-text'
      );
    } catch (error: any) {
      setToastMessage(error?.response?.data?.message || 'Failed to change password');
      setToastType('error');
      setShowToast(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View
        className="flex-row items-center px-5 py-4 border-b"
        style={{ borderBottomColor: colors.border }}
      >
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text className="text-xl font-bold flex-1" style={{ color: colors.text }}>
          Change Password
        </Text>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 20 }}>
        <View
          className="p-5 rounded-2xl mb-6"
          style={{ backgroundColor: colors.primaryBackground }}
        >
          <View className="flex-row items-center mb-4">
            <Ionicons name="lock-closed-outline" size={20} color={colors.primary} />
            <Text className="text-sm ml-2 flex-1" style={{ color: colors.textSecondary }}>
              For security, you'll need to verify your identity with an OTP sent to your email.
            </Text>
          </View>
        </View>

        <View className="mb-4">
          <Text className="text-sm font-semibold mb-2" style={{ color: colors.text }}>
            Current Password
          </Text>
          <View
            className="flex-row items-center rounded-xl border px-4"
            style={{
              borderColor: colors.border,
              backgroundColor: colors.backgroundSecondary,
            }}
          >
            <TextInput
              value={currentPassword}
              onChangeText={setCurrentPassword}
              placeholder="Enter current password"
              placeholderTextColor={colors.textTertiary}
              secureTextEntry={!showCurrentPassword}
              className="flex-1"
              style={{
                color: colors.text,
                fontSize: 15,
                lineHeight: 20,
                paddingVertical: 0,
              }}
            />
            <TouchableOpacity
              onPress={() => setShowCurrentPassword(!showCurrentPassword)}
              className="p-2"
            >
              <Ionicons
                name={showCurrentPassword ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color={colors.textTertiary}
              />
            </TouchableOpacity>
          </View>
        </View>

        <View className="mb-4">
          <Text className="text-sm font-semibold mb-2" style={{ color: colors.text }}>
            New Password
          </Text>
          <View
            className="flex-row items-center rounded-xl border px-4"
            style={{
              borderColor: colors.border,
              backgroundColor: colors.backgroundSecondary,
            }}
          >
            <TextInput
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="Enter new password"
              placeholderTextColor={colors.textTertiary}
              secureTextEntry={!showNewPassword}
              className="flex-1"
              style={{
                color: colors.text,
                fontSize: 15,
                lineHeight: 20,
                paddingVertical: 0,
              }}
            />
            <TouchableOpacity
              onPress={() => setShowNewPassword(!showNewPassword)}
              className="p-2"
            >
              <Ionicons
                name={showNewPassword ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color={colors.textTertiary}
              />
            </TouchableOpacity>
          </View>
          <Text className="text-xs mt-1" style={{ color: colors.textTertiary }}>
            Must be at least 8 characters with uppercase, lowercase, and number
          </Text>
        </View>

        <View className="mb-6">
          <Text className="text-sm font-semibold mb-2" style={{ color: colors.text }}>
            Confirm New Password
          </Text>
          <View
            className="flex-row items-center rounded-xl border px-4"
            style={{
              borderColor: colors.border,
              backgroundColor: colors.backgroundSecondary,
            }}
          >
            <TextInput
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Confirm new password"
              placeholderTextColor={colors.textTertiary}
              secureTextEntry={!showConfirmPassword}
              className="flex-1"
              style={{
                color: colors.text,
                fontSize: 15,
                lineHeight: 20,
                paddingVertical: 0,
              }}
            />
            <TouchableOpacity
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              className="p-2"
            >
              <Ionicons
                name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color={colors.textTertiary}
              />
            </TouchableOpacity>
          </View>
        </View>

        <Button
          title="Change Password"
          onPress={handleChangePassword}
          loading={isLoading}
        />
      </ScrollView>

      <Toast
        visible={showToast}
        message={toastMessage}
        onHide={() => setShowToast(false)}
        type={toastType}
      />
    </SafeAreaView>
  );
}
