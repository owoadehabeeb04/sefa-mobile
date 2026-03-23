export const MAX_SAFE_INCOME_AMOUNT = Number.MAX_SAFE_INTEGER / 100;

export const INCOME_AMOUNT_TOO_LARGE_MESSAGE = 'Amount is too large to process safely';

export const isSafeIncomeAmount = (amount: number) =>
  Number.isFinite(amount) && amount > 0 && amount <= MAX_SAFE_INCOME_AMOUNT;
