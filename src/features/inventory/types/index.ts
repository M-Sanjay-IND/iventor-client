import type { BaseEntity } from '@/types'
import type { COPY_CONDITIONS, COPY_STATUSES } from '@/constants'

/** Category record — hierarchical inventory classification */
export interface Category extends BaseEntity {
  name: string
  description: string
  parent_id: string | null
}

/** Location record — hierarchical physical location */
export interface Location extends BaseEntity {
  name: string
  description: string
  parent_id: string | null
}

/** Physical copy condition */
export type CopyCondition = (typeof COPY_CONDITIONS)[number]

/** Physical copy availability status */
export type CopyStatus = (typeof COPY_STATUSES)[number]

/** Inventory item — abstract product definition */
export interface InventoryItem extends BaseEntity {
  name: string
  description: string
  category_id: string | null
  manufacturer: string | null
  brand: string | null
  model: string | null
  sku: string | null
  unit_value: number | null
  metadata: Record<string, unknown>
}

/** Inventory item with category joined */
export interface InventoryItemWithCategory extends InventoryItem {
  category: Category | null
}

/** Inventory copy — physical instance of an item */
export interface InventoryCopy extends BaseEntity {
  item_id: string
  copy_number: number
  asset_tag: string | null
  location_id: string | null
  condition: CopyCondition
  status: CopyStatus
  acquisition_date: string | null
  notes: string | null
}

/** Inventory copy with location and item joined */
export interface InventoryCopyWithRelations extends InventoryCopy {
  item: InventoryItem
  location: Location | null
}

/** Summary returned by get_inventory_summary() RPC */
export interface InventorySummary {
  total_items: number
  total_copies: number
  copies_by_status: Partial<Record<CopyStatus, number>>
  copies_by_condition: Partial<Record<CopyCondition, number>>
}

/** Category count returned by get_category_counts() RPC */
export interface CategoryCount {
  category_id: string
  category_name: string
  item_count: number
}
