import { LayoutDashboard } from 'lucide-react'

export function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Overview of your inventory system.
        </p>
      </div>

      {/* Placeholder stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-lg border border-border bg-card p-5"
          >
            <div className="mb-3 h-4 w-24 animate-pulse rounded bg-muted" />
            <div className="h-8 w-16 animate-pulse rounded bg-muted" />
          </div>
        ))}
      </div>

      {/* Placeholder chart area */}
      <div className="rounded-lg border border-border bg-card p-6">
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <LayoutDashboard className="mb-3 size-10 opacity-30" />
          <p className="text-sm">Analytics widgets coming in a future milestone.</p>
        </div>
      </div>
    </div>
  )
}
