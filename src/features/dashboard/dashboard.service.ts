/**
 * Dashboard API Service
 */

import api from '@/services/api';
import type { 
  GetDashboardSummaryParams, 
  DashboardSummaryResponse 
} from './dashboard.types';

const BASE_URL = '/dashboard';

/**
 * Get dashboard summary with financial overview and AI insights
 */
export const getDashboardSummary = async (
  params: GetDashboardSummaryParams = {}
): Promise<DashboardSummaryResponse> => {
  const { period = 'month', startDate, endDate } = params;
  
  const queryParams = new URLSearchParams();
  queryParams.append('period', period);
  
  if (startDate) queryParams.append('startDate', startDate);
  if (endDate) queryParams.append('endDate', endDate);
  
  const response = await api.get<DashboardSummaryResponse>(
    `${BASE_URL}/summary?${queryParams.toString()}`
  );
  
  return response.data;
};
