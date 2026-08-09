import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getActiveTerminal,
  openTerminal,
  closeTerminal,
  createBorrowerOtp,
  verifyBorrowerOtp,
  lookupQrForCounter,
  borrowCopy,
  returnCopy,
  getTerminalHistory,
} from '../services/borrow.service'

const borrowKeys = {
  terminal: () => ['terminal'] as const,
  terminalHistory: () => ['terminal', 'history'] as const,
}

// ============================================================================
// Terminal Management
// ============================================================================

export function useActiveTerminal() {
  return useQuery({
    queryKey: borrowKeys.terminal(),
    queryFn: getActiveTerminal,
    refetchInterval: 30_000,
  })
}

export function useOpenTerminal() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (notes?: string) => openTerminal(notes),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: borrowKeys.terminal() })
      void queryClient.invalidateQueries({ queryKey: borrowKeys.terminalHistory() })
    },
  })
}

export function useCloseTerminal() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (sessionId: string) => closeTerminal(sessionId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: borrowKeys.terminal() })
      void queryClient.invalidateQueries({ queryKey: borrowKeys.terminalHistory() })
    },
  })
}

export function useTerminalHistory() {
  return useQuery({
    queryKey: borrowKeys.terminalHistory(),
    queryFn: getTerminalHistory,
  })
}

// ============================================================================
// Borrower OTP
// ============================================================================

export function useCreateBorrowerOtp() {
  return useMutation({
    mutationFn: ({ email, terminalId }: { email: string; terminalId: string }) =>
      createBorrowerOtp(email, terminalId),
  })
}

export function useVerifyBorrowerOtp() {
  return useMutation({
    mutationFn: ({ sessionId, otp }: { sessionId: string; otp: string }) =>
      verifyBorrowerOtp(sessionId, otp),
  })
}

// ============================================================================
// QR Lookup
// ============================================================================

export function useLookupQr() {
  return useMutation({
    mutationFn: (qrUid: string) => lookupQrForCounter(qrUid),
  })
}

// ============================================================================
// Borrow / Return
// ============================================================================

export function useBorrowItem() {
  return useMutation({
    mutationFn: ({
      sessionToken,
      copyId,
      dueDays,
    }: {
      sessionToken: string
      copyId: string
      dueDays?: number
    }) => borrowCopy(sessionToken, copyId, dueDays),
  })
}

export function useReturnItem() {
  return useMutation({
    mutationFn: ({
      sessionToken,
      copyId,
    }: {
      sessionToken: string
      copyId: string
    }) => returnCopy(sessionToken, copyId),
  })
}
