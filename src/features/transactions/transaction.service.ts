/**
 * Transaction Service
 * API-only: fetches transactions from server with cursor-based pagination (infinite scroll)
 */

import api from '@/services/api';
import { API_ENDPOINTS } from '@/config/api';
import type { Transaction, TransactionFilters } from './transaction.hooks';

export interface TransactionsPageResponse {
  transactions: Transaction[];
  nextCursor: string | null;
  hasMore: boolean;
  pagination: { limit: number; hasMore: boolean };
}

const mapTransactionFromApi = (t: any): Transaction => ({
  id: t._id || t.id,
  serverId: t._id || t.id,
  userId: t.userId,
  categoryId: t.categoryId?._id || t.categoryId,
  amount: t.amount,
  description: t.description,
  date: t.date,
  paymentMethod: t.paymentMethod || (t.type === 'expense' ? 'cash' : 'bank_transfer'),
  location: (t as any).location,
  source: (t as any).source,
  tags: t.tags || [],
  receiptUrl: (t as any).receiptUrl,
  isRecurring: t.isRecurring || false,
  recurringFrequency: t.recurringFrequency,
  recurringEndDate: t.recurringEndDate,
  isPending: false,
  synced: true,
  createdAt: t.createdAt,
  updatedAt: t.updatedAt,
  type: t.type as 'expense' | 'income',
  category: t.category?.name
    ? {
        id: t.category._id || t.category.id,
        name: t.category.name,
        icon: t.category.icon,
        color: t.category.color,
        type: t.category.type,
      }
    : undefined,
});

/**
 * Fetch a page of transactions from server (cursor-based pagination for infinite scroll).
 * Pass cursor only for "load more"; omit for first page. All filters (type, date range, search) are applied on the backend.
 */
export const fetchTransactionsPage = async (
  filters?: TransactionFilters,
  cursor?: string | null,
  limit: number = 30
): Promise<TransactionsPageResponse> => {
  const { type, ...commonFilters } = filters || {};
  const params: Record<string, unknown> = {
    ...commonFilters,
    type: type === 'expense' || type === 'income' ? type : 'all',
    limit,
  };
  if (cursor) params.cursor = cursor;
  // Drop undefined so they aren't sent as "undefined" string
  Object.keys(params).forEach((k) => params[k] === undefined && delete params[k]);

  const response = await api.get(API_ENDPOINTS.TRANSACTIONS.BASE, { params });

  if (!response.data.success) {
    return {
      transactions: [],
      nextCursor: null,
      hasMore: false,
      pagination: { limit, hasMore: false },
    };
  }

  const raw = response.data.data;
  const transactions: Transaction[] = (raw.transactions || []).map(mapTransactionFromApi);
  const nextCursor = raw.nextCursor ?? null;
  const hasMore = Boolean(raw.hasMore);

  return {
    transactions,
    nextCursor,
    hasMore,
    pagination: { limit, hasMore },
  };
};

/**
 * Sync transactions from server (API-only: no local DB to write to).
 * Refetch is handled by React Query invalidation.
 */
export const syncTransactionsFromServer = async (): Promise<{
  success: boolean;
  expensesSynced: number;
  incomeSynced: number;
}> => {
  return { success: true, expensesSynced: 0, incomeSynced: 0 };
};
