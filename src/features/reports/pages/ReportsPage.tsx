import { useState } from 'react'
import {
  BarChart3,
  Download,
  Printer,
  FileSpreadsheet,
  Calendar,
  AlertCircle,
  Clock,
  Layers,
  ArrowUpRight,
  ArrowDownLeft,
  Mail,
  Send,
  Loader2,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  useValuationReport,
  useBorrowingReport,
  useOverdueReport,
  useLostDamagedReport,
} from '../hooks/reports.queries'
import { exportToCsv, exportToXlsx, printReport } from '../utils/export.utils'
import { sendDueReminderEmail } from '@/services/email.service'
import type { ReportTab } from '../types'

type DatePreset = 'all' | 'today' | '7days' | '30days' | 'this_month' | 'custom'

export function ReportsPage() {
  const [activeTab, setActiveTab] = useState<ReportTab>('valuation')
  const [preset, setPreset] = useState<DatePreset>('all')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [sendingReminders, setSendingReminders] = useState(false)

  // Compute ISO filters
  const dateFilter = {
    startDate: startDate ? new Date(startDate).toISOString() : undefined,
    endDate: endDate ? new Date(endDate + 'T23:59:59.999Z').toISOString() : undefined,
  }

  const valuationQuery = useValuationReport(dateFilter)
  const borrowingQuery = useBorrowingReport(dateFilter.startDate, dateFilter.endDate)
  const overdueQuery = useOverdueReport(dateFilter)
  const lostDamagedQuery = useLostDamagedReport(dateFilter)

  function handlePresetChange(newPreset: DatePreset) {
    setPreset(newPreset)
    const now = new Date()

    if (newPreset === 'all') {
      setStartDate('')
      setEndDate('')
    } else if (newPreset === 'today') {
      const todayStr = now.toISOString().split('T')[0]!
      setStartDate(todayStr)
      setEndDate(todayStr)
    } else if (newPreset === '7days') {
      const past = new Date()
      past.setDate(now.getDate() - 7)
      setStartDate(past.toISOString().split('T')[0]!)
      setEndDate(now.toISOString().split('T')[0]!)
    } else if (newPreset === '30days') {
      const past = new Date()
      past.setDate(now.getDate() - 30)
      setStartDate(past.toISOString().split('T')[0]!)
      setEndDate(now.toISOString().split('T')[0]!)
    } else if (newPreset === 'this_month') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      setStartDate(startOfMonth.toISOString().split('T')[0]!)
      setEndDate(now.toISOString().split('T')[0]!)
    }
  }

  async function handleSendAllDueReminders() {
    const overdueItems = overdueQuery.data ?? []
    if (overdueItems.length === 0) {
      toast.info('No overdue items to send reminders for.')
      return
    }

    setSendingReminders(true)
    try {
      // Group by borrower email
      const borrowerMap = new Map<string, typeof overdueItems>()
      for (const item of overdueItems) {
        if (!borrowerMap.has(item.borrower_email)) {
          borrowerMap.set(item.borrower_email, [])
        }
        borrowerMap.get(item.borrower_email)!.push(item)
      }

      for (const [email, items] of borrowerMap.entries()) {
        await sendDueReminderEmail({
          borrowerEmail: email,
          items: items.map((i) => ({
            item_name: i.item_name,
            copy_number: i.copy_number,
            due_date: i.due_date,
            days_overdue: i.days_overdue,
          })),
        })
      }

      toast.success(
        `Sent due/overdue reminder emails to ${borrowerMap.size} ${
          borrowerMap.size === 1 ? 'borrower' : 'borrowers'
        }!`,
      )
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to dispatch due reminders')
    } finally {
      setSendingReminders(false)
    }
  }

  function handleExportCsv() {
    const suffix = startDate && endDate ? `_${startDate}_to_${endDate}` : '_all_time'

    if (activeTab === 'valuation' && valuationQuery.data) {
      const rows = valuationQuery.data.by_category.map((c) => ({
        'Category Name': c.category_name,
        'Item Count': c.item_count,
        'Copy Count': c.copy_count,
        'Total Valuation (INR)': c.total_value,
      }))
      exportToCsv(`inventory_valuation_report${suffix}.csv`, rows)
    } else if (activeTab === 'borrowing' && borrowingQuery.data) {
      const rows = borrowingQuery.data.map((b) => ({
        'Type': b.type,
        'Item Name': b.item_name,
        'Category': b.category_name,
        'Copy Number': b.copy_number,
        'Borrower Email': b.borrower_email,
        'Borrowed Date': b.borrowed_at ? new Date(b.borrowed_at).toLocaleDateString() : '',
        'Due Date': b.due_date ? new Date(b.due_date).toLocaleDateString() : '',
        'Returned Date': b.returned_at ? new Date(b.returned_at).toLocaleDateString() : '',
      }))
      exportToCsv(`borrowing_activity_report${suffix}.csv`, rows)
    } else if (activeTab === 'overdue' && overdueQuery.data) {
      const rows = overdueQuery.data.map((o) => ({
        'Item Name': o.item_name,
        'Category': o.category_name,
        'Copy Number': o.copy_number,
        'Borrower Email': o.borrower_email,
        'Borrowed Date': new Date(o.borrowed_at).toLocaleDateString(),
        'Due Date': new Date(o.due_date).toLocaleDateString(),
        'Days Overdue': o.days_overdue,
      }))
      exportToCsv(`overdue_loans_report${suffix}.csv`, rows)
    } else if (activeTab === 'lost_damaged' && lostDamagedQuery.data) {
      const rows = lostDamagedQuery.data.map((l) => ({
        'Type': l.type,
        'Item Name': l.item_name,
        'Copy Number': l.copy_number,
        'Date': new Date(l.date).toLocaleDateString(),
        'Unit Value (INR)': l.unit_value ?? '',
        'Notes': l.notes ?? '',
      }))
      exportToCsv(`lost_damaged_report${suffix}.csv`, rows)
    }
  }

  function handleExportXlsx() {
    const suffix = startDate && endDate ? `_${startDate}_to_${endDate}` : '_all_time'

    if (activeTab === 'valuation' && valuationQuery.data) {
      const categoryRows = valuationQuery.data.by_category.map((c) => ({
        'Category Name': c.category_name,
        'Item Count': c.item_count,
        'Copy Count': c.copy_count,
        'Total Valuation (INR)': c.total_value,
      }))
      const locationRows = valuationQuery.data.by_location.map((l) => ({
        'Location Name': l.location_name,
        'Physical Copies Count': l.copy_count,
      }))
      exportToXlsx(`inventory_valuation_report${suffix}.xlsx`, [
        { name: 'Valuation by Category', data: categoryRows },
        { name: 'Stock by Location', data: locationRows },
      ])
    } else if (activeTab === 'borrowing' && borrowingQuery.data) {
      const rows = borrowingQuery.data.map((b) => ({
        'Type': b.type,
        'Item Name': b.item_name,
        'Category': b.category_name,
        'Copy Number': b.copy_number,
        'Borrower Email': b.borrower_email,
        'Borrowed Date': b.borrowed_at ? new Date(b.borrowed_at).toLocaleDateString() : '',
        'Due Date': b.due_date ? new Date(b.due_date).toLocaleDateString() : '',
        'Returned Date': b.returned_at ? new Date(b.returned_at).toLocaleDateString() : '',
      }))
      exportToXlsx(`borrowing_activity_report${suffix}.xlsx`, [{ name: 'Borrowing Activity', data: rows }])
    } else if (activeTab === 'overdue' && overdueQuery.data) {
      const rows = overdueQuery.data.map((o) => ({
        'Item Name': o.item_name,
        'Category': o.category_name,
        'Copy Number': o.copy_number,
        'Borrower Email': o.borrower_email,
        'Borrowed Date': new Date(o.borrowed_at).toLocaleDateString(),
        'Due Date': new Date(o.due_date).toLocaleDateString(),
        'Days Overdue': o.days_overdue,
      }))
      exportToXlsx(`overdue_loans_report${suffix}.xlsx`, [{ name: 'Overdue Loans', data: rows }])
    } else if (activeTab === 'lost_damaged' && lostDamagedQuery.data) {
      const rows = lostDamagedQuery.data.map((l) => ({
        'Type': l.type,
        'Item Name': l.item_name,
        'Copy Number': l.copy_number,
        'Date': new Date(l.date).toLocaleDateString(),
        'Unit Value (INR)': l.unit_value ?? '',
        'Notes': l.notes ?? '',
      }))
      exportToXlsx(`lost_damaged_report${suffix}.xlsx`, [{ name: 'Write-Offs', data: rows }])
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground flex items-center gap-2">
            <BarChart3 className="size-6 text-primary" />
            Reports & Analytics Engine
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Custom date range reports for inventory valuation, borrowing volume, overdue tracking, and write-offs.
          </p>
        </div>

        {/* Action Export Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted transition-colors shadow-sm"
          >
            <Download className="size-3.5" />
            Export CSV
          </button>
          <button
            onClick={handleExportXlsx}
            className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs font-semibold text-emerald-600 hover:bg-emerald-500/10 transition-colors shadow-sm"
          >
            <FileSpreadsheet className="size-3.5" />
            Export XLSX
          </button>
          <button
            onClick={printReport}
            className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
          >
            <Printer className="size-3.5" />
            Print / PDF
          </button>
        </div>
      </div>

      {/* Universal Custom Date Range Selector */}
      <div className="rounded-xl border border-border bg-card p-4 shadow-sm space-y-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          <Calendar className="size-4 text-primary" />
          <span>Report Time Window & Date Range Filters</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => handlePresetChange('all')}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              preset === 'all'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-muted/50 text-muted-foreground hover:bg-muted'
            }`}
          >
            All Time
          </button>
          <button
            onClick={() => handlePresetChange('today')}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              preset === 'today'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-muted/50 text-muted-foreground hover:bg-muted'
            }`}
          >
            Today
          </button>
          <button
            onClick={() => handlePresetChange('7days')}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              preset === '7days'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-muted/50 text-muted-foreground hover:bg-muted'
            }`}
          >
            Last 7 Days
          </button>
          <button
            onClick={() => handlePresetChange('30days')}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              preset === '30days'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-muted/50 text-muted-foreground hover:bg-muted'
            }`}
          >
            Last 30 Days
          </button>
          <button
            onClick={() => handlePresetChange('this_month')}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              preset === 'this_month'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-muted/50 text-muted-foreground hover:bg-muted'
            }`}
          >
            This Month
          </button>

          {/* Custom Date Pickers */}
          <div className="flex items-center gap-2 ml-auto text-xs text-muted-foreground">
            <span>Custom:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value)
                setPreset('custom')
              }}
              className="rounded-md border border-border bg-transparent px-2.5 py-1 text-xs text-foreground focus:border-primary"
            />
            <span>to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value)
                setPreset('custom')
              }}
              className="rounded-md border border-border bg-transparent px-2.5 py-1 text-xs text-foreground focus:border-primary"
            />
            {(startDate || endDate) && (
              <button
                onClick={() => handlePresetChange('all')}
                className="text-xs text-primary hover:underline ml-1"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-border pb-3">
        <button
          onClick={() => setActiveTab('valuation')}
          className={`rounded-lg px-4 py-2 text-xs font-semibold transition-all ${
            activeTab === 'valuation'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
        >
          Inventory Valuation & Stock
        </button>
        <button
          onClick={() => setActiveTab('borrowing')}
          className={`rounded-lg px-4 py-2 text-xs font-semibold transition-all ${
            activeTab === 'borrowing'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
        >
          Borrowing Activity Log
        </button>
        <button
          onClick={() => setActiveTab('overdue')}
          className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold transition-all ${
            activeTab === 'overdue'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
        >
          Overdue Loans & Reminders
          {(overdueQuery.data?.length ?? 0) > 0 && (
            <span className="rounded-full bg-red-500 px-1.5 py-0.2 text-[10px] font-bold text-white">
              {overdueQuery.data?.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('lost_damaged')}
          className={`rounded-lg px-4 py-2 text-xs font-semibold transition-all ${
            activeTab === 'lost_damaged'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
        >
          Lost & Damaged Write-offs
        </button>
      </div>

      {/* TAB 1: Valuation & Stock */}
      {activeTab === 'valuation' && (
        <div className="space-y-6">
          {valuationQuery.isLoading ? (
            <div className="h-48 animate-pulse rounded-xl bg-muted/60" />
          ) : valuationQuery.data ? (
            <>
              {/* Summary KPIs */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
                  <p className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
                    Total Asset Valuation
                  </p>
                  <p className="mt-2 font-mono text-2xl font-bold text-foreground">
                    ₹{valuationQuery.data.total_inventory_value.toLocaleString()}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">Cumulative catalog value</p>
                </div>
                <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
                  <p className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
                    Catalog Items & Copies
                  </p>
                  <p className="mt-2 text-2xl font-bold text-foreground">
                    {valuationQuery.data.total_items} Items / {valuationQuery.data.total_copies} Copies
                  </p>
                  <p className="mt-1 text-xs text-emerald-600 font-medium">
                    {valuationQuery.data.available_copies} Available for borrowing
                  </p>
                </div>
                <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
                  <p className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
                    Active Loans
                  </p>
                  <p className="mt-2 text-2xl font-bold text-blue-600">
                    {valuationQuery.data.borrowed_copies} Copies Checked Out
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">With registered borrowers</p>
                </div>
                <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
                  <p className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
                    Damaged / Lost Copies
                  </p>
                  <p className="mt-2 text-2xl font-bold text-red-600">
                    {valuationQuery.data.lost_copies + valuationQuery.data.damaged_copies} Copies
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {valuationQuery.data.lost_copies} Lost • {valuationQuery.data.damaged_copies} Damaged
                  </p>
                </div>
              </div>

              {/* Breakdown by Category */}
              <div className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-3">
                <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                  <Layers className="size-4 text-primary" />
                  Valuation Breakdown by Category
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b border-border bg-muted/40 text-xs uppercase text-muted-foreground">
                      <tr>
                        <th className="px-4 py-2.5">Category Name</th>
                        <th className="px-4 py-2.5">Item Count</th>
                        <th className="px-4 py-2.5">Copy Count</th>
                        <th className="px-4 py-2.5 text-right">Total Category Value</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {valuationQuery.data.by_category.map((cat) => (
                        <tr key={cat.category_name} className="hover:bg-muted/20">
                          <td className="px-4 py-2.5 font-medium text-foreground">{cat.category_name}</td>
                          <td className="px-4 py-2.5">{cat.item_count}</td>
                          <td className="px-4 py-2.5">{cat.copy_count}</td>
                          <td className="px-4 py-2.5 text-right font-mono font-semibold">
                            ₹{cat.total_value.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : null}
        </div>
      )}

      {/* TAB 2: Borrowing Activity */}
      {activeTab === 'borrowing' && (
        <div className="space-y-4">
          {borrowingQuery.isLoading ? (
            <div className="h-48 animate-pulse rounded-xl bg-muted/60" />
          ) : borrowingQuery.data && borrowingQuery.data.length > 0 ? (
            <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border bg-muted/40 text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Item & Copy</th>
                    <th className="px-4 py-3">Borrower</th>
                    <th className="px-4 py-3">Borrowed Date</th>
                    <th className="px-4 py-3">Due / Returned Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {borrowingQuery.data.map((b) => (
                    <tr key={b.id} className="hover:bg-muted/20">
                      <td className="px-4 py-3">
                        {b.type === 'borrow' ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 bg-blue-500/10 px-2.5 py-0.5 rounded-full">
                            <ArrowUpRight className="size-3" /> Borrow
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-500/10 px-2.5 py-0.5 rounded-full">
                            <ArrowDownLeft className="size-3" /> Return
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-foreground">{b.item_name}</p>
                        <p className="text-xs text-muted-foreground">Copy #{b.copy_number} • {b.category_name}</p>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-foreground">{b.borrower_email}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {b.borrowed_at ? new Date(b.borrowed_at).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-4 py-3 text-xs">
                        {b.returned_at ? (
                          <span className="text-emerald-600">Returned {new Date(b.returned_at).toLocaleDateString()}</span>
                        ) : b.due_date ? (
                          <span className="text-muted-foreground">Due {new Date(b.due_date).toLocaleDateString()}</span>
                        ) : (
                          'No due date'
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center text-sm text-muted-foreground rounded-xl border border-border bg-card">
              No borrowing activity found for the selected date range.
            </div>
          )}
        </div>
      )}

      {/* TAB 3: Overdue Loans */}
      {activeTab === 'overdue' && (
        <div className="space-y-4">
          {/* Overdue Action Banner */}
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-red-500/30 bg-red-500/10 p-4">
            <div className="flex items-center gap-3">
              <Mail className="size-5 text-red-600" />
              <div>
                <p className="text-sm font-semibold text-red-900 dark:text-red-300">
                  Automated Due & Overdue Email Reminders
                </p>
                <p className="text-xs text-red-700 dark:text-red-400">
                  Dispatch email notifications to borrowers with loans due today or overdue.
                </p>
              </div>
            </div>

            <button
              onClick={() => void handleSendAllDueReminders()}
              disabled={sendingReminders || (overdueQuery.data?.length ?? 0) === 0}
              className="flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-red-700 transition-all disabled:opacity-50"
            >
              {sendingReminders ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  Dispatching Emails...
                </>
              ) : (
                <>
                  <Send className="size-3.5" />
                  Send Due Reminders Now
                </>
              )}
            </button>
          </div>

          {overdueQuery.isLoading ? (
            <div className="h-48 animate-pulse rounded-xl bg-muted/60" />
          ) : overdueQuery.data && overdueQuery.data.length > 0 ? (
            <div className="overflow-hidden rounded-xl border border-red-500/30 bg-card shadow-sm">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-red-500/20 bg-red-500/10 text-xs uppercase text-red-700">
                  <tr>
                    <th className="px-4 py-3">Item & Copy</th>
                    <th className="px-4 py-3">Borrower Email</th>
                    <th className="px-4 py-3">Borrowed Date</th>
                    <th className="px-4 py-3">Due Date</th>
                    <th className="px-4 py-3 text-right">Days Overdue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {overdueQuery.data.map((o) => (
                    <tr key={o.transaction_id} className="hover:bg-red-500/5">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-foreground">{o.item_name}</p>
                        <p className="text-xs text-muted-foreground">Copy #{o.copy_number} • {o.category_name}</p>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-foreground">{o.borrower_email}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {new Date(o.borrowed_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-xs font-semibold text-red-600">
                        {new Date(o.due_date).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2.5 py-1 text-xs font-bold text-red-600">
                          <Clock className="size-3" /> {o.days_overdue} {o.days_overdue === 1 ? 'day' : 'days'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center text-sm text-emerald-600 rounded-xl border border-emerald-500/30 bg-emerald-500/5">
              🎉 Outstanding! There are currently zero overdue items for this date filter.
            </div>
          )}
        </div>
      )}

      {/* TAB 4: Lost & Damaged */}
      {activeTab === 'lost_damaged' && (
        <div className="space-y-4">
          {lostDamagedQuery.isLoading ? (
            <div className="h-48 animate-pulse rounded-xl bg-muted/60" />
          ) : lostDamagedQuery.data && lostDamagedQuery.data.length > 0 ? (
            <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border bg-muted/40 text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Item & Copy</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Cost Impact</th>
                    <th className="px-4 py-3">Audit Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {lostDamagedQuery.data.map((l) => (
                    <tr key={l.transaction_id} className="hover:bg-muted/20">
                      <td className="px-4 py-3">
                        {l.type === 'lost' ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 bg-red-500/10 px-2.5 py-0.5 rounded-full">
                            <AlertCircle className="size-3" /> Lost
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600 bg-amber-500/10 px-2.5 py-0.5 rounded-full">
                            <AlertCircle className="size-3" /> Damaged
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-foreground">{l.item_name}</p>
                        <p className="text-xs text-muted-foreground">Copy #{l.copy_number}</p>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {new Date(l.date).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 font-mono font-semibold text-xs">
                        {l.unit_value != null ? `₹${l.unit_value.toLocaleString()}` : '—'}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{l.notes ?? 'No notes provided'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center text-sm text-muted-foreground rounded-xl border border-border bg-card">
              No lost or damaged items logged for this date range.
            </div>
          )}
        </div>
      )}
    </div>
  )
}
