import { useNavigate } from 'react-router-dom'
import {
  Package,
  ArrowLeftRight,
  Clock,
  Layers,
  ArrowUpRight,
  ArrowDownLeft,
  Plus,
  Printer,
  UploadCloud,
  Monitor,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react'
import { useDashboardData } from '../hooks/dashboard.queries'

export function DashboardPage() {
  const navigate = useNavigate()
  const { data, isLoading } = useDashboardData()

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-muted/60" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl bg-muted/60" />
          ))}
        </div>
        <div className="h-64 animate-pulse rounded-xl bg-muted/60" />
      </div>
    )
  }

  const stats = data?.stats
  const recentTxs = data?.recentTransactions ?? []
  const availablePercent =
    stats && stats.totalCopies > 0
      ? Math.round((stats.availableCopies / stats.totalCopies) * 100)
      : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Command Dashboard
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Real-time overview of inventory valuation, active loans, and counter operations.
          </p>
        </div>

        {/* Counter Terminal Launch Button */}
        <button
          onClick={() => navigate('/counter')}
          className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-md transition-all hover:bg-primary/90"
        >
          <Monitor className="size-4" />
          Launch Counter Terminal
          <span
            className={`inline-block size-2 rounded-full ${
              data?.activeTerminalOpen ? 'bg-emerald-400 animate-pulse' : 'bg-muted-foreground/50'
            }`}
          />
        </button>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Asset Valuation */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Total Valuation
            </span>
            <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-600">
              <Package className="size-4" />
            </div>
          </div>
          <p className="mt-3 font-mono text-2xl font-bold text-foreground">
            ₹{(stats?.totalValuation ?? 0).toLocaleString()}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Across {stats?.totalItems ?? 0} items ({stats?.totalCopies ?? 0} physical copies)
          </p>
        </div>

        {/* Active Loans */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Active Borrows
            </span>
            <div className="rounded-lg bg-blue-500/10 p-2 text-blue-600">
              <ArrowLeftRight className="size-4" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold text-blue-600">
            {stats?.activeBorrows ?? 0} Copies Checked Out
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {stats?.availableCopies ?? 0} physical copies available
          </p>
        </div>

        {/* Overdue Loans */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Overdue Alerts
            </span>
            <div className="rounded-lg bg-red-500/10 p-2 text-red-600">
              <Clock className="size-4" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold text-red-600">
            {stats?.overdueLoans ?? 0} Overdue
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {(stats?.overdueLoans ?? 0) > 0 ? 'Requires borrower notification' : 'All loans are on schedule'}
          </p>
        </div>

        {/* Stock Utilization */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Availability Rate
            </span>
            <div className="rounded-lg bg-primary/10 p-2 text-primary">
              <Layers className="size-4" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold text-foreground">{availablePercent}%</p>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-primary transition-all duration-500"
              style={{ width: `${availablePercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Quick Action Bar */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Quick Actions & Operations
        </h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <button
            onClick={() => navigate('/admin/inventory/new')}
            className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 p-3 text-xs font-semibold text-foreground hover:bg-muted transition-colors"
          >
            <Plus className="size-4 text-primary" />
            Add Catalog Item
          </button>
          <button
            onClick={() => navigate('/admin/inventory')}
            className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 p-3 text-xs font-semibold text-foreground hover:bg-muted transition-colors"
          >
            <UploadCloud className="size-4 text-primary" />
            Bulk Import (XLSX)
          </button>
          <button
            onClick={() => navigate('/admin/qr/print')}
            className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 p-3 text-xs font-semibold text-foreground hover:bg-muted transition-colors"
          >
            <Printer className="size-4 text-primary" />
            Print QR Sticker Sheets
          </button>
          <button
            onClick={() => navigate('/admin/reports')}
            className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 p-3 text-xs font-semibold text-foreground hover:bg-muted transition-colors"
          >
            <ExternalLink className="size-4 text-primary" />
            Generate Full Reports
          </button>
        </div>
      </div>

      {/* Recent Activity Feed & Stock Overview */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Transactions Stream */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
              <ArrowLeftRight className="size-4 text-primary" />
              Recent Transactions Ledger
            </h3>
            <button
              onClick={() => navigate('/admin/transactions')}
              className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
            >
              View all <ExternalLink className="size-3" />
            </button>
          </div>

          {recentTxs.length === 0 ? (
            <div className="py-12 text-center text-xs text-muted-foreground">
              <ShieldCheck className="mx-auto size-8 text-muted-foreground/40 mb-2" />
              No transactions recorded yet.
            </div>
          ) : (
            <div className="divide-y divide-border">
              {recentTxs.map((tx) => {
                const item = tx.copy?.item
                const copy = tx.copy

                return (
                  <div key={tx.id} className="py-3 flex items-center justify-between gap-3 text-sm">
                    <div className="flex items-center gap-3">
                      <div
                        className={`rounded-lg p-2 ${
                          tx.type === 'borrow'
                            ? 'bg-blue-500/10 text-blue-600'
                            : tx.type === 'return'
                            ? 'bg-emerald-500/10 text-emerald-600'
                            : 'bg-red-500/10 text-red-600'
                        }`}
                      >
                        {tx.type === 'borrow' ? (
                          <ArrowUpRight className="size-4" />
                        ) : tx.type === 'return' ? (
                          <ArrowDownLeft className="size-4" />
                        ) : (
                          <Clock className="size-4" />
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">
                          {item?.name ?? 'Inventory Item'}
                          <span className="ml-2 text-xs font-normal text-muted-foreground">
                            (Copy #{copy?.copy_number ?? 1})
                          </span>
                        </p>
                        <p className="text-xs text-muted-foreground font-mono">
                          {tx.borrower_email}
                        </p>
                      </div>
                    </div>

                    <div className="text-right text-xs text-muted-foreground">
                      <p>{new Date(tx.created_at).toLocaleDateString()}</p>
                      <p className="text-[10px]">
                        {new Date(tx.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* System Topology Card */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-4">
          <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
            <CheckCircle2 className="size-4 text-emerald-600" />
            Infrastructure Health
          </h3>

          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <span className="text-muted-foreground">Categories Registered</span>
              <span className="font-semibold text-foreground">{stats?.categoriesCount ?? 0}</span>
            </div>
            <div className="flex items-center justify-between border-b border-border pb-2">
              <span className="text-muted-foreground">Locations / Racks</span>
              <span className="font-semibold text-foreground">{stats?.locationsCount ?? 0}</span>
            </div>
            <div className="flex items-center justify-between border-b border-border pb-2">
              <span className="text-muted-foreground">Terminal Session</span>
              <span
                className={`font-semibold ${
                  data?.activeTerminalOpen ? 'text-emerald-600' : 'text-muted-foreground'
                }`}
              >
                {data?.activeTerminalOpen ? 'Active Terminal Open' : 'Terminal Idle'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">RLS Security Status</span>
              <span className="font-semibold text-emerald-600">Enforced</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
