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

export default function SettingsScreen() {
  const colors = Colors.light;
  const router = useRouter();
  const queryClient = useQueryClient();
  const { clearAuth, user } = useAuthStore();

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
        <View className="pt-4 pb-6">
          <Text className="text-2xl font-bold" style={{ color: colors.text }}>
            Settings
          </Text>
          <Text className="text-sm mt-1" style={{ color: colors.textSecondary }}>
            Manage your account and preferences
          </Text>
        </View>

        {/* User Card */}
        <View
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
        </View>

        {/* Settings Sections */}
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

        <View className="mb-6">
          <Text
            className="text-xs font-semibold mb-3 px-1"
            style={{ color: colors.textTertiary }}
          >
            PREFERENCES
          </Text>
          <SettingsItem
            icon="notifications-outline"
            title="Notifications"
            subtitle="Manage app notifications"
            onPress={() => router.push('/settings/notifications')}
          />
          <SettingsItem
            icon="options-outline"
            title="Notification Preferences"
            subtitle="Customize alerts and quiet hours"
            onPress={() => router.push('/settings/notification-preferences')}
          />
        </View>

        <View className="mb-6">
          <Text
            className="text-xs font-semibold mb-3 px-1"
            style={{ color: colors.textTertiary }}
          >
            SECURITY
          </Text>
          <SettingsItem
            icon="key-outline"
            title="Change Password"
            subtitle="Update your password"
            onPress={() => router.push('/settings/change-password')}
          />
        </View>

        <View className="mb-6">
          <Text
            className="text-xs font-semibold mb-3 px-1"
            style={{ color: colors.textTertiary }}
          >
            DATA
          </Text>
          <SettingsItem
            icon="cloud-upload-outline"
            title="Import Statements"
            subtitle="Upload bank statements"
            onPress={() => router.push('/settings/import-statement')}
          />
          <SettingsItem
            icon="time-outline"
            title="Import History"
            subtitle="Review past imports"
            onPress={() => router.push('/settings/import-history')}
          />
          <SettingsItem
            icon="download-outline"
            title="Export Data"
            subtitle="Download your financial data"
            onPress={() => router.push('/settings/export-data')}
          />
          <SettingsItem
            icon="trash-outline"
            title="Clear Data"
            subtitle="Delete all transactions"
            onPress={() => router.push('/settings/clear-data')}
          />
        </View>

        {/* Logout Button */}
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

        {/* App Version */}
        <View className="items-center py-4">
          <Text className="text-xs" style={{ color: colors.textTertiary }}>
            SEFA v1.0.0
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
