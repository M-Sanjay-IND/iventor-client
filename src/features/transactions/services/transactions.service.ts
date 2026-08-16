import { supabase } from '@/services/supabase'
import { DEFAULT_PAGE_SIZE } from '@/constants'
import type {
  TransactionWithDetails,
  TransactionFilterParams,
  GetTransactionsResult,
  Transaction,
} from '../types'

export async function getTransactions(
  params: TransactionFilterParams = {},
): Promise<GetTransactionsResult> {
  const {
    pagination = { page: 1, pageSize: DEFAULT_PAGE_SIZE },
    sort = { column: 'created_at', direction: 'desc' },
    type,
    search,
    startDate,
    endDate,
  } = params

  const from = (pagination.page - 1) * pagination.pageSize
  const to = from + pagination.pageSize - 1

  let query = supabase
    .from('transactions')
    .select(
      `*, copy:inventory_copies(*, item:inventory_items(*, category:categories(*)), location:locations(*))`,
      { count: 'exact' },
    )
    .range(from, to)
    .order(sort.column, { ascending: sort.direction === 'asc' })

  // Type & Status filters
  if (type && type !== 'all') {
    if (type === 'active_borrow') {
      query = query.eq('type', 'borrow')
      // Note: active borrow copies are filtered where copy status is 'borrowed'
    } else if (type === 'overdue') {
      const nowIso = new Date().toISOString()
      query = query.eq('type', 'borrow').lt('due_date', nowIso).is('returned_at', null)
    } else {
      query = query.eq('type', type)
    }
  }

  // Date filters
  if (startDate) {
    query = query.gte('created_at', startDate)
  }
  if (endDate) {
    query = query.lte('created_at', endDate)
  }

  // Search by borrower email
  if (search) {
    query = query.ilike('borrower_email', `%${search}%`)
  }

  const { data, count, error } = await query

  if (error) throw new TransactionServiceError(error.message, 'TRANSACTIONS_FETCH_FAILED')

  return {
    data: (data ?? []) as unknown as TransactionWithDetails[],
    total: count ?? 0,
  }
}

export async function getCopyTransactions(copyId: string): Promise<TransactionWithDetails[]> {
  const { data, error } = await supabase
    .from('transactions')
    .select(
      `*, copy:inventory_copies(*, item:inventory_items(*, category:categories(*)), location:locations(*))`,
    )
    .eq('copy_id', copyId)
    .order('created_at', { ascending: false })

  if (error) throw new TransactionServiceError(error.message, 'COPY_TRANSACTIONS_FETCH_FAILED')
  return (data ?? []) as unknown as TransactionWithDetails[]
}

export async function markCopyLost(copyId: string, notes?: string): Promise<Transaction> {
  const { data: userRes } = await supabase.auth.getUser()
  const userId = userRes.user?.id ?? null
  const userEmail = userRes.user?.email ?? 'admin@system.local'

  // 1. Create 'lost' transaction record
  const { data: tx, error: txError } = await supabase
    .from('transactions')
    .insert({
      type: 'lost',
      copy_id: copyId,
      borrower_email: userEmail,
      notes: notes ?? 'Marked as lost by admin',
      created_by: userId,
    })
    .select()
    .single()

  if (txError) throw new TransactionServiceError(txError.message, 'MARK_LOST_FAILED')

  // 2. Update copy status to 'lost'
  const { error: copyError } = await supabase
    .from('inventory_copies')
    .update({ status: 'lost', condition: 'lost' })
    .eq('id', copyId)

  if (copyError) throw new TransactionServiceError(copyError.message, 'MARK_LOST_COPY_UPDATE_FAILED')

  return tx as Transaction
}

export async function markCopyDamaged(copyId: string, notes?: string): Promise<Transaction> {
  const { data: userRes } = await supabase.auth.getUser()
  const userId = userRes.user?.id ?? null
  const userEmail = userRes.user?.email ?? 'admin@system.local'

  // 1. Create 'damaged' transaction record
  const { data: tx, error: txError } = await supabase
    .from('transactions')
    .insert({
      type: 'damaged',
      copy_id: copyId,
      borrower_email: userEmail,
      notes: notes ?? 'Marked as damaged by admin',
      created_by: userId,
    })
    .select()
    .single()

  if (txError) throw new TransactionServiceError(txError.message, 'MARK_DAMAGED_FAILED')

  // 2. Update copy status to 'maintenance' and condition to 'damaged'
  const { error: copyError } = await supabase
    .from('inventory_copies')
    .update({ status: 'maintenance', condition: 'damaged' })
    .eq('id', copyId)

  if (copyError) throw new TransactionServiceError(copyError.message, 'MARK_DAMAGED_COPY_UPDATE_FAILED')

  return tx as Transaction
}

export async function adminForceReturn(copyId: string, notes?: string): Promise<Transaction> {
  const { data: userRes } = await supabase.auth.getUser()
  const userId = userRes.user?.id ?? null
  const userEmail = userRes.user?.email ?? 'admin@system.local'

  // 1. Create 'return' transaction record
  const { data: tx, error: txError } = await supabase
    .from('transactions')
    .insert({
      type: 'return',
      copy_id: copyId,
      borrower_email: userEmail,
      returned_at: new Date().toISOString(),
      notes: notes ?? 'Admin override return',
      created_by: userId,
    })
    .select()
    .single()

  if (txError) throw new TransactionServiceError(txError.message, 'FORCE_RETURN_FAILED')

  // 2. Update copy status back to 'available'
  const { error: copyError } = await supabase
    .from('inventory_copies')
    .update({ status: 'available' })
    .eq('id', copyId)

  if (copyError) throw new TransactionServiceError(copyError.message, 'FORCE_RETURN_COPY_UPDATE_FAILED')

  return tx as Transaction
}

export class TransactionServiceError extends Error {
  code: string
  constructor(message: string, code: string) {
    super(message)
    this.name = 'TransactionServiceError'
    this.code = code
  }
}
