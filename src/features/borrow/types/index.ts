export interface TerminalSession {
  id: string
  opened_at: string
  closed_at: string | null
  opened_by: string
  closed_by: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface BorrowerSession {
  id: string
  terminal_id: string
  email: string
  otp_hash: string
  session_token: string | null
  status: 'pending' | 'active' | 'expired' | 'failed'
  attempts: number
  max_attempts: number
  expires_at: string
  created_at: string
  updated_at: string
}

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

export interface QrLookupResult {
  qr_uid: string
  item_id: string
  copy_id: string | null
  copy_number?: number | null
  status: string
  condition?: string | null
  item_name: string
  item_description: string | null
  category_name: string | null
  location_name: string | null
  total_copies: number
  available_copies: number
  borrowed_copies: number
}

export type CounterMode = 'borrow' | 'return'

export type SessionState =
  | 'idle'
  | 'otp_sent'
  | 'otp_verifying'
  | 'active'
  | 'expired'
