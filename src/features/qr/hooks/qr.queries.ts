import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
} from '@tanstack/react-query'
import {
  getQrCodes,
  getQrByUid,
  getQrByCopyId,
  getUnlinkedCopies,
  generateQrForCopy,
  bulkGenerateQr,
  reprintQr,
  replaceQr,
  getQrLabels,
} from '../services/qr.service'
import type { QrCode, QrCodeWithRelations, QrLabel } from '../types'

// ============================================================================
// Query Keys
// ============================================================================

const qrKeys = {
  all: ['qr-codes'] as const,
  list: (params: Record<string, unknown>) => [...qrKeys.all, 'list', params] as const,
  uid: (uid: string) => [...qrKeys.all, 'uid', uid] as const,
  copy: (copyId: string) => [...qrKeys.all, 'copy', copyId] as const,
  unlinked: ['unlinked-copies'] as const,
  labels: (ids: string[]) => [...qrKeys.all, 'labels', ids] as const,
}

// ============================================================================
// Queries
// ============================================================================

interface UseQrCodesParams {
  page?: number
  pageSize?: number
  search?: string
  activeOnly?: boolean
}

export function useQrCodes(params: UseQrCodesParams = {}) {
  const { page = 1, pageSize = 25, search, activeOnly = true } = params

  return useQuery({
    queryKey: qrKeys.list({ page, pageSize, search, activeOnly }),
    queryFn: () =>
      getQrCodes({
        pagination: { page, pageSize },
        search,
        activeOnly,
      }),
  })
}

export function useQrByUid(
  uid: string,
  options?: Partial<UseQueryOptions<QrCodeWithRelations | null>>,
) {
  return useQuery({
    queryKey: qrKeys.uid(uid),
    queryFn: () => getQrByUid(uid),
    enabled: Boolean(uid),
    ...options,
  })
}

export function useQrByCopyId(copyId: string) {
  return useQuery({
    queryKey: qrKeys.copy(copyId),
    queryFn: () => getQrByCopyId(copyId),
    enabled: Boolean(copyId),
  })
}

export function useUnlinkedCopies() {
  return useQuery({
    queryKey: qrKeys.unlinked,
    queryFn: getUnlinkedCopies,
  })
}

export function useQrLabels(qrIds: string[]) {
  return useQuery({
    queryKey: qrKeys.labels(qrIds),
    queryFn: () => getQrLabels(qrIds),
    enabled: qrIds.length > 0,
  })
}

// ============================================================================
// Mutations
// ============================================================================

export function useGenerateQr() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (copyId: string) => generateQrForCopy(copyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qrKeys.all })
      queryClient.invalidateQueries({ queryKey: qrKeys.unlinked })
    },
  })
}

export function useBulkGenerateQr() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (copyIds: string[]) => bulkGenerateQr(copyIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qrKeys.all })
      queryClient.invalidateQueries({ queryKey: qrKeys.unlinked })
    },
  })
}

export function useReprintQr() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (qrId: string) => reprintQr(qrId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: qrKeys.all })
      queryClient.invalidateQueries({ queryKey: qrKeys.uid(data.qr_uid) })
    },
  })
}

export function useReplaceQr() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (qrId: string) => replaceQr(qrId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qrKeys.all })
      queryClient.invalidateQueries({ queryKey: qrKeys.unlinked })
    },
  })
}
