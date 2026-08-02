import { useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeft, Printer } from 'lucide-react'
import { useQrLabels } from '../hooks/qr.queries'
import { PrintPreview } from '../components/PrintPreview'

export function PrintPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const state = location.state as { qrIds?: string[] } | null
  const qrIds = state?.qrIds ?? []

  const { data: labels = [], isLoading } = useQrLabels(qrIds)

  if (qrIds.length === 0) {
    return (
      <div className="py-16 text-center text-muted-foreground">
        <p className="text-lg font-medium">No QR codes selected</p>
        <button
          type="button"
          onClick={() => void navigate('/admin/qr')}
          className="mt-3 text-sm text-primary hover:underline"
        >
          Back to QR codes
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Screen-only toolbar */}
      <div className="no-print flex items-center justify-between">
        <button
          type="button"
          onClick={() => void navigate('/admin/qr')}
          className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back
        </button>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">
            {labels.length} label{labels.length !== 1 ? 's' : ''}
          </span>
          <button
            type="button"
            onClick={() => window.print()}
            disabled={isLoading || labels.length === 0}
            className="flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            <Printer className="size-4" />
            Print
          </button>
        </div>
      </div>

      {/* Loading */}
      {isLoading ? (
        <div className="space-y-4">
          <div className="h-96 animate-pulse rounded-lg bg-muted" />
        </div>
      ) : (
        <PrintPreview labels={labels} layout="a4-grid" />
      )}
    </div>
  )
}
