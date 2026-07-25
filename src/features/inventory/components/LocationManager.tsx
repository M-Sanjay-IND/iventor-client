import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Pencil, Trash2 } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import {
  useLocations,
  useCreateLocation,
  useUpdateLocation,
  useDeleteLocation,
} from '../hooks/inventory.queries'
import { locationFormSchema, type LocationFormValues, type LocationFormInput } from '../validation/schemas'
import { toast } from 'sonner'

interface LocationManagerProps {
  open: boolean
  onClose: () => void
}

export function LocationManager({ open, onClose }: LocationManagerProps) {
  const { data: locations = [], isLoading } = useLocations()
  const createMutation = useCreateLocation()
  const updateMutation = useUpdateLocation()
  const deleteMutation = useDeleteLocation()

  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<LocationFormInput, unknown, LocationFormValues>({
    resolver: zodResolver(locationFormSchema),
    defaultValues: { name: '', description: '', parent_id: null },
  })

  function startEdit(loc: { id: string; name: string; description: string }) {
    setEditingId(loc.id)
    reset({ name: loc.name, description: loc.description, parent_id: null })
  }

  function cancelEdit() {
    setEditingId(null)
    reset({ name: '', description: '', parent_id: null })
  }

  async function onSubmit(data: LocationFormValues) {
    if (editingId) {
      await updateMutation.mutateAsync({ id: editingId, data })
      toast.success('Location updated')
      cancelEdit()
    } else {
      await createMutation.mutateAsync(data)
      toast.success('Location created')
      reset({ name: '', description: '', parent_id: null })
    }
  }

  async function handleDelete() {
    if (!deleteId) return
    await deleteMutation.mutateAsync(deleteId)
    toast.success('Location deleted')
    setDeleteId(null)
  }

  return (
    <>
      <Modal open={open} onClose={onClose} title="Manage Locations" maxWidth="max-w-md">
        <form onSubmit={handleSubmit(onSubmit)} className="mb-4 flex gap-2">
          <div className="flex-1">
            <input
              type="text"
              {...register('name')}
              className="w-full rounded-md border border-border bg-transparent px-3 py-1.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder={editingId ? 'Rename location…' : 'New location name…'}
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

        <div className="max-h-60 space-y-1 overflow-y-auto">
          {isLoading ? (
            <p className="py-4 text-center text-sm text-muted-foreground">Loading…</p>
          ) : locations.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              No locations yet.
            </p>
          ) : (
            locations.map((loc) => (
              <div
                key={loc.id}
                className="flex items-center justify-between rounded-md px-3 py-2 text-sm hover:bg-muted/50"
              >
                <span>{loc.name}</span>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => startEdit(loc)}
                    className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                    aria-label={`Edit ${loc.name}`}
                  >
                    <Pencil className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteId(loc.id)}
                    className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    aria-label={`Delete ${loc.name}`}
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
        title="Delete Location"
        message="Copies using this location will become unlocated. This action cannot be undone."
        loading={deleteMutation.isPending}
      />
    </>
  )
}
