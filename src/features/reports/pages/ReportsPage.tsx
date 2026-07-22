import { BarChart3 } from 'lucide-react'

export function ReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Reports
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Inventory, borrowing, and audit reports.
        </p>
      </div>

      <div className="rounded-lg border border-border bg-card p-6">
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <BarChart3 className="mb-3 size-10 opacity-30" />
          <p className="text-sm font-medium">No reports available</p>
          <p className="mt-1 text-xs">
            Reporting will be available after Phase 8.
          </p>
        </div>
      </div>
    </div>
  )
}
