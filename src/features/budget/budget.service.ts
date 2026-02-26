/**
 * Budget API Service
 */

import api from '@/services/api';
import { API_ENDPOINTS } from '@/config/api';
import type { ApiBudgetResponse } from './budget.types';

/**
 * Get current user's monthly budget limit
 */
export const getBudget = async (): Promise<ApiBudgetResponse> => {
  const response = await api.get<ApiBudgetResponse>(API_ENDPOINTS.DASHBOARD.BUDGET);
  return response.data;
};

/**
 * Set or update monthly budget limit. Pass null to clear.
 */
export const updateBudget = async (amount: number | null): Promise<ApiBudgetResponse> => {
  const response = await api.put<ApiBudgetResponse>(API_ENDPOINTS.DASHBOARD.BUDGET, {
    amount: amount ?? null,
  });
  return response.data;
};
