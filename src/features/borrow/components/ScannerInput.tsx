import { useState, useRef, useEffect } from 'react'
import { QrCode, Search, CheckCircle2, AlertCircle, ArrowLeft, Loader2, Trash2, ShoppingBag } from 'lucide-react'
import type { CounterMode, QrLookupResult } from '../types'
import { useLookupQr } from '../hooks/borrow.queries'

interface ScannerInputProps {
  mode: CounterMode
  onConfirmBulkAction: (qrUids: string[], copyIds: string[], items: QrLookupResult[]) => Promise<void>
  onBack: () => void
  loading: boolean
}

export function ScannerInput({
  mode,
  onConfirmBulkAction,
  onBack,
  loading,
}: ScannerInputProps) {
  const [inputVal, setInputVal] = useState('')
  const [cart, setCart] = useState<QrLookupResult[]>([])
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const lookupMutation = useLookupQr()
  const isBorrow = mode === 'borrow'

  // Keep input focused for rapid scanner input
  useEffect(() => {
    inputRef.current?.focus()
  }, [cart, errorMsg])

  async function handleScanOrLookup(qrUidToSearch: string) {
    const trimmedUid = qrUidToSearch.trim().toUpperCase()
    if (!trimmedUid) return

    setErrorMsg(null)

    try {
      const item = await lookupMutation.mutateAsync(trimmedUid)

      // Count how many of this item QR are already in the cart
      const currentCartCount = cart.filter((c) => c.qr_uid === item.qr_uid).length

      // Stock validation
      if (isBorrow) {
        if (item.available_copies <= currentCartCount) {
          setErrorMsg(
            `Cannot add more "${item.item_name}": only ${item.available_copies} available copy remaining.`,
          )
          setInputVal('')
          return
        }
      } else {
        if (item.borrowed_copies <= currentCartCount) {
          setErrorMsg(
            `Cannot add more "${item.item_name}": only ${item.borrowed_copies} borrowed copy available to return.`,
          )
          setInputVal('')
          return
        }
      }

      // Add item to cart list
      setCart((prev) => [...prev, item])
      setInputVal('')
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'QR Code not found')
      setInputVal('')
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()
      void handleScanOrLookup(inputVal)
    }
  }

  function handleRemoveItem(index: number) {
    setCart((prev) => prev.filter((_, idx) => idx !== index))
  }

  async function handleConfirmBulk() {
    if (cart.length === 0 || loading) return
    setErrorMsg(null)

    const qrUids = cart.map((item) => item.qr_uid)
    const copyIds = cart.map((item) => item.copy_id).filter(Boolean) as string[]

    try {
      await onConfirmBulkAction(qrUids, copyIds, cart)
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Batch transaction failed')
    }
  }

  return (
    <div className="flex w-full max-w-2xl flex-col items-center">
      {/* Back button */}
      <button
        onClick={onBack}
        disabled={loading}
        className="mb-6 flex items-center gap-1.5 self-start text-sm text-muted-foreground hover:text-foreground disabled:opacity-50"
      >
        <ArrowLeft className="size-4" /> Back to Actions
      </button>

      <div className="mb-3 flex items-center gap-2">
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider ${
            isBorrow
              ? 'bg-primary/10 text-primary'
              : 'bg-emerald-500/10 text-emerald-500'
          }`}
        >
          {isBorrow ? 'Bulk Borrow Mode' : 'Bulk Return Mode'}
        </span>
      </div>

      <h2 className="text-2xl font-bold tracking-tight text-foreground text-center">
        Scan Items
      </h2>
      <p className="mt-1 text-sm text-muted-foreground text-center mb-6">
        Scan barcodes continuously to add items to your list
      </p>

      {/* Scanner / Manual Search Input */}
      <div className="relative w-full mb-6">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-muted-foreground">
          <QrCode className="size-5" />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Scan Item QR code continuously..."
          disabled={loading || lookupMutation.isPending}
          className="h-14 w-full rounded-xl border border-border bg-card pl-12 pr-28 text-lg font-mono text-foreground placeholder:font-sans placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
        <button
          onClick={() => void handleScanOrLookup(inputVal)}
          disabled={!inputVal.trim() || loading || lookupMutation.isPending}
          className="absolute right-2 top-2 bottom-2 flex items-center gap-1 rounded-lg bg-secondary px-4 text-sm font-medium text-secondary-foreground hover:bg-secondary/80 disabled:opacity-50"
        >
          {lookupMutation.isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <>
              <Search className="size-4" /> Add
            </>
          )}
        </button>
      </div>

      {/* Error message */}
      {errorMsg && (
        <div className="w-full mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-600 flex items-start gap-3">
          <AlertCircle className="size-5 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Cart Staging List */}
      <div className="w-full rounded-2xl border border-border bg-card p-6 shadow-sm mb-6 space-y-4">
        <div className="flex justify-between items-center border-b border-border/50 pb-3">
          <div className="flex items-center gap-2">
            <ShoppingBag className="size-5 text-primary" />
            <h3 className="text-base font-semibold text-foreground">
              Scanned Items List
            </h3>
          </div>
          <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
            {cart.length} {cart.length === 1 ? 'unit' : 'units'}
          </span>
        </div>

        {cart.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            No items scanned yet. Point scanner at a barcode to begin.
          </div>
        ) : (
          <div className="divide-y divide-border/50 max-h-64 overflow-y-auto">
            {cart.map((item, idx) => (
              <div
                key={`${item.qr_uid}-${idx}`}
                className="flex items-center justify-between py-3 hover:bg-muted/30 px-2 rounded-lg"
              >
                <div>
                  <span className="font-mono text-xs text-primary font-semibold">
                    {item.qr_uid}
                  </span>
                  <p className="text-sm font-medium text-foreground">
                    {item.item_name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {item.category_name ? `${item.category_name} • ` : ''}
                    Available Stock: {item.available_copies} / {item.total_copies}
                  </p>
                </div>

                <button
                  onClick={() => handleRemoveItem(idx)}
                  disabled={loading}
                  title="Remove unit from list"
                  className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors disabled:opacity-50"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Bulk Action button */}
        {cart.length > 0 && (
          <button
            onClick={() => void handleConfirmBulk()}
            disabled={loading}
            className={`w-full h-14 mt-4 flex items-center justify-center gap-2 rounded-xl text-lg font-semibold transition-all active:scale-[0.98] disabled:opacity-50 ${
              isBorrow
                ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                : 'bg-emerald-600 text-white hover:bg-emerald-700'
            }`}
          >
            {loading ? (
              <Loader2 className="size-5 animate-spin" />
            ) : (
              <>
                <CheckCircle2 className="size-6" />
                Confirm {isBorrow ? 'Borrow' : 'Return'} ({cart.length}{' '}
                {cart.length === 1 ? 'Unit' : 'Units'})
              </>
            )}
          </button>
        )}
      </div>
    </div>
  )
}
