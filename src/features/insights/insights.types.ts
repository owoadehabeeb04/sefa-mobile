import type { ApiResponse } from '@/features/auth/auth.types';

export interface InsightSummary {
  headline: string;
  narrative: string;
  keyTakeaway: string;
  nextBestAction: string;
}

export interface HealthSubScore {
  key: string;
  label: string;
  score: number;
  status: 'excellent' | 'good' | 'fair' | 'needs_attention' | string;
  reason: string;
}

export interface HealthScore {
  generatedAt: string;
  overallScore: number;
  previousOverallScore: number;
  trend: 'improving' | 'stable' | 'declining' | string;
  summary: string;
  subScores: HealthSubScore[];
  confidence: number;
}

export interface ForecastCategoryRisk {
  categoryName: string;
  currentSpend: number;
  projectedSpend: number;
  budgetAmount: number | null;
  transactionCount: number;
  breachProbability: number | null;
  status: string;
}

export interface DailyForecastPoint {
  date: string;
  projectedIncome: number;
  projectedExpenses: number;
  projectedNet: number;
}

export interface ForecastBacktest {
  horizonDays: number;
  maeExpense: number;
  maeIncome: number;
  mapeExpense: number;
  mapeIncome: number;
}

export interface ForecastData {
  generatedAt: string;
  horizonDays: number;
  currentMonth: {
    income: number;
    expenses: number;
    net: number;
    budgetLimit: number | null;
    spendingRate: number | null;
  };
  projectedIncome: number;
  projectedExpenses: number;
  projectedNetCashFlow: number;
  projectedMonthEndIncome: number;
  projectedMonthEndExpenses: number;
  projectedMonthEndBalance: number;
  overspendingProbability: number;
  likelyBudgetBreachCategories: ForecastCategoryRisk[];
  categoryForecasts: ForecastCategoryRisk[];
  dailyForecast: DailyForecastPoint[];
  backtest: ForecastBacktest | null;
  headline: string;
  confidence: number;
}

export interface InsightAnomalyAlert {
  id: string;
  type: string;
  title: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | string;
  confidence: number;
  why?: Record<string, unknown>;
  riskTag: 'possible_fraud' | 'possible_error' | 'likely_genuine' | string;
  recommendedAction: string;
}

export interface InsightEvidenceCard {
  id: string;
  title: string;
  type: string;
  insight: string;
  why: string;
  dataWindow: string;
  confidence: number;
  metrics?: Record<string, unknown>;
  recommendedAction?: string;
}

export interface PersonaSummary {
  label: string;
  title: string;
  reason: string;
  confidence: number;
}

export interface BehaviorPatterns {
  generatedAt: string;
  persona: PersonaSummary;
  paydayPattern: {
    detected: boolean;
    postPaydayRatio: number;
    averageThreeDaySpendAfterIncome: number;
    summary: string;
  };
  weekendVsWeekday: {
    weekendAverage: number;
    weekdayAverage: number;
    bias: string;
    ratio: number;
    summary: string;
  };
  subscriptionCreep: {
    subscriptionCount: number;
    estimatedMonthlyTotal: number;
    summary: string;
    items: {
      description: string;
      monthlyAmount: number;
      occurrences: number;
      summary: string;
    }[];
  };
  recurringLeakage: {
    monthlyLeakage: number;
    summary: string;
    items: {
      key: string;
      description: string;
      monthlyLeakage: number;
      frequency: number;
      averageAmount: number;
      categoryName: string;
    }[];
  };
  highRiskCategories: {
    categoryName: string;
    total: number;
    shareOfSpend: number;
  }[];
  nudges: string[];
  confidence: number;
}

export interface InsightAction {
  id: string;
  title: string;
  action: string;
  impact: number;
  confidence: number;
}

export interface InsightsLinePoint {
  x: number;
  y: number;
  amount: number;
  date: string;
  label: string;
  tickLabel: string;
}

export interface InsightsVisualCategory {
  categoryName: string;
  amount: number;
  percentage: number;
  color: string;
  budgetAmount: number | null;
  status: string;
}

export interface InsightsVisualBudgetUsage {
  categoryName: string;
  spent: number;
  budgetAmount: number;
  percentUsed: number;
  status: string;
  color: string;
}

export interface InsightsVisualMainUpdate {
  message: string;
  supportingText: string;
  projectedMonthEndBalance: number;
  actionText: string;
  sparkline: InsightsLinePoint[];
  status: 'healthy' | 'watch' | 'at_risk' | string;
}

export interface InsightsHubVisuals {
  mainUpdate: InsightsVisualMainUpdate;
  spendingBreakdown: {
    totalCurrentMonthSpending: number;
    categories: InsightsVisualCategory[];
  };
  spendingTrend: {
    actualSeries: InsightsLinePoint[];
    forecastSeries: InsightsLinePoint[];
    direction: 'rising' | 'falling' | 'steady' | string;
  };
  incomeVsExpense: {
    periods: {
      label: string;
      fullLabel: string;
      income: number;
      expenses: number;
      balance: number;
    }[];
  };
  budgetUsage: InsightsVisualBudgetUsage[];
  savingsActions: InsightAction[];
  thingsToCheck: InsightAnomalyAlert[];
}

export interface InsightTextSection {
  title: string;
  lines: string[];
  action: string;
}

export interface InsightAskSefaSection extends InsightTextSection {
  prompts: string[];
}

export interface InsightsHubTextView {
  mainUpdate: InsightTextSection;
  thingsToCheck: InsightTextSection;
  whereMoneyGoes: InsightTextSection;
  thisMonthTrend: InsightTextSection;
  waysToSave: InsightTextSection;
  askSefa: InsightAskSefaSection;
}

export interface InsightsHubData {
  generatedAt: string;
  summary: InsightSummary;
  healthScore: HealthScore;
  subScores: HealthSubScore[];
  forecast: ForecastData;
  anomalies: {
    summary: {
      totalAnomalies: number;
      critical: number;
      high: number;
      medium: number;
      low: number;
    };
    alerts: InsightAnomalyAlert[];
    recommendations: {
      priority: string;
      message: string;
      action: string;
    }[];
  };
  behaviorPatterns: BehaviorPatterns;
  recommendations: {
    budgetActions: InsightAction[];
    savingsActions: InsightAction[];
    weeklyNudges: string[];
    nextBestAction: string;
  };
  visuals: InsightsHubVisuals;
  textView: InsightsHubTextView;
  confidence: number;
  evidence: InsightEvidenceCard[];
  suggestedQuestions: string[];
  researchMetrics: {
    forecastMAE: number;
    forecastMAPE: number;
    anomalyCount: number;
    estimatedMonthlySavings: number;
    totalIncome: number;
    totalExpenses: number;
  };
}

export interface CopilotResponse {
  sessionId: string;
  answer: string;
  evidenceCards: InsightEvidenceCard[];
  confidence: number;
  actions: string[];
  suggestedQuestions: string[];
}

export interface WhatIfRequest {
  days?: 7 | 30;
  categoryName?: string;
  reductionPercent?: number;
  incomeChangePercent?: number;
  adjustments?: {
    type: 'category_reduction' | 'income_change';
    categoryName?: string;
    percent: number;
  }[];
}

export interface WhatIfResponse {
  baseline: {
    projectedIncome: number;
    projectedExpenses: number;
    projectedMonthEndBalance: number;
  };
  scenario: {
    projectedIncome: number;
    projectedExpenses: number;
    projectedNetCashFlow: number;
    projectedMonthEndBalance: number;
    assumptions: string[];
  };
  delta: {
    projectedIncome: number;
    projectedExpenses: number;
    projectedMonthEndBalance: number;
  };
  explanation: string;
  confidence: number;
}

export interface InsightFeedbackRequest {
  sessionId?: string;
  insightKey: string;
  insightType: string;
  rating: 'helpful' | 'not_helpful' | 'wrong' | 'already_knew' | 'took_action';
  comment?: string;
  metadata?: Record<string, unknown>;
}

export type InsightsHubApiResponse = ApiResponse<InsightsHubData>;
export type HealthScoreApiResponse = ApiResponse<HealthScore>;
export type ForecastApiResponse = ApiResponse<ForecastData>;
export type CopilotApiResponse = ApiResponse<CopilotResponse>;
export type WhatIfApiResponse = ApiResponse<WhatIfResponse>;
export type InsightFeedbackApiResponse = ApiResponse<Record<string, unknown>>;
