import { CheckCircle2, RotateCcw, LogOut, Calendar, Mail } from 'lucide-react'
import type { Transaction } from '../types'

interface TransactionReceiptProps {
  transaction: Transaction
  onScanAnother: () => void
  onEndSession: () => void
}

export function TransactionReceipt({
  transaction,
  onScanAnother,
  onEndSession,
}: TransactionReceiptProps) {
  const isBorrow = transaction.type === 'borrow'
  const formattedDate = new Date(transaction.created_at).toLocaleString()
  const formattedDueDate = transaction.due_date
    ? new Date(transaction.due_date).toLocaleDateString()
    : null

  return (
    <div className="flex w-full max-w-md flex-col items-center">
      {/* Success Icon */}
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
        <CheckCircle2 className="size-12" />
      </div>

      <h2 className="text-2xl font-bold tracking-tight text-foreground text-center">
        {isBorrow ? 'Item Borrowed!' : 'Item Returned!'}
      </h2>
      <p className="mt-1 text-sm text-muted-foreground text-center flex items-center justify-center gap-1">
        <Mail className="size-3.5" />
        Receipt sent to <span className="font-medium text-foreground">{transaction.borrower_email}</span>
      </p>

      {/* Receipt Details Card */}
      <div className="mt-6 w-full rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
        <div className="border-b border-border/50 pb-3">
          <span className="text-xs font-mono uppercase text-muted-foreground font-semibold">
            Transaction #{transaction.id.slice(0, 8)}
          </span>
          <p className="text-xs text-muted-foreground mt-0.5">{formattedDate}</p>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Action</span>
            <span
              className={`font-semibold capitalize ${
                isBorrow ? 'text-primary' : 'text-emerald-500'
              }`}
            >
              {transaction.type}
            </span>
          </div>

          {formattedDueDate && isBorrow && (
            <div className="flex justify-between items-center text-amber-600 bg-amber-500/10 p-2 rounded-lg text-xs font-medium">
              <span className="flex items-center gap-1">
                <Calendar className="size-3.5" /> Due Date
              </span>
              <span>{formattedDueDate}</span>
            </div>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className="mt-8 grid w-full grid-cols-2 gap-3">
        <button
          onClick={onScanAnother}
          className="flex h-12 items-center justify-center gap-1.5 rounded-xl border border-border bg-card text-sm font-semibold text-foreground transition-all hover:bg-muted active:scale-[0.98]"
        >
          <RotateCcw className="size-4" />
          Scan Another
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
