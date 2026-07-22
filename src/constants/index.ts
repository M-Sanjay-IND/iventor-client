/**
 * Application-wide constants.
 *
 * All magic numbers and strings are centralized here.
 * Never use hardcoded values in components or services.
 */

/** Application metadata */
export const APP_NAME = 'Inventor Client' as const
export const APP_VERSION = '0.1.0' as const
export const APP_DESCRIPTION =
  'Enterprise Inventory Management Platform' as const

/** QR code configuration */
export const QR_UID_PREFIX = 'INV' as const
export const QR_UID_SEPARATOR = '-' as const
export const QR_UID_PAD_LENGTH = 9 as const
export const QR_IMAGE_SIZE_PX = 200 as const
export const QR_IMAGE_DPI = 300 as const

/** Session configuration */
export const ADMIN_SESSION_TIMEOUT_MS = 28_800_000 // 8 hours
export const BORROWER_SESSION_TIMEOUT_MS = 600_000 // 10 minutes
export const MAX_FAILED_LOGIN_ATTEMPTS = 5 as const
export const ACCOUNT_LOCKOUT_DURATION_MS = 900_000 // 15 minutes

/** Pagination defaults */
export const DEFAULT_PAGE_SIZE = 25 as const
export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const

/** Import engine */
export const SUPPORTED_IMPORT_FORMATS = ['csv', 'xls', 'xlsx'] as const
export const MAX_IMPORT_FILE_SIZE_MB = 10 as const
export const MAX_IMPORT_FILE_SIZE_BYTES = 10_485_760 // 10 MB

/** Export formats */
export const SUPPORTED_EXPORT_FORMATS = ['csv', 'xlsx', 'pdf'] as const

/** Inventory copy conditions */
export const COPY_CONDITIONS = [
  'new',
  'good',
  'fair',
  'poor',
  'damaged',
  'lost',
] as const

/** Inventory copy statuses */
export const COPY_STATUSES = [
  'available',
  'borrowed',
  'reserved',
  'maintenance',
  'retired',
] as const

/** Transaction types */
export const TRANSACTION_TYPES = [
  'borrow',
  'return',
  'lost',
  'damaged',
] as const

/** Audit log actions */
export const AUDIT_ACTIONS = {
  AUTH_LOGIN: 'auth.login',
  AUTH_LOGOUT: 'auth.logout',
  AUTH_LOGIN_FAILED: 'auth.login_failed',
  AUTH_OTP_SENT: 'auth.otp_sent',
  AUTH_OTP_VERIFIED: 'auth.otp_verified',
  INVENTORY_CREATE: 'inventory.create',
  INVENTORY_UPDATE: 'inventory.update',
  INVENTORY_DELETE: 'inventory.delete',
  COPY_CREATE: 'copy.create',
  COPY_UPDATE: 'copy.update',
  COPY_DELETE: 'copy.delete',
  QR_GENERATE: 'qr.generate',
  QR_BULK_GENERATE: 'qr.bulk_generate',
  QR_PRINT: 'qr.print',
  QR_BULK_PRINT: 'qr.bulk_print',
  TRANSACTION_BORROW: 'transaction.borrow',
  TRANSACTION_RETURN: 'transaction.return',
  IMPORT_START: 'import.start',
  IMPORT_COMPLETE: 'import.complete',
  IMPORT_FAILED: 'import.failed',
  IMPORT_ROLLBACK: 'import.rollback',
  EXPORT_CREATE: 'export.create',
  SETTINGS_UPDATE: 'settings.update',
  ROLE_CHANGE: 'role.change',
  USER_CREATE: 'user.create',
  USER_UPDATE: 'user.update',
  USER_DELETE: 'user.delete',
} as const

/** Sidebar navigation items */
export const NAV_ITEMS = [
  { path: '/admin', label: 'Dashboard', icon: 'LayoutDashboard' },
  { path: '/admin/inventory', label: 'Inventory', icon: 'Package' },
  { path: '/admin/qr', label: 'QR Codes', icon: 'QrCode' },
  { path: '/admin/reports', label: 'Reports', icon: 'BarChart3' },
  { path: '/admin/settings', label: 'Settings', icon: 'Settings' },
] as const

/** Route label map for breadcrumbs */
export const ROUTE_LABELS: Record<string, string> = {
  admin: 'Dashboard',
  inventory: 'Inventory',
  qr: 'QR Codes',
  reports: 'Reports',
  settings: 'Settings',
} as const
