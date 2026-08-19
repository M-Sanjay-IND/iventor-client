import { useState, useMemo } from 'react'
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
  Boxes,
  Database,
  Radio,
  Server,
} from 'lucide-react'
import { useDashboardData } from '../hooks/dashboard.queries'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

type FilterType = 'all' | 'borrow' | 'return'

export function DashboardPage() {
  const navigate = useNavigate()
  const { data, isLoading } = useDashboardData()
  const [filter, setFilter] = useState<FilterType>('all')

  const stats = data?.stats

  const filteredTxs = useMemo(() => {
    const rawTxs = data?.recentTransactions ?? []
    if (filter === 'all') return rawTxs
    return rawTxs.filter((tx) => tx.type === filter)
  }, [data?.recentTransactions, filter])

  const availablePercent =
    stats && stats.totalCopies > 0
      ? Math.round((stats.availableCopies / stats.totalCopies) * 100)
      : 0

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-64 animate-pulse rounded-xl bg-muted/70" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-xl bg-muted/60 skeuo-card" />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="h-80 animate-pulse rounded-xl bg-muted/60 lg:col-span-2 skeuo-card" />
          <div className="h-80 animate-pulse rounded-xl bg-muted/60 skeuo-card" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Command Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/80 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
              Command Dashboard
            </h1>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-muted/80 px-2.5 py-0.5 text-[11px] font-semibold text-muted-foreground skeuo-pill">
              <span className="size-1.5 rounded-full bg-foreground animate-pulse" />
              LIVE TELEMETRY
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
            Real-time overview of physical asset valuations, loan flows, and counter nodes.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            onClick={() => navigate('/counter')}
            size="default"
            className="gap-2.5 px-4"
          >
            <Monitor className="size-4" />
            <span>Counter Terminal</span>
            <span
              className={`inline-block size-2 rounded-full border border-primary-foreground/30 ${
                data?.activeTerminalOpen ? 'bg-emerald-400 animate-pulse' : 'bg-muted-foreground/60'
              }`}
            />
          </Button>
        </div>
      </div>

      {/* KPI Metric Dials */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Valuation */}
        <Card className="p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Total Asset Valuation
            </span>
            <div className="flex size-8 items-center justify-center rounded-lg border border-border bg-muted/80 text-foreground skeuo-pill">
              <Package className="size-4" />
            </div>
          </div>
          <div className="mt-4">
            <p className="font-mono text-2xl font-bold text-foreground tracking-tight">
              ₹{(stats?.totalValuation ?? 0).toLocaleString()}
            </p>
            <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="font-mono font-medium text-foreground">{stats?.totalItems ?? 0}</span> items
              <span>•</span>
              <span className="font-mono font-medium text-foreground">{stats?.totalCopies ?? 0}</span> copies
            </div>
          </div>
        </Card>

        {/* Active Borrows */}
        <Card className="p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Active Borrows
            </span>
            <div className="flex size-8 items-center justify-center rounded-lg border border-border bg-muted/80 text-foreground skeuo-pill">
              <ArrowLeftRight className="size-4" />
            </div>
          </div>
          <div className="mt-4">
            <p className="font-mono text-2xl font-bold text-foreground tracking-tight">
              {stats?.activeBorrows ?? 0}
              <span className="text-xs font-normal text-muted-foreground ml-2">Checked Out</span>
            </p>
            <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="font-mono font-medium text-foreground">{stats?.availableCopies ?? 0}</span> units available in racks
            </div>
          </div>
        </Card>

        {/* Overdue Alerts */}
        <Card className="p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Overdue Alerts
            </span>
            <div className="flex size-8 items-center justify-center rounded-lg border border-border bg-muted/80 text-foreground skeuo-pill">
              <Clock className="size-4" />
            </div>
          </div>
          <div className="mt-4">
            <p className="font-mono text-2xl font-bold text-foreground tracking-tight">
              {stats?.overdueLoans ?? 0}
              <span className="text-xs font-normal text-muted-foreground ml-2">Delinquent</span>
            </p>
            <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
              {(stats?.overdueLoans ?? 0) > 0 ? (
                <span className="font-medium text-foreground">Action required: Notify borrower</span>
              ) : (
                <span className="text-muted-foreground">All loans within return grace period</span>
              )}
            </div>
          </div>
        </Card>

        {/* Stock Utilization Rate */}
        <Card className="p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Availability Index
            </span>
            <div className="flex size-8 items-center justify-center rounded-lg border border-border bg-muted/80 text-foreground skeuo-pill">
              <Layers className="size-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-baseline justify-between">
              <p className="font-mono text-2xl font-bold text-foreground tracking-tight">
                {availablePercent}%
              </p>
              <span className="text-xs text-muted-foreground">
                {stats?.availableCopies ?? 0} / {stats?.totalCopies ?? 0}
              </span>
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full border border-border/80 bg-muted/80 skeuo-well p-0.5">
              <div
                className="h-full rounded-full bg-foreground transition-all duration-500"
                style={{ width: `${availablePercent}%` }}
              />
            </div>
          </div>
        </Card>
      </div>

      {/* Quick Operation Station */}
      <div className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1">
          Quick Operations & Fast Actions
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <button
            type="button"
            onClick={() => navigate('/admin/inventory/new')}
            className="skeuo-card-interactive flex flex-col justify-between rounded-xl bg-card p-4 text-left transition-all group"
          >
            <div className="flex size-9 items-center justify-center rounded-lg border border-border bg-muted text-foreground skeuo-pill group-hover:bg-foreground group-hover:text-background transition-colors">
              <Plus className="size-4" />
            </div>
            <div className="mt-3">
              <p className="text-xs font-semibold text-foreground">Add Item</p>
              <p className="text-[11px] text-muted-foreground">Register new SKU</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => navigate('/admin/inventory')}
            className="skeuo-card-interactive flex flex-col justify-between rounded-xl bg-card p-4 text-left transition-all group"
          >
            <div className="flex size-9 items-center justify-center rounded-lg border border-border bg-muted text-foreground skeuo-pill group-hover:bg-foreground group-hover:text-background transition-colors">
              <UploadCloud className="size-4" />
            </div>
            <div className="mt-3">
              <p className="text-xs font-semibold text-foreground">Bulk Import</p>
              <p className="text-[11px] text-muted-foreground">Upload XLSX / CSV</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => navigate('/admin/qr/print')}
            className="skeuo-card-interactive flex flex-col justify-between rounded-xl bg-card p-4 text-left transition-all group"
          >
            <div className="flex size-9 items-center justify-center rounded-lg border border-border bg-muted text-foreground skeuo-pill group-hover:bg-foreground group-hover:text-background transition-colors">
              <Printer className="size-4" />
            </div>
            <div className="mt-3">
              <p className="text-xs font-semibold text-foreground">Print QR Sheets</p>
              <p className="text-[11px] text-muted-foreground">Generate barcodes</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => navigate('/admin/reports')}
            className="skeuo-card-interactive flex flex-col justify-between rounded-xl bg-card p-4 text-left transition-all group"
          >
            <div className="flex size-9 items-center justify-center rounded-lg border border-border bg-muted text-foreground skeuo-pill group-hover:bg-foreground group-hover:text-background transition-colors">
              <ExternalLink className="size-4" />
            </div>
            <div className="mt-3">
              <p className="text-xs font-semibold text-foreground">Export Reports</p>
              <p className="text-[11px] text-muted-foreground">Audit logs & metrics</p>
            </div>
          </button>
        </div>
      </div>

      {/* Main Command Matrix */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left (2/3): Live Transactions Ledger */}
        <Card className="lg:col-span-2 flex flex-col justify-between">
          <CardHeader className="border-b border-border/80 pb-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <ArrowLeftRight className="size-4 text-foreground" />
                <CardTitle className="text-base">Transactions Stream</CardTitle>
              </div>

              {/* Segmented Filter Pills */}
              <div className="flex items-center rounded-lg border border-border bg-muted/80 p-0.5 skeuo-well text-xs">
                <button
                  type="button"
                  onClick={() => setFilter('all')}
                  className={`rounded-md px-2.5 py-1 font-medium transition-all ${
                    filter === 'all'
                      ? 'bg-card text-foreground skeuo-pill font-semibold shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => setFilter('borrow')}
                  className={`rounded-md px-2.5 py-1 font-medium transition-all ${
                    filter === 'borrow'
                      ? 'bg-card text-foreground skeuo-pill font-semibold shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Borrows
                </button>
                <button
                  type="button"
                  onClick={() => setFilter('return')}
                  className={`rounded-md px-2.5 py-1 font-medium transition-all ${
                    filter === 'return'
                      ? 'bg-card text-foreground skeuo-pill font-semibold shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Returns
                </button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0 flex-1">
            {filteredTxs.length === 0 ? (
              <div className="py-16 text-center text-xs text-muted-foreground">
                <ShieldCheck className="mx-auto size-9 text-muted-foreground/30 mb-2.5" />
                <p className="font-medium text-foreground">No recent transaction entries found</p>
                <p className="mt-0.5 text-muted-foreground">Transactions recorded at the counter terminal appear here in real-time.</p>
              </div>
            ) : (
              <div className="divide-y divide-border/60">
                {filteredTxs.slice(0, 7).map((tx) => {
                  const item = tx.copy?.item
                  const copy = tx.copy
                  const isBorrow = tx.type === 'borrow'

                  return (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between gap-3 px-5 py-3 text-xs transition-colors hover:bg-muted/30"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`flex size-7 shrink-0 items-center justify-center rounded-lg border border-border skeuo-pill ${
                            isBorrow
                              ? 'bg-foreground text-background'
                              : 'bg-muted text-foreground'
                          }`}
                        >
                          {isBorrow ? (
                            <ArrowUpRight className="size-3.5" />
                          ) : (
                            <ArrowDownLeft className="size-3.5" />
                          )}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-foreground truncate">
                              {item?.name ?? 'Inventory Asset'}
                            </p>
                            <span className="shrink-0 rounded border border-border/70 bg-muted/60 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                              #{copy?.copy_number ?? 1}
                            </span>
                          </div>
                          <p className="text-[11px] text-muted-foreground font-mono truncate mt-0.5">
                            {tx.borrower_email}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <p className="font-mono text-xs text-foreground font-medium">
                          {new Date(tx.created_at).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </p>
                        <p className="text-[10px] text-muted-foreground font-mono">
                          {new Date(tx.created_at).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>

          <div className="border-t border-border/80 p-3 bg-muted/20 flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/admin/transactions')}
              className="gap-1.5 text-xs"
            >
              <span>View Full Ledger</span>
              <ExternalLink className="size-3" />
            </Button>
          </div>
        </Card>

        {/* Right (1/3): Infrastructure & System Health Deck */}
        <div className="space-y-4">
          {/* System Nodes Status Card */}
          <Card className="p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-border/80 pb-3">
              <div className="flex items-center gap-2">
                <Server className="size-4 text-foreground" />
                <h3 className="text-sm font-semibold text-foreground">Infrastructure Nodes</h3>
              </div>
              <span className="flex size-2 rounded-full bg-emerald-500 skeuo-led" />
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between border-b border-border/60 pb-2">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Database className="size-3.5" /> Database & RLS
                </span>
                <span className="font-semibold text-foreground bg-muted/80 px-2 py-0.5 rounded border border-border/60">
                  Enforced
                </span>
              </div>

              <div className="flex items-center justify-between border-b border-border/60 pb-2">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Radio className="size-3.5" /> Counter Terminal
                </span>
                <span
                  className={`font-semibold px-2 py-0.5 rounded border ${
                    data?.activeTerminalOpen
                      ? 'bg-foreground text-background border-foreground font-mono'
                      : 'bg-muted text-muted-foreground border-border/60'
                  }`}
                >
                  {data?.activeTerminalOpen ? 'Session Active' : 'Standby'}
                </span>
              </div>

              <div className="flex items-center justify-between border-b border-border/60 pb-2">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Boxes className="size-3.5" /> Storage Racks / Locs
                </span>
                <span className="font-mono font-semibold text-foreground">
                  {stats?.locationsCount ?? 0} active
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Package className="size-3.5" /> Catalog Taxonomies
                </span>
                <span className="font-mono font-semibold text-foreground">
                  {stats?.categoriesCount ?? 0} categories
                </span>
              </div>
            </div>
          </Card>

          {/* Quick Security & Integrity Card */}
          <Card className="p-5 space-y-3">
            <div className="flex items-center gap-2 text-foreground">
              <CheckCircle2 className="size-4" />
              <h3 className="text-sm font-semibold">Audit & Verification</h3>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Every loan and return event is cryptographically timestamped and bound to OTP-verified borrower credentials.
            </p>
            <div className="pt-1">
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs"
                onClick={() => navigate('/admin/reports')}
              >
                Inspect Audit Ledger
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
