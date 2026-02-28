import api from '@/services/api';
import { API_ENDPOINTS } from '@/config/api';

export interface SyncHistoryQuery {
  page?: number;
  limit?: number;
  status?: string;
  connectionId?: string;
}

export interface SyncHistoryItem {
  _id: string;
  connectionId?: {
    _id?: string;
    institutionName?: string;
    accountNumber?: string;
  } | string;
  status?: string;
  startedAt?: string;
  completedAt?: string;
  duration?: number;
  results?: {
    totalFetched?: number;
    newTransactions?: number;
    duplicates?: number;
    transfers?: number;
  };
  error?: {
    message?: string;
  };
}

export interface SyncHistoryResponse {
  success: boolean;
  data: SyncHistoryItem[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface ConnectionSyncStatusResponse {
  success: boolean;
  data: {
    connectionId: string;
    institutionName?: string;
    syncStatus?: string;
    lastSyncAt?: string;
    nextSyncAt?: string;
    autoSync?: boolean;
    syncInterval?: number;
    errorMessage?: string;
    latestSync?: {
      syncLogId?: string;
      status?: string;
      startedAt?: string;
      completedAt?: string;
      duration?: number;
      results?: {
        totalFetched?: number;
        newTransactions?: number;
        duplicates?: number;
        transfers?: number;
      };
      error?: {
        message?: string;
      };
    } | null;
  };
}

export interface SyncStatsResponse {
  success: boolean;
  data: {
    overall: {
      totalSyncs: number;
      successful: number;
      failed: number;
      successRate: string | number;
      totalTransactions: number;
    };
    byConnection: Array<{
      connectionId?: string;
      institutionName?: string;
      accountNumber?: string;
      totalSyncs?: number;
      successful?: number;
      failed?: number;
      successRate?: string | number;
      transactions?: {
        total?: number;
      };
    }>;
  };
}

export const getConnectionSyncStatus = async (connectionId: string): Promise<ConnectionSyncStatusResponse> => {
  const response = await api.get<ConnectionSyncStatusResponse>(
    `${API_ENDPOINTS.SYNC.CONNECTION_STATUS}/${connectionId}/status`
  );
  return response.data;
};

export const cancelConnectionSync = async (connectionId: string): Promise<{ success: boolean; message?: string }> => {
  const response = await api.post<{ success: boolean; message?: string }>(
    `${API_ENDPOINTS.SYNC.CONNECTION_CANCEL}/${connectionId}/cancel`
  );
  return response.data;
};

export const getSyncHistory = async (query: SyncHistoryQuery = {}): Promise<SyncHistoryResponse> => {
  const response = await api.get<SyncHistoryResponse>(API_ENDPOINTS.SYNC.HISTORY, {
    params: query,
  });
  return response.data;
};

export const getSyncStats = async (days: number = 30): Promise<SyncStatsResponse> => {
  const response = await api.get<SyncStatsResponse>(API_ENDPOINTS.SYNC.STATS, {
    params: { days },
  });
  return response.data;
};

export const retryFailedSyncs = async (): Promise<{ success: boolean; message?: string }> => {
  const response = await api.post<{ success: boolean; message?: string }>(API_ENDPOINTS.SYNC.RETRY);
  return response.data;
};

export const clearSyncTransactions = async (
  syncLogId: string
): Promise<{ success: boolean; message?: string; data?: { totalDeleted?: number } }> => {
  const response = await api.delete<{ success: boolean; message?: string; data?: { totalDeleted?: number } }>(
    `${API_ENDPOINTS.SYNC.HISTORY}/${syncLogId}/transactions`
  );
  return response.data;
};
