/**
 * Transaction Hooks
 * Combined hooks for expenses and income with server-side pagination
 */

import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { getLocalExpenses } from '../expenses/expense.service';
import { getLocalIncome } from '../income/income.service';
import { syncTransactionsFromServer, fetchTransactionsPage } from './transaction.service';
import type { ExpenseFilters } from '../expenses/expense.types';
import type { IncomeFilters } from '../income/income.types';

export interface Transaction {
  id: string;
  serverId?: string;
  userId: string;
  categoryId: string;
  amount: number;
  description?: string;
  date: string;
  type: 'expense' | 'income';
  paymentMethod?: string;
  location?: string;
  source?: string;
  tags?: string[];
  isPending: boolean;
  synced: boolean;
  isRecurring?: boolean;
  receiptUrl?: string;
  createdAt?: string;
  updatedAt?: string;
  recurringFrequency?: string;
  recurringEndDate?: string;
  category?: {
    id: string;
    name: string;
    icon: string;
    color: string;
    type: string;
  };
}

export interface TransactionFilters extends ExpenseFilters {
  type?: 'expense' | 'income' | 'all';
}

const TRANSACTIONS_PAGE_LIMIT = 30;

/**
 * Hook to fetch transactions with cursor-based pagination (infinite scroll).
 * Filters (type, date range, search) are applied on the backend; when they change, the list refetches from the first page.
 */
export const useInfiniteTransactions = (filters?: TransactionFilters) => {
  return useInfiniteQuery({
    queryKey: ['transactions', 'infinite', filters],
    queryFn: ({ pageParam }) =>
      fetchTransactionsPage(filters, pageParam ?? undefined, TRANSACTIONS_PAGE_LIMIT),
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    initialPageParam: null as string | null,
    staleTime: 30 * 1000,
  });
};

/**
 * Hook to fetch all transactions (expenses + income combined) - for backward compatibility
 */
export const useTransactions = (filters?: TransactionFilters) => {
  return useQuery({
    queryKey: ['transactions', filters],
    queryFn: async () => {
      const { type, ...commonFilters } = filters || {};
      
      let expenses: Transaction[] = [];
      let income: Transaction[] = [];

      // Fetch expenses if needed
      if (!type || type === 'all' || type === 'expense') {
        const expensesData = await getLocalExpenses(commonFilters);
        expenses = expensesData.map(exp => ({
          ...exp,
          type: 'expense' as const,
        }));
      }

      // Fetch income if needed
      if (!type || type === 'all' || type === 'income') {
        const incomeData = await getLocalIncome(commonFilters);
        income = incomeData.map(inc => ({
          ...inc,
          type: 'income' as const,
        }));
      }

      // Combine and sort by date (newest first)
      const allTransactions = [...expenses, ...income];
      allTransactions.sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return dateB - dateA; // Descending order
      });

      return allTransactions;
    },
    staleTime: 1 * 60 * 1000, // Consider data fresh for 1 minute
  });
};

/**
 * Hook to sync transactions from server
 */
export const useSyncTransactions = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: syncTransactionsFromServer,
    onSuccess: (result) => {
      if (result.success) {
        console.log(`✅ Synced ${result.expensesSynced + result.incomeSynced} transactions`);
        // Invalidate all transaction queries to refetch from local DB
        queryClient.invalidateQueries({ queryKey: ['transactions'] });
        queryClient.invalidateQueries({ queryKey: ['expenses'] });
        queryClient.invalidateQueries({ queryKey: ['income'] });
        queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      }
    },
    onError: (error) => {
      console.error('Transaction sync error:', error);
    },
  });
};

/**
 * Group transactions by date
 */
export const groupTransactionsByDate = (transactions: Transaction[]) => {
  const grouped: { [key: string]: Transaction[] } = {};

  transactions.forEach(transaction => {
    const date = new Date(transaction.date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    let key: string;
    
    // Check if today
    if (date.toDateString() === today.toDateString()) {
      key = 'Today';
    }
    // Check if yesterday
    else if (date.toDateString() === yesterday.toDateString()) {
      key = 'Yesterday';
    }
    // Otherwise use formatted date
    else {
      key = date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
      });
    }

    if (!grouped[key]) {
      grouped[key] = [];
    }
    grouped[key].push(transaction);
  });

  return grouped;
};
