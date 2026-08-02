/* eslint-disable */
/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-return */
import { supabase } from '@/services/supabase'
import { DEFAULT_PAGE_SIZE } from '@/constants'
import { generateQrPng, generateQrSvg, computeChecksum } from '../utils/qr.utils'
import type { QrCode, QrCodeWithRelations, QrLabel } from '../types'
import type { PaginationParams } from '@/types'

const QR_STORAGE_BUCKET = 'qr-codes'

// ============================================================================
// Queries
// ============================================================================

interface GetQrCodesParams {
  pagination?: PaginationParams
  search?: string
  activeOnly?: boolean
}

interface GetQrCodesResult {
  data: QrCodeWithRelations[]
  total: number
}

export async function getQrCodes(
  params: GetQrCodesParams = {},
): Promise<GetQrCodesResult> {
  const {
    pagination = { page: 1, pageSize: DEFAULT_PAGE_SIZE },
    search,
    activeOnly = true,
  } = params

  const from = (pagination.page - 1) * pagination.pageSize
  const to = from + pagination.pageSize - 1

  let query = supabase
    .from('qr_codes')
    .select(
      `*, copy:inventory_copies(*, item:inventory_items(*, category:categories(*)), location:locations(*))`,
      { count: 'exact' },
    )
    .is('deleted_at', null)
    .range(from, to)
    .order('created_at', { ascending: false })

  if (activeOnly) {
    query = query.eq('is_active', true)
  }

  if (search) {
    query = query.ilike('qr_uid', `%${search}%`)
  }

  const { data, count, error } = await query

  if (error) throw new QrServiceError(error.message, 'QR_FETCH_FAILED')

  return {
    data: (data) ?? [],
    total: count ?? 0,
  }
}

export async function getQrByUid(uid: string): Promise<QrCodeWithRelations | null> {
  const { data, error } = await supabase
    .from('qr_codes')
    .select(
      `*, copy:inventory_copies(*, item:inventory_items(*, category:categories(*)), location:locations(*))`,
    )
    .eq('qr_uid', uid)
    .is('deleted_at', null)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw new QrServiceError(error.message, 'QR_FETCH_FAILED')
  }

  return data
}

export async function getQrByCopyId(copyId: string): Promise<QrCode | null> {
  const { data, error } = await supabase
    .from('qr_codes')
    .select('*')
    .eq('copy_id', copyId)
    .eq('is_active', true)
    .is('deleted_at', null)
    .maybeSingle()

  if (error) throw new QrServiceError(error.message, 'QR_FETCH_FAILED')

  return (data) ?? null
}

export async function getUnlinkedCopies(): Promise<unknown[]> {
  const linkedResult = await supabase
    .from('qr_codes')
    .select('copy_id')
    .eq('is_active', true)
    .is('deleted_at', null)

  const linkedRows = (linkedResult.data ?? []) as { copy_id: string }[]
  const excludeIds = linkedRows.map((r) => r.copy_id)

  let query = supabase
    .from('inventory_copies')
    .select('*, item:inventory_items(name, category:categories(name)), location:locations(name)')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (excludeIds.length > 0) {
    query = query.not('id', 'in', `(${excludeIds.join(',')})`)
  }

  const { data, error } = await query

  if (error) throw new QrServiceError(error.message, 'UNLINKED_COPIES_FETCH_FAILED')

  return (data ?? []) as unknown[]
}

// ============================================================================
// Generation
// ============================================================================

export async function generateQrForCopy(copyId: string): Promise<QrCode> {
  const uidResult = await supabase.rpc('next_qr_uid', { p_count: 1 })
  const uids = uidResult.data as string[] | null
  const uidError = uidResult.error

  if (uidError || !uids || uids.length === 0) {
    throw new QrServiceError(
      uidError?.message ?? 'Failed to generate UID',
      'QR_UID_GENERATION_FAILED',
    )
  }

  return uploadAndInsert(uids[0]!, copyId)
}

export async function bulkGenerateQr(copyIds: string[]): Promise<QrCode[]> {
  if (copyIds.length === 0) return []
  if (copyIds.length > 1000) {
    throw new QrServiceError('Cannot generate more than 1000 QR codes at once', 'QR_BULK_LIMIT')
  }

  const uidResult = await supabase.rpc('next_qr_uid', { p_count: copyIds.length })
  const uids = uidResult.data as string[] | null
  const uidError = uidResult.error

  if (uidError || !uids || uids.length !== copyIds.length) {
    throw new QrServiceError(
      uidError?.message ?? 'Failed to generate UIDs',
      'QR_UID_GENERATION_FAILED',
    )
  }

  const results: QrCode[] = []
  for (let i = 0; i < copyIds.length; i++) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const qr = await uploadAndInsert(uids[i]!, copyIds[i]!)
    results.push(qr)
  }

  return results
}

async function uploadAndInsert(uid: string, copyId: string): Promise<QrCode> {
  const pngBlob = await generateQrPng(uid)
  const svgString = await generateQrSvg(uid)
  const checksum = await computeChecksum(pngBlob)

  const pngPath = `${uid}.png`
  const svgPath = `${uid}.svg`

  const pngUpload = await supabase.storage
    .from(QR_STORAGE_BUCKET)
    .upload(pngPath, pngBlob, {
      contentType: 'image/png',
      upsert: false,
    })

  if (pngUpload.error) throw new QrServiceError(pngUpload.error.message, 'QR_PNG_UPLOAD_FAILED')

  const svgBlob = new Blob([svgString], { type: 'image/svg+xml' })
  const svgUpload = await supabase.storage
    .from(QR_STORAGE_BUCKET)
    .upload(svgPath, svgBlob, {
      contentType: 'image/svg+xml',
      upsert: false,
    })

  if (svgUpload.error) throw new QrServiceError(svgUpload.error.message, 'QR_SVG_UPLOAD_FAILED')

  const userResult = await supabase.auth.getUser()
  const userId = userResult.data.user?.id ?? null

  const insertResult = await supabase
    .from('qr_codes')
    .insert({
      qr_uid: uid,
      copy_id: copyId,
      png_storage_path: pngPath,
      svg_storage_path: svgPath,
      checksum,
      version: 1,
      generated_by: userId,
      created_by: userId,
      updated_by: userId,
    })
    .select()
    .single()

  if (insertResult.error) throw new QrServiceError(insertResult.error.message, 'QR_INSERT_FAILED')

  return insertResult.data
}

// ============================================================================
// Reprint & Replace
// ============================================================================

export async function reprintQr(qrId: string): Promise<QrCode> {
  const currentResult = await supabase
    .from('qr_codes')
    .select('print_count')
    .eq('id', qrId)
    .single()

  if (currentResult.error) throw new QrServiceError(currentResult.error.message, 'QR_REPRINT_FAILED')

  const currentCount = (currentResult.data).print_count

  const updateResult = await supabase
    .from('qr_codes')
    .update({
      print_count: currentCount + 1,
      last_printed_at: new Date().toISOString(),
    })
    .eq('id', qrId)
    .select()
    .single()

  if (updateResult.error) throw new QrServiceError(updateResult.error.message, 'QR_REPRINT_FAILED')

  return updateResult.data
}

export async function replaceQr(qrId: string): Promise<QrCode> {
  const fetchResult = await supabase
    .from('qr_codes')
    .select('*')
    .eq('id', qrId)
    .single()

  if (fetchResult.error) {
    throw new QrServiceError(fetchResult.error.message, 'QR_NOT_FOUND')
  }

  const oldQr = fetchResult.data as unknown as QrCode

  const deactivateResult = await supabase
    .from('qr_codes')
    .update({ is_active: false })
    .eq('id', qrId)

  if (deactivateResult.error) {
    throw new QrServiceError(deactivateResult.error.message, 'QR_DEACTIVATE_FAILED')
  }

  const uidResult = await supabase.rpc('next_qr_uid', { p_count: 1 })
  const uids = uidResult.data as string[] | null

  if (uidResult.error || !uids?.[0]) {
    throw new QrServiceError(uidResult.error?.message ?? 'UID generation failed', 'QR_UID_GENERATION_FAILED')
  }

  const uid = uids[0]
  const pngBlob = await generateQrPng(uid)
  const svgString = await generateQrSvg(uid)
  const checksum = await computeChecksum(pngBlob)

  const pngPath = `${uid}.png`
  const svgPath = `${uid}.svg`

  await supabase.storage.from(QR_STORAGE_BUCKET).upload(pngPath, pngBlob, {
    contentType: 'image/png',
    upsert: false,
  })

  const svgBlob = new Blob([svgString], { type: 'image/svg+xml' })
  await supabase.storage.from(QR_STORAGE_BUCKET).upload(svgPath, svgBlob, {
    contentType: 'image/svg+xml',
    upsert: false,
  })

  const userResult = await supabase.auth.getUser()
  const userId = userResult.data.user?.id ?? null

  const insertResult = await supabase
    .from('qr_codes')
    .insert({
      qr_uid: uid,
      copy_id: oldQr.copy_id,
      png_storage_path: pngPath,
      svg_storage_path: svgPath,
      checksum,
      version: oldQr.version + 1,
      generated_by: userId,
      created_by: userId,
      updated_by: userId,
    })
    .select()
    .single()

  if (insertResult.error) throw new QrServiceError(insertResult.error.message, 'QR_REPLACE_FAILED')

  return insertResult.data
}

// ============================================================================
// Deletion
// ============================================================================

export async function softDeleteQr(qrId: string): Promise<void> {
  const timestamp = new Date().toISOString()

  // 1. Get the copy_id of the QR code
  const fetchResult = await supabase
    .from('qr_codes')
    .select('copy_id')
    .eq('id', qrId)
    .single()

  if (fetchResult.error) {
    throw new QrServiceError(fetchResult.error.message, 'QR_NOT_FOUND')
  }

  const copyId = fetchResult.data.copy_id

  // 2. Soft delete and deactivate the QR code
  const deactivateResult = await supabase
    .from('qr_codes')
    .update({ is_active: false, deleted_at: timestamp })
    .eq('id', qrId)

  if (deactivateResult.error) {
    throw new QrServiceError(deactivateResult.error.message, 'QR_DELETE_FAILED')
  }

  // 3. Soft delete the associated inventory copy
  const { error: copyError } = await supabase
    .from('inventory_copies')
    .update({ deleted_at: timestamp })
    .eq('id', copyId)
    .is('deleted_at', null)

  if (copyError) {
    throw new QrServiceError(copyError.message, 'QR_COPY_DELETE_FAILED')
  }
}

// ============================================================================
// Storage URLs
// ============================================================================

export function getQrImageUrl(storagePath: string): string {
  const { data } = supabase.storage
    .from(QR_STORAGE_BUCKET)
    .getPublicUrl(storagePath)

  return data.publicUrl
}

export async function downloadQrImage(storagePath: string): Promise<Blob> {
  const result = await supabase.storage
    .from(QR_STORAGE_BUCKET)
    .download(storagePath)

  if (result.error || !result.data) {
    throw new QrServiceError(result.error?.message ?? 'Download failed', 'QR_DOWNLOAD_FAILED')
  }

  return result.data
}

// ============================================================================
// Labels — prepare data for the print preview
// ============================================================================

export async function getQrLabels(qrIds: string[]): Promise<QrLabel[]> {
  if (qrIds.length === 0) return []

  const { data, error } = await supabase
    .from('qr_codes')
    .select(
      `qr_uid, png_storage_path, copy:inventory_copies(item:inventory_items(name, category:categories(name)), location:locations(name))`,
    )
    .in('id', qrIds)
    .eq('is_active', true)

  if (error) throw new QrServiceError(error.message, 'QR_LABELS_FETCH_FAILED')

  return ((data ?? []) as unknown as {
    qr_uid: string
    png_storage_path: string
    copy: {
      item: { name: string; category: { name: string } | null } | null
      location: { name: string } | null
    } | null
  }[]).map((row) => ({
    qr_uid: row.qr_uid,
    qr_image_url: getQrImageUrl(row.png_storage_path),
    item_name: row.copy?.item?.name ?? 'Unknown Item',
    category_name: row.copy?.item?.category?.name ?? null,
    location_name: row.copy?.location?.name ?? null,
  }))
}

// ============================================================================
// Error class
// ============================================================================

export class QrServiceError extends Error {
  code: string
  constructor(message: string, code: string) {
    super(message)
    this.name = 'QrServiceError'
    this.code = code
  }
}
