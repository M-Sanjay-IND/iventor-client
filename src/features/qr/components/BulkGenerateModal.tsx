/* eslint-disable */
import { useState } from 'react'
import { QrCode } from 'lucide-react'
import { toast } from 'sonner'
import { Modal } from '@/components/ui/Modal'
import { useUnlinkedCopies, useBulkGenerateQr } from '../hooks/qr.queries'

interface BulkGenerateModalProps {
  open: boolean
  onClose: () => void
}

export function BulkGenerateModal({ open, onClose }: BulkGenerateModalProps) {
  const { data: copies = [], isLoading } = useUnlinkedCopies()
  const bulkMutation = useBulkGenerateQr()
  const [selected, setSelected] = useState<Set<string>>(new Set())

  function toggleSelection(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  function toggleAll() {
    if (selected.size === copies.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(copies.map((c: any) => c.id as string)))
    }
  }

  async function handleGenerate() {
    if (selected.size === 0) return

    try {
      const results = await bulkMutation.mutateAsync(Array.from(selected))
      toast.success(`Generated ${results.length} QR code${results.length > 1 ? 's' : ''}`)
      setSelected(new Set())
      onClose()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Generation failed')
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Generate QR Codes" maxWidth="max-w-lg">
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-10 animate-pulse rounded bg-muted" />
          ))}
        </div>
      ) : copies.length === 0 ? (
        <div className="flex flex-col items-center py-8 text-muted-foreground">
          <QrCode className="mb-2 size-8 opacity-30" />
          <p className="text-sm font-medium">All copies have QR codes</p>
          <p className="mt-1 text-xs">Add new inventory copies to generate more.</p>
        </div>
      ) : (
        <>
          {/* Select all */}
          <div className="mb-3 flex items-center justify-between border-b border-border pb-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={selected.size === copies.length && copies.length > 0}
                onChange={toggleAll}
                className="size-4 rounded border-border accent-primary"
              />
              Select all ({copies.length})
            </label>
            <span className="text-xs text-muted-foreground">
              {selected.size} selected
            </span>
          </div>

          {/* Copy list */}
          <div className="max-h-72 space-y-1 overflow-y-auto">
            {copies.map((copy: any) => {
              const id = copy.id as string
              const item = copy.item as Record<string, unknown> | null
              const itemName = (item?.name as string) ?? 'Unknown'
              const category = item?.category as Record<string, string> | null
              const copyNumber = copy.copy_number as number

              return (
                <label
                  key={id}
                  className="flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 transition-colors hover:bg-muted/50"
                >
                  <input
                    type="checkbox"
                    checked={selected.has(id)}
                    onChange={() => toggleSelection(id)}
                    className="size-4 rounded border-border accent-primary"
                  />
                  <div className="flex-1 text-sm">
                    <span className="font-medium">{itemName}</span>
                    <span className="ml-1 font-mono text-xs text-muted-foreground">
                      #{copyNumber}
                    </span>
                    {category?.name && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        · {category.name}
                      </span>
                    )}
                  </div>
                </label>
              )
            })}
          </div>

          {/* Actions */}
          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-border px-3 py-1.5 text-sm transition-colors hover:bg-muted"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleGenerate}
              disabled={selected.size === 0 || bulkMutation.isPending}
              className="flex items-center gap-1.5 rounded-md bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              <QrCode className="size-3.5" />
              {bulkMutation.isPending
                ? `Generating ${selected.size}…`
                : `Generate ${selected.size} QR${selected.size !== 1 ? 's' : ''}`}
            </button>
          </div>
        </>
      )}
    </Modal>
  )
}
