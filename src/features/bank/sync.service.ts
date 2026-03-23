import api from '@/services/api';
import { API_ENDPOINTS } from '@/config/api';

export interface SyncHistoryQuery {
  page?: number;
  limit?: number;
  status?: string;
  connectionId?: string;
}

export interface SyncResultsSummary {
  totalFetched?: number;
  importedCount?: number;
  duplicateCount?: number;
  skippedCount?: number;
  failedCount?: number;
  transferCount?: number;
}

export interface SyncHistoryItem {
  _id: string;
  syncLogId?: string;
  syncType?: string;
  triggerSource?: string;
  connectionId?: {
    _id?: string;
    institutionName?: string;
    accountNumber?: string;
  } | string;
  status?: string;
  phase?: string;
  startedAt?: string;
  completedAt?: string;
  duration?: number;
  results?: SyncResultsSummary;
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
    currentSyncLogId?: string | null;
    institutionName?: string;
    syncStatus?: string;
    phase?: string;
    cancelRequested?: boolean;
    lastSyncAt?: string;
    lastSuccessfulSyncAt?: string;
    nextSyncAt?: string;
    autoSync?: boolean;
    syncInterval?: number;
    errorMessage?: string;
    lastErrorSummary?: string;
    fetchedCount?: number;
    importedCount?: number;
    duplicateCount?: number;
    skippedCount?: number;
    failedCount?: number;
    startedAt?: string;
    finishedAt?: string;
    latestSync?: {
      syncLogId?: string;
      status?: string;
      phase?: string;
      startedAt?: string;
      completedAt?: string;
      duration?: number;
      cancelRequested?: boolean;
      results?: SyncResultsSummary;
      error?: {
        message?: string;
      };
      errorList?: {
        externalId?: string;
        stage?: string;
        message?: string;
      }[];
      syncType?: string;
    } | null;
  };
}

export interface SyncLogDetailResponse {
  success: boolean;
  data: {
    _id: string;
    syncLogId?: string;
    syncType?: string;
    triggerSource?: string;
    status?: string;
    phase?: string;
    startedAt?: string;
    completedAt?: string;
    duration?: number;
    cancelRequested?: boolean;
    connectionId?: {
      _id?: string;
      institutionName?: string;
      accountNumber?: string;
      syncStatus?: string;
      lastSyncAt?: string;
      lastSuccessfulSyncAt?: string;
    } | string;
    results?: SyncResultsSummary;
    error?: {
      message?: string;
    };
      errorList?: {
        externalId?: string;
        stage?: string;
        message?: string;
      }[];
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
    byConnection: {
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
    }[];
  };
}

export const getConnectionSyncStatus = async (connectionId: string): Promise<ConnectionSyncStatusResponse> => {
  const response = await api.get<ConnectionSyncStatusResponse>(
    `${API_ENDPOINTS.SYNC.CONNECTION_STATUS}/${connectionId}/status`
  );
  return response.data;
};

export const getSyncLogDetails = async (syncLogId: string): Promise<SyncLogDetailResponse> => {
  const response = await api.get<SyncLogDetailResponse>(
    `${API_ENDPOINTS.SYNC.LOGS}/${syncLogId}`
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
