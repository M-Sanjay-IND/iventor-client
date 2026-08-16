import { supabase } from '@/services/supabase'
import type {
  ValuationReportData,
  BorrowingActivityItem,
  OverdueLoanItem,
  LostDamagedReportItem,
} from '../types'

export async function getValuationReport(): Promise<ValuationReportData> {
  // 1. Fetch items with category and copies
  const { data: items, error: itemError } = await supabase
    .from('inventory_items')
    .select('id, name, unit_value, category:categories(id, name), copies:inventory_copies(id, status, location:locations(name))')
    .is('deleted_at', null)

  if (itemError) throw new Error(itemError.message)

  let totalItems = 0
  let totalCopies = 0
  let availableCopies = 0
  let borrowedCopies = 0
  let lostCopies = 0
  let damagedCopies = 0
  let totalValue = 0

  const categoryMap = new Map<string, { item_count: number; copy_count: number; total_value: number }>()
  const locationMap = new Map<string, number>()

  for (const item of (items ?? [])) {
    totalItems++
    const itemUnitVal = Number(item.unit_value ?? 0)
    const cat = item.category as unknown as { name: string } | null
    const catName = cat?.name ?? 'Uncategorized'

    if (!categoryMap.has(catName)) {
      categoryMap.set(catName, { item_count: 0, copy_count: 0, total_value: 0 })
    }
    const catStat = categoryMap.get(catName)!
    catStat.item_count++

    const copies = (item.copies ?? []) as unknown as { id: string; status: string; location: { name: string } | null }[]
    for (const copy of copies) {
      totalCopies++
      totalValue += itemUnitVal
      catStat.copy_count++
      catStat.total_value += itemUnitVal

      if (copy.status === 'available') availableCopies++
      else if (copy.status === 'borrowed') borrowedCopies++
      else if (copy.status === 'lost') lostCopies++
      else if (copy.status === 'maintenance' || copy.status === 'damaged') damagedCopies++

      const locName = copy.location?.name ?? 'No Location'
      locationMap.set(locName, (locationMap.get(locName) ?? 0) + 1)
    }
  }

  const byCategory = Array.from(categoryMap.entries()).map(([category_name, stats]) => ({
    category_name,
    ...stats,
  }))

  const byLocation = Array.from(locationMap.entries()).map(([location_name, copy_count]) => ({
    location_name,
    copy_count,
  }))

  return {
    total_items: totalItems,
    total_copies: totalCopies,
    available_copies: availableCopies,
    borrowed_copies: borrowedCopies,
    lost_copies: lostCopies,
    damaged_copies: damagedCopies,
    total_inventory_value: totalValue,
    by_category: byCategory,
    by_location: byLocation,
  }
}

export async function getBorrowingActivityReport(
  startDate?: string,
  endDate?: string,
): Promise<BorrowingActivityItem[]> {
  let query = supabase
    .from('transactions')
    .select('id, type, borrower_email, borrowed_at, due_date, returned_at, copy:inventory_copies(copy_number, item:inventory_items(name, category:categories(name)))')
    .in('type', ['borrow', 'return'])
    .order('created_at', { ascending: false })
    .limit(1000)

  if (startDate) query = query.gte('created_at', startDate)
  if (endDate) query = query.lte('created_at', endDate)

  const { data, error } = await query
  if (error) throw new Error(error.message)

  return (data ?? []).map((t) => {
    const copy = t.copy as unknown as { copy_number: number; item: { name: string; category: { name: string } | null } | null } | null
    return {
      id: t.id,
      type: t.type,
      item_name: copy?.item?.name ?? 'Unknown Item',
      category_name: copy?.item?.category?.name ?? 'Uncategorized',
      copy_number: copy?.copy_number ?? 1,
      borrower_email: t.borrower_email,
      borrowed_at: t.borrowed_at,
      due_date: t.due_date,
      returned_at: t.returned_at,
    }
  })
}

export async function getOverdueLoansReport(): Promise<OverdueLoanItem[]> {
  const nowIso = new Date().toISOString()
  const { data, error } = await supabase
    .from('transactions')
    .select('id, copy_id, borrower_email, borrowed_at, due_date, copy:inventory_copies(status, copy_number, item:inventory_items(name, category:categories(name)))')
    .eq('type', 'borrow')
    .lt('due_date', nowIso)
    .is('returned_at', null)
    .order('due_date', { ascending: true })

  if (error) throw new Error(error.message)

  const now = new Date()

  return (data ?? [])
    .filter((t) => {
      const copy = t.copy as unknown as { status: string } | null
      return copy?.status === 'borrowed'
    })
    .map((t) => {
      const copy = t.copy as unknown as { copy_number: number; item: { name: string; category: { name: string } | null } | null } | null
      const dueDate = new Date(t.due_date!)
      const diffMs = now.getTime() - dueDate.getTime()
      const daysOverdue = Math.max(1, Math.floor(diffMs / (1000 * 60 * 60 * 24)))

      return {
        transaction_id: t.id,
        copy_id: t.copy_id,
        item_name: copy?.item?.name ?? 'Unknown Item',
        category_name: copy?.item?.category?.name ?? 'Uncategorized',
        copy_number: copy?.copy_number ?? 1,
        borrower_email: t.borrower_email,
        borrowed_at: t.borrowed_at!,
        due_date: t.due_date!,
        days_overdue: daysOverdue,
      }
    })
}

export async function getLostDamagedReport(): Promise<LostDamagedReportItem[]> {
  const { data, error } = await supabase
    .from('transactions')
    .select('id, copy_id, type, notes, created_at, copy:inventory_copies(copy_number, item:inventory_items(name, unit_value))')
    .in('type', ['lost', 'damaged'])
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)

  return (data ?? []).map((t) => {
    const copy = t.copy as unknown as { copy_number: number; item: { name: string; unit_value: number | null } | null } | null
    return {
      transaction_id: t.id,
      copy_id: t.copy_id,
      item_name: copy?.item?.name ?? 'Unknown Item',
      copy_number: copy?.copy_number ?? 1,
      type: t.type as 'lost' | 'damaged',
      notes: t.notes,
      date: t.created_at,
      unit_value: copy?.item?.unit_value ? Number(copy.item.unit_value) : null,
    }
  })
}
