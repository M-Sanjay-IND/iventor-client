import { CheckCircle2, RotateCcw, LogOut, Calendar, Mail, Package } from 'lucide-react'
import type { Transaction, QrLookupResult } from '../types'

interface TransactionReceiptProps {
  transactions: Transaction[]
  items: QrLookupResult[]
  onScanAnother: () => void
  onEndSession: () => void
}

export function TransactionReceipt({
  transactions,
  items,
  onScanAnother,
  onEndSession,
}: TransactionReceiptProps) {
  if (transactions.length === 0) return null

  const firstTx = transactions[0]!
  const isBorrow = firstTx.type === 'borrow'
  const borrowerEmail = firstTx.borrower_email
  const formattedDate = new Date(firstTx.created_at).toLocaleString()
  const count = transactions.length

  const formattedDueDate = firstTx.due_date
    ? new Date(firstTx.due_date).toLocaleDateString()
    : null

  return (
    <div className="flex w-full max-w-lg flex-col items-center">
      {/* Success Icon */}
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
        <CheckCircle2 className="size-12" />
      </div>

      <h2 className="text-2xl font-bold tracking-tight text-foreground text-center">
        {count} {count === 1 ? 'Item' : 'Items'}{' '}
        {isBorrow ? 'Successfully Borrowed!' : 'Successfully Returned!'}
      </h2>

      <p className="mt-1 text-sm text-muted-foreground text-center flex items-center justify-center gap-1">
        <Mail className="size-3.5" />
        Digital receipt sent to <span className="font-medium text-foreground">{borrowerEmail}</span>
      </p>

      {/* Multi-item Receipt Card */}
      <div className="mt-6 w-full rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
        <div className="flex justify-between items-center border-b border-border/50 pb-3">
          <div>
            <span className="text-xs font-mono uppercase text-muted-foreground font-semibold">
              Batch #{firstTx.id.slice(0, 8)}
            </span>
            <p className="text-xs text-muted-foreground mt-0.5">{formattedDate}</p>
          </div>
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase ${
              isBorrow ? 'bg-primary/10 text-primary' : 'bg-emerald-500/10 text-emerald-500'
            }`}
          >
            {firstTx.type}
          </span>
        </div>

        {formattedDueDate && isBorrow && (
          <div className="flex justify-between items-center text-amber-600 bg-amber-500/10 p-2.5 rounded-xl text-xs font-medium">
            <span className="flex items-center gap-1.5">
              <Calendar className="size-4" /> Default Due Date
            </span>
            <span className="font-semibold">{formattedDueDate}</span>
          </div>
        )}

        {/* Processed Items Table */}
        <div className="space-y-2 pt-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
            <Package className="size-3.5" />
            <span>Processed Inventory Copies</span>
          </div>

          <div className="divide-y divide-border/40 max-h-48 overflow-y-auto rounded-xl border border-border/50 bg-muted/20 px-3">
            {items.map((item) => (
              <div key={item.copy_id} className="py-2.5 flex justify-between items-center text-xs">
                <div>
                  <span className="font-mono text-[10px] text-primary font-semibold">
                    {item.qr_uid}
                  </span>
                  <p className="font-medium text-foreground">{item.item_name}</p>
                  <p className="text-muted-foreground text-[11px]">Copy #{item.copy_number}</p>
                </div>
                <span className="text-emerald-500 font-semibold text-[11px]">Complete</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="mt-8 grid w-full grid-cols-2 gap-3">
        <button
          onClick={onScanAnother}
          className="flex h-12 items-center justify-center gap-1.5 rounded-xl border border-border bg-card text-sm font-semibold text-foreground transition-all hover:bg-muted active:scale-[0.98]"
        >
          <RotateCcw className="size-4" />
          Scan More
        </button>

        <button
          onClick={onEndSession}
          className="flex h-12 items-center justify-center gap-1.5 rounded-xl bg-primary text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 active:scale-[0.98]"
        >
          <LogOut className="size-4" />
          Done & Exit
        </button>
      </div>
    </div>
  )
}
