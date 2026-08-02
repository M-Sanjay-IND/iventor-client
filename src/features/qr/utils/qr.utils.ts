import QRCode from 'qrcode'
import {
  QR_UID_PREFIX,
  QR_UID_SEPARATOR,
  QR_UID_PAD_LENGTH,
  QR_IMAGE_SIZE_PX,
} from '@/constants'

/**
 * Formats a numeric sequence value into the canonical QR UID string.
 * e.g., 1 → "INV-000000001"
 */
export function formatQrUid(sequence: number): string {
  return `${QR_UID_PREFIX}${QR_UID_SEPARATOR}${String(sequence).padStart(QR_UID_PAD_LENGTH, '0')}`
}

/**
 * Generates a QR code as a PNG Blob.
 * Error correction level H (30%) — survives sticker damage.
 */
export async function generateQrPng(uid: string): Promise<Blob> {
  const dataUrl = await QRCode.toDataURL(uid, {
    errorCorrectionLevel: 'H',
    width: QR_IMAGE_SIZE_PX,
    margin: 2,
    color: { dark: '#000000', light: '#ffffff' },
  })

  const response = await fetch(dataUrl)
  return response.blob()
}

/**
 * Generates a QR code as an SVG string.
 */
export async function generateQrSvg(uid: string): Promise<string> {
  return QRCode.toString(uid, {
    type: 'svg',
    errorCorrectionLevel: 'H',
    margin: 2,
    color: { dark: '#000000', light: '#ffffff' },
  })
}

/**
 * Computes a SHA-256 hex checksum of a Blob's contents.
 * Used for integrity verification of stored QR images.
 */
export async function computeChecksum(blob: Blob): Promise<string> {
  const buffer = await blob.arrayBuffer()
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}
