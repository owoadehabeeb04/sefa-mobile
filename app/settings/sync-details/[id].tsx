import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors } from '@/constants/theme';
import { Toast } from '@/components/common/Toast';
import { useCancelSync, useClearSyncTransactions, useConnectionSyncStatus } from '@/features/bank/sync.hooks';

const colors = Colors.light;

const formatDateTime = (value?: string) => {
  if (!value) return 'N/A';
  const date = new Date(value);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

export default function SyncDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const syncStatus = useConnectionSyncStatus(id || '');
  const cancelSync = useCancelSync();
  const clearSyncTransactions = useClearSyncTransactions();

  const [showToast, setShowToast] = React.useState(false);
  const [toastMessage, setToastMessage] = React.useState('');
  const [toastType, setToastType] = React.useState<'success' | 'error'>('success');

  const data = syncStatus.data?.data;
  const latestSync = data?.latestSync;
  const isActivelySyncing = data?.syncStatus === 'syncing';
  const latestSyncStatusLabel = latestSync?.status || (isActivelySyncing ? 'processing' : 'N/A');
  const institutionLabel =
    data?.institutionName && data.institutionName !== 'Unknown Bank'
      ? data.institutionName
      : 'Linked Bank Account';

  const handleCancelSync = () => {
    if (!id) return;
    Alert.alert('Cancel Sync', 'Do you want to cancel the ongoing sync?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes',
        style: 'destructive',
        onPress: async () => {
          try {
            await cancelSync.mutateAsync(id);
            setToastType('success');
            setToastMessage('Sync cancelled successfully');
            setShowToast(true);
            syncStatus.refetch();
          } catch (error: any) {
            setToastType('error');
            setToastMessage(error?.message || 'Failed to cancel sync');
            setShowToast(true);
          }
        },
      },
    ]);
  };

  const handleClearLatestSyncTransactions = () => {
    const syncLogId = latestSync?.syncLogId;
    if (!syncLogId) return;

    Alert.alert(
      'Clear Sync Transactions',
      'This will remove transactions imported by this sync from your database. Continue?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await clearSyncTransactions.mutateAsync(syncLogId);
              setToastType('success');
              setToastMessage(
                result?.data?.totalDeleted
                  ? `Cleared ${result.data.totalDeleted} transaction(s) from this sync`
                  : 'Sync transactions cleared successfully'
              );
              setShowToast(true);
              syncStatus.refetch();
            } catch (error: any) {
              setToastType('error');
              setToastMessage(error?.message || 'Failed to clear sync transactions');
              setShowToast(true);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View
        className="flex-row items-center px-5 py-4 border-b"
        style={{ borderBottomColor: colors.border }}
      >
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text className="text-xl font-bold flex-1" style={{ color: colors.text }}>
          Sync Details
        </Text>
        <TouchableOpacity
          onPress={() => syncStatus.refetch()}
          className="px-3 py-1 rounded-full"
          style={{ backgroundColor: colors.backgroundSecondary }}
        >
          <Text className="text-xs font-semibold" style={{ color: colors.textSecondary }}>
            Refresh
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 20, paddingBottom: 30 }}>
        {isActivelySyncing && (
          <View
            className="p-4 rounded-2xl mb-4 flex-row items-center"
            style={{ backgroundColor: colors.primaryBackground }}
          >
            <ActivityIndicator size="small" color={colors.primary} style={{ marginRight: 10 }} />
            <View className="flex-1">
              <Text className="text-sm font-semibold" style={{ color: colors.text }}>
                Sync in progress
              </Text>
              <Text className="text-xs mt-1" style={{ color: colors.textSecondary }}>
                You can leave this page. Sync continues in the background.
              </Text>
            </View>
          </View>
        )}

        <View className="p-5 rounded-2xl mb-4" style={{ backgroundColor: colors.backgroundSecondary }}>
          <Text className="text-base font-semibold" style={{ color: colors.text }}>
            {institutionLabel}
          </Text>
          <Text className="text-xs mt-2" style={{ color: colors.textTertiary }}>
            Status: {data?.syncStatus || 'unknown'}
          </Text>
          <Text className="text-xs mt-1" style={{ color: colors.textTertiary }}>
            Last Sync: {data?.lastSyncAt ? formatDateTime(data.lastSyncAt) : 'Pending first successful sync'}
          </Text>
          <Text className="text-xs mt-1" style={{ color: colors.textTertiary }}>
            Next Sync: {formatDateTime(data?.nextSyncAt)}
          </Text>
          {data?.errorMessage && (
            <Text className="text-xs mt-2" style={{ color: colors.error }}>
              Error: {data.errorMessage}
            </Text>
          )}
        </View>

        <View className="p-5 rounded-2xl mb-4" style={{ backgroundColor: colors.primaryBackground }}>
          <Text className="text-sm font-semibold" style={{ color: colors.text }}>
            Latest Sync
          </Text>
          <Text className="text-xs mt-2" style={{ color: colors.textSecondary }}>
            Status: {latestSyncStatusLabel}
          </Text>
          <Text className="text-xs mt-1" style={{ color: colors.textSecondary }}>
            Started: {formatDateTime(latestSync?.startedAt)}
          </Text>
          <Text className="text-xs mt-1" style={{ color: colors.textSecondary }}>
            Completed: {formatDateTime(latestSync?.completedAt)}
          </Text>
          <Text className="text-xs mt-1" style={{ color: colors.textSecondary }}>
            New Transactions: {latestSync?.results?.newTransactions ?? 0}
          </Text>
          <Text className="text-xs mt-1" style={{ color: colors.textSecondary }}>
            Duplicates: {latestSync?.results?.duplicates ?? 0}
          </Text>
          <Text className="text-xs mt-1" style={{ color: colors.textSecondary }}>
            Transfers: {latestSync?.results?.transfers ?? 0}
          </Text>
          {latestSync?.error?.message && (
            <Text className="text-xs mt-2" style={{ color: colors.error }}>
              Error: {latestSync.error.message}
            </Text>
          )}

          {!!latestSync?.syncLogId && (
            <TouchableOpacity
              onPress={handleClearLatestSyncTransactions}
              disabled={clearSyncTransactions.isPending}
              className="mt-4 px-4 py-2 rounded-xl items-center"
              style={{ backgroundColor: `${colors.error}20` }}
            >
              <Text className="text-xs font-semibold" style={{ color: colors.error }}>
                {clearSyncTransactions.isPending ? 'Clearing...' : 'Clear Transactions From This Sync'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {data?.syncStatus === 'syncing' && (
          <TouchableOpacity
            onPress={handleCancelSync}
            className="px-4 py-3 rounded-xl items-center"
            style={{ backgroundColor: `${colors.error}20` }}
          >
            <Text className="text-sm font-semibold" style={{ color: colors.error }}>
              {cancelSync.isPending ? 'Cancelling...' : 'Cancel Sync'}
            </Text>
          </TouchableOpacity>
        )}
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
