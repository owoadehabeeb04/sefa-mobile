import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/theme';
import { useRetryFailedSyncs, useSyncHistory, useSyncStats } from '@/features/bank/sync.hooks';

const colors = Colors.light;

const formatDateTime = (value?: string) => {
  if (!value) return 'N/A';
  const date = new Date(value);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

const getConnectionLabel = (item: any) => {
  const connection = item?.connectionId;
  if (typeof connection === 'string') return 'Bank Connection';
  if (!connection) return 'Bank Connection';
  return connection.institutionName || 'Bank Connection';
};

const getConnectionId = (item: any) => {
  const connection = item?.connectionId;
  if (typeof connection === 'string') return connection;
  return connection?._id;
};

export default function SyncHistoryScreen() {
  const router = useRouter();
  const syncHistory = useSyncHistory({ page: 1, limit: 20 });
  const syncStats = useSyncStats(30);
  const retryFailed = useRetryFailedSyncs();

  const historyItems = syncHistory.data?.data || [];
  const stats = syncStats.data?.data;

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
          Sync Activity
        </Text>
        <TouchableOpacity
          onPress={() => retryFailed.mutate()}
          disabled={retryFailed.isPending}
          className="px-3 py-1 rounded-full"
          style={{ backgroundColor: colors.backgroundSecondary }}
        >
          <Text className="text-xs font-semibold" style={{ color: colors.textSecondary }}>
            {retryFailed.isPending ? 'Retrying...' : 'Retry'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 20, paddingBottom: 30 }}
        refreshControl={
          <RefreshControl
            refreshing={syncHistory.isRefetching || syncStats.isRefetching}
            onRefresh={() => {
              syncHistory.refetch();
              syncStats.refetch();
            }}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        <View className="flex-row mb-4">
          <View className="flex-1 p-4 rounded-2xl mr-2" style={{ backgroundColor: colors.primaryBackground }}>
            <Text className="text-xs" style={{ color: colors.textSecondary }}>Success Rate</Text>
            <Text className="text-xl font-bold mt-1" style={{ color: colors.text }}>
              {stats?.overall?.successRate ?? '0'}%
            </Text>
          </View>
          <View className="flex-1 p-4 rounded-2xl ml-2" style={{ backgroundColor: colors.backgroundSecondary }}>
            <Text className="text-xs" style={{ color: colors.textSecondary }}>Total Syncs</Text>
            <Text className="text-xl font-bold mt-1" style={{ color: colors.text }}>
              {stats?.overall?.totalSyncs ?? 0}
            </Text>
          </View>
        </View>

        {historyItems.length === 0 && (
          <View className="items-center py-10">
            <Ionicons name="time-outline" size={32} color={colors.textTertiary} />
            <Text className="text-base font-semibold mt-3" style={{ color: colors.text }}>
              No sync history yet
            </Text>
            <Text className="text-sm mt-1" style={{ color: colors.textSecondary }}>
              Start a manual sync from bank connections.
            </Text>
          </View>
        )}

        {historyItems.map((item: any) => {
          const connectionId = getConnectionId(item);
          const statusColor = item.status === 'completed'
            ? colors.success
            : item.status === 'failed'
              ? colors.error
              : colors.warning;

          return (
            <TouchableOpacity
              key={item._id}
              className="p-4 rounded-2xl mb-3"
              style={{ backgroundColor: colors.backgroundSecondary }}
              onPress={() => connectionId && router.push(`/settings/sync-details/${connectionId}`)}
              disabled={!connectionId}
            >
              <View className="flex-row items-center justify-between">
                <Text className="text-base font-semibold" style={{ color: colors.text }}>
                  {getConnectionLabel(item)}
                </Text>
                <View className="flex-row items-center">
                  <View className="w-2 h-2 rounded-full mr-1" style={{ backgroundColor: statusColor }} />
                  <Text className="text-xs" style={{ color: colors.textTertiary }}>
                    {item.status || 'unknown'}
                  </Text>
                </View>
              </View>
              <Text className="text-xs mt-1" style={{ color: colors.textTertiary }}>
                {formatDateTime(item.startedAt)}
              </Text>
              <View className="flex-row items-center justify-between mt-2">
                <Text className="text-xs" style={{ color: colors.textSecondary }}>
                  New: {item.results?.newTransactions ?? 0}
                </Text>
                <Text className="text-xs" style={{ color: colors.textSecondary }}>
                  Duplicates: {item.results?.duplicates ?? 0}
                </Text>
                <Text className="text-xs" style={{ color: colors.textSecondary }}>
                  Transfers: {item.results?.transfers ?? 0}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}
