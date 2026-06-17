/**
 * Types for the Financial Intelligence Dashboard.
 *
 * These mirror the backend MonthlyInsightSnapshot / dashboard payload. The
 * backend calculates every number here; the AI summary only explains them.
 */

export interface DashboardSnapshot {
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  spendingRate: number; // expenses / income (0..1+)
  budgetUsage: number; // % of total monthly budget used
  savingsPotential: number;
  previousPeriod: PreviousPeriod | null;
}

export interface PreviousPeriod {
  periodKey: string;
  periodLabel: string;
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  expensesChange: number;
  expensesChangePercent: number | null;
}

export interface CategoryBreakdownItem {
  categoryId: string | null;
  categoryName: string;
  totalSpent: number;
  percentage: number;
  transactionCount: number;
  averageTransaction: number;
  color: string;
}

export interface PieSlice {
  label: string;
  value: number;
  percentage: number;
  categoryId: string | null;
  color: string;
  formattedAmount: string;
}

export interface SpendingDrivers {
  topSpendingCategory: { categoryName: string; totalSpent: number; percentage: number } | null;
  mostFrequentCategory: { categoryName: string; transactionCount: number; totalSpent: number } | null;
  highestSingleExpense: {
    amount: number;
    description: string;
    categoryName: string;
    date: string;
  } | null;
  fastestGrowingCategory: {
    categoryName: string;
    previousSpent: number;
    currentSpent: number;
    changePercent: number;
  } | null;
  recurringIndicators: {
    description: string;
    categoryName: string;
    occurrences: number;
    total: number;
  }[];
  categoriesCloseToBudget: { categoryName: string; percentUsed: number; spent: number; budgetAmount: number }[];
  categoriesOverBudget: { categoryName: string; percentUsed: number; spent: number; budgetAmount: number }[];
  possibleMoneyLeaks: {
    description: string;
    categoryName: string;
    occurrences: number;
    total: number;
    reason: string;
  }[];
}

export type SavingsConfidence = 'high' | 'medium' | 'low';

export interface SavingsOpportunity {
  id: string;
  type: 'category' | 'subscription' | 'budget';
  title: string;
  categoryName: string | null;
  estimatedSavings: number;
  confidence: SavingsConfidence;
  reason: string;
}

export type BudgetStatus = 'within_budget' | 'close_to_limit' | 'over_budget' | 'no_budget';

export interface BudgetHealthItem {
  categoryName: string;
  budgetAmount: number;
  spent: number;
  percentUsed: number;
  remaining: number;
  status: BudgetStatus;
  color: string;
}

export interface BudgetHealth {
  hasBudgets: boolean;
  monthly: {
    totalBudget: number;
    totalSpent: number;
    percentUsed: number;
    remaining: number;
    status: BudgetStatus;
  };
  counts: Record<BudgetStatus, number>;
  categories: BudgetHealthItem[];
}

export interface AiSummary {
  shortSummary: string;
  detailedExplanation: string;
  actions: string[];
  generatedAt?: string;
  model?: string;
}

export interface DashboardData {
  period: string;
  periodKey: string;
  periodStart: string;
  periodEnd: string;
  hasData: boolean;
  hasBudgets: boolean;
  lastCalculatedAt: string;
  fromCache: boolean;
  snapshot: DashboardSnapshot;
  categoryBreakdown: CategoryBreakdownItem[];
  pieChart: PieSlice[];
  spendingDrivers: SpendingDrivers;
  savingsOpportunities: SavingsOpportunity[];
  savingsSummary: { totalEstimatedSavings: number; percentOfExpenses: number };
  budgetHealth: BudgetHealth;
  aiSummary: AiSummary | null;
}

export interface DashboardApiResponse {
  success: boolean;
  data: DashboardData;
  message: string;
}

/** Streaming summary event handlers (SSE). */
export interface SummaryStreamHandlers {
  onDelta?: (fullText: string) => void;
  onDone?: (summary: AiSummary | null) => void;
  onError?: (error: Error) => void;
  /** Fired when the runtime cannot stream — caller should fetch the buffered summary. */
  onUnsupported?: () => void;
}
