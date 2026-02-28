import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  cancelConnectionSync,
  clearSyncTransactions,
  getConnectionSyncStatus,
  getSyncHistory,
  getSyncStats,
  retryFailedSyncs,
  type SyncHistoryQuery,
} from './sync.service';

export const useConnectionSyncStatus = (connectionId: string) => {
  return useQuery({
    queryKey: ['sync-status', connectionId],
    queryFn: () => getConnectionSyncStatus(connectionId),
    enabled: Boolean(connectionId),
    refetchInterval: 10000,
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
      queryClient.invalidateQueries({ queryKey: ['sync-history'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['bank-connections'] });
    },
  });
};
