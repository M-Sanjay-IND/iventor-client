import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { itemFormSchema, type ItemFormValues, type ItemFormInput } from '../validation/schemas'
import { useCategories } from '../hooks/inventory.queries'

interface ItemFormProps {
  defaultValues?: Partial<ItemFormValues>
  onSubmit: (data: ItemFormValues) => void
  loading?: boolean
  submitLabel?: string
}

export function ItemForm({
  defaultValues,
  onSubmit,
  loading = false,
  submitLabel = 'Create Item',
}: ItemFormProps) {
  const { data: categories = [] } = useCategories()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ItemFormInput, unknown, ItemFormValues>({
    resolver: zodResolver(itemFormSchema),
    defaultValues: {
      name: '',
      description: '',
      category_id: null,
      manufacturer: null,
      brand: null,
      model: null,
      sku: null,
      unit_value: null,
      metadata: {},
      ...defaultValues,
    },
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Name */}
      <div>
        <label htmlFor="name" className="mb-1 block text-sm font-medium text-foreground">
          Name <span className="text-destructive">*</span>
        </label>
        <input
          id="name"
          type="text"
          {...register('name')}
          className="w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          placeholder="e.g., Dell Latitude 5540"
        />
        {errors.name && (
          <p className="mt-1 text-xs text-destructive">{errors.name.message}</p>
        )}
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className="mb-1 block text-sm font-medium text-foreground">
          Description
        </label>
        <textarea
          id="description"
          rows={3}
          {...register('description')}
          className="w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          placeholder="Optional description…"
        />
      </div>

      {/* Category */}
      <div>
        <label htmlFor="category_id" className="mb-1 block text-sm font-medium text-foreground">
          Category
        </label>
        <select
          id="category_id"
          {...register('category_id')}
          className="w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="">No category</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      {/* Manufacturer / Brand / Model — compact row */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="manufacturer" className="mb-1 block text-sm font-medium text-foreground">
            Manufacturer
          </label>
          <input
            id="manufacturer"
            type="text"
            {...register('manufacturer')}
            className="w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="e.g., Dell"
          />
        </div>
        <div>
          <label htmlFor="brand" className="mb-1 block text-sm font-medium text-foreground">
            Brand
          </label>
          <input
            id="brand"
            type="text"
            {...register('brand')}
            className="w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="e.g., Latitude"
          />
        </div>
        <div>
          <label htmlFor="model" className="mb-1 block text-sm font-medium text-foreground">
            Model
          </label>
          <input
            id="model"
            type="text"
            {...register('model')}
            className="w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="e.g., 5540"
          />
        </div>
      </div>

      {/* SKU / Unit Value — compact row */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="sku" className="mb-1 block text-sm font-medium text-foreground">
            SKU
          </label>
          <input
            id="sku"
            type="text"
            {...register('sku')}
            className="w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm font-mono text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="e.g., DELL-LAT-5540"
          />
        </div>
        <div>
          <label htmlFor="unit_value" className="mb-1 block text-sm font-medium text-foreground">
            Unit Value (₹)
          </label>
          <input
            id="unit_value"
            type="number"
            step="0.01"
            min="0"
            {...register('unit_value', { valueAsNumber: true })}
            className="w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm font-mono text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="0.00"
          />
          {errors.unit_value && (
            <p className="mt-1 text-xs text-destructive">{errors.unit_value.message}</p>
          )}
        </div>
      </div>

      {/* Submit */}
      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
        >
          {loading ? 'Saving…' : submitLabel}
        </button>
      </div>
    </form>
  )
}
