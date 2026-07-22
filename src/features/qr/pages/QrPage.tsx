import { QrCode } from 'lucide-react'

export function QrPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          QR Codes
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Generate and manage permanent QR identities.
        </p>
      </div>

      <div className="rounded-lg border border-border bg-card p-6">
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <QrCode className="mb-3 size-10 opacity-30" />
          <p className="text-sm font-medium">No QR codes generated</p>
          <p className="mt-1 text-xs">
            QR management will be available after Phase 5.
          </p>
        </div>
      </div>
    </div>
  )
}
