import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { AlertCircle, CheckCircle2, AlertTriangle, ShieldAlert } from 'lucide-react'
import { toast } from 'sonner'
import { useMarkCopyLost, useMarkCopyDamaged, useAdminForceReturn } from '../hooks/transactions.queries'
import type { TransactionWithDetails } from '../types'

interface MarkLostDamagedModalProps {
  transaction: TransactionWithDetails | null
  actionType: 'lost' | 'damaged' | 'force_return' | null
  open: boolean
  onClose: () => void
}

export function MarkLostDamagedModal({
  transaction,
  actionType,
  open,
  onClose,
}: MarkLostDamagedModalProps) {
  const [notes, setNotes] = useState('')

  const markLostMutation = useMarkCopyLost()
  const markDamagedMutation = useMarkCopyDamaged()
  const forceReturnMutation = useAdminForceReturn()

  const loading =
    markLostMutation.isPending || markDamagedMutation.isPending || forceReturnMutation.isPending

  if (!transaction || !actionType) return null

  const copy = transaction.copy
  const itemName = copy?.item?.name ?? 'Unknown Item'
  const copyNum = copy?.copy_number ?? 1

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!transaction?.copy_id) return

    try {
      if (actionType === 'lost') {
        await markLostMutation.mutateAsync({ copyId: transaction.copy_id, notes })
        toast.success(`Marked "${itemName} (Copy #${copyNum})" as Lost.`)
      } else if (actionType === 'damaged') {
        await markDamagedMutation.mutateAsync({ copyId: transaction.copy_id, notes })
        toast.success(`Marked "${itemName} (Copy #${copyNum})" as Damaged.`)
      } else if (actionType === 'force_return') {
        await forceReturnMutation.mutateAsync({ copyId: transaction.copy_id, notes })
        toast.success(`Admin override return confirmed for "${itemName}".`)
      }
      setNotes('')
      onClose()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Action failed')
    }
  }

  const titles = {
    lost: 'Mark Copy as Lost',
    damaged: 'Mark Copy as Damaged',
    force_return: 'Admin Override Force Return',
  }

  const icons = {
    lost: <AlertCircle className="size-6 text-red-500" />,
    damaged: <AlertTriangle className="size-6 text-amber-500" />,
    force_return: <ShieldAlert className="size-6 text-primary" />,
  }

  return (
    <Modal open={open} onClose={onClose} title={titles[actionType]}>
      <form onSubmit={handleSubmit} className="p-4 space-y-4">
        <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/30 p-3">
          {icons[actionType]}
          <div>
            <p className="text-sm font-semibold text-foreground">{itemName}</p>
            <p className="text-xs text-muted-foreground">
              Copy #{copyNum} • Current Borrower: {transaction.borrower_email}
            </p>
          </div>
        </div>

        <div>
          <label htmlFor="overrideNotes" className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
            Audit Reason / Condition Notes
          </label>
          <textarea
            id="overrideNotes"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={
              actionType === 'lost'
                ? 'e.g., Unreturned after semester end, student notified.'
                : actionType === 'damaged'
                ? 'e.g., Screen cracked, sent to repair shop.'
                : 'e.g., Physical item received directly by laboratory admin.'
            }
            className="w-full rounded-lg border border-border bg-transparent p-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="border-t border-border pt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium text-white transition-all disabled:opacity-50 ${
              actionType === 'lost'
                ? 'bg-red-600 hover:bg-red-700'
                : actionType === 'damaged'
                ? 'bg-amber-600 hover:bg-amber-700'
                : 'bg-primary hover:bg-primary/90'
            }`}
          >
            <CheckCircle2 className="size-4" />
            {loading ? 'Processing...' : 'Confirm Action'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
