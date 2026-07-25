import { z } from 'zod'
import { COPY_CONDITIONS, COPY_STATUSES } from '@/constants'

export const itemFormSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(255, 'Name must be under 255 characters'),
  description: z.string().default(''),
  category_id: z.string().nullable().default(null),
  manufacturer: z.string().nullable().default(null),
  brand: z.string().nullable().default(null),
  model: z.string().nullable().default(null),
  sku: z
    .string()
    .nullable()
    .default(null)
    .transform((v) => (v === '' ? null : v)),
  unit_value: z
    .number()
    .min(0, 'Value cannot be negative')
    .nullable()
    .default(null),
  metadata: z.record(z.unknown()).default({}),
})

export type ItemFormValues = z.infer<typeof itemFormSchema>

export const copyFormSchema = z.object({
  item_id: z.string().min(1, 'Item is required'),
  copy_number: z.number().int().min(1),
  asset_tag: z
    .string()
    .nullable()
    .default(null)
    .transform((v) => (v === '' ? null : v)),
  location_id: z
    .string()
    .nullable()
    .default(null)
    .transform((v) => (v === '' ? null : v)),
  condition: z.enum(COPY_CONDITIONS).default('new'),
  status: z.enum(COPY_STATUSES).default('available'),
  acquisition_date: z
    .string()
    .nullable()
    .default(null)
    .transform((v) => (v === '' ? null : v)),
  notes: z
    .string()
    .nullable()
    .default(null)
    .transform((v) => (v === '' ? null : v)),
})

export type CopyFormValues = z.infer<typeof copyFormSchema>

export const categoryFormSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be under 100 characters'),
  description: z.string().default(''),
  parent_id: z.string().nullable().default(null),
})

export type CategoryFormValues = z.infer<typeof categoryFormSchema>

export const locationFormSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be under 100 characters'),
  description: z.string().default(''),
  parent_id: z.string().nullable().default(null),
})

export type LocationFormValues = z.infer<typeof locationFormSchema>
