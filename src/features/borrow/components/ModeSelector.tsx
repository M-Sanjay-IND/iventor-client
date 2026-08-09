import { ArrowDownToLine, ArrowUpFromLine, LogOut } from 'lucide-react'
import type { CounterMode } from '../types'

interface ModeSelectorProps {
  email: string
  onSelectMode: (mode: CounterMode) => void
  onEndSession: () => void
}

export function ModeSelector({ email, onSelectMode, onEndSession }: ModeSelectorProps) {
  return (
    <div className="flex w-full max-w-2xl flex-col items-center">
      {/* Active Borrower Info Header */}
      <div className="mb-8 flex items-center justify-between w-full rounded-xl border border-border bg-card p-4 px-6 shadow-sm">
        <div>
          <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
            Active Session
          </span>
          <p className="text-base font-semibold text-foreground">{email}</p>
        </div>
        <button
          onClick={onEndSession}
          className="flex items-center gap-1.5 rounded-lg border border-border bg-transparent px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
        >
          <LogOut className="size-4" />
          End Session
        </button>
      </div>

      <h2 className="text-2xl font-bold tracking-tight text-foreground text-center mb-2">
        What would you like to do?
      </h2>
      <p className="text-muted-foreground text-center mb-8">
        Select an action to proceed with scanning
      </p>

      {/* Large Action Cards */}
      <div className="grid w-full grid-cols-1 md:grid-cols-2 gap-6">
        {/* Borrow Card */}
        <button
          onClick={() => onSelectMode('borrow')}
          className="group relative flex flex-col items-center justify-center p-8 rounded-2xl border-2 border-border bg-card hover:border-primary hover:bg-primary/5 transition-all duration-200 active:scale-[0.98] shadow-sm text-center"
        >
          <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10 text-primary group-hover:scale-110 transition-transform">
            <ArrowDownToLine className="size-10" />
          </div>
          <h3 className="text-xl font-bold text-foreground">Borrow Item</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Check out physical inventory items to take with you
          </p>
        </button>

        {/* Return Card */}
        <button
          onClick={() => onSelectMode('return')}
          className="group relative flex flex-col items-center justify-center p-8 rounded-2xl border-2 border-border bg-card hover:border-emerald-500 hover:bg-emerald-500/5 transition-all duration-200 active:scale-[0.98] shadow-sm text-center"
        >
          <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500 group-hover:scale-110 transition-transform">
            <ArrowUpFromLine className="size-10" />
          </div>
          <h3 className="text-xl font-bold text-foreground">Return Item</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Check in items you have previously borrowed
          </p>
        </button>
      </div>
    </div>
  )
}
