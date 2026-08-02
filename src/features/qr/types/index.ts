import type { BaseEntity } from '@/types'
import type { InventoryCopyWithRelations } from '@/features/inventory'

/** QR code record — permanent identity linked to a physical copy */
export interface QrCode extends BaseEntity {
  qr_uid: string
  copy_id: string
  png_storage_path: string
  svg_storage_path: string
  checksum: string
  version: number
  print_count: number
  last_printed_at: string | null
  generated_by: string
  is_active: boolean
}

/** QR code with joined copy, item, location, and category data */
export interface QrCodeWithRelations extends QrCode {
  copy: InventoryCopyWithRelations
}

/** Label data structure used by the print preview renderer */
export interface QrLabel {
  qr_uid: string
  qr_image_url: string
  item_name: string
  category_name: string | null
  location_name: string | null
}

/** Print layout configuration */
export type PrintLayout = 'a4-grid' | 'thermal'

/** Print configuration for label rendering */
export interface PrintConfig {
  layout: PrintLayout
  selected_qr_ids: string[]
}
