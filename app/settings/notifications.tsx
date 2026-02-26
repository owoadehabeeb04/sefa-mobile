/**
 * Notifications Settings Screen
 */

import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import { Toast } from '@/components/common/Toast';
import { useAuthStore } from '@/store/auth.store';
import api from '@/services/api';
import { API_ENDPOINTS } from '@/config/api';

const colors = Colors.light;

export default function NotificationsSettingsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    user?.preferences?.notifications ?? true
  );
  const [expenseReminders, setExpenseReminders] = useState(true);
  const [budgetAlerts, setBudgetAlerts] = useState(true);
  const [weeklyReports, setWeeklyReports] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSavePreferences = async () => {
    setIsSaving(true);
    try {
      await api.put(API_ENDPOINTS.AUTH.PROFILE, {
        preferences: {
          notifications: notificationsEnabled,
        },
      });

      setToastMessage('Notification preferences saved');
      setShowToast(true);
    } catch (error: any) {
      setToastMessage(error?.message || 'Failed to save preferences');
      setShowToast(true);
    } finally {
      setIsSaving(false);
    }
  };

  const SettingItem = ({
    icon,
    title,
    subtitle,
    value,
    onValueChange,
  }: {
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
    subtitle?: string;
    value: boolean;
    onValueChange: (value: boolean) => void;
  }) => (
    <View
      className="flex-row items-center py-4 px-4 rounded-xl mb-2"
      style={{ backgroundColor: colors.backgroundSecondary }}
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
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: colors.border, true: colors.primary }}
        thumbColor="#FFFFFF"
      />
    </View>
  );

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
          Notifications
        </Text>
        <TouchableOpacity
          onPress={handleSavePreferences}
          disabled={isSaving}
          className="px-3 py-1"
        >
          <Text
            className="text-base font-semibold"
            style={{ color: isSaving ? colors.textTertiary : colors.primary }}
          >
            {isSaving ? 'Saving...' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 20 }}>
        <SettingItem
          icon="notifications-outline"
          title="Enable Notifications"
          subtitle="Receive app notifications"
          value={notificationsEnabled}
          onValueChange={setNotificationsEnabled}
        />

        {notificationsEnabled && (
          <>
            <SettingItem
              icon="time-outline"
              title="Expense Reminders"
              subtitle="Remind me to log expenses"
              value={expenseReminders}
              onValueChange={setExpenseReminders}
            />

            <SettingItem
              icon="warning-outline"
              title="Budget Alerts"
              subtitle="Alert when approaching budget limit"
              value={budgetAlerts}
              onValueChange={setBudgetAlerts}
            />

            <SettingItem
              icon="document-text-outline"
              title="Weekly Reports"
              subtitle="Receive weekly spending summaries"
              value={weeklyReports}
              onValueChange={setWeeklyReports}
            />
          </>
        )}
      </ScrollView>

      <Toast
        visible={showToast}
        message={toastMessage}
        onHide={() => setShowToast(false)}
        type="success"
      />
    </SafeAreaView>
  );
}
