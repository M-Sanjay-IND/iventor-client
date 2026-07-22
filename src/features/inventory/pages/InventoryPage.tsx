import { Package } from 'lucide-react'

export function InventoryPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Inventory
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your items and physical copies.
        </p>
      </div>

      <div className="rounded-lg border border-border bg-card p-6">
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <Package className="mb-3 size-10 opacity-30" />
          <p className="text-sm font-medium">No inventory items yet</p>
          <p className="mt-1 text-xs">
            Inventory management will be available after Phase 4.
          </p>
        </div>
      </div>
    </div>
  )
}
