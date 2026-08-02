import { z } from 'zod'

export const bulkGenerateSchema = z.object({
  copy_ids: z
    .array(z.string().uuid())
    .min(1, 'Select at least one copy')
    .max(1000, 'Cannot generate more than 1000 at once'),
})

export type BulkGenerateValues = z.infer<typeof bulkGenerateSchema>

export const printConfigSchema = z.object({
  layout: z.enum(['a4-grid', 'thermal']).default('a4-grid'),
  selected_qr_ids: z
    .array(z.string().uuid())
    .min(1, 'Select at least one QR code'),
})

export type PrintConfigValues = z.infer<typeof printConfigSchema>
