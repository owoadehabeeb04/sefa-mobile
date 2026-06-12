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
import { useSensitiveActionSecurity } from '@/features/security/useSensitiveActionSecurity';
import { AnimatedScreenSection, FadeUp } from '@/src/components/motion';

export default function SettingsScreen() {
  const colors = Colors.light;
  const router = useRouter();
  const queryClient = useQueryClient();
  const { clearAuth, user } = useAuthStore();
  const { settings: appLockSettings, biometricStatus } = useAppLockStore();
  const { requireVerification } = useSensitiveActionSecurity();

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
    danger,
  }: {
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
    subtitle?: string;
    onPress?: () => void;
    showBadge?: boolean;
    danger?: boolean;
  }) => (
    <TouchableOpacity
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 13,
        paddingHorizontal: 16,
        backgroundColor: colors.backgroundSecondary,
        borderRadius: 14,
        marginBottom: 8,
      }}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 12,
          backgroundColor: danger ? `${colors.error}12` : colors.primaryBackground,
        }}
      >
        <Ionicons name={icon} size={18} color={danger ? colors.error : colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 15, fontWeight: '500', color: danger ? colors.error : colors.text }}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={{ fontSize: 12, color: colors.textTertiary, marginTop: 1 }}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {showBadge && (
        <View
          style={{
            paddingHorizontal: 8,
            paddingVertical: 3,
            borderRadius: 6,
            backgroundColor: colors.primaryBackground,
            marginRight: 8,
          }}
        >
          <Text style={{ fontSize: 11, fontWeight: '600', color: colors.primary }}>Soon</Text>
        </View>
      )}
      {!danger && (
        <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
      )}
    </TouchableOpacity>
  );

  const SectionLabel = ({ label }: { label: string }) => (
    <Text
      style={{
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 0.8,
        color: colors.textTertiary,
        textTransform: 'uppercase',
        marginBottom: 8,
        marginTop: 4,
        paddingHorizontal: 4,
      }}
    >
      {label}
    </Text>
  );

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <FadeUp style={{ paddingTop: 16, paddingBottom: 20 }}>
          <Text style={{ fontSize: 28, fontWeight: '700', color: colors.text }}>Settings</Text>
        </FadeUp>

        {/* User Card */}
        <AnimatedScreenSection
          index={0}
          style={{
            backgroundColor: colors.primaryBackground,
            borderRadius: 20,
            padding: 16,
            marginBottom: 24,
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          <View
            style={{
              width: 52,
              height: 52,
              borderRadius: 26,
              backgroundColor: colors.primary,
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 14,
            }}
          >
            <Text style={{ fontSize: 22, fontWeight: '700', color: '#FFFFFF' }}>
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 17, fontWeight: '600', color: colors.text }}>
              {user?.name || 'User'}
            </Text>
            <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 2 }}>
              {user?.email || 'user@example.com'}
            </Text>
          </View>
        </AnimatedScreenSection>

        {/* Financial */}
        <AnimatedScreenSection index={1} style={{ marginBottom: 20 }}>
          <SectionLabel label="Financial" />
          <SettingsItem
            icon="pricetag-outline"
            title="Categories"
            subtitle="Expense & income categories"
            onPress={() => router.push('/settings/categories')}
          />
          <SettingsItem
            icon="wallet-outline"
            title="Budget"
            subtitle="Monthly spending limit"
            onPress={() => router.push('/settings/budget')}
          />
          <SettingsItem
            icon="link-outline"
            title="Bank Connections"
            subtitle="Sync your bank accounts"
            onPress={() => router.push('/settings/bank-connections')}
          />
          <SettingsItem
            icon="pulse-outline"
            title="Sync Activity"
            subtitle="View sync history"
            onPress={() => router.push('/settings/sync-history')}
          />
          <SettingsItem
            icon="document-text-outline"
            title="Statement Imports"
            subtitle="Upload PDF bank statements"
            onPress={async () => {
              const allowed = await requireVerification('statement_import_history');
              if (allowed) router.push('/settings/statement-import');
            }}
          />
        </AnimatedScreenSection>

        {/* Security */}
        <AnimatedScreenSection index={2} style={{ marginBottom: 20 }}>
          <SectionLabel label="Security" />
          <SettingsItem
            icon="shield-checkmark-outline"
            title="App Lock & PIN"
            subtitle={describeAppLockMethod(appLockSettings, biometricStatus)}
            onPress={() => router.push('/settings/app-lock')}
          />
          <SettingsItem
            icon="key-outline"
            title="Change Password"
            onPress={() => router.push('/settings/change-password')}
          />
        </AnimatedScreenSection>

        {/* Logout */}
        <AnimatedScreenSection index={3}>
          <TouchableOpacity
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              paddingVertical: 14,
              borderRadius: 14,
              backgroundColor: `${colors.error}12`,
            }}
            onPress={handleLogout}
            activeOpacity={0.7}
          >
            <Ionicons name="log-out-outline" size={18} color={colors.error} />
            <Text style={{ fontSize: 15, fontWeight: '600', color: colors.error, marginLeft: 8 }}>
              Logout
            </Text>
          </TouchableOpacity>
        </AnimatedScreenSection>

        {/* Version */}
        <AnimatedScreenSection index={4}>
          <View style={{ alignItems: 'center', paddingVertical: 20 }}>
            <Text style={{ fontSize: 12, color: colors.textTertiary }}>SEFA v1.0.0</Text>
          </View>
        </AnimatedScreenSection>
      </ScrollView>
    </SafeAreaView>
  );
}
