import { useQuery } from '@tanstack/react-query'
import {
  getValuationReport,
  getBorrowingActivityReport,
  getOverdueLoansReport,
  getLostDamagedReport,
  type ReportDateFilter,
} from '../services/reports.service'

export const reportKeys = {
  all: ['reports'] as const,
  valuation: (filter?: ReportDateFilter) => [...reportKeys.all, 'valuation', filter] as const,
  borrowing: (start?: string, end?: string) => [...reportKeys.all, 'borrowing', { start, end }] as const,
  overdue: (filter?: ReportDateFilter) => [...reportKeys.all, 'overdue', filter] as const,
  lostDamaged: (filter?: ReportDateFilter) => [...reportKeys.all, 'lostDamaged', filter] as const,
}

export function useValuationReport(filter?: ReportDateFilter) {
  return useQuery({
    queryKey: reportKeys.valuation(filter),
    queryFn: () => getValuationReport(filter),
  })
}

export function useBorrowingReport(startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: reportKeys.borrowing(startDate, endDate),
    queryFn: () => getBorrowingActivityReport(startDate, endDate),
  })
}

export function useOverdueReport(filter?: ReportDateFilter) {
  return useQuery({
    queryKey: reportKeys.overdue(filter),
    queryFn: () => getOverdueLoansReport(filter),
  })
}

export function useLostDamagedReport(filter?: ReportDateFilter) {
  return useQuery({
    queryKey: reportKeys.lostDamaged(filter),
    queryFn: () => getLostDamagedReport(filter),
  })
}
