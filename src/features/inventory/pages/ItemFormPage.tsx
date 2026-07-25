import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { useItem, useCreateItem, useUpdateItem } from '../hooks/inventory.queries'
import { ItemForm } from '../components/ItemForm'
import type { ItemFormValues } from '../validation/schemas'

export function ItemFormPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isEdit = Boolean(id)

  const { data: existingItem, isLoading } = useItem(id ?? '')
  const createMutation = useCreateItem()
  const updateMutation = useUpdateItem()

  async function handleSubmit(data: ItemFormValues) {
    if (isEdit && id) {
      await updateMutation.mutateAsync({ id, data })
      toast.success('Item updated')
      navigate(`/admin/inventory/${id}`)
    } else {
      const result = await createMutation.mutateAsync(data)
      toast.success('Item created')
      navigate(`/admin/inventory/${result.id}`)
    }
  }

  if (isEdit && isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="h-96 animate-pulse rounded-lg bg-muted" />
      </div>
    )
  }

  if (isEdit && !existingItem) {
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

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back
        </button>
      </div>

      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {isEdit ? 'Edit Item' : 'New Item'}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {isEdit
            ? 'Update the inventory item details.'
            : 'Add a new abstract item to your inventory.'}
        </p>
      </div>

      <div className="rounded-lg border border-border bg-card p-5">
        <ItemForm
          defaultValues={
            existingItem
              ? {
                  name: existingItem.name,
                  description: existingItem.description,
                  category_id: existingItem.category_id,
                  manufacturer: existingItem.manufacturer,
                  brand: existingItem.brand,
                  model: existingItem.model,
                  sku: existingItem.sku,
                  unit_value: existingItem.unit_value,
                  metadata: existingItem.metadata,
                }
              : undefined
          }
          onSubmit={handleSubmit}
          loading={createMutation.isPending || updateMutation.isPending}
          submitLabel={isEdit ? 'Update Item' : 'Create Item'}
        />
      </div>
    </div>
  )
}
