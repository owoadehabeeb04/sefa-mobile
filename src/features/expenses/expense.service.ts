/**
 * Expense Service
 * API-only: all operations go through the backend
 */

import api from '@/services/api';
import { API_ENDPOINTS } from '@/config/api';
import { isFutureDate } from '@/utils/helpers';
import type { Expense, ExpenseInput, ExpenseFilters, ExpenseResponse } from './expense.types';

function mapExpenseFromApi(exp: any): Expense {
  const cat = exp.category ?? exp.categoryId;
  const categoryId = typeof cat === 'string' ? cat : (cat?._id ?? cat?.id ?? exp.categoryId);
  const categoryIdStr = typeof categoryId === 'string' ? categoryId : categoryId?.toString?.() ?? '';
  return {
    id: exp._id ?? exp.id,
    serverId: exp._id ?? exp.id,
    userId: exp.userId,
    categoryId: categoryIdStr,
    amount: exp.amount,
    description: exp.description,
    date: exp.date,
    paymentMethod: exp.paymentMethod ?? 'cash',
    location: exp.location,
    tags: exp.tags ?? [],
    receiptUrl: exp.receiptUrl,
    isRecurring: exp.isRecurring ?? false,
    recurringFrequency: exp.recurringFrequency,
    recurringEndDate: exp.recurringEndDate,
    isPending: exp.date ? isFutureDate(exp.date) : false,
    synced: true,
    createdAt: exp.createdAt,
    updatedAt: exp.updatedAt,
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
 * Fetch expenses from server
 */
export const fetchExpensesFromServer = async (filters?: ExpenseFilters): Promise<ExpenseResponse> => {
  const params: Record<string, any> = { limit: 500, ...filters };
  const response = await api.get(API_ENDPOINTS.EXPENSES.BASE, { params });
  return response.data;
};

/**
 * Get expenses from API
 */
export const getLocalExpenses = async (filters?: ExpenseFilters): Promise<Expense[]> => {
  try {
    const response = await fetchExpensesFromServer(filters);
    if (!response.success || !response.data?.expenses) return [];
    return response.data.expenses.map(mapExpenseFromApi);
  } catch (error) {
    console.error('Error fetching expenses:', error);
    throw error;
  }
};

/**
 * Get a single expense by ID
 */
export const getExpenseById = async (expenseId: string): Promise<Expense | null> => {
  try {
    const response = await api.get(`${API_ENDPOINTS.EXPENSES.BASE}/${expenseId}`);
    if (!response.data.success || !response.data.data?.expense) return null;
    return mapExpenseFromApi(response.data.data.expense);
  } catch (error: any) {
    if (error.response?.status === 404) return null;
    console.error('Error fetching expense by ID:', error);
    throw error;
  }
};

/**
 * Create a new expense
 */
export const createExpense = async (input: ExpenseInput, userId: string): Promise<Expense> => {
  if (input.amount <= 0 || input.amount > 10000000) {
    throw new Error('Amount must be between ₦0.01 and ₦10,000,000');
  }

  const response = await api.post(API_ENDPOINTS.EXPENSES.BASE, {
    categoryId: input.categoryId,
    amount: input.amount,
    description: input.description,
    date: input.date,
    paymentMethod: input.paymentMethod,
    location: input.location,
    tags: input.tags,
  });

  if (!response.data.success || !response.data.data?.expense) {
    throw new Error(response.data?.message ?? 'Failed to create expense');
  }

  return mapExpenseFromApi(response.data.data.expense);
};

/**
 * Update an expense
 */
export const updateExpense = async (expenseId: string, input: Partial<ExpenseInput>): Promise<Expense> => {
  const response = await api.put(`${API_ENDPOINTS.TRANSACTIONS.BASE}/${expenseId}`, input);
  if (!response.data.success || !response.data.data?.transaction) {
    throw new Error(response.data?.message ?? 'Failed to update expense');
  }
  return mapExpenseFromApi(response.data.data.transaction);
};

/**
 * Delete an expense
 */
export const deleteExpense = async (expenseId: string): Promise<void> => {
  await api.delete(`${API_ENDPOINTS.TRANSACTIONS.BASE}/${expenseId}`);
};
