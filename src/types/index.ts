/**
 * Global TypeScript Types
 */

export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;

export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
}

// Re-export dashboard types
export * from './dashboard.types';
