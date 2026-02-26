/**
 * Bank Connection Hooks
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  connectBankAccount,
  disconnectBankConnection,
  getBankConnections,
  syncBankConnection,
  updateSyncSettings,
} from './bankConnection.service';

export const BANK_CONNECTIONS_QUERY_KEY = ['bank-connections'];

export const useBankConnections = () => {
  return useQuery({
    queryKey: BANK_CONNECTIONS_QUERY_KEY,
    queryFn: getBankConnections,
    staleTime: 60 * 1000,
  });
};

export const useConnectBank = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (code: string) => connectBankAccount(code),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BANK_CONNECTIONS_QUERY_KEY });
    },
  });
};

export const useSyncConnection = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (connectionId: string) => syncBankConnection(connectionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BANK_CONNECTIONS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
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
    },
  });
};
