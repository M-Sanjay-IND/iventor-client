import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Pencil, Trash2, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { useItem, useCopies, useCreateCopy, useUpdateCopy, useDeleteItem } from '../hooks/inventory.queries'
import { CopiesTable } from '../components/CopiesTable'
import { CopyFormModal } from '../components/CopyFormModal'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import type { InventoryCopy } from '../types'
import type { CopyFormValues } from '../validation/schemas'

export function ItemDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: item, isLoading: itemLoading } = useItem(id ?? '')
  const { data: copies = [], isLoading: copiesLoading } = useCopies(id ?? '')
  const createCopyMutation = useCreateCopy()
  const updateCopyMutation = useUpdateCopy(id ?? '')
  const deleteItemMutation = useDeleteItem()

  const [copyModalOpen, setCopyModalOpen] = useState(false)
  const [editingCopy, setEditingCopy] = useState<InventoryCopy | null>(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)

  if (itemLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="h-4 w-96 animate-pulse rounded bg-muted" />
        <div className="h-64 animate-pulse rounded-lg bg-muted" />
      </div>
    )
  }

  if (!item) {
    return (
      <div className="py-16 text-center text-muted-foreground">
        <p className="text-lg font-medium">Item not found</p>
        <button
          type="button"
          onClick={() => navigate('/admin/inventory')}
          className="mt-3 text-sm text-primary hover:underline"
        >
          Back to inventory
        </button>
      </div>
    )
  }

  async function handleCopySubmit(data: CopyFormValues) {
    if (editingCopy) {
      await updateCopyMutation.mutateAsync({ id: editingCopy.id, data })
      toast.success('Copy updated')
    } else {
      await createCopyMutation.mutateAsync(data)
      toast.success('Copy added')
    }
    setCopyModalOpen(false)
    setEditingCopy(null)
  }

  function handleEditCopy(copy: InventoryCopy) {
    setEditingCopy(copy)
    setCopyModalOpen(true)
  }

  async function handleDeleteItem() {
    if (!item) return
    await deleteItemMutation.mutateAsync(item.id)
    toast.success('Item deleted')
    navigate('/admin/inventory')
  }

  return (
    <div className="space-y-6">
      {/* Back + Actions */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate('/admin/inventory')}
          className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back
        </button>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => navigate(`/admin/inventory/${item.id}/edit`)}
            className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm transition-colors hover:bg-muted"
          >
            <Pencil className="size-3.5" />
            Edit
          </button>
          <button
            type="button"
            onClick={() => setDeleteConfirmOpen(true)}
            className="flex items-center gap-1.5 rounded-md border border-destructive/30 px-3 py-1.5 text-sm text-destructive transition-colors hover:bg-destructive/10"
          >
            <Trash2 className="size-3.5" />
            Delete
          </button>
        </div>
      </div>

      {/* Item Metadata */}
      <div className="rounded-lg border border-border bg-card p-5">
        <h1 className="text-xl font-semibold text-foreground">{item.name}</h1>
        {item.description && (
          <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
        )}

        <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <span className="text-xs uppercase text-muted-foreground">Category</span>
            <p className="font-medium">{item.category?.name ?? '—'}</p>
          </div>
          <div>
            <span className="text-xs uppercase text-muted-foreground">Manufacturer</span>
            <p className="font-medium">{item.manufacturer ?? '—'}</p>
          </div>
          <div>
            <span className="text-xs uppercase text-muted-foreground">Brand / Model</span>
            <p className="font-medium">
              {[item.brand, item.model].filter(Boolean).join(' ') || '—'}
            </p>
          </div>
          <div>
            <span className="text-xs uppercase text-muted-foreground">SKU</span>
            <p className="font-mono text-xs font-medium">{item.sku ?? '—'}</p>
          </div>
          <div>
            <span className="text-xs uppercase text-muted-foreground">Unit Value</span>
            <p className="font-mono font-medium">
              {item.unit_value != null ? `₹${item.unit_value.toLocaleString()}` : '—'}
            </p>
          </div>
          <div>
            <span className="text-xs uppercase text-muted-foreground">Physical Copies</span>
            <p className="font-medium">{copies.length}</p>
          </div>
        </div>
      </div>

      {/* Copies Section */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold text-foreground">Physical Copies</h2>
          <button
            type="button"
            onClick={() => {
              setEditingCopy(null)
              setCopyModalOpen(true)
            }}
            className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Plus className="size-3.5" />
            Add Copy
          </button>
        </div>

        <CopiesTable
          data={copies}
          loading={copiesLoading}
          onEdit={handleEditCopy}
        />
      </div>

      {/* Modals */}
      <CopyFormModal
        open={copyModalOpen}
        onClose={() => {
          setCopyModalOpen(false)
          setEditingCopy(null)
        }}
        onSubmit={handleCopySubmit}
        itemId={item.id}
        editingCopy={editingCopy}
        loading={createCopyMutation.isPending || updateCopyMutation.isPending}
      />

      <ConfirmDialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleDeleteItem}
        title="Delete Item"
        message={`Are you sure you want to delete "${item.name}"? All associated copies will remain but the item will be archived.`}
        loading={deleteItemMutation.isPending}
      />
    </div>
  )
}
