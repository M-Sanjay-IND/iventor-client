import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Printer } from 'lucide-react'
import { toast } from 'sonner'
import { useQrByUid, useReprintQr, useReplaceQr, useDeleteQr } from '../hooks/qr.queries'
import { QrPreviewCard } from '../components/QrPreviewCard'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { useState } from 'react'

export function QrDetailPage() {
  const { uid } = useParams<{ uid: string }>()
  const navigate = useNavigate()

  const { data: qr, isLoading } = useQrByUid(uid ?? '')
  const reprintMutation = useReprintQr()
  const replaceMutation = useReplaceQr()
  const deleteMutation = useDeleteQr()

  const [replaceConfirmOpen, setReplaceConfirmOpen] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)

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

  async function handleDelete() {
    try {
      if (!qr) return
      await deleteMutation.mutateAsync(qr.id)
      toast.success('QR and associated copy successfully deleted')
      setDeleteConfirmOpen(false)
      void navigate('/admin/qr')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Delete failed')
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
        onDelete={() => setDeleteConfirmOpen(true)}
        reprintLoading={reprintMutation.isPending}
        replaceLoading={replaceMutation.isPending}
        deleteLoading={deleteMutation.isPending}
      />

      {/* Replace confirmation */}
      <ConfirmDialog
        open={replaceConfirmOpen}
        onClose={() => setReplaceConfirmOpen(false)}
        onConfirm={() => void handleReplace()}
        title="Replace QR Code"
        message={`This will deactivate QR "${qr.qr_uid}" and generate a new one for the same copy. The original image is preserved. This action cannot be undone.`}
        confirmLabel="Replace"
      />

      {/* Delete confirmation */}
      <ConfirmDialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        title="Delete QR and Copy"
        message={`Are you sure you want to delete QR code ${qr.qr_uid}? This will also remove the physical inventory copy associated with it. This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={() => void handleDelete()}
      />
    </div>
  )
}
