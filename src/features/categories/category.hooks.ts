/**
 * Category Hooks
 * React Query hooks for category operations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getLocalCategories,
  getGroupedCategories,
  syncCategories,
  createCategory,
  deleteCategory,
} from './category.service';
import type { CategoryInput } from './category.types';

/**
 * Hook to fetch categories (offline-first)
 */
export const useCategories = (type?: 'income' | 'expense') => {
  return useQuery({
    queryKey: ['categories', type],
    queryFn: () => getLocalCategories(type),
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
  });
};

/**
 * Hook to fetch grouped categories
 */
export const useGroupedCategories = () => {
  return useQuery({
    queryKey: ['categories', 'grouped'],
    queryFn: getGroupedCategories,
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Hook to sync categories from server
 */
export const useSyncCategories = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: syncCategories,
    onSuccess: () => {
      // Invalidate all category queries to refetch
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
    onError: (error) => {
      console.error('Category sync error:', error);
    },
  });
};

/**
 * Hook to create a new category
 */
export const useCreateCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CategoryInput) => createCategory(input),
    onSuccess: () => {
      // Invalidate category queries
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
    onError: (error) => {
      console.error('Create category error:', error);
    },
  });
};

/**
 * Hook to delete a category
 */
export const useDeleteCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (categoryId: string) => deleteCategory(categoryId),
    onSuccess: () => {
      // Invalidate category queries
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
    onError: (error) => {
      console.error('Delete category error:', error);
    },
  });
};
