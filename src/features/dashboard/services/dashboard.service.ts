import { supabase } from '@/services/supabase'
import type { DashboardData, DashboardStats } from '../types'
import type { TransactionWithDetails } from '@/features/transactions/types'

export async function getDashboardData(): Promise<DashboardData> {
  // 1. Fetch total items & valuation
  const { data: items, error: itemsErr } = await supabase
    .from('inventory_items')
    .select('id, unit_value')
    .is('deleted_at', null)

  if (itemsErr) throw new Error(itemsErr.message)

  const totalItems = items?.length ?? 0
  const itemMap = new Map<string, number>()
  for (const item of (items ?? [])) {
    itemMap.set(item.id, Number(item.unit_value ?? 0))
  }

  // 2. Fetch copy stats
  const { data: copies, error: copiesErr } = await supabase
    .from('inventory_copies')
    .select('id, item_id, status')
    .is('deleted_at', null)

  if (copiesErr) throw new Error(copiesErr.message)

  let totalCopies = 0
  let availableCopies = 0
  let activeBorrows = 0
  let totalValuation = 0

  for (const copy of (copies ?? [])) {
    totalCopies++
    const unitVal = itemMap.get(copy.item_id) ?? 0
    totalValuation += unitVal

    if (copy.status === 'available') availableCopies++
    else if (copy.status === 'borrowed') activeBorrows++
  }

  // 3. Count overdue loans
  const nowIso = new Date().toISOString()
  const { count: overdueCount } = await supabase
    .from('transactions')
    .select('id', { count: 'exact', head: true })
    .eq('type', 'borrow')
    .lt('due_date', nowIso)
    .is('returned_at', null)

  // 4. Count categories & locations
  const { count: categoriesCount } = await supabase
    .from('categories')
    .select('id', { count: 'exact', head: true })
    .is('deleted_at', null)

  const { count: locationsCount } = await supabase
    .from('locations')
    .select('id', { count: 'exact', head: true })
    .is('deleted_at', null)

  // 5. Fetch recent 6 transactions with relations
  const { data: recentTxs } = await supabase
    .from('transactions')
    .select('*, copy:inventory_copies(*, item:inventory_items(*, category:categories(*)), location:locations(*))')
    .order('created_at', { ascending: false })
    .limit(6)

  // 6. Check active terminal status
  const { data: terminal } = await supabase.rpc('get_active_terminal')
  const activeTerminalOpen = Boolean(terminal && (!Array.isArray(terminal) || terminal.length > 0))

  const stats: DashboardStats = {
    totalItems,
    totalCopies,
    availableCopies,
    activeBorrows,
    overdueLoans: overdueCount ?? 0,
    totalValuation,
    categoriesCount: categoriesCount ?? 0,
    locationsCount: locationsCount ?? 0,
  }

  return {
    stats,
    recentTransactions: (recentTxs ?? []) as unknown as TransactionWithDetails[],
    activeTerminalOpen,
  }
}
