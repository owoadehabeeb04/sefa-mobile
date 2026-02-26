/**
 * Expense Types
 */

export type PaymentMethod = 'cash' | 'card' | 'bank_transfer' | 'mobile_money' | 'other';
export type RecurringFrequency = 'daily' | 'weekly' | 'bi-weekly' | 'monthly' | 'quarterly' | 'yearly';

export interface Expense {
  id: string;
  serverId?: string;
  userId: string;
  categoryId: string;
  amount: number;
  description?: string;
  date: string;
  paymentMethod: PaymentMethod;
  location?: string;
  tags?: string[];
  receiptUrl?: string;
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

export interface ExpenseInput {
  categoryId: string;
  amount: number;
  description?: string;
  date: string;
  paymentMethod?: PaymentMethod;
  location?: string;
  tags?: string[];
  isRecurring?: boolean;
  recurringFrequency?: RecurringFrequency;
  recurringEndDate?: string;
}

export interface ExpenseFilters {
  startDate?: string;
  endDate?: string;
  categoryId?: string;
  minAmount?: number;
  maxAmount?: number;
  paymentMethod?: PaymentMethod;
  search?: string;
  includePending?: boolean;
}

export interface ExpenseResponse {
  success: boolean;
  data: {
    expense?: Expense;
    expenses?: Expense[];
    pagination?: {
      total: number;
      page: number;
      pages: number;
      limit: number;
    };
  };
  message?: string;
}
