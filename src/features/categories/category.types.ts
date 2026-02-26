/**
 * Category Types
 */

export interface Category {
  id: string;
  serverId?: string;
  name: string;
  type: 'income' | 'expense';
  icon: string;
  color: string;
  source: 'system' | 'user';
  isActive: boolean;
  synced: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CategoryInput {
  name: string;
  type: 'income' | 'expense';
  icon?: string;
  color?: string;
}

export interface CategoryResponse {
  success: boolean;
  data: {
    category?: Category;
    categories?: {
      income: Category[];
      expense: Category[];
    } | Category[];
    total?: number;
    income?: number;
    expense?: number;
  };
  message?: string;
}

export interface GroupedCategories {
  income: Category[];
  expense: Category[];
}
