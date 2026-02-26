export interface BudgetResponse {
  monthlyBudgetLimit: number | null;
  currency: string;
}

export interface ApiBudgetResponse {
  success: boolean;
  data: BudgetResponse;
  message: string;
  timestamp: string;
}
