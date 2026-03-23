import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors } from '@/constants/theme';
import { Toast } from '@/components/common/Toast';
import {
  useCancelSync,
  useClearSyncTransactions,
  useConnectionSyncStatus,
  useSyncLogDetails,
} from '@/features/bank/sync.hooks';

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

const getStatusColor = (status?: string) => {
  if (status === 'completed') return colors.success;
  if (status === 'partial_success') return colors.warning;
  if (status === 'failed') return colors.error;
  if (status === 'queued' || status === 'syncing') return colors.primary;
  return colors.textTertiary;
};

export default function SyncDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string; kind?: string; connectionId?: string }>();

  const kind = params.kind === 'sync-log' ? 'sync-log' : 'connection';
  const routeId = params.id || '';
  const explicitConnectionId = params.connectionId || '';
  const connectionId = kind === 'connection' ? routeId : explicitConnectionId;

  const connectionStatus = useConnectionSyncStatus(connectionId);
  const selectedSyncLogId =
    kind === 'sync-log'
      ? routeId
      : connectionStatus.data?.data?.currentSyncLogId || connectionStatus.data?.data?.latestSync?.syncLogId || '';
  const syncLogDetails = useSyncLogDetails(selectedSyncLogId);
  const cancelSync = useCancelSync();
  const clearSyncTransactions = useClearSyncTransactions();

  const [showToast, setShowToast] = React.useState(false);
  const [toastMessage, setToastMessage] = React.useState('');
  const [toastType, setToastType] = React.useState<'success' | 'error'>('success');

  const connectionData = connectionStatus.data?.data;
  const syncLogData = syncLogDetails.data?.data;
  const activeSyncStatus = connectionData?.syncStatus;
  const isActivelySyncing = activeSyncStatus === 'queued' || activeSyncStatus === 'syncing';

  const resolvedConnectionId =
    connectionId ||
    (typeof syncLogData?.connectionId === 'string'
      ? syncLogData.connectionId
      : syncLogData?.connectionId?._id || '');

  const institutionLabel =
    connectionData?.institutionName ||
    (typeof syncLogData?.connectionId === 'object' ? syncLogData.connectionId?.institutionName : undefined) ||
    'Linked Bank Account';

  const handleRefresh = () => {
    if (resolvedConnectionId) {
      connectionStatus.refetch();
    }
    if (selectedSyncLogId) {
      syncLogDetails.refetch();
    }
  };

  const handleCancelSync = () => {
    if (!resolvedConnectionId) return;
    Alert.alert('Cancel Sync', 'Do you want to cancel the active sync?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes',
        style: 'destructive',
        onPress: async () => {
          try {
            await cancelSync.mutateAsync(resolvedConnectionId);
            setToastType('success');
            setToastMessage('Sync cancellation requested');
            setShowToast(true);
            handleRefresh();
          } catch (error: any) {
            setToastType('error');
            setToastMessage(error?.message || 'Failed to cancel sync');
            setShowToast(true);
          }
        },
      },
    ]);
  };

  const handleClearSyncTransactions = () => {
    if (!selectedSyncLogId) return;

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
              const result = await clearSyncTransactions.mutateAsync(selectedSyncLogId);
              setToastType('success');
              setToastMessage(
                result?.data?.totalDeleted
                  ? `Cleared ${result.data.totalDeleted} transaction(s) from this sync`
                  : 'Sync transactions cleared successfully',
              );
              setShowToast(true);
              handleRefresh();
            } catch (error: any) {
              setToastType('error');
              setToastMessage(error?.message || 'Failed to clear sync transactions');
              setShowToast(true);
            }
          },
        },
      ],
    );
  };

  const syncStatusColor = getStatusColor(syncLogData?.status || activeSyncStatus);

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
          onPress={handleRefresh}
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
                {activeSyncStatus === 'queued' ? 'Sync queued' : 'Sync in progress'}
              </Text>
              <Text className="text-xs mt-1" style={{ color: colors.textSecondary }}>
                You can leave this page. The app will refresh while the sync is active.
              </Text>
            </View>
          </View>
        )}

        <View className="p-5 rounded-2xl mb-4" style={{ backgroundColor: colors.backgroundSecondary }}>
          <Text className="text-base font-semibold" style={{ color: colors.text }}>
            {institutionLabel}
          </Text>
          <View className="flex-row items-center mt-2">
            <View className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: syncStatusColor }} />
            <Text className="text-xs" style={{ color: colors.textTertiary }}>
              Connection Status: {connectionData?.syncStatus || syncLogData?.status || 'unknown'}
            </Text>
          </View>
          <Text className="text-xs mt-1" style={{ color: colors.textTertiary }}>
            Last Sync Attempt: {formatDateTime(connectionData?.lastSyncAt)}
          </Text>
          <Text className="text-xs mt-1" style={{ color: colors.textTertiary }}>
            Last Successful Sync: {formatDateTime(connectionData?.lastSuccessfulSyncAt)}
          </Text>
          <Text className="text-xs mt-1" style={{ color: colors.textTertiary }}>
            Next Sync: {formatDateTime(connectionData?.nextSyncAt)}
          </Text>
          {connectionData?.lastErrorSummary && (
            <Text className="text-xs mt-2" style={{ color: colors.error }}>
              Last Issue: {connectionData.lastErrorSummary}
            </Text>
          )}
        </View>

        <View className="p-5 rounded-2xl mb-4" style={{ backgroundColor: colors.primaryBackground }}>
          <Text className="text-sm font-semibold" style={{ color: colors.text }}>
            Sync Run
          </Text>
          <Text className="text-xs mt-2" style={{ color: colors.textSecondary }}>
            Sync Log ID: {selectedSyncLogId || 'Waiting for first sync'}
          </Text>
          <Text className="text-xs mt-1" style={{ color: colors.textSecondary }}>
            Trigger: {syncLogData?.triggerSource || syncLogData?.syncType || connectionData?.latestSync?.syncType || 'unknown'}
          </Text>
          <Text className="text-xs mt-1" style={{ color: colors.textSecondary }}>
            Status: {syncLogData?.status || connectionData?.latestSync?.status || connectionData?.syncStatus || 'unknown'}
          </Text>
          <Text className="text-xs mt-1" style={{ color: colors.textSecondary }}>
            Phase: {syncLogData?.phase || connectionData?.phase || connectionData?.latestSync?.phase || 'N/A'}
          </Text>
          <Text className="text-xs mt-1" style={{ color: colors.textSecondary }}>
            Started: {formatDateTime(syncLogData?.startedAt || connectionData?.startedAt)}
          </Text>
          <Text className="text-xs mt-1" style={{ color: colors.textSecondary }}>
            Completed: {formatDateTime(syncLogData?.completedAt || connectionData?.finishedAt)}
          </Text>
          <Text className="text-xs mt-3" style={{ color: colors.textSecondary }}>
            Imported: {syncLogData?.results?.importedCount ?? connectionData?.importedCount ?? 0}
          </Text>
          <Text className="text-xs mt-1" style={{ color: colors.textSecondary }}>
            Duplicates: {syncLogData?.results?.duplicateCount ?? connectionData?.duplicateCount ?? 0}
          </Text>
          <Text className="text-xs mt-1" style={{ color: colors.textSecondary }}>
            Skipped: {syncLogData?.results?.skippedCount ?? connectionData?.skippedCount ?? 0}
          </Text>
          <Text className="text-xs mt-1" style={{ color: colors.textSecondary }}>
            Failed: {syncLogData?.results?.failedCount ?? connectionData?.failedCount ?? 0}
          </Text>
          <Text className="text-xs mt-1" style={{ color: colors.textSecondary }}>
            Fetched: {syncLogData?.results?.totalFetched ?? connectionData?.fetchedCount ?? 0}
          </Text>

          {syncLogData?.error?.message && (
            <Text className="text-xs mt-2" style={{ color: colors.error }}>
              Error: {syncLogData.error.message}
            </Text>
          )}

          {(syncLogData?.errorList || []).slice(0, 3).map((item, index) => (
            <Text
              key={`${item.externalId || 'error'}-${index}`}
              className="text-xs mt-1"
              style={{ color: colors.error }}
            >
              {item.stage ? `${item.stage}: ` : ''}
              {item.message}
            </Text>
          ))}

          {/* {!!selectedSyncLogId && (
            <TouchableOpacity
              onPress={handleClearSyncTransactions}
              disabled={clearSyncTransactions.isPending}
              className="mt-4 px-4 py-2 rounded-xl items-center"
              style={{ backgroundColor: `${colors.error}20` }}
            >
              <Text className="text-xs font-semibold" style={{ color: colors.error }}>
                {clearSyncTransactions.isPending ? 'Clearing...' : 'Clear Transactions From This Sync'}
              </Text>
            </TouchableOpacity>
          )} */}
        </View>

        {isActivelySyncing && !!resolvedConnectionId && (
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
