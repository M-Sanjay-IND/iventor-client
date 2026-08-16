import { useQuery } from '@tanstack/react-query'
import { getDashboardData } from '../services/dashboard.service'

export function useDashboardData() {
  return useQuery({
    queryKey: ['dashboard', 'summary'],
    queryFn: getDashboardData,
    refetchInterval: 15_000, // auto-refresh dashboard every 15s
  })
}
