/**
 * Clear Data Screen
 */

import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import { Toast } from '@/components/common/Toast';
import { useQueryClient } from '@tanstack/react-query';

const colors = Colors.light;

export default function ClearDataScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isClearing, setIsClearing] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  const clearAllData = async () => {
    setIsClearing(true);
    try {
      // Clear React Query cache (data is stored on server; this just clears local cache)
      queryClient.removeQueries({ queryKey: ['expenses'] });
      queryClient.removeQueries({ queryKey: ['income'] });
      queryClient.removeQueries({ queryKey: ['categories'] });
      queryClient.removeQueries({ queryKey: ['transactions'] });
      queryClient.removeQueries({ queryKey: ['dashboard'] });

      setToastMessage('Cache cleared. Data will reload from server when you refresh.');
      setToastType('success');
      setShowToast(true);

      setTimeout(() => {
        router.back();
      }, 1500);
    } catch (error: any) {
      console.error('Clear data error:', error);
      setToastMessage(error?.message || 'Failed to clear cache');
      setToastType('error');
      setShowToast(true);
    } finally {
      setIsClearing(false);
    }
  };

  const handleClearData = () => {
    Alert.alert(
      'Clear Cache',
      'This will clear the cached data on this device. Your data on the server is unchanged. The app will reload data from the server when you refresh or reopen screens.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All Data',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Clear cache?',
              'Cached data on this device will be cleared. Server data is not affected.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Yes, Delete Everything',
                  style: 'destructive',
                  onPress: clearAllData,
                },
              ]
            );
          },
        },
      ]
    );
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
          Clear Cache
        </Text>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 20 }}>
        <View
          className="p-5 rounded-2xl mb-6"
          style={{ backgroundColor: `${colors.error}15` }}
        >
          <View className="flex-row items-center mb-4">
            <Ionicons name="warning-outline" size={24} color={colors.error} />
            <Text className="text-base font-semibold ml-2 flex-1" style={{ color: colors.error }}>
              Clear local cache
            </Text>
          </View>
          <Text className="text-sm" style={{ color: colors.textSecondary }}>
            This clears cached data on this device only. Your data on the server is safe and will reload when you refresh.
          </Text>
        </View>

        <View
          className="p-5 rounded-2xl mb-6"
          style={{ backgroundColor: colors.backgroundSecondary }}
        >
          <Text className="text-base font-semibold mb-3" style={{ color: colors.text }}>
            What will be cleared:
          </Text>
          <View className="mb-2">
            <Text className="text-sm" style={{ color: colors.textSecondary }}>
              • Cached expenses
            </Text>
          </View>
          <View className="mb-2">
            <Text className="text-sm" style={{ color: colors.textSecondary }}>
              • Cached income entries
            </Text>
          </View>
          <View className="mb-2">
            <Text className="text-sm" style={{ color: colors.textSecondary }}>
              • Cached categories
            </Text>
          </View>
          <View>
            <Text className="text-sm" style={{ color: colors.textSecondary }}>
              • Cached dashboard data
            </Text>
          </View>
        </View>

        <View
          className="p-5 rounded-2xl mb-6"
          style={{ backgroundColor: colors.primaryBackground }}
        >
          <Text className="text-sm" style={{ color: colors.textSecondary }}>
             Tip: Export your data before clearing if you want to keep a backup.
          </Text>
        </View>

        <TouchableOpacity
          onPress={handleClearData}
          disabled={isClearing}
          className="rounded-xl px-6 py-3 items-center justify-center"
          style={{
            backgroundColor: colors.error,
            opacity: isClearing ? 0.5 : 1,
          }}
          activeOpacity={0.7}
        >
          {isClearing ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text className="text-base font-semibold" style={{ color: '#FFFFFF' }}>
              Clear Cache
            </Text>
          )}
        </TouchableOpacity>
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
