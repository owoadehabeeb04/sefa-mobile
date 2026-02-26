/**
 * Income Service
 * API-only: all operations go through the backend
 */

import api from '@/services/api';
import { API_ENDPOINTS } from '@/config/api';
import { isFutureDate } from '@/utils/helpers';
import type { Income, IncomeInput, IncomeFilters, IncomeResponse } from './income.types';

function mapIncomeFromApi(inc: any): Income {
  const cat = inc.category ?? inc.categoryId;
  const categoryId = typeof cat === 'string' ? cat : (cat?._id ?? cat?.id ?? inc.categoryId);
  const categoryIdStr = typeof categoryId === 'string' ? categoryId : categoryId?.toString?.() ?? '';
  return {
    id: inc._id ?? inc.id,
    serverId: inc._id ?? inc.id,
    userId: inc.userId,
    categoryId: categoryIdStr,
    amount: inc.amount,
    source: inc.source,
    description: inc.description,
    date: inc.date,
    paymentMethod: inc.paymentMethod ?? 'bank_transfer',
    tags: inc.tags ?? [],
    isRecurring: inc.isRecurring ?? false,
    recurringFrequency: inc.recurringFrequency,
    recurringEndDate: inc.recurringEndDate,
    isPending: inc.date ? isFutureDate(inc.date) : false,
    synced: true,
    createdAt: inc.createdAt,
    updatedAt: inc.updatedAt,
    category: cat?.name
      ? {
          id: cat._id ?? cat.id,
          name: cat.name,
          icon: cat.icon,
          color: cat.color,
          type: cat.type,
        }
      : undefined,
  };
}

/**
 * Fetch income from server
 */
export const fetchIncomeFromServer = async (filters?: IncomeFilters): Promise<IncomeResponse> => {
  const params: Record<string, any> = { limit: 500, ...filters };
  const response = await api.get(API_ENDPOINTS.INCOME.BASE, { params });
  return response.data;
};

/**
 * Get income from API
 */
export const getLocalIncome = async (filters?: IncomeFilters): Promise<Income[]> => {
  try {
    const response = await fetchIncomeFromServer(filters);
    const income = response.data?.income;
    if (!income) return [];
    const list = Array.isArray(income) ? income : [income];
    return list.map(mapIncomeFromApi);
  } catch (error) {
    console.error('Error fetching income:', error);
    throw error;
  }
};

/**
 * Get a single income by ID
 */
export const getIncomeById = async (incomeId: string): Promise<Income | null> => {
  try {
    const response = await api.get(`${API_ENDPOINTS.INCOME.BASE}/${incomeId}`);
    if (!response.data.success || !response.data.data?.income) return null;
    return mapIncomeFromApi(response.data.data.income);
  } catch (error: any) {
    if (error.response?.status === 404) return null;
    console.error('Error fetching income by ID:', error);
    throw error;
  }
};

/**
 * Create a new income
 */
export const createIncome = async (input: IncomeInput, userId: string): Promise<Income> => {
  if (input.amount <= 0 || input.amount > 10000000) {
    throw new Error('Amount must be between ₦0.01 and ₦10,000,000');
  }
  if (!input.source?.trim()) {
    throw new Error('Income source is required');
  }

  const response = await api.post(API_ENDPOINTS.INCOME.BASE, {
    categoryId: input.categoryId,
    amount: input.amount,
    source: input.source.trim(),
    description: input.description,
    date: input.date,
    paymentMethod: input.paymentMethod,
    tags: input.tags,
  });

  if (!response.data.success || !response.data.data?.income) {
    throw new Error(response.data?.message ?? 'Failed to create income');
  }

  return mapIncomeFromApi(response.data.data.income);
};

/**
 * Update an income
 */
export const updateIncome = async (incomeId: string, input: Partial<IncomeInput>): Promise<Income> => {
  const response = await api.put(`${API_ENDPOINTS.TRANSACTIONS.BASE}/${incomeId}`, input);
  if (!response.data.success || !response.data.data?.transaction) {
    throw new Error(response.data?.message ?? 'Failed to update income');
  }
  return mapIncomeFromApi(response.data.data.transaction);
};

/**
 * Delete an income
 */
export const deleteIncome = async (incomeId: string): Promise<void> => {
  await api.delete(`${API_ENDPOINTS.TRANSACTIONS.BASE}/${incomeId}`);
};
