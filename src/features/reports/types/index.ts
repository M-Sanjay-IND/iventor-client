export interface ItemValuationReportItem {
  id: string
  name: string
  category_name: string
  sku: string | null
  manufacturer: string | null
  brand: string | null
  model: string | null
  unit_value: number
  total_copies: number
  available_copies: number
  borrowed_copies: number
  lost_copies: number
  damaged_copies: number
  total_valuation: number
  locations: string[]
  created_at: string
}

export interface ValuationCategoryBreakdown {
  category_name: string
  item_count: number
  copy_count: number
  total_value: number
}

export interface ValuationLocationBreakdown {
  location_name: string
  copy_count: number
}

export interface ValuationReportData {
  total_items: number
  total_copies: number
  available_copies: number
  borrowed_copies: number
  lost_copies: number
  damaged_copies: number
  total_inventory_value: number
  items: ItemValuationReportItem[]
  by_category: ValuationCategoryBreakdown[]
  by_location: ValuationLocationBreakdown[]
}

export interface BorrowingActivityItem {
  id: string
  type: string
  item_name: string
  category_name: string
  sku: string | null
  copy_number: number
  borrower_email: string
  borrowed_at: string | null
  due_date: string | null
  returned_at: string | null
}

export interface OverdueLoanItem {
  transaction_id: string
  copy_id: string
  item_name: string
  category_name: string
  sku: string | null
  copy_number: number
  borrower_email: string
  borrowed_at: string
  due_date: string
  days_overdue: number
}

export interface LostDamagedReportItem {
  transaction_id: string
  copy_id: string
  item_name: string
  sku: string | null
  copy_number: number
  type: 'lost' | 'damaged'
  notes: string | null
  date: string
  unit_value: number | null
}

export type ReportTab = 'valuation' | 'borrowing' | 'overdue' | 'lost_damaged'
export type ValuationViewMode = 'items' | 'category' | 'location'
