import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Modal } from '@/components/ui/Modal'
import { COPY_CONDITIONS, COPY_STATUSES } from '@/constants'
import { useLocations, useNextCopyNumber } from '../hooks/inventory.queries'
import { copyFormSchema, type CopyFormValues, type CopyFormInput } from '../validation/schemas'
import type { InventoryCopy } from '../types'

interface CopyFormModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: CopyFormValues) => void
  itemId: string
  editingCopy?: InventoryCopy | null
  loading?: boolean
}

export function CopyFormModal({
  open,
  onClose,
  onSubmit,
  itemId,
  editingCopy,
  loading = false,
}: CopyFormModalProps) {
  const { data: locations = [] } = useLocations()
  const { data: nextNumber } = useNextCopyNumber(itemId)
  const isEdit = Boolean(editingCopy)

  const {
    register,
    handleSubmit,
    reset,
  } = useForm<CopyFormInput, unknown, CopyFormValues>({
    resolver: zodResolver(copyFormSchema),
  })

  useEffect(() => {
    if (open) {
      if (editingCopy) {
        reset({
          item_id: editingCopy.item_id,
          copy_number: editingCopy.copy_number,
          asset_tag: editingCopy.asset_tag,
          location_id: editingCopy.location_id,
          condition: editingCopy.condition,
          status: editingCopy.status,
          acquisition_date: editingCopy.acquisition_date,
          notes: editingCopy.notes,
        })
      } else {
        reset({
          item_id: itemId,
          copy_number: nextNumber ?? 1,
          asset_tag: null,
          location_id: null,
          condition: 'new',
          status: 'available',
          acquisition_date: null,
          notes: null,
        })
      }
    }
  }, [open, editingCopy, itemId, nextNumber, reset])

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? `Edit Copy #${editingCopy?.copy_number ?? ''}` : 'Add Copy'}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <input type="hidden" {...register('item_id')} />
        <input type="hidden" {...register('copy_number', { valueAsNumber: true })} />

        {/* Asset Tag */}
        <div>
          <label htmlFor="copy-asset-tag" className="mb-1 block text-sm font-medium">
            Asset Tag
          </label>
          <input
            id="copy-asset-tag"
            type="text"
            {...register('asset_tag')}
            className="w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="e.g., ASSET-001"
          />
        </div>

        {/* Location */}
        <div>
          <label htmlFor="copy-location" className="mb-1 block text-sm font-medium">
            Location
          </label>
          <select
            id="copy-location"
            {...register('location_id')}
            className="w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="">No location</option>
            {locations.map((loc) => (
              <option key={loc.id} value={loc.id}>
                {loc.name}
              </option>
            ))}
          </select>
        </div>

        {/* Condition / Status */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="copy-condition" className="mb-1 block text-sm font-medium">
              Condition
            </label>
            <select
              id="copy-condition"
              {...register('condition')}
              className="w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm capitalize focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {COPY_CONDITIONS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="copy-status" className="mb-1 block text-sm font-medium">
              Status
            </label>
            <select
              id="copy-status"
              {...register('status')}
              className="w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm capitalize focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {COPY_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Acquisition Date */}
        <div>
          <label htmlFor="copy-date" className="mb-1 block text-sm font-medium">
            Acquisition Date
          </label>
          <input
            id="copy-date"
            type="date"
            {...register('acquisition_date')}
            className="w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Notes */}
        <div>
          <label htmlFor="copy-notes" className="mb-1 block text-sm font-medium">
            Notes
          </label>
          <textarea
            id="copy-notes"
            rows={2}
            {...register('notes')}
            className="w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="Optional notes…"
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-border px-3 py-1.5 text-sm transition-colors hover:bg-muted"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? 'Saving…' : isEdit ? 'Update' : 'Add Copy'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
