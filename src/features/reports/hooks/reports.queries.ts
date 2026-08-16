import { useQuery } from '@tanstack/react-query'
import {
  getValuationReport,
  getBorrowingActivityReport,
  getOverdueLoansReport,
  getLostDamagedReport,
} from '../services/reports.service'

export const reportKeys = {
  all: ['reports'] as const,
  valuation: () => [...reportKeys.all, 'valuation'] as const,
  borrowing: (start?: string, end?: string) => [...reportKeys.all, 'borrowing', { start, end }] as const,
  overdue: () => [...reportKeys.all, 'overdue'] as const,
  lostDamaged: () => [...reportKeys.all, 'lostDamaged'] as const,
}

export function useValuationReport() {
  return useQuery({
    queryKey: reportKeys.valuation(),
    queryFn: getValuationReport,
  })
}

export function useBorrowingReport(startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: reportKeys.borrowing(startDate, endDate),
    queryFn: () => getBorrowingActivityReport(startDate, endDate),
  })
}

export function useOverdueReport() {
  return useQuery({
    queryKey: reportKeys.overdue(),
    queryFn: getOverdueLoansReport,
  })
}

export function useLostDamagedReport() {
  return useQuery({
    queryKey: reportKeys.lostDamaged(),
    queryFn: getLostDamagedReport,
  })
}
