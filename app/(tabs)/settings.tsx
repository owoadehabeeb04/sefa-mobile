/**
 * Settings Screen
 */

import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import { useAuthStore } from '@/store/auth.store';
import { useAppLockStore } from '@/store/appLock.store';
import { describeAppLockMethod } from '@/features/security/appLock.service';
import { AnimatedScreenSection, FadeUp } from '@/src/components/motion';

export default function SettingsScreen() {
  const colors = Colors.light;
  const router = useRouter();
  const queryClient = useQueryClient();
  const { clearAuth, user } = useAuthStore();
  const { settings: appLockSettings, biometricStatus } = useAppLockStore();

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await clearAuth();
          queryClient.clear();
          router.replace('/(welcome)');
        },
      },
    ]);
  };

  const SettingsItem = ({
    icon,
    title,
    subtitle,
    onPress,
    showBadge,
  }: {
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
    subtitle?: string;
    onPress?: () => void;
    showBadge?: boolean;
  }) => (
    <TouchableOpacity
      className="flex-row items-center py-4 px-4 rounded-xl mb-2"
      style={{ backgroundColor: colors.backgroundSecondary }}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View
        className="w-10 h-10 rounded-full items-center justify-center mr-3"
        style={{ backgroundColor: colors.primaryBackground }}
      >
        <Ionicons name={icon} size={20} color={colors.primary} />
      </View>
      <View className="flex-1">
        <Text className="text-base font-semibold" style={{ color: colors.text }}>
          {title}
        </Text>
        {subtitle && (
          <Text className="text-xs mt-0.5" style={{ color: colors.textTertiary }}>
            {subtitle}
          </Text>
        )}
      </View>
      {showBadge && (
        <View
          className="px-2 py-1 rounded mr-2"
          style={{ backgroundColor: colors.primaryBackground }}
        >
          <Text className="text-xs font-semibold" style={{ color: colors.primary }}>
            Soon
          </Text>
        </View>
      )}
      <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView className="flex-1" contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}>
        {/* Header */}
        <FadeUp className="pt-4 pb-6">
          <Text className="text-2xl font-bold" style={{ color: colors.text }}>
            Settings
          </Text>
          <Text className="text-sm mt-1" style={{ color: colors.textSecondary }}>
            Manage your account and preferences
          </Text>
        </FadeUp>

        {/* User Card */}
        <AnimatedScreenSection
          index={0}
          className="p-5 rounded-2xl mb-6"
          style={{ backgroundColor: colors.primaryBackground }}
        >
          <View className="flex-row items-center">
            <View
              className="w-16 h-16 rounded-full items-center justify-center mr-4"
              style={{ backgroundColor: colors.primary }}
            >
              <Text className="text-2xl font-bold" style={{ color: '#FFFFFF' }}>
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </Text>
            </View>
            <View className="flex-1">
              <Text className="text-xl font-bold mb-1" style={{ color: colors.text }}>
                {user?.name || 'User'}
              </Text>
              <Text className="text-sm" style={{ color: colors.textSecondary }}>
                {user?.email || 'user@example.com'}
              </Text>
            </View>
          </View>
        </AnimatedScreenSection>

        {/* Settings Sections */}
        <AnimatedScreenSection index={1}>
        <View className="mb-6">
          <Text
            className="text-xs font-semibold mb-3 px-1"
            style={{ color: colors.textTertiary }}
          >
            FINANCIAL
          </Text>
          <SettingsItem
            icon="pricetag-outline"
            title="Categories"
            subtitle="Manage expense & income categories"
            onPress={() => router.push('/settings/categories')}
          />
          <SettingsItem
            icon="wallet-outline"
            title="Budget Settings"
            subtitle="Set monthly spending limits"
            onPress={() => router.push('/settings/budget')}
          />
          <SettingsItem
            icon="link-outline"
            title="Bank Connections"
            subtitle="Connect and sync your bank accounts"
            onPress={() => router.push('/settings/bank-connections')}
          />
          <SettingsItem
            icon="pulse-outline"
            title="Sync Activity"
            subtitle="View sync status and history"
            onPress={() => router.push('/settings/sync-history')}
          />
        </View>
        </AnimatedScreenSection>

        <AnimatedScreenSection index={2}>
        <View className="mb-6">
          <Text
            className="text-xs font-semibold mb-3 px-1"
            style={{ color: colors.textTertiary }}
          >
            SECURITY
          </Text>
          <SettingsItem
            icon="shield-checkmark-outline"
            title="App Lock & PIN"
            subtitle={describeAppLockMethod(appLockSettings, biometricStatus)}
            onPress={() => router.push('/settings/app-lock')}
          />
          <SettingsItem
            icon="key-outline"
            title="Change Password"
            subtitle="Update your password"
            onPress={() => router.push('/settings/change-password')}
          />
        </View>
        </AnimatedScreenSection>

        <AnimatedScreenSection index={3}>
        <View className="mb-6">
          <Text
            className="text-xs font-semibold mb-3 px-1"
            style={{ color: colors.textTertiary }}
          >
            DATA
          </Text>
          <SettingsItem
            icon="trash-outline"
            title="Clear Data"
            subtitle="Delete all transactions"
            onPress={() => router.push('/settings/clear-data')}
          />
        </View>
        </AnimatedScreenSection>

        {/* Logout Button */}
        <AnimatedScreenSection index={4}>
          <TouchableOpacity
            className="flex-row items-center justify-center py-4 px-4 rounded-xl mb-4"
            style={{ backgroundColor: `${colors.error}15` }}
            onPress={handleLogout}
            activeOpacity={0.7}
          >
            <Ionicons name="log-out-outline" size={20} color={colors.error} />
            <Text className="text-base font-semibold ml-2" style={{ color: colors.error }}>
              Logout
            </Text>
          </TouchableOpacity>
        </AnimatedScreenSection>

        {/* App Version */}
        <AnimatedScreenSection index={5} variant="slide">
          <View className="items-center py-4">
            <Text className="text-xs" style={{ color: colors.textTertiary }}>
              SEFA v1.0.0
            </Text>
          </View>
        </AnimatedScreenSection>
      </ScrollView>
    </SafeAreaView>
  );
}
