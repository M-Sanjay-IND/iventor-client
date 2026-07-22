import { Settings } from 'lucide-react'

export function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Settings
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Application configuration and preferences.
        </p>
      </div>

      <div className="rounded-lg border border-border bg-card p-6">
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <Settings className="mb-3 size-10 opacity-30" />
          <p className="text-sm font-medium">Settings coming soon</p>
          <p className="mt-1 text-xs">
            Configuration options will be available in a future milestone.
          </p>
        </div>
      </div>
    </div>
  )
}
