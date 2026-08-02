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
    data: (data ?? []) as unknown as QrCodeWithRelations[],
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

  return data as unknown as QrCodeWithRelations
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

  return data as QrCode | null
}

export async function getUnlinkedCopies() {
  const { data, error } = await supabase
    .from('inventory_copies')
    .select('*, item:inventory_items(name, category:categories(name)), location:locations(name)')
    .is('deleted_at', null)
    .not(
      'id',
      'in',
      supabase
        .from('qr_codes')
        .select('copy_id')
        .eq('is_active', true)
        .is('deleted_at', null),
    )
    .order('created_at', { ascending: false })

  if (error) throw new QrServiceError(error.message, 'UNLINKED_COPIES_FETCH_FAILED')

  return data ?? []
}

// ============================================================================
// Generation
// ============================================================================

export async function generateQrForCopy(copyId: string): Promise<QrCode> {
  const { data: uids, error: uidError } = await supabase.rpc('next_qr_uid', {
    p_count: 1,
  })

  if (uidError || !uids || uids.length === 0) {
    throw new QrServiceError(
      uidError?.message ?? 'Failed to generate UID',
      'QR_UID_GENERATION_FAILED',
    )
  }

  const uid = uids[0] as string
  return uploadAndInsert(uid, copyId)
}

export async function bulkGenerateQr(
  copyIds: string[],
): Promise<QrCode[]> {
  if (copyIds.length === 0) return []
  if (copyIds.length > 1000) {
    throw new QrServiceError('Cannot generate more than 1000 QR codes at once', 'QR_BULK_LIMIT')
  }

  const { data: uids, error: uidError } = await supabase.rpc('next_qr_uid', {
    p_count: copyIds.length,
  })

  if (uidError || !uids || uids.length !== copyIds.length) {
    throw new QrServiceError(
      uidError?.message ?? 'Failed to generate UIDs',
      'QR_UID_GENERATION_FAILED',
    )
  }

  const results: QrCode[] = []
  for (let i = 0; i < copyIds.length; i++) {
    const qr = await uploadAndInsert(uids[i] as string, copyIds[i])
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

  const { error: pngError } = await supabase.storage
    .from(QR_STORAGE_BUCKET)
    .upload(pngPath, pngBlob, {
      contentType: 'image/png',
      upsert: false,
    })

  if (pngError) throw new QrServiceError(pngError.message, 'QR_PNG_UPLOAD_FAILED')

  const svgBlob = new Blob([svgString], { type: 'image/svg+xml' })
  const { error: svgError } = await supabase.storage
    .from(QR_STORAGE_BUCKET)
    .upload(svgPath, svgBlob, {
      contentType: 'image/svg+xml',
      upsert: false,
    })

  if (svgError) throw new QrServiceError(svgError.message, 'QR_SVG_UPLOAD_FAILED')

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from('qr_codes')
    .insert({
      qr_uid: uid,
      copy_id: copyId,
      png_storage_path: pngPath,
      svg_storage_path: svgPath,
      checksum,
      version: 1,
      generated_by: user?.id,
      created_by: user?.id,
      updated_by: user?.id,
    })
    .select()
    .single()

  if (error) throw new QrServiceError(error.message, 'QR_INSERT_FAILED')

  return data as QrCode
}

// ============================================================================
// Reprint & Replace
// ============================================================================

export async function reprintQr(qrId: string): Promise<QrCode> {
  const { data, error } = await supabase
    .from('qr_codes')
    .update({
      print_count: supabase.rpc('increment_print_count_inline', { row_id: qrId }) as unknown as number,
      last_printed_at: new Date().toISOString(),
    })
    .eq('id', qrId)
    .select()
    .single()

  // Fallback: direct increment via raw update
  if (error) {
    const { data: current } = await supabase
      .from('qr_codes')
      .select('print_count')
      .eq('id', qrId)
      .single()

    const { data: updated, error: updateError } = await supabase
      .from('qr_codes')
      .update({
        print_count: (current?.print_count ?? 0) + 1,
        last_printed_at: new Date().toISOString(),
      })
      .eq('id', qrId)
      .select()
      .single()

    if (updateError) throw new QrServiceError(updateError.message, 'QR_REPRINT_FAILED')
    return updated as QrCode
  }

  return data as QrCode
}

export async function replaceQr(qrId: string): Promise<QrCode> {
  const { data: oldQr, error: fetchError } = await supabase
    .from('qr_codes')
    .select('*')
    .eq('id', qrId)
    .single()

  if (fetchError || !oldQr) {
    throw new QrServiceError(fetchError?.message ?? 'QR not found', 'QR_NOT_FOUND')
  }

  const { error: deactivateError } = await supabase
    .from('qr_codes')
    .update({ is_active: false })
    .eq('id', qrId)

  if (deactivateError) {
    throw new QrServiceError(deactivateError.message, 'QR_DEACTIVATE_FAILED')
  }

  const { data: uids, error: uidError } = await supabase.rpc('next_qr_uid', {
    p_count: 1,
  })

  if (uidError || !uids?.[0]) {
    throw new QrServiceError(uidError?.message ?? 'UID generation failed', 'QR_UID_GENERATION_FAILED')
  }

  const uid = uids[0] as string
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

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: newQr, error: insertError } = await supabase
    .from('qr_codes')
    .insert({
      qr_uid: uid,
      copy_id: (oldQr as QrCode).copy_id,
      png_storage_path: pngPath,
      svg_storage_path: svgPath,
      checksum,
      version: ((oldQr as QrCode).version ?? 0) + 1,
      generated_by: user?.id,
      created_by: user?.id,
      updated_by: user?.id,
    })
    .select()
    .single()

  if (insertError) throw new QrServiceError(insertError.message, 'QR_REPLACE_FAILED')

  return newQr as QrCode
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

export async function downloadQrImage(
  storagePath: string,
): Promise<Blob> {
  const { data, error } = await supabase.storage
    .from(QR_STORAGE_BUCKET)
    .download(storagePath)

  if (error || !data) {
    throw new QrServiceError(error?.message ?? 'Download failed', 'QR_DOWNLOAD_FAILED')
  }

  return data
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

  return (data ?? []).map((row: Record<string, unknown>) => {
    const copy = row.copy as Record<string, unknown> | null
    const item = copy?.item as Record<string, unknown> | null
    const category = item?.category as Record<string, string> | null
    const location = copy?.location as Record<string, string> | null

    return {
      qr_uid: row.qr_uid as string,
      qr_image_url: getQrImageUrl(row.png_storage_path as string),
      item_name: (item?.name as string) ?? 'Unknown Item',
      category_name: category?.name ?? null,
      location_name: location?.name ?? null,
    }
  })
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
