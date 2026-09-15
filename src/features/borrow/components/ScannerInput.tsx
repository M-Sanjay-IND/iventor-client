import { useState, useRef, useEffect } from 'react'
import {
  QrCode,
  Search,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Loader2,
  Trash2,
  ShoppingBag,
  PackageCheck,
  Check,
  ShieldCheck,
  Unlock,
  Lock,
  X,
  KeyRound,
} from 'lucide-react'
import type { CounterMode, QrLookupResult } from '../types'
import { useLookupQr, useBorrowerActiveLoans } from '../hooks/borrow.queries'

interface ScannerInputProps {
  mode: CounterMode
  sessionToken: string | null
  onConfirmBulkAction: (qrUids: string[], copyIds: string[], items: QrLookupResult[]) => Promise<void>
  onBack: () => void
  loading: boolean
}

export function ScannerInput({
  mode,
  sessionToken,
  onConfirmBulkAction,
  onBack,
  loading,
}: ScannerInputProps) {
  const [inputVal, setInputVal] = useState('')
  const [cart, setCart] = useState<QrLookupResult[]>([])
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [allowManualInput, setAllowManualInput] = useState(false)
  const [showPinModal, setShowPinModal] = useState(false)
  const [pinValue, setPinValue] = useState('')
  const [pinError, setPinError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const keyStrokeTimesRef = useRef<number[]>([])

  const STAFF_PIN = (import.meta.env.VITE_STAFF_PIN as string) || '8821'

  function handleVerifyPin(e: React.FormEvent) {
    e.preventDefault()
    if (pinValue === STAFF_PIN) {
      setAllowManualInput(true)
      setShowPinModal(false)
      setPinValue('')
      setPinError(null)
      setErrorMsg(null)
    } else {
      setPinError('Invalid Staff PIN. Manual entry denied.')
      setPinValue('')
    }
  }

  const lookupMutation = useLookupQr()
  const isBorrow = mode === 'borrow'

  // Fetch active loans if in Return mode (Read-only reference)
  const { data: activeLoans = [], isLoading: loadingActiveLoans } = useBorrowerActiveLoans(
    !isBorrow ? sessionToken : null,
  )

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

  function isManualTypingDetected(times: number[]): boolean {
    if (times.length < 2) return false
    const first = times[0]
    const last = times[times.length - 1]
    if (first === undefined || last === undefined) return false

    const totalDuration = last - first
    const avgInterval = totalDuration / (times.length - 1)
    return avgInterval > 70 || (times.length >= 4 && totalDuration > 600)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()

      // Hardware Scanner Timing Verification:
      // Barcode/QR optical scanners in HID keyboard emulation emit characters at superhuman speed (<30ms avg interval).
      // Manual typing takes much longer (>80-150ms per key).
      if (!allowManualInput && isManualTypingDetected(keyStrokeTimesRef.current)) {
        setErrorMsg(
          'Manual keyboard typing blocked! Scan the physical book label with the handheld library scanner.',
        )
        setInputVal('')
        keyStrokeTimesRef.current = []
        return
      }

      keyStrokeTimesRef.current = []
      void handleScanOrLookup(inputVal)
    } else {
      keyStrokeTimesRef.current.push(performance.now())
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
        {isBorrow ? 'Scan Items to Borrow' : 'Scan Items to Return'}
      </h2>
      <p className="mt-1 text-sm text-muted-foreground text-center mb-6">
        {isBorrow
          ? 'Scan barcodes continuously to add items to your borrow list'
          : 'Scan physical barcodes below to verify and return items'}
      </p>

      {/* Read-Only Active Loans Reference Card (Return Mode Only) */}
      {!isBorrow && (
        <div className="w-full mb-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-emerald-500/20 pb-3">
            <div className="flex items-center gap-2">
              <PackageCheck className="size-5 text-emerald-600" />
              <div>
                <h3 className="text-base font-semibold text-foreground">
                  Your Currently Borrowed Items
                </h3>
                <p className="text-xs text-muted-foreground">
                  Reference checklist — scan barcodes below to return items
                </p>
              </div>
            </div>
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-500/10 px-2.5 py-1 rounded-full">
              {activeLoans.length} {activeLoans.length === 1 ? 'item' : 'items'} out
            </span>
          </div>

          {loadingActiveLoans ? (
            <div className="py-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin text-emerald-600" />
              Loading your active loans...
            </div>
          ) : activeLoans.length === 0 ? (
            <div className="py-4 text-center text-sm text-muted-foreground">
              You currently have no active borrowed items.
            </div>
          ) : (
            <div className="divide-y divide-emerald-500/10 max-h-56 overflow-y-auto pr-1 space-y-1">
              {activeLoans.map((loan) => {
                const isScanned = cart.some(
                  (c) => c.copy_id === loan.copy_id || c.qr_uid === loan.qr_uid || c.item_id === loan.item_id,
                )
                return (
                  <div
                    key={loan.transaction_id}
                    className="flex items-center justify-between py-2.5 px-2 rounded-lg transition-colors"
                  >
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {loan.item_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Copy #{loan.copy_number} • {loan.category_name || 'Item'} • Borrowed:{' '}
                        {new Date(loan.borrowed_at).toLocaleDateString()}
                      </p>
                    </div>

                    <div>
                      {isScanned ? (
                        <span className="flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-500/20 px-2.5 py-1 rounded-full">
                          <Check className="size-3.5" /> Scanned for Return
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground bg-muted px-2.5 py-1 rounded-full">
                          Pending Scan
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Scanner Guard Badge & Override Switch */}
      <div className="flex w-full items-center justify-between mb-2 px-1 text-xs">
        {allowManualInput ? (
          <span className="inline-flex items-center gap-1 font-semibold text-amber-500">
            <Unlock className="size-3.5" /> Staff Manual Override Active
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
            <ShieldCheck className="size-3.5" /> Hardware Scanner Guard Active (Optical HID Only)
          </span>
        )}
        <button
          type="button"
          onClick={() => {
            if (allowManualInput) {
              setAllowManualInput(false)
              setErrorMsg(null)
            } else {
              setShowPinModal(true)
              setPinValue('')
              setPinError(null)
            }
          }}
          className="text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors flex items-center gap-1"
        >
          {allowManualInput ? (
            'Lock to Scanner Only'
          ) : (
            <>
              <Lock className="size-3" /> Staff Override
            </>
          )}
        </button>
      </div>

      {/* Staff PIN Authorization Modal */}
      {showPinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border/50 pb-3">
              <div className="flex items-center gap-2">
                <div className="flex size-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
                  <KeyRound className="size-4" />
                </div>
                <h3 className="text-sm font-semibold text-foreground">
                  Staff Authorization Required
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowPinModal(false)
                  setPinError(null)
                }}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>

            <p className="text-xs text-muted-foreground">
              Enter the 4-digit librarian PIN to temporarily unlock manual keyboard typing.
            </p>

            <form onSubmit={handleVerifyPin} className="space-y-3">
              <input
                type="password"
                maxLength={4}
                autoFocus
                value={pinValue}
                onChange={(e) => setPinValue(e.target.value)}
                placeholder="••••"
                className="h-12 w-full text-center text-2xl tracking-[0.5em] font-mono rounded-xl border border-border bg-muted/40 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground"
              />

              {pinError && (
                <p className="text-xs font-medium text-destructive text-center">
                  {pinError}
                </p>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowPinModal(false)
                    setPinError(null)
                  }}
                  className="w-1/2 h-10 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={pinValue.length !== 4}
                  className="w-1/2 h-10 rounded-lg bg-primary text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  Authorize
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
          onPaste={(e) => {
            if (!allowManualInput) {
              e.preventDefault()
              setErrorMsg('Clipboard pasting is disabled on scanner input. Scan the physical barcode.')
            }
          }}
          onContextMenu={(e) => {
            if (!allowManualInput) {
              e.preventDefault()
            }
          }}
          placeholder={
            allowManualInput
              ? 'Enter Item QR UID manually...'
              : isBorrow
                ? 'Scan Item QR code to borrow...'
                : 'Scan physical QR code to return...'
          }
          disabled={loading || lookupMutation.isPending}
          className="h-14 w-full rounded-xl border border-border bg-card pl-12 pr-28 text-lg font-mono text-foreground placeholder:font-sans placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
        <button
          onClick={() => {
            if (!allowManualInput && inputVal.trim().length > 0 && isManualTypingDetected(keyStrokeTimesRef.current)) {
              setErrorMsg(
                'Manual keyboard typing blocked! Scan the physical barcode or toggle Staff Override.',
              )
              setInputVal('')
              keyStrokeTimesRef.current = []
              return
            }
            keyStrokeTimesRef.current = []
            void handleScanOrLookup(inputVal)
          }}
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
              {isBorrow ? 'Scanned Borrow List' : 'Scanned Return List'}
            </h3>
          </div>
          <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
            {cart.length} {cart.length === 1 ? 'unit' : 'units'}
          </span>
        </div>

        {cart.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            {isBorrow
              ? 'No items scanned yet. Point scanner at a barcode to begin.'
              : 'No barcodes scanned yet. Scan physical barcode to add to return batch.'}
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
                    {item.copy_number ? `Copy #${item.copy_number}` : `Stock: ${item.available_copies} / ${item.total_copies}`}
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
