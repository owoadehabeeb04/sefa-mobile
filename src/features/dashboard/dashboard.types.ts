/**
 * Dashboard Feature Types
 */

import type { DashboardData, PeriodType } from '@/types/dashboard.types';

export interface GetDashboardSummaryParams {
  period?: PeriodType;
  startDate?: string;
  endDate?: string;
}

export interface DashboardSummaryResponse {
  success: boolean;
  data: DashboardData;
  message: string;
  timestamp: string;
}
