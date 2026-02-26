/**
 * Category Service
 * API-only: all operations go through the backend
 */

import api from '@/services/api';
import { API_ENDPOINTS } from '@/config/api';
import type { Category, CategoryInput, CategoryResponse, GroupedCategories } from './category.types';

function mapCategoryFromApi(c: any): Category {
  return {
    id: c._id ?? c.id,
    serverId: c._id ?? c.id,
    name: c.name,
    type: c.type,
    icon: c.icon ?? 'folder',
    color: c.color ?? '#3498db',
    source: c.source ?? 'user',
    isActive: c.isActive ?? true,
    synced: true,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
  };
}

/**
 * Fetch categories from server
 */
export const fetchCategoriesFromServer = async (type?: 'income' | 'expense'): Promise<CategoryResponse> => {
  const params = type ? { type } : {};
  const response = await api.get(API_ENDPOINTS.CATEGORIES.BASE, { params });
  return response.data;
};

/**
 * Get categories from API
 */
export const getLocalCategories = async (type?: 'income' | 'expense'): Promise<Category[]> => {
  try {
    const response = await fetchCategoriesFromServer(type);
    const data = response.data;
    if (!data) return [];

    const categories = data.categories;
    if (!categories) return [];

    if (Array.isArray(categories)) {
      return categories.map(mapCategoryFromApi);
    }
    const grouped = categories as { income: any[]; expense: any[] };
    const all = [...(grouped.income ?? []), ...(grouped.expense ?? [])];
    return all.map(mapCategoryFromApi);
  } catch (error) {
    console.error('Error fetching categories:', error);
    throw error;
  }
};

/**
 * Get grouped categories (income and expense)
 */
export const getGroupedCategories = async (): Promise<GroupedCategories> => {
  const response = await fetchCategoriesFromServer();
  const data = response.data;
  if (!data?.categories) {
    return { income: [], expense: [] };
  }

  const categories = data.categories;
  if (Array.isArray(categories)) {
    return {
      income: categories.filter((c: any) => c.type === 'income').map(mapCategoryFromApi),
      expense: categories.filter((c: any) => c.type === 'expense').map(mapCategoryFromApi),
    };
  }

  const grouped = categories as { income: any[]; expense: any[] };
  return {
    income: (grouped.income ?? []).map(mapCategoryFromApi),
    expense: (grouped.expense ?? []).map(mapCategoryFromApi),
  };
};

/**
 * Sync categories from server (refetch - no local DB)
 */
export const syncCategories = async (): Promise<void> => {
  await fetchCategoriesFromServer();
};

/**
 * Create a new category
 */
export const createCategory = async (input: CategoryInput): Promise<Category> => {
  const response = await api.post(API_ENDPOINTS.CATEGORIES.BASE, {
    name: input.name.trim(),
    type: input.type,
    icon: input.icon ?? 'folder',
    color: input.color ?? '#3498db',
  });

  if (!response.data.success || !response.data.data?.category) {
    throw new Error(response.data?.message ?? 'Failed to create category');
  }

  return mapCategoryFromApi(response.data.data.category);
};

/**
 * Delete a category (soft delete via disable)
 */
export const deleteCategory = async (categoryId: string): Promise<void> => {
  await api.patch(`${API_ENDPOINTS.CATEGORIES.BASE}/${categoryId}/disable`);
};
