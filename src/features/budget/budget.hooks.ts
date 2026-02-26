/**
 * Budget React Query Hooks
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getBudget, updateBudget } from './budget.service';

export const BUDGET_QUERY_KEY = ['budget'];

export const useBudget = () => {
  return useQuery({
    queryKey: BUDGET_QUERY_KEY,
    queryFn: async () => {
      const result = await getBudget();
      return result.data;
    },
    staleTime: 2 * 60 * 1000,
  });
};

export const useUpdateBudget = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (amount: number | null) => updateBudget(amount),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BUDGET_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
    },
  });
};
