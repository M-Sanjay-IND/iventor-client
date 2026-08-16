import type { TransactionWithDetails } from '@/features/transactions/types'

export interface DashboardStats {
  totalItems: number
  totalCopies: number
  availableCopies: number
  activeBorrows: number
  overdueLoans: number
  totalValuation: number
  categoriesCount: number
  locationsCount: number
}

export interface DashboardData {
  stats: DashboardStats
  recentTransactions: TransactionWithDetails[]
  activeTerminalOpen: boolean
}
