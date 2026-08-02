/**
 * qr feature module.
 * Components, hooks, services, and types are exported from here.
 * Import from '@/features/qr' - never reach into subfolders directly.
 */

export { QrPage } from './pages/QrPage'
export { QrDetailPage } from './pages/QrDetailPage'
export { PrintPage } from './pages/PrintPage'

export type {
  QrCode,
  QrCodeWithRelations,
  QrLabel,
  PrintLayout,
  PrintConfig,
} from './types'