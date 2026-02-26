/**
 * Expense Hooks
 * React Query hooks for expense operations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth.store';
import {
  getLocalExpenses,
  getExpenseById,
  createExpense,
  updateExpense,
  deleteExpense,
} from './expense.service';
import type { ExpenseInput, ExpenseFilters } from './expense.types';

/**
 * Hook to fetch expenses (offline-first)
 */
export const useExpenses = (filters?: ExpenseFilters) => {
  return useQuery({
    queryKey: ['expenses', filters],
    queryFn: () => getLocalExpenses(filters),
    staleTime: 1 * 60 * 1000, // Consider data fresh for 1 minute
  });
};

/**
 * Hook to fetch a single expense by ID
 */
export const useExpense = (expenseId: string) => {
  return useQuery({
    queryKey: ['expense', expenseId],
    queryFn: () => getExpenseById(expenseId),
    enabled: !!expenseId,
  });
};

/**
 * Hook to create a new expense
 */
export const useCreateExpense = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  return useMutation({
    mutationFn: (input: ExpenseInput) => {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }
      return createExpense(input, user.id);
    },
    onMutate: async (input) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['transactions', 'paginated'] });

      // Snapshot previous value
      const previousData = queryClient.getQueryData(['transactions', 'paginated']);

      // Get category details for optimistic update
      // Try multiple category query keys
      let categories: any[] = [];
      const allCategories = queryClient.getQueryData(['categories']) as any[];
      const expenseCategories = queryClient.getQueryData(['categories', 'expense']) as any[];
      const incomeCategories = queryClient.getQueryData(['categories', 'income']) as any[];
      
      if (allCategories && Array.isArray(allCategories)) {
        categories = allCategories;
      } else if (expenseCategories && Array.isArray(expenseCategories)) {
        categories = expenseCategories;
      } else if (incomeCategories && Array.isArray(incomeCategories)) {
        categories = incomeCategories;
      }
      
      const category = categories.find((c: any) => c.id === input.categoryId);

      // Create optimistic transaction
      const optimisticTransaction = {
        id: `temp-${Date.now()}`,
        userId: user!.id,
        categoryId: input.categoryId,
        amount: input.amount,
        description: input.description,
        date: input.date,
        paymentMethod: input.paymentMethod || 'cash',
        location: input.location,
        tags: input.tags || [],
        isPending: false,
        synced: false,
        type: 'expense' as const,
        category: category ? {
          id: category.id,
          name: category.name,
          icon: category.icon,
          color: category.color,
          type: category.type,
        } : undefined,
      };

      // Optimistically add to paginated transactions cache
      queryClient.setQueriesData({ queryKey: ['transactions', 'paginated'] }, (old: any) => {
        console.log('🟢 Optimistic update - old data:', old);
        
        // If no pages exist yet, create a new page structure
        if (!old?.pages || old.pages.length === 0) {
          console.log('🟢 Creating new page structure for optimistic transaction');
          return {
            pages: [{
              transactions: [optimisticTransaction],
              pagination: {
                total: 1,
                page: 1,
                pages: 1,
                limit: 30,
              },
            }],
            pageParams: [1],
          };
        }
        
        // Add to first page at the beginning (newest first)
        const newPages = [...old.pages];
        if (newPages[0]) {
          console.log('🟢 Adding optimistic transaction to existing page');
          newPages[0] = {
            ...newPages[0],
            transactions: [optimisticTransaction, ...newPages[0].transactions],
            pagination: {
              ...newPages[0].pagination,
              total: (newPages[0].pagination.total || 0) + 1,
            },
          };
        }
        
        console.log('🟢 Optimistic update - new data:', { pages: newPages });
        return {
          ...old,
          pages: newPages,
        };
      });

      return { previousData };
    },
    onError: (error, input, context) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(['transactions', 'paginated'], context.previousData);
      }
      console.error('Create expense error:', error);
    },
    onSuccess: async (newExpense) => {
      // Invalidate other queries immediately
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      
      // Don't invalidate paginated transactions immediately - let optimistic update stay visible
      // Only invalidate after a delay to allow server to save and replace temp ID with real ID
      setTimeout(() => {
        console.log('🔄 Invalidating paginated transactions after server save');
        queryClient.invalidateQueries({ queryKey: ['transactions', 'paginated'] });
      }, 1500); // Wait 1.5 seconds for server to save
    },
  });
};

/**
 * Hook to update an expense
 */
export const useUpdateExpense = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ExpenseInput> }) => 
      updateExpense(id, data),
    onSuccess: (_, variables) => {
      // Invalidate specific expense and list queries
      queryClient.invalidateQueries({ queryKey: ['expense', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['transactions', 'paginated'] });
    },
    onError: (error) => {
      console.error('Update expense error:', error);
    },
  });
};

/**
 * Hook to delete an expense
 */
export const useDeleteExpense = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (expenseId: string) => deleteExpense(expenseId),
    onMutate: async (expenseId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['expenses'] });
      await queryClient.cancelQueries({ queryKey: ['transactions'] });
      await queryClient.cancelQueries({ queryKey: ['transactions', 'paginated'] });

      // Snapshot previous values
      const previousExpenses = queryClient.getQueryData(['expenses']);
      const previousTransactions = queryClient.getQueryData(['transactions']);

      // Optimistically remove from cache
      queryClient.setQueryData(['expenses'], (old: any) => {
        if (!old) return old;
        return old.filter((exp: any) => exp.id !== expenseId);
      });

      queryClient.setQueryData(['transactions'], (old: any) => {
        if (!old) return old;
        return old.filter((t: any) => t.id !== expenseId);
      });

      // Optimistically remove from paginated transactions
      queryClient.setQueriesData({ queryKey: ['transactions', 'paginated'] }, (old: any) => {
        if (!old?.pages) return old;
        return {
          ...old,
          pages: old.pages.map((page: any) => ({
            ...page,
            transactions: page.transactions.filter((t: any) => t.id !== expenseId),
            pagination: {
              ...page.pagination,
              total: Math.max(0, page.pagination.total - 1),
            },
          })),
        };
      });

      return { previousExpenses, previousTransactions };
    },
    onError: (error, expenseId, context) => {
      // Rollback on error
      if (context?.previousExpenses) {
        queryClient.setQueryData(['expenses'], context.previousExpenses);
      }
      if (context?.previousTransactions) {
        queryClient.setQueryData(['transactions'], context.previousTransactions);
      }
      console.error('Delete expense error:', error);
    },
    onSuccess: () => {
      // Invalidate to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['transactions', 'paginated'] });
    },
  });
};
