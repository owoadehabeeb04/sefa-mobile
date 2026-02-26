/**
 * Income Types
 */

export type PaymentMethod = 'cash' | 'card' | 'bank_transfer' | 'mobile_money' | 'other';
export type RecurringFrequency = 'daily' | 'weekly' | 'bi-weekly' | 'monthly' | 'quarterly' | 'yearly';

export interface Income {
  id: string;
  serverId?: string;
  userId: string;
  categoryId: string;
  amount: number;
  source: string;
  description?: string;
  date: string;
  paymentMethod: PaymentMethod;
  tags?: string[];
  isRecurring: boolean;
  recurringFrequency?: RecurringFrequency;
  recurringEndDate?: string;
  isPending: boolean;
  synced: boolean;
  createdAt?: string;
  updatedAt?: string;
  
  // Populated fields (from joins)
  category?: {
    id: string;
    name: string;
    icon: string;
    color: string;
    type: string;
  };
}

export interface IncomeInput {
  categoryId: string;
  amount: number;
  source: string;
  description?: string;
  date: string;
  paymentMethod?: PaymentMethod;
  tags?: string[];
  isRecurring?: boolean;
  recurringFrequency?: RecurringFrequency;
  recurringEndDate?: string;
}

export interface IncomeFilters {
  startDate?: string;
  endDate?: string;
  categoryId?: string;
  minAmount?: number;
  maxAmount?: number;
  paymentMethod?: PaymentMethod;
  search?: string;
  includePending?: boolean;
}

export interface IncomeResponse {
  success: boolean;
  data: {
    income?: Income | Income[];
    pagination?: {
      total: number;
      page: number;
      pages: number;
      limit: number;
    };
  };
  message?: string;
}
