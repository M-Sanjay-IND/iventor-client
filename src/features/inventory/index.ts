/**
 * inventory feature module.
 * Components, hooks, services, and types are exported from here.
 * Import from '@/features/inventory' - never reach into subfolders directly.
 */

export { InventoryPage } from './pages/InventoryPage'

export type {
  Category,
  Location,
  CopyCondition,
  CopyStatus,
  InventoryItem,
  InventoryItemWithCategory,
  InventoryCopy,
  InventoryCopyWithRelations,
  InventorySummary,
  CategoryCount,
} from './types'
