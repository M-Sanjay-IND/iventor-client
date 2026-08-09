import { supabase } from '@/services/supabase'
import type { TerminalSession, Transaction, QrLookupResult, ActiveLoan } from '../types'

// ============================================================================
// Terminal Management
// ============================================================================

export async function getActiveTerminal(): Promise<TerminalSession | null> {
  const { data, error } = await supabase.rpc('get_active_terminal')

  if (error) throw new BorrowServiceError(error.message, 'TERMINAL_FETCH_FAILED')
  if (!data || (Array.isArray(data) && data.length === 0)) return null

  return (Array.isArray(data) ? data[0] : data) as TerminalSession
}

export async function openTerminal(notes?: string): Promise<string> {
  const { data, error } = await supabase.rpc('open_terminal', {
    p_notes: notes ?? null,
  })

  if (error) throw new BorrowServiceError(error.message, 'TERMINAL_OPEN_FAILED')
  return data as string
}

export async function closeTerminal(sessionId: string): Promise<void> {
  const { error } = await supabase.rpc('close_terminal', {
    p_session_id: sessionId,
  })

  if (error) throw new BorrowServiceError(error.message, 'TERMINAL_CLOSE_FAILED')
}

// ============================================================================
// Borrower OTP
// ============================================================================

export interface CreateOtpResult {
  session_id: string
  otp: string
}

export async function createBorrowerOtp(
  email: string,
  terminalId: string,
): Promise<CreateOtpResult> {
  const { data, error } = await supabase.rpc('create_borrower_otp', {
    p_email: email,
    p_terminal_id: terminalId,
  })

  if (error) throw new BorrowServiceError(error.message, 'OTP_CREATE_FAILED')
  return data as CreateOtpResult
}

export async function verifyBorrowerOtp(
  sessionId: string,
  otp: string,
): Promise<string> {
  const { data, error } = await supabase.rpc('verify_borrower_otp', {
    p_session_id: sessionId,
    p_otp: otp,
  })

  if (error) throw new BorrowServiceError(error.message, 'OTP_VERIFY_FAILED')
  return data as string
}

// ============================================================================
// QR Lookup
// ============================================================================

export async function lookupQrForCounter(qrUid: string): Promise<QrLookupResult> {
  const { data, error } = await supabase.rpc('lookup_qr_for_counter', {
    p_qr_uid: qrUid.trim().toUpperCase(),
  })

  if (error) throw new BorrowServiceError(error.message, 'QR_LOOKUP_FAILED')
  return data as QrLookupResult
}

// ============================================================================
// Borrow / Return
// ============================================================================

export async function borrowCopy(
  sessionToken: string,
  copyId: string,
  dueDays?: number,
): Promise<Transaction> {
  const { data, error } = await supabase.rpc('borrow_copy', {
    p_session_token: sessionToken,
    p_copy_id: copyId,
    p_due_days: dueDays && dueDays > 0 ? dueDays : null,
  })

  if (error) throw new BorrowServiceError(error.message, 'BORROW_FAILED')
  return data as Transaction
}

export async function returnCopy(
  sessionToken: string,
  copyId: string,
): Promise<Transaction> {
  const { data, error } = await supabase.rpc('return_copy', {
    p_session_token: sessionToken,
    p_copy_id: copyId,
  })

  if (error) throw new BorrowServiceError(error.message, 'RETURN_FAILED')
  return data as Transaction
}

export async function bulkBorrowCopies(
  sessionToken: string,
  copyIds?: string[],
  dueDays?: number,
  qrUids?: string[],
): Promise<Transaction[]> {
  const { data, error } = await supabase.rpc('bulk_borrow_copies', {
    p_session_token: sessionToken,
    p_copy_ids: copyIds && copyIds.length > 0 ? copyIds : null,
    p_due_days: dueDays && dueDays > 0 ? dueDays : null,
    p_qr_uids: qrUids && qrUids.length > 0 ? qrUids : null,
  })

  if (error) throw new BorrowServiceError(error.message, 'BULK_BORROW_FAILED')
  return (data ?? []) as Transaction[]
}

export async function bulkReturnCopies(
  sessionToken: string,
  copyIds?: string[],
  qrUids?: string[],
): Promise<Transaction[]> {
  const { data, error } = await supabase.rpc('bulk_return_copies', {
    p_session_token: sessionToken,
    p_copy_ids: copyIds && copyIds.length > 0 ? copyIds : null,
    p_qr_uids: qrUids && qrUids.length > 0 ? qrUids : null,
  })

  if (error) throw new BorrowServiceError(error.message, 'BULK_RETURN_FAILED')
  return (data ?? []) as Transaction[]
}

export async function getBorrowerActiveLoans(sessionToken: string): Promise<ActiveLoan[]> {
  const { data, error } = await supabase.rpc('get_borrower_active_loans', {
    p_session_token: sessionToken,
  })

  if (error) throw new BorrowServiceError(error.message, 'ACTIVE_LOANS_FETCH_FAILED')
  return (data ?? []) as ActiveLoan[]
}

// ============================================================================
// Terminal History (Admin)
// ============================================================================

export async function getTerminalHistory(): Promise<TerminalSession[]> {
  const { data, error } = await supabase
    .from('terminal_sessions')
    .select('*')
    .order('opened_at', { ascending: false })
    .limit(50)

  if (error) throw new BorrowServiceError(error.message, 'TERMINAL_HISTORY_FAILED')
  return (data ?? []) as TerminalSession[]
}

// ============================================================================
// Error Class
// ============================================================================

export class BorrowServiceError extends Error {
  readonly code: string

  constructor(message: string, code: string) {
    super(message)
    this.name = 'BorrowServiceError'
    this.code = code
  }
}
