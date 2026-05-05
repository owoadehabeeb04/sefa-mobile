/**
 * Bank Connection Service
 * API-only: all operations go through the backend
 */

import api from '@/services/api';
import { API_ENDPOINTS } from '@/config/api';
import type {
  BankConnection,
  BankConnectionResponse,
  BankConnectionsResponse,
  BankConnectionSecurityResponse,
  BankConnectionSecuritySummary,
  SyncJobResponse,
} from './bankConnection.types';

const mapBankConnectionFromApi = (c: any): BankConnection => ({
  id: c._id ?? c.id ?? c.connectionId,
  institutionName: c.institutionName ?? 'Unknown Bank',
  institutionCode: c.institutionCode,
  accountName: c.accountName,
  accountNumber: c.accountNumber,
  maskedAccountNumber: c.maskedAccountNumber,
  accountType: c.accountType,
  currency: c.currency ?? 'NGN',
  balance: c.balance ?? 0,
  autoSync: c.autoSync ?? true,
  syncStatus: c.syncStatus,
  currentSyncLogId: c.currentSyncLogId,
  lastSyncAt: c.lastSyncAt,
  lastSuccessfulSyncAt: c.lastSuccessfulSyncAt,
  nextSyncAt: c.nextSyncAt,
  lastSyncErrorSummary: c.lastSyncErrorSummary,
  pendingResync: c.pendingResync ?? false,
  syncFrequency: c.syncFrequency,
  isPrimary: c.isPrimary,
  accessMode: c.accessMode ?? 'read_only',
  allowedOperations: Array.isArray(c.allowedOperations) ? c.allowedOperations : [],
  forbiddenOperations: Array.isArray(c.forbiddenOperations) ? c.forbiddenOperations : [],
  permissionSummary: c.permissionSummary ?? 'Account details and transaction history only',
  securityVerifiedAt: c.securityVerifiedAt,
  createdAt: c.createdAt,
  updatedAt: c.updatedAt,
});

const mapBankConnectionSecurityFromApi = (payload: any): BankConnectionSecuritySummary => ({
  connectionId: payload.connectionId,
  institutionName: payload.institutionName ?? 'Unknown Bank',
  accountName: payload.accountName,
  accountNumber: payload.accountNumber,
  provider: payload.provider ?? 'mono',
  accessMode: payload.accessMode ?? 'read_only',
  allowedOperations: Array.isArray(payload.allowedOperations) ? payload.allowedOperations : [],
  forbiddenOperations: Array.isArray(payload.forbiddenOperations) ? payload.forbiddenOperations : [],
  permissionSummary: payload.permissionSummary ?? 'Account details and transaction history only',
  securityVerifiedAt: payload.securityVerifiedAt,
  lastSyncAt: payload.lastSyncAt ?? null,
  lastSuccessfulSyncAt: payload.lastSuccessfulSyncAt ?? null,
  credentialHandling: {
    rawBankCredentialsCollected: Boolean(payload.credentialHandling?.rawBankCredentialsCollected),
    providerHostedAuthentication: Boolean(payload.credentialHandling?.providerHostedAuthentication),
    encryptedTokenStorage: Boolean(payload.credentialHandling?.encryptedTokenStorage),
  },
  webhookSecurity: {
    type: payload.webhookSecurity?.type ?? 'hmac_sha256_signature',
    enabled: Boolean(payload.webhookSecurity?.enabled),
  },
  audit: {
    chainValid: Boolean(payload.audit?.chainValid),
    checkedEntries: Number(payload.audit?.checkedEntries ?? 0),
    checkedAt: payload.audit?.checkedAt,
  },
  recentEvents: Array.isArray(payload.recentEvents)
    ? payload.recentEvents.map((event: any) => ({
        id: String(event.id ?? event._id ?? event.chainIndex ?? Math.random()),
        eventType: String(event.eventType ?? 'unknown'),
        actorType: event.actorType ?? 'system',
        timestamp: event.timestamp,
        chainIndex: Number(event.chainIndex ?? 0),
        requestMeta: event.requestMeta ?? {},
        metadata: event.metadata ?? {},
      }))
    : [],
});

export const getBankConnections = async (): Promise<BankConnection[]> => {
  const response = await api.get<BankConnectionsResponse>(API_ENDPOINTS.BANK.CONNECTIONS);
  const data = response.data?.data;
  if (!data) return [];

  const connections = Array.isArray(data) ? data : data.connections;
  if (!connections) return [];

  return connections.map(mapBankConnectionFromApi);
};

export const connectBankAccount = async (code: string): Promise<BankConnection> => {
  const response = await api.post<BankConnectionResponse>(API_ENDPOINTS.BANK.CONNECT, { code });
  if (!response.data?.success || !response.data?.data) {
    throw new Error(response.data?.message ?? 'Failed to connect bank account');
  }
  return mapBankConnectionFromApi(response.data.data);
};

export const getBankConnectionSecurity = async (
  connectionId: string
): Promise<BankConnectionSecuritySummary> => {
  const response = await api.get<BankConnectionSecurityResponse>(
    `${API_ENDPOINTS.BANK.SECURITY}/${connectionId}/security`
  );

  if (!response.data?.success || !response.data?.data) {
    throw new Error(response.data?.message ?? 'Failed to load bank connection security details');
  }

  return mapBankConnectionSecurityFromApi(response.data.data);
};

export const syncBankConnection = async (connectionId: string): Promise<SyncJobResponse> => {
  const response = await api.post<SyncJobResponse>(
    `${API_ENDPOINTS.SYNC.CONNECTION}/${connectionId}`
  );
  return response.data;
};

export const disconnectBankConnection = async (connectionId: string): Promise<void> => {
  await api.delete(`${API_ENDPOINTS.BANK.CONNECTIONS}/${connectionId}`);
};

export const updateSyncSettings = async (
  connectionId: string,
  settings: { autoSync?: boolean; syncInterval?: number }
): Promise<void> => {
  await api.patch(`${API_ENDPOINTS.SYNC.CONNECTION_SETTINGS}/${connectionId}/settings`, settings);
};
