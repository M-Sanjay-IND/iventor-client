/**
 * Global TypeScript type definitions.
 *
 * Domain-specific types live in their respective feature folders.
 * This file contains only cross-cutting types used across multiple features.
 */

/** Standard API success response */
export interface ApiResponse<T> {
  data: T
  count?: number
  message?: string
}

/** Standard API error response */
export interface ApiError {
  error: {
    code: string
    message: string
    details?: unknown
  }
}

/** Pagination parameters */
export interface PaginationParams {
  page: number
  pageSize: number
}

/** Paginated response wrapper */
export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

/** Sort direction */
export type SortDirection = 'asc' | 'desc'

/** Sort parameters */
export interface SortParams {
  column: string
  direction: SortDirection
}

/** Filter operator */
export type FilterOperator =
  | 'eq'
  | 'neq'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'like'
  | 'ilike'
  | 'in'
  | 'is'

/** Filter parameter */
export interface FilterParam {
  column: string
  operator: FilterOperator
  value: unknown
}

/** Base entity with standard audit fields */
export interface BaseEntity {
  id: string
  created_at: string
  updated_at: string
  deleted_at: string | null
  created_by: string | null
  updated_by: string | null
}

/** Select option for dropdowns */
export interface SelectOption {
  label: string
  value: string
  disabled?: boolean
}
