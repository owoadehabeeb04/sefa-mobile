/**
 * Dashboard React Query Hooks
 */

import { useQuery } from '@tanstack/react-query';
import { getDashboardSummary } from './dashboard.service';
import type { GetDashboardSummaryParams } from './dashboard.types';

/**
 * Hook to fetch dashboard summary
 */
export const useDashboardSummary = (params: GetDashboardSummaryParams = {}) => {
  return useQuery({
    queryKey: ['dashboard-summary', params],
    queryFn: async () => {
      try {
        console.log('📊 Fetching dashboard summary...', params);
        const result = await getDashboardSummary(params);
        console.log('📊 Dashboard data received:', result);
        return result;
      } catch (error: any) {
        console.error('📊 Dashboard fetch error:', error);
        console.error('📊 Error details:', {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status,
        });
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    retry: 2, // Retry failed requests twice
  });
};
