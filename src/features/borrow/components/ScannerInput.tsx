import { useState, useRef, useEffect } from 'react'
import { QrCode, Search, CheckCircle2, AlertCircle, ArrowLeft, Loader2 } from 'lucide-react'
import type { CounterMode, QrLookupResult } from '../types'
import { useLookupQr } from '../hooks/borrow.queries'

interface ScannerInputProps {
  mode: CounterMode
  onConfirmAction: (copyId: string) => Promise<void>
  onBack: () => void
  loading: boolean
}

export function ScannerInput({ mode, onConfirmAction, onBack, loading }: ScannerInputProps) {
  const [inputVal, setInputVal] = useState('')
  const [scannedData, setScannedData] = useState<QrLookupResult | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const lookupMutation = useLookupQr()

  // Auto-focus input on mount and keep focus
  useEffect(() => {
    inputRef.current?.focus()
  }, [scannedData])

  async function handleSearch(qrUidToSearch: string) {
    if (!qrUidToSearch.trim()) return
    setErrorMsg(null)
    setScannedData(null)

    try {
      const result = await lookupMutation.mutateAsync(qrUidToSearch.trim())
      setScannedData(result)
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to find QR code')
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()
      void handleSearch(inputVal)
    }
  }

  async function handleConfirm() {
    if (!scannedData || loading) return
    setErrorMsg(null)
    try {
      await onConfirmAction(scannedData.copy_id)
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Transaction failed')
    }
  }

  const isBorrow = mode === 'borrow'
  const isInvalidState = isBorrow
    ? scannedData?.status !== 'available'
    : scannedData?.status !== 'borrowed'

  return (
    <div className="flex w-full max-w-xl flex-col items-center">
      {/* Back button */}
      <button
        onClick={onBack}
        disabled={loading}
        className="mb-6 flex items-center gap-1.5 self-start text-sm text-muted-foreground hover:text-foreground disabled:opacity-50"
      >
        <ArrowLeft className="size-4" /> Back to Actions
      </button>

      <div className="mb-4 flex items-center gap-2">
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider ${
            isBorrow
              ? 'bg-primary/10 text-primary'
              : 'bg-emerald-500/10 text-emerald-500'
          }`}
        >
          {isBorrow ? 'Borrow Mode' : 'Return Mode'}
        </span>
      </div>

      <h2 className="text-2xl font-bold tracking-tight text-foreground text-center">
        Scan QR Code
      </h2>
      <p className="mt-1 text-sm text-muted-foreground text-center mb-6">
        Point the USB/Bluetooth scanner at the item label or enter QR UID
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
          placeholder="Scan barcode or type INV-000000001..."
          disabled={loading || lookupMutation.isPending}
          className="h-14 w-full rounded-xl border border-border bg-card pl-12 pr-28 text-lg font-mono text-foreground placeholder:font-sans placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
        <button
          onClick={() => void handleSearch(inputVal)}
          disabled={!inputVal.trim() || loading || lookupMutation.isPending}
          className="absolute right-2 top-2 bottom-2 flex items-center gap-1 rounded-lg bg-secondary px-4 text-sm font-medium text-secondary-foreground hover:bg-secondary/80 disabled:opacity-50"
        >
          {lookupMutation.isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <>
              <Search className="size-4" /> Lookup
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

      {/* Scanned Item Details Card */}
      {scannedData && (
        <div className="w-full rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <span className="font-mono text-xs text-primary font-semibold">
                {scannedData.qr_uid}
              </span>
              <h3 className="text-xl font-bold text-foreground mt-0.5">
                {scannedData.item_name}
              </h3>
              <p className="text-sm text-muted-foreground">
                Copy #{scannedData.copy_number}
              </p>
            </div>

            <div className="text-right">
              <span
                className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
                  scannedData.status === 'available'
                    ? 'bg-emerald-500/10 text-emerald-500'
                    : scannedData.status === 'borrowed'
                    ? 'bg-amber-500/10 text-amber-500'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {scannedData.status}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs border-t border-border/50 pt-3 text-muted-foreground">
            <div>
              <span className="block font-medium text-foreground">Category</span>
              {scannedData.category_name || 'Unassigned'}
            </div>
            <div>
              <span className="block font-medium text-foreground">Location</span>
              {scannedData.location_name || 'Unassigned'}
            </div>
            <div>
              <span className="block font-medium text-foreground">Condition</span>
              <span className="capitalize">{scannedData.condition}</span>
            </div>
          </div>

          {/* Validation Banner if item status is invalid for the mode */}
          {isInvalidState && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-600 flex items-center gap-2">
              <AlertCircle className="size-4 shrink-0" />
              <span>
                {isBorrow
                  ? `Cannot borrow: item is currently "${scannedData.status}"`
                  : `Cannot return: item is currently "${scannedData.status}"`}
              </span>
            </div>
          )}

          {/* Action button */}
          <button
            onClick={() => void handleConfirm()}
            disabled={isInvalidState || loading}
            className={`w-full h-12 flex items-center justify-center gap-2 rounded-xl text-base font-semibold transition-all active:scale-[0.98] disabled:opacity-50 ${
              isBorrow
                ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                : 'bg-emerald-600 text-white hover:bg-emerald-700'
            }`}
          >
            {loading ? (
              <Loader2 className="size-5 animate-spin" />
            ) : (
              <>
                <CheckCircle2 className="size-5" />
                Confirm {isBorrow ? 'Borrow' : 'Return'}
              </>
            )}
          </button>
        </div>
      )}
    </div>
  )
}
