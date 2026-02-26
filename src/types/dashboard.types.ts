/**
 * Dashboard Type Definitions
 */

export interface DashboardPeriod {
  start: string;
  end: string;
  label: string;
}

export interface DashboardSummary {
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  savings: number;
  currency: string;
  spendingRate: number;
  savingsRate: number;
}

export interface DashboardComparison {
  incomeChange: string | null;
  expenseChange: string | null;
}

export interface CategoryBreakdown {
  id: string;
  name: string;
  icon: string;
  color: string;
  total: number;
  count: number;
  percentage: string;
}

export interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  icon?: string;
  color?: string;
  description?: string;
  date: string;
  createdAt: string;
}

export interface TransactionCounts {
  totalTransactions: number;
  incomeCount: number;
  expenseCount: number;
}

export interface BudgetSummary {
  limit: number;
  used: number;
  left: number;
  percentUsed: number;
  status: 'on_track' | 'approaching' | 'over';
  /** When budget is scaled by period (not "This month") */
  monthlyBudgetLimit?: number;
  periodDays?: number;
  periodLabel?: string;
  isCurrentMonth?: boolean;
}

/** Current month budget (Option C) when viewing another period */
export interface ThisMonthBudgetSummary {
  limit: number;
  used: number;
  left: number;
  percentUsed: number;
  status: 'on_track' | 'approaching' | 'over';
}

export interface DashboardData {
  period: DashboardPeriod;
  summary: DashboardSummary;
  budget: BudgetSummary | null;
  thisMonthBudget?: ThisMonthBudgetSummary | null;
  comparison: DashboardComparison;
  topCategories: CategoryBreakdown[];
  recentTransactions: Transaction[];
  aiInsight: string;
  counts: TransactionCounts;
}

export type PeriodType = 'today' | 'week' | 'month' | 'year' | 'custom';
export type TransactionFilterType = 'all' | 'expenses' | 'income';
