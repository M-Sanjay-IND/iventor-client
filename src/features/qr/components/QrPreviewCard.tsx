/* eslint-disable */
import { format } from 'date-fns'
import { Download, Printer, RefreshCw } from 'lucide-react'
import { getQrImageUrl, downloadQrImage } from '../services/qr.service'
import type { QrCodeWithRelations } from '../types'

interface QrPreviewCardProps {
  qr: QrCodeWithRelations
  onReprint?: () => void
  onReplace?: () => void
  reprintLoading?: boolean
  replaceLoading?: boolean
}

export function QrPreviewCard({
  qr,
  onReprint,
  onReplace,
  reprintLoading,
  replaceLoading,
}: QrPreviewCardProps) {
  const imageUrl = getQrImageUrl(qr.png_storage_path)

  async function handleDownload(format: 'png' | 'svg') {
    const path = format === 'png' ? qr.png_storage_path : qr.svg_storage_path
    const blob = await downloadQrImage(path)
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${qr.qr_uid}.${format}`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
        {/* QR Image */}
        <div className="shrink-0 rounded-lg border border-border bg-white p-3">
          <img
            src={imageUrl}
            alt={`QR code ${qr.qr_uid}`}
            className="size-36"
            loading="lazy"
          />
        </div>

        {/* Metadata */}
        <div className="flex-1 space-y-3">
          <div>
            <p className="font-mono text-lg font-semibold text-primary">{qr.qr_uid}</p>
            <p className="text-sm text-muted-foreground">
              {qr.copy?.item?.name ?? 'Unknown Item'} — Copy #{qr.copy?.copy_number ?? '?'}
            </p>
          </div>

          <div className="grid gap-2 text-sm sm:grid-cols-3">
            <div>
              <span className="text-xs uppercase text-muted-foreground">Version</span>
              <p className="font-medium">v{qr.version}</p>
            </div>
            <div>
              <span className="text-xs uppercase text-muted-foreground">Print Count</span>
              <p className="font-medium">{qr.print_count}</p>
            </div>
            <div>
              <span className="text-xs uppercase text-muted-foreground">Generated</span>
              <p className="font-medium">
                {format(new Date(qr.created_at), 'dd MMM yyyy')}
              </p>
            </div>
            <div>
              <span className="text-xs uppercase text-muted-foreground">Last Printed</span>
              <p className="font-medium">
                {qr.last_printed_at
                  ? format(new Date(qr.last_printed_at), 'dd MMM yyyy')
                  : 'Never'}
              </p>
            </div>
            <div>
              <span className="text-xs uppercase text-muted-foreground">Status</span>
              <p className="font-medium">{qr.is_active ? 'Active' : 'Replaced'}</p>
            </div>
            <div>
              <span className="text-xs uppercase text-muted-foreground">Checksum</span>
              <p className="truncate font-mono text-xs" title={qr.checksum}>
                {qr.checksum.slice(0, 16)}…
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2 pt-1">
            <button
              type="button"
              onClick={() => handleDownload('png')}
              className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs transition-colors hover:bg-muted"
            >
              <Download className="size-3" />
              PNG
            </button>
            <button
              type="button"
              onClick={() => handleDownload('svg')}
              className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs transition-colors hover:bg-muted"
            >
              <Download className="size-3" />
              SVG
            </button>
            {qr.is_active && (
              <>
                <button
                  type="button"
                  onClick={onReprint}
                  disabled={reprintLoading}
                  className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
                >
                  <Printer className="size-3" />
                  {reprintLoading ? 'Printing…' : 'Reprint'}
                </button>
                <button
                  type="button"
                  onClick={onReplace}
                  disabled={replaceLoading}
                  className="flex items-center gap-1.5 rounded-md border border-destructive/30 px-3 py-1.5 text-xs text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-50"
                >
                  <RefreshCw className="size-3" />
                  {replaceLoading ? 'Replacing…' : 'Replace'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
