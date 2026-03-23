export type BankSyncStatus =
  | 'active'
  | 'queued'
  | 'syncing'
  | 'completed'
  | 'partial_success'
  | 'failed'
  | 'cancelled'
  | 'paused'
  | 'error'
  | 'disconnected'
  | 'reauth_required';

export interface BankConnection {
  id: string;
  institutionName: string;
  institutionCode?: string;
  accountName?: string;
  accountNumber?: string;
  maskedAccountNumber?: string;
  accountType?: 'savings' | 'current' | 'domiciliary' | 'other';
  currency?: string;
  balance?: number;
  autoSync?: boolean;
  syncStatus?: BankSyncStatus;
  currentSyncLogId?: string;
  lastSyncAt?: string;
  lastSuccessfulSyncAt?: string;
  nextSyncAt?: string;
  lastSyncErrorSummary?: string;
  pendingResync?: boolean;
  syncFrequency?: number;
  isPrimary?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface BankConnectionsResponse {
  success: boolean;
  data: BankConnection[] | { connections: BankConnection[] };
  count?: number;
  message?: string;
}

export interface BankConnectionResponse {
  success: boolean;
  data: BankConnection;
  message?: string;
}

export interface SyncJobResponse {
  success: boolean;
  data?: {
    connectionId?: string;
    syncLogId?: string;
    status?: 'queued' | 'syncing';
  };
  message?: string;
}
