import type { InventoryCopy, InventoryItem, Category, Location } from '@/features/inventory/types'
import type { PaginationParams, SortParams } from '@/types'

export type TransactionType = 'borrow' | 'return' | 'lost' | 'damaged'

export interface Transaction {
  id: string
  type: TransactionType
  copy_id: string
  borrower_email: string
  borrower_session_id: string | null
  terminal_session_id: string | null
  borrowed_at: string | null
  returned_at: string | null
  due_date: string | null
  notes: string | null
  created_at: string
  updated_at: string
  created_by: string | null
}

export interface TransactionWithDetails extends Transaction {
  copy: (InventoryCopy & {
    item: (InventoryItem & { category: Category | null }) | null
    location: Location | null
  }) | null
}

export interface TransactionFilterParams {
  pagination?: PaginationParams
  sort?: SortParams
  type?: TransactionType | 'all' | 'active_borrow' | 'overdue'
  search?: string
  startDate?: string
  endDate?: string
}

export interface GetTransactionsResult {
  data: TransactionWithDetails[]
  total: number
}

export interface AdminOverridePayload {
  copyId: string
  notes?: string
}
