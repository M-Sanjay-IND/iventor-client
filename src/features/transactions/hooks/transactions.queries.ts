import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getTransactions,
  getCopyTransactions,
  markCopyLost,
  markCopyDamaged,
  adminForceReturn,
} from '../services/transactions.service'
import type { TransactionFilterParams, AdminOverridePayload } from '../types'

export const transactionKeys = {
  all: ['transactions'] as const,
  lists: () => [...transactionKeys.all, 'list'] as const,
  list: (params: TransactionFilterParams) => [...transactionKeys.lists(), params] as const,
  copy: (copyId: string) => [...transactionKeys.all, 'copy', copyId] as const,
}

export function useTransactions(params: TransactionFilterParams = {}) {
  return useQuery({
    queryKey: transactionKeys.list(params),
    queryFn: () => getTransactions(params),
  })
}

export function useCopyTransactions(copyId: string) {
  return useQuery({
    queryKey: transactionKeys.copy(copyId),
    queryFn: () => getCopyTransactions(copyId),
    enabled: Boolean(copyId),
  })
}

export function useMarkCopyLost() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ copyId, notes }: AdminOverridePayload) => markCopyLost(copyId, notes),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: transactionKeys.all })
      void queryClient.invalidateQueries({ queryKey: ['inventory'] })
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

export function useMarkCopyDamaged() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ copyId, notes }: AdminOverridePayload) => markCopyDamaged(copyId, notes),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: transactionKeys.all })
      void queryClient.invalidateQueries({ queryKey: ['inventory'] })
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

export function useAdminForceReturn() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ copyId, notes }: AdminOverridePayload) => adminForceReturn(copyId, notes),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: transactionKeys.all })
      void queryClient.invalidateQueries({ queryKey: ['inventory'] })
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}
