import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Pencil, Trash2 } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import {
  useCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
} from '../hooks/inventory.queries'
import { categoryFormSchema, type CategoryFormValues, type CategoryFormInput } from '../validation/schemas'
import { toast } from 'sonner'

interface CategoryManagerProps {
  open: boolean
  onClose: () => void
}

export function CategoryManager({ open, onClose }: CategoryManagerProps) {
  const { data: categories = [], isLoading } = useCategories()
  const createMutation = useCreateCategory()
  const updateMutation = useUpdateCategory()
  const deleteMutation = useDeleteCategory()

  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CategoryFormInput, unknown, CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: { name: '', description: '', parent_id: null },
  })

  function startEdit(cat: { id: string; name: string; description: string }) {
    setEditingId(cat.id)
    reset({ name: cat.name, description: cat.description, parent_id: null })
  }

  function cancelEdit() {
    setEditingId(null)
    reset({ name: '', description: '', parent_id: null })
  }

  async function onSubmit(data: CategoryFormValues) {
    if (editingId) {
      await updateMutation.mutateAsync({ id: editingId, data })
      toast.success('Category updated')
      cancelEdit()
    } else {
      await createMutation.mutateAsync(data)
      toast.success('Category created')
      reset({ name: '', description: '', parent_id: null })
    }
  }

  async function handleDelete() {
    if (!deleteId) return
    await deleteMutation.mutateAsync(deleteId)
    toast.success('Category deleted')
    setDeleteId(null)
  }

  return (
    <>
      <Modal open={open} onClose={onClose} title="Manage Categories" maxWidth="max-w-md">
        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="mb-4 flex gap-2">
          <div className="flex-1">
            <input
              type="text"
              {...register('name')}
              className="w-full rounded-md border border-border bg-transparent px-3 py-1.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder={editingId ? 'Rename category…' : 'New category name…'}
            />
            {errors.name && (
              <p className="mt-0.5 text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>
          <button
            type="submit"
            disabled={createMutation.isPending || updateMutation.isPending}
            className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {editingId ? 'Update' : 'Add'}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={cancelEdit}
              className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-muted"
            >
              Cancel
            </button>
          )}
        </form>

        {/* List */}
        <div className="max-h-60 space-y-1 overflow-y-auto">
          {isLoading ? (
            <p className="py-4 text-center text-sm text-muted-foreground">Loading…</p>
          ) : categories.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              No categories yet.
            </p>
          ) : (
            categories.map((cat) => (
              <div
                key={cat.id}
                className="flex items-center justify-between rounded-md px-3 py-2 text-sm hover:bg-muted/50"
              >
                <span>{cat.name}</span>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => startEdit(cat)}
                    className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                    aria-label={`Edit ${cat.name}`}
                  >
                    <Pencil className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteId(cat.id)}
                    className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    aria-label={`Delete ${cat.name}`}
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteId)}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Category"
        message="Items using this category will become uncategorized. This action cannot be undone."
        loading={deleteMutation.isPending}
      />
    </>
  )
}
