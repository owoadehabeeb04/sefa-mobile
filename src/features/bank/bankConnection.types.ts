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
  accessMode?: 'read_only';
  allowedOperations?: string[];
  forbiddenOperations?: string[];
  permissionSummary?: string;
  securityVerifiedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface BankConnectionSecurityEvent {
  id: string;
  eventType: string;
  actorType: 'user' | 'system' | 'webhook';
  timestamp: string;
  chainIndex: number;
  requestMeta?: {
    ipAddress?: string;
    userAgent?: string;
  };
  metadata?: Record<string, unknown>;
}

export interface BankConnectionSecuritySummary {
  connectionId: string;
  institutionName: string;
  accountName?: string;
  accountNumber?: string;
  provider?: string;
  accessMode: 'read_only';
  allowedOperations: string[];
  forbiddenOperations: string[];
  permissionSummary: string;
  securityVerifiedAt?: string;
  lastSyncAt?: string | null;
  lastSuccessfulSyncAt?: string | null;
  credentialHandling: {
    rawBankCredentialsCollected: boolean;
    providerHostedAuthentication: boolean;
    encryptedTokenStorage: boolean;
  };
  webhookSecurity: {
    type: string;
    enabled: boolean;
  };
  audit: {
    chainValid: boolean;
    checkedEntries: number;
    checkedAt?: string;
  };
  recentEvents: BankConnectionSecurityEvent[];
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

export interface BankConnectionSecurityResponse {
  success: boolean;
  data: BankConnectionSecuritySummary;
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
