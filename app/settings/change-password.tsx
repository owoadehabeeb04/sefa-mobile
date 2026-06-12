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
import { useSensitiveActionSecurity } from '@/features/security/useSensitiveActionSecurity';
import { AnimatedScreenSection, FadeUp } from '@/src/components/motion';

const colors = Colors.light;

const PasswordField = ({
  label,
  value,
  onChangeText,
  placeholder,
  visible,
  onToggle,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder: string;
  visible: boolean;
  onToggle: () => void;
}) => (
  <View style={{ marginBottom: 16 }}>
    <Text style={{ fontSize: 13, fontWeight: '600', color: colors.text, marginBottom: 8 }}>
      {label}
    </Text>
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.backgroundSecondary,
        paddingHorizontal: 14,
        paddingVertical: 14,
      }}
    >
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textTertiary}
        secureTextEntry={!visible}
        style={{ flex: 1, color: colors.text, fontSize: 15 }}
      />
      <TouchableOpacity onPress={onToggle} style={{ padding: 4 }}>
        <Ionicons
          name={visible ? 'eye-off-outline' : 'eye-outline'}
          size={20}
          color={colors.textTertiary}
        />
      </TouchableOpacity>
    </View>
  </View>
);

export default function ChangePasswordScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { requireVerification } = useSensitiveActionSecurity();
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
    if (password.length < 8) return 'Password must be at least 8 characters';
    if (!/[A-Z]/.test(password)) return 'Password must contain an uppercase letter';
    if (!/[a-z]/.test(password)) return 'Password must contain a lowercase letter';
    if (!/[0-9]/.test(password)) return 'Password must contain a number';
    return null;
  };

  const showError = (msg: string) => {
    setToastMessage(msg);
    setToastType('error');
    setShowToast(true);
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      showError('Please fill in all fields');
      return;
    }
    if (newPassword !== confirmPassword) {
      showError('New passwords do not match');
      return;
    }
    const validationError = validatePassword(newPassword);
    if (validationError) {
      showError(validationError);
      return;
    }

    const verified = await requireVerification('change_password');
    if (!verified) return;

    setIsLoading(true);
    try {
      try {
        await api.post(API_ENDPOINTS.AUTH.LOGIN, { email: user?.email, password: currentPassword });
      } catch {
        showError('Current password is incorrect');
        setIsLoading(false);
        return;
      }

      await api.post(API_ENDPOINTS.AUTH.FORGOT_PASSWORD, { email: user?.email });

      Alert.prompt(
        'Enter OTP',
        `We sent a 6-digit code to ${user?.email}`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Confirm',
            onPress: async (otp: any) => {
              if (!otp || otp.length !== 6) {
                showError('Please enter a valid 6-digit OTP');
                return;
              }
              try {
                await api.post(API_ENDPOINTS.AUTH.RESET_PASSWORD, {
                  email: user?.email,
                  otp: otp.trim(),
                  newPassword,
                });
                setToastMessage('Password changed successfully');
                setToastType('success');
                setShowToast(true);
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
                setTimeout(() => router.back(), 1500);
              } catch (error: any) {
                showError(error?.response?.data?.message || 'Failed to change password');
              }
            },
          },
        ],
        'plain-text'
      );
    } catch (error: any) {
      showError(error?.response?.data?.message || 'Failed to change password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <FadeUp
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 20,
          paddingVertical: 14,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12, padding: 2 }}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text, flex: 1 }}>
          Change Password
        </Text>
      </FadeUp>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        <AnimatedScreenSection index={0} style={{ marginBottom: 8 }}>
          <PasswordField
            label="Current Password"
            value={currentPassword}
            onChangeText={setCurrentPassword}
            placeholder="Enter current password"
            visible={showCurrentPassword}
            onToggle={() => setShowCurrentPassword(!showCurrentPassword)}
          />
        </AnimatedScreenSection>

        <AnimatedScreenSection index={1} style={{ marginBottom: 4 }}>
          <PasswordField
            label="New Password"
            value={newPassword}
            onChangeText={setNewPassword}
            placeholder="Enter new password"
            visible={showNewPassword}
            onToggle={() => setShowNewPassword(!showNewPassword)}
          />
          <Text style={{ fontSize: 12, color: colors.textTertiary, marginTop: -8, marginBottom: 16 }}>
            Min. 8 characters with uppercase, lowercase and number
          </Text>
        </AnimatedScreenSection>

        <AnimatedScreenSection index={2} style={{ marginBottom: 24 }}>
          <PasswordField
            label="Confirm New Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Re-enter new password"
            visible={showConfirmPassword}
            onToggle={() => setShowConfirmPassword(!showConfirmPassword)}
          />
        </AnimatedScreenSection>

        <AnimatedScreenSection index={3}>
          <Button title="Change Password" onPress={handleChangePassword} loading={isLoading} />
        </AnimatedScreenSection>
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
