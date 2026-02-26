/**
 * Bank Connection Service
 * API-only: all operations go through the backend
 */

import api from '@/services/api';
import { API_ENDPOINTS } from '@/config/api';
import type { BankConnection, BankConnectionsResponse, BankConnectionResponse, SyncJobResponse } from './bankConnection.types';

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
  lastSyncAt: c.lastSyncAt,
  nextSyncAt: c.nextSyncAt,
  syncFrequency: c.syncFrequency,
  isPrimary: c.isPrimary,
  createdAt: c.createdAt,
  updatedAt: c.updatedAt,
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
