export type BankSyncStatus = 'active' | 'syncing' | 'paused' | 'error' | 'disconnected' | 'reauth_required';

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
  lastSyncAt?: string;
  nextSyncAt?: string;
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
    jobId?: string;
    status?: string;
  };
  message?: string;
}
