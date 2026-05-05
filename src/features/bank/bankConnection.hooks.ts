/**
 * Bank Connection Hooks
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  connectBankAccount,
  disconnectBankConnection,
  getBankConnectionSecurity,
  getBankConnections,
  syncBankConnection,
  updateSyncSettings,
} from './bankConnection.service';
import type { BankConnection, BankConnectionSecuritySummary } from './bankConnection.types';

export const BANK_CONNECTIONS_QUERY_KEY = ['bank-connections'];
export const bankConnectionSecurityQueryKey = (connectionId: string) => ['bank-connection-security', connectionId];
export const isConnectionSyncActive = (connection?: Pick<BankConnection, 'syncStatus'> | null) =>
  connection?.syncStatus === 'queued' || connection?.syncStatus === 'syncing';

export const useBankConnections = () => {
  return useQuery({
    queryKey: BANK_CONNECTIONS_QUERY_KEY,
    queryFn: getBankConnections,
    staleTime: 60 * 1000,
    refetchInterval: (query) => {
      const connections = query.state.data ?? [];
      const hasActiveSync = connections.some((connection) => isConnectionSyncActive(connection));
      return hasActiveSync ? 5000 : false;
    },
  });
};

export const useBankConnectionSecurity = (connectionId?: string) => {
  return useQuery<BankConnectionSecuritySummary>({
    queryKey: bankConnectionSecurityQueryKey(connectionId || ''),
    queryFn: () => getBankConnectionSecurity(connectionId || ''),
    enabled: Boolean(connectionId),
    staleTime: 30 * 1000,
  });
};

export const useConnectBank = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (code: string) => connectBankAccount(code),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BANK_CONNECTIONS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['sync-history'] });
      queryClient.invalidateQueries({ queryKey: ['bank-connection-security'] });
    },
  });
};

export const useSyncConnection = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (connectionId: string) => syncBankConnection(connectionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BANK_CONNECTIONS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['sync-history'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['bank-connection-security'] });
    },
  });
};

export const useDisconnectBank = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (connectionId: string) => disconnectBankConnection(connectionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BANK_CONNECTIONS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['bank-connection-security'] });
    },
  });
};

export const useUpdateConnectionSettings = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ connectionId, autoSync }: { connectionId: string; autoSync: boolean }) =>
      updateSyncSettings(connectionId, { autoSync }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BANK_CONNECTIONS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['bank-connection-security'] });
    },
  });
};
