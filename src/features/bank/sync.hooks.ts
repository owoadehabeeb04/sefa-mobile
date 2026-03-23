import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  cancelConnectionSync,
  clearSyncTransactions,
  getConnectionSyncStatus,
  getSyncLogDetails,
  getSyncHistory,
  getSyncStats,
  retryFailedSyncs,
  type ConnectionSyncStatusResponse,
  type SyncHistoryQuery,
  type SyncLogDetailResponse,
} from './sync.service';

const getStatusRefetchInterval = (
  payload?: ConnectionSyncStatusResponse['data'] | SyncLogDetailResponse['data']
) => {
  const status =
    payload && 'status' in payload
      ? payload.status
      : payload && 'syncStatus' in payload
        ? payload.syncStatus
        : undefined;
  return status === 'queued' || status === 'syncing' ? 5000 : false;
};

export const useConnectionSyncStatus = (connectionId: string) => {
  return useQuery({
    queryKey: ['sync-status', connectionId],
    queryFn: () => getConnectionSyncStatus(connectionId),
    enabled: Boolean(connectionId),
    refetchInterval: (query) => getStatusRefetchInterval(query.state.data?.data),
  });
};

export const useSyncLogDetails = (syncLogId: string) => {
  return useQuery({
    queryKey: ['sync-log', syncLogId],
    queryFn: () => getSyncLogDetails(syncLogId),
    enabled: Boolean(syncLogId),
    refetchInterval: (query) => getStatusRefetchInterval(query.state.data?.data),
  });
};

export const useSyncHistory = (query: SyncHistoryQuery = {}) => {
  return useQuery({
    queryKey: ['sync-history', query],
    queryFn: () => getSyncHistory(query),
  });
};

export const useSyncStats = (days: number = 30) => {
  return useQuery({
    queryKey: ['sync-stats', days],
    queryFn: () => getSyncStats(days),
  });
};

export const useCancelSync = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (connectionId: string) => cancelConnectionSync(connectionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sync-status'] });
      queryClient.invalidateQueries({ queryKey: ['sync-log'] });
      queryClient.invalidateQueries({ queryKey: ['sync-history'] });
      queryClient.invalidateQueries({ queryKey: ['bank-connections'] });
    },
  });
};

export const useRetryFailedSyncs = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: retryFailedSyncs,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sync-history'] });
      queryClient.invalidateQueries({ queryKey: ['sync-stats'] });
      queryClient.invalidateQueries({ queryKey: ['bank-connections'] });
    },
  });
};

export const useClearSyncTransactions = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (syncLogId: string) => clearSyncTransactions(syncLogId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sync-status'] });
      queryClient.invalidateQueries({ queryKey: ['sync-log'] });
      queryClient.invalidateQueries({ queryKey: ['sync-history'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['bank-connections'] });
    },
  });
};
