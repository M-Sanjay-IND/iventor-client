import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Printer } from 'lucide-react'
import { toast } from 'sonner'
import { useQrByUid, useReprintQr, useReplaceQr } from '../hooks/qr.queries'
import { QrPreviewCard } from '../components/QrPreviewCard'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { useState } from 'react'

export function QrDetailPage() {
  const { uid } = useParams<{ uid: string }>()
  const navigate = useNavigate()

  const { data: qr, isLoading } = useQrByUid(uid ?? '')
  const reprintMutation = useReprintQr()
  const replaceMutation = useReplaceQr()

  const [replaceConfirmOpen, setReplaceConfirmOpen] = useState(false)

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="h-64 animate-pulse rounded-lg bg-muted" />
      </div>
    )
  }

  if (!qr) {
    return (
      <div className="py-16 text-center text-muted-foreground">
        <p className="text-lg font-medium">QR code not found</p>
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

  async function handleReprint() {
    try {
      if (!qr) return
      await reprintMutation.mutateAsync(qr.id)
      toast.success('Print count updated')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Reprint failed')
    }
  }

  async function handleReplace() {
    try {
      if (!qr) return
      const newQr = await replaceMutation.mutateAsync(qr.id)
      toast.success(`Replaced with ${newQr.qr_uid}`)
      setReplaceConfirmOpen(false)
      void navigate(`/admin/qr/${newQr.qr_uid}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Replace failed')
    }
  }

  return (
    <div className="space-y-6">
      {/* Back + Print */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => void navigate('/admin/qr')}
          className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back
        </button>
        {qr.is_active && (
          <button
            type="button"
            onClick={() =>
              void navigate('/admin/qr/print', { state: { qrIds: [qr.id] } })
            }
            className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Printer className="size-3.5" />
            Print Label
          </button>
        )}
      </div>

      {/* QR Detail Card */}
      <QrPreviewCard
        qr={qr}
        onReprint={handleReprint}
        onReplace={() => setReplaceConfirmOpen(true)}
        reprintLoading={reprintMutation.isPending}
        replaceLoading={replaceMutation.isPending}
      />

      {/* Replace confirmation */}
      <ConfirmDialog
        open={replaceConfirmOpen}
        onClose={() => setReplaceConfirmOpen(false)}
        onConfirm={handleReplace}
        title="Replace QR Code"
        message={`This will deactivate QR "${qr.qr_uid}" and generate a new one for the same copy. The original image is preserved. This action cannot be undone.`}
        loading={replaceMutation.isPending}
      />
    </div>
  )
}
