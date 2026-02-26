/**
 * Income Hooks
 * React Query hooks for income operations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth.store';
import {
  getLocalIncome,
  getIncomeById,
  createIncome,
  updateIncome,
  deleteIncome,
} from './income.service';
import type { IncomeInput, IncomeFilters } from './income.types';

/**
 * Hook to fetch income (offline-first)
 */
export const useIncome = (filters?: IncomeFilters) => {
  return useQuery({
    queryKey: ['income', filters],
    queryFn: () => getLocalIncome(filters),
    staleTime: 1 * 60 * 1000, // Consider data fresh for 1 minute
  });
};

/**
 * Hook to fetch a single income by ID
 */
export const useIncomeById = (incomeId: string) => {
  return useQuery({
    queryKey: ['income', incomeId],
    queryFn: () => getIncomeById(incomeId),
    enabled: !!incomeId,
  });
};

/**
 * Hook to create a new income
 */
export const useCreateIncome = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  return useMutation({
    mutationFn: (input: IncomeInput) => {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }
      return createIncome(input, user.id);
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
        source: input.source,
        description: input.description,
        date: input.date,
        paymentMethod: input.paymentMethod || 'bank_transfer',
        tags: input.tags || [],
        isPending: false,
        synced: false,
        type: 'income' as const,
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
        // If no pages exist yet, create a new page structure
        if (!old?.pages || old.pages.length === 0) {
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
          newPages[0] = {
            ...newPages[0],
            transactions: [optimisticTransaction, ...newPages[0].transactions],
            pagination: {
              ...newPages[0].pagination,
              total: (newPages[0].pagination.total || 0) + 1,
            },
          };
        }
        
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
      console.error('Create income error:', error);
    },
    onSuccess: async (newIncome) => {
      // Invalidate other queries immediately
      queryClient.invalidateQueries({ queryKey: ['income'] });
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
 * Hook to update an income
 */
export const useUpdateIncome = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<IncomeInput> }) => 
      updateIncome(id, data),
    onSuccess: (_, variables) => {
      // Invalidate specific income and list queries
      queryClient.invalidateQueries({ queryKey: ['income', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['income'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['transactions', 'paginated'] });
    },
    onError: (error) => {
      console.error('Update income error:', error);
    },
  });
};

/**
 * Hook to delete an income
 */
export const useDeleteIncome = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (incomeId: string) => deleteIncome(incomeId),
    onMutate: async (incomeId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['income'] });
      await queryClient.cancelQueries({ queryKey: ['transactions'] });
      await queryClient.cancelQueries({ queryKey: ['transactions', 'paginated'] });

      // Snapshot previous values
      const previousIncome = queryClient.getQueryData(['income']);
      const previousTransactions = queryClient.getQueryData(['transactions']);

      // Optimistically remove from cache
      queryClient.setQueryData(['income'], (old: any) => {
        if (!old) return old;
        return old.filter((inc: any) => inc.id !== incomeId);
      });

      queryClient.setQueryData(['transactions'], (old: any) => {
        if (!old) return old;
        return old.filter((t: any) => t.id !== incomeId);
      });

      // Optimistically remove from paginated transactions
      queryClient.setQueriesData({ queryKey: ['transactions', 'paginated'] }, (old: any) => {
        if (!old?.pages) return old;
        return {
          ...old,
          pages: old.pages.map((page: any) => ({
            ...page,
            transactions: page.transactions.filter((t: any) => t.id !== incomeId),
            pagination: {
              ...page.pagination,
              total: Math.max(0, page.pagination.total - 1),
            },
          })),
        };
      });

      return { previousIncome, previousTransactions };
    },
    onError: (error, incomeId, context) => {
      // Rollback on error
      if (context?.previousIncome) {
        queryClient.setQueryData(['income'], context.previousIncome);
      }
      if (context?.previousTransactions) {
        queryClient.setQueryData(['transactions'], context.previousTransactions);
      }
      console.error('Delete income error:', error);
    },
    onSuccess: () => {
      // Invalidate to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['transactions', 'paginated'] });
    },
  });
};
