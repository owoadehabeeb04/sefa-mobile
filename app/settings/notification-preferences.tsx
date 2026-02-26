/**
 * Notification Preferences Screen
 */

import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/theme';
import { Input } from '@/components/common/Input';
import { Toast } from '@/components/common/Toast';
import {
  useNotificationPreferences,
  useUpdateNotificationPreferences,
} from '@/features/notifications/notificationPreferences.hooks';

const colors = Colors.light;

export default function NotificationPreferencesScreen() {
  const router = useRouter();
  const { data: prefs, isLoading } = useNotificationPreferences();
  const updatePreferences = useUpdateNotificationPreferences();

  const [pushEnabled, setPushEnabled] = useState(true);
  const [transactionAlerts, setTransactionAlerts] = useState(true);
  const [budgetWarnings, setBudgetWarnings] = useState(true);
  const [weeklyReports, setWeeklyReports] = useState(true);
  const [goalUpdates, setGoalUpdates] = useState(true);
  const [importNotifications, setImportNotifications] = useState(true);
  const [maxNotificationsPerDay, setMaxNotificationsPerDay] = useState('10');
  const [dailyDigestEnabled, setDailyDigestEnabled] = useState(false);
  const [dailyDigestTime, setDailyDigestTime] = useState('09:00');
  const [weeklySummaryEnabled, setWeeklySummaryEnabled] = useState(true);
  const [weeklySummaryDay, setWeeklySummaryDay] = useState('0');
  const [weeklySummaryTime, setWeeklySummaryTime] = useState('20:00');
  const [quietHoursEnabled, setQuietHoursEnabled] = useState(false);
  const [quietHoursStart, setQuietHoursStart] = useState('22:00');
  const [quietHoursEnd, setQuietHoursEnd] = useState('07:00');
  const [largeTransactionMinAmount, setLargeTransactionMinAmount] = useState('10000');
  const [budgetWarningThreshold, setBudgetWarningThreshold] = useState('80');

  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  useEffect(() => {
    if (!prefs) return;
    setPushEnabled(prefs.pushEnabled);
    setTransactionAlerts(prefs.transactionAlerts);
    setBudgetWarnings(prefs.budgetWarnings);
    setWeeklyReports(prefs.weeklyReports);
    setGoalUpdates(prefs.goalUpdates);
    setImportNotifications(prefs.importNotifications);
    setMaxNotificationsPerDay(String(prefs.maxNotificationsPerDay));
    setDailyDigestEnabled(prefs.dailyDigestEnabled);
    setDailyDigestTime(prefs.dailyDigestTime);
    setWeeklySummaryEnabled(prefs.weeklySummaryEnabled);
    setWeeklySummaryDay(String(prefs.weeklySummaryDay));
    setWeeklySummaryTime(prefs.weeklySummaryTime);
    setQuietHoursEnabled(prefs.quietHoursEnabled);
    setQuietHoursStart(prefs.quietHoursStart);
    setQuietHoursEnd(prefs.quietHoursEnd);
    setLargeTransactionMinAmount(String(prefs.largeTransactionMinAmount));
    setBudgetWarningThreshold(String(prefs.budgetWarningThreshold));
  }, [prefs]);

  const handleSave = async () => {
    try {
      await updatePreferences.mutateAsync({
        pushEnabled,
        transactionAlerts,
        budgetWarnings,
        weeklyReports,
        goalUpdates,
        importNotifications,
        maxNotificationsPerDay: Number(maxNotificationsPerDay) || 10,
        dailyDigestEnabled,
        dailyDigestTime,
        weeklySummaryEnabled,
        weeklySummaryDay: Number(weeklySummaryDay) || 0,
        weeklySummaryTime,
        quietHoursEnabled,
        quietHoursStart,
        quietHoursEnd,
        largeTransactionMinAmount: Number(largeTransactionMinAmount) || 0,
        budgetWarningThreshold: Number(budgetWarningThreshold) || 0,
      });
      setToastMessage('Notification preferences saved');
      setToastType('success');
      setShowToast(true);
    } catch (error: any) {
      setToastMessage(error?.message || 'Failed to save preferences');
      setToastType('error');
      setShowToast(true);
    }
  };

  const SettingSwitch = ({
    title,
    subtitle,
    value,
    onValueChange,
  }: {
    title: string;
    subtitle?: string;
    value: boolean;
    onValueChange: (value: boolean) => void;
  }) => (
    <View
      className="flex-row items-center py-4 px-4 rounded-xl mb-2"
      style={{ backgroundColor: colors.backgroundSecondary }}
    >
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
          Notification Preferences
        </Text>
        <TouchableOpacity onPress={handleSave} disabled={updatePreferences.isPending}>
          <Text
            className="text-base font-semibold"
            style={{ color: updatePreferences.isPending ? colors.textTertiary : colors.primary }}
          >
            {updatePreferences.isPending ? 'Saving...' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 20 }}>
        {isLoading && (
          <Text className="text-sm" style={{ color: colors.textSecondary }}>
            Loading preferences...
          </Text>
        )}

        <Text className="text-xs font-semibold mb-3" style={{ color: colors.textTertiary }}>
          GENERAL
        </Text>
        <SettingSwitch
          title="Enable Push Notifications"
          subtitle="Receive notifications on this device"
          value={pushEnabled}
          onValueChange={setPushEnabled}
        />

        <Text className="text-xs font-semibold mb-3 mt-6" style={{ color: colors.textTertiary }}>
          ALERT TYPES
        </Text>
        <SettingSwitch
          title="Transaction Alerts"
          subtitle="Get notified about new transactions"
          value={transactionAlerts}
          onValueChange={setTransactionAlerts}
        />
        <SettingSwitch
          title="Budget Warnings"
          subtitle="Alerts when you reach your budget limit"
          value={budgetWarnings}
          onValueChange={setBudgetWarnings}
        />
        <SettingSwitch
          title="Weekly Reports"
          subtitle="Receive weekly spending summaries"
          value={weeklyReports}
          onValueChange={setWeeklyReports}
        />
        <SettingSwitch
          title="Goal Updates"
          subtitle="Progress updates for your goals"
          value={goalUpdates}
          onValueChange={setGoalUpdates}
        />
        <SettingSwitch
          title="Import Notifications"
          subtitle="Notify when imports finish"
          value={importNotifications}
          onValueChange={setImportNotifications}
        />

        <Text className="text-xs font-semibold mb-3 mt-6" style={{ color: colors.textTertiary }}>
          FREQUENCY
        </Text>
        <Input
          label="Max notifications per day"
          value={maxNotificationsPerDay}
          onChangeText={setMaxNotificationsPerDay}
          keyboardType="numeric"
        />
        <SettingSwitch
          title="Daily Digest"
          subtitle="Send a summary every day"
          value={dailyDigestEnabled}
          onValueChange={setDailyDigestEnabled}
        />
        {dailyDigestEnabled && (
          <Input
            label="Daily digest time (HH:MM)"
            value={dailyDigestTime}
            onChangeText={setDailyDigestTime}
            placeholder="09:00"
          />
        )}

        <SettingSwitch
          title="Weekly Summary"
          subtitle="Weekly report day and time"
          value={weeklySummaryEnabled}
          onValueChange={setWeeklySummaryEnabled}
        />
        {weeklySummaryEnabled && (
          <>
            <Input
              label="Weekly summary day (0=Sun, 6=Sat)"
              value={weeklySummaryDay}
              onChangeText={setWeeklySummaryDay}
              keyboardType="numeric"
            />
            <Input
              label="Weekly summary time (HH:MM)"
              value={weeklySummaryTime}
              onChangeText={setWeeklySummaryTime}
              placeholder="20:00"
            />
          </>
        )}

        <Text className="text-xs font-semibold mb-3 mt-6" style={{ color: colors.textTertiary }}>
          QUIET HOURS
        </Text>
        <SettingSwitch
          title="Enable Quiet Hours"
          subtitle="Pause notifications during quiet hours"
          value={quietHoursEnabled}
          onValueChange={setQuietHoursEnabled}
        />
        {quietHoursEnabled && (
          <>
            <Input
              label="Quiet hours start (HH:MM)"
              value={quietHoursStart}
              onChangeText={setQuietHoursStart}
              placeholder="22:00"
            />
            <Input
              label="Quiet hours end (HH:MM)"
              value={quietHoursEnd}
              onChangeText={setQuietHoursEnd}
              placeholder="07:00"
            />
          </>
        )}

        <Text className="text-xs font-semibold mb-3 mt-6" style={{ color: colors.textTertiary }}>
          THRESHOLDS
        </Text>
        <Input
          label="Large transaction minimum (NGN)"
          value={largeTransactionMinAmount}
          onChangeText={setLargeTransactionMinAmount}
          keyboardType="numeric"
        />
        <Input
          label="Budget warning threshold (%)"
          value={budgetWarningThreshold}
          onChangeText={setBudgetWarningThreshold}
          keyboardType="numeric"
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
