import { useState, useMemo } from 'react'
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
  Search,
  Package,
  MapPin,
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
import type { ReportTab, ValuationViewMode } from '../types'

type DatePreset = 'all' | 'today' | '7days' | '30days' | 'this_month' | 'custom'

export function ReportsPage() {
  const [activeTab, setActiveTab] = useState<ReportTab>('valuation')
  const [valViewMode, setValViewMode] = useState<ValuationViewMode>('items')
  const [preset, setPreset] = useState<DatePreset>('all')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [searchFilter, setSearchFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [sendingReminders, setSendingReminders] = useState(false)

  // Compute ISO filters
  const dateFilter = useMemo(
    () => ({
      startDate: startDate ? new Date(startDate).toISOString() : undefined,
      endDate: endDate ? new Date(endDate + 'T23:59:59.999Z').toISOString() : undefined,
    }),
    [startDate, endDate],
  )

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

  // Filter valuation items based on search and category
  const filteredValuationItems = useMemo(() => {
    const raw = valuationQuery.data?.items ?? []
    return raw.filter((item) => {
      const matchesCategory = !categoryFilter || item.category_name === categoryFilter
      const q = searchFilter.toLowerCase().trim()
      const matchesSearch =
        !q ||
        item.name.toLowerCase().includes(q) ||
        (item.sku && item.sku.toLowerCase().includes(q)) ||
        (item.brand && item.brand.toLowerCase().includes(q)) ||
        (item.model && item.model.toLowerCase().includes(q)) ||
        item.locations.some((l) => l.toLowerCase().includes(q))
      return matchesCategory && matchesSearch
    })
  }, [valuationQuery.data?.items, categoryFilter, searchFilter])

  async function handleSendAllDueReminders() {
    const overdueItems = overdueQuery.data ?? []
    if (overdueItems.length === 0) {
      toast.info('No overdue items to send reminders for.')
      return
    }

    setSendingReminders(true)
    try {
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
      const rows = filteredValuationItems.map((item) => ({
        'Item Name': item.name,
        'Category': item.category_name,
        'SKU': item.sku ?? '',
        'Brand / Model': [item.brand, item.model].filter(Boolean).join(' ') || '',
        'Unit Price (INR)': item.unit_value,
        'Total Copies': item.total_copies,
        'Available Copies': item.available_copies,
        'Borrowed Copies': item.borrowed_copies,
        'Lost / Damaged': item.lost_copies + item.damaged_copies,
        'Total Valuation (INR)': item.total_valuation,
        'Storage Locations': item.locations.join('; '),
      }))
      exportToCsv(`detailed_inventory_valuation_report${suffix}.csv`, rows)
    } else if (activeTab === 'borrowing' && borrowingQuery.data) {
      const rows = borrowingQuery.data.map((b) => ({
        'Type': b.type,
        'Item Name': b.item_name,
        'Category': b.category_name,
        'SKU': b.sku ?? '',
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
        'SKU': o.sku ?? '',
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
        'SKU': l.sku ?? '',
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
      const itemRows = filteredValuationItems.map((item) => ({
        'Item Name': item.name,
        'Category': item.category_name,
        'SKU': item.sku ?? '',
        'Brand / Model': [item.brand, item.model].filter(Boolean).join(' ') || '',
        'Unit Price (INR)': item.unit_value,
        'Total Copies': item.total_copies,
        'Available Copies': item.available_copies,
        'Borrowed Copies': item.borrowed_copies,
        'Lost / Damaged': item.lost_copies + item.damaged_copies,
        'Total Valuation (INR)': item.total_valuation,
        'Locations': item.locations.join('; '),
      }))
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
      exportToXlsx(`comprehensive_inventory_report${suffix}.xlsx`, [
        { name: 'Item-Level Inventory', data: itemRows },
        { name: 'Category Valuation', data: categoryRows },
        { name: 'Location Breakdown', data: locationRows },
      ])
    } else if (activeTab === 'borrowing' && borrowingQuery.data) {
      const rows = borrowingQuery.data.map((b) => ({
        'Type': b.type,
        'Item Name': b.item_name,
        'Category': b.category_name,
        'SKU': b.sku ?? '',
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
        'SKU': o.sku ?? '',
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
        'SKU': l.sku ?? '',
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
            Enterprise Reports & Analytics
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Granular item-level valuation, borrowing trends, overdue tracking, and write-offs.
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
            Export Multi-Sheet XLSX
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

      {/* Main Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-border pb-3">
        <button
          onClick={() => setActiveTab('valuation')}
          className={`rounded-lg px-4 py-2 text-xs font-semibold transition-all ${
            activeTab === 'valuation'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
        >
          Inventory Valuation & Stock (Item-Level)
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

      {/* TAB 1: Valuation & Stock (Granular Items + Category + Location views) */}
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

              {/* View Mode Switcher & Filter Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-card p-4 shadow-sm">
                <div className="flex items-center gap-1 rounded-lg border border-border bg-muted/30 p-1">
                  <button
                    onClick={() => setValViewMode('items')}
                    className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
                      valViewMode === 'items'
                        ? 'bg-card text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Package className="size-3.5" />
                    Detailed Item-by-Item Table ({filteredValuationItems.length})
                  </button>
                  <button
                    onClick={() => setValViewMode('category')}
                    className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
                      valViewMode === 'category'
                        ? 'bg-card text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Layers className="size-3.5" />
                    Category Summary ({valuationQuery.data.by_category.length})
                  </button>
                  <button
                    onClick={() => setValViewMode('location')}
                    className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
                      valViewMode === 'location'
                        ? 'bg-card text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <MapPin className="size-3.5" />
                    Location Summary ({valuationQuery.data.by_location.length})
                  </button>
                </div>

                {valViewMode === 'items' && (
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                      <input
                        type="text"
                        value={searchFilter}
                        onChange={(e) => setSearchFilter(e.target.value)}
                        placeholder="Search item, SKU, brand..."
                        className="rounded-md border border-border bg-transparent py-1.5 pl-8 pr-3 text-xs placeholder:text-muted-foreground focus:border-primary"
                      />
                    </div>

                    <select
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                      className="rounded-md border border-border bg-transparent px-2.5 py-1.5 text-xs text-foreground focus:border-primary"
                    >
                      <option value="">All Categories</option>
                      {valuationQuery.data.by_category.map((c) => (
                        <option key={c.category_name} value={c.category_name}>
                          {c.category_name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* VIEW 1: Item-by-Item Detailed Table */}
              {valViewMode === 'items' && (
                <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="border-b border-border bg-muted/40 text-xs font-semibold uppercase text-muted-foreground">
                        <tr>
                          <th className="px-4 py-3">Item Name & SKU</th>
                          <th className="px-4 py-3">Category</th>
                          <th className="px-4 py-3">Brand / Model</th>
                          <th className="px-4 py-3 text-right">Unit Price</th>
                          <th className="px-4 py-3 text-center">Copies (Total / Avail / Out)</th>
                          <th className="px-4 py-3">Storage Locations</th>
                          <th className="px-4 py-3 text-right">Total Item Valuation</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {filteredValuationItems.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="p-8 text-center text-xs text-muted-foreground">
                              No inventory items matched your filter criteria.
                            </td>
                          </tr>
                        ) : (
                          filteredValuationItems.map((item) => (
                            <tr key={item.id} className="hover:bg-muted/20 transition-colors">
                              <td className="px-4 py-3">
                                <p className="font-semibold text-foreground">{item.name}</p>
                                {item.sku ? (
                                  <span className="font-mono text-[11px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                                    SKU: {item.sku}
                                  </span>
                                ) : (
                                  <span className="text-[11px] text-muted-foreground/60">No SKU</span>
                                )}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-xs text-foreground font-medium">
                                {item.category_name}
                              </td>
                              <td className="px-4 py-3 text-xs text-muted-foreground">
                                {[item.brand, item.model].filter(Boolean).join(' ') || '—'}
                              </td>
                              <td className="px-4 py-3 text-right font-mono text-xs font-medium">
                                ₹{item.unit_value.toLocaleString()}
                              </td>
                              <td className="px-4 py-3 text-center whitespace-nowrap">
                                <span className="font-semibold text-foreground">{item.total_copies}</span>{' '}
                                <span className="text-xs text-emerald-600 font-medium">
                                  ({item.available_copies} avail
                                </span>
                                {item.borrowed_copies > 0 && (
                                  <span className="text-xs text-blue-600 font-medium">
                                    , {item.borrowed_copies} out
                                  </span>
                                )}
                                {item.lost_copies + item.damaged_copies > 0 && (
                                  <span className="text-xs text-red-600 font-medium">
                                    , {item.lost_copies + item.damaged_copies} loss
                                  </span>
                                )}
                                <span className="text-xs text-muted-foreground">)</span>
                              </td>
                              <td className="px-4 py-3 text-xs text-muted-foreground">
                                {item.locations.length > 0 ? item.locations.join(', ') : '—'}
                              </td>
                              <td className="px-4 py-3 text-right font-mono font-semibold text-foreground whitespace-nowrap">
                                ₹{item.total_valuation.toLocaleString()}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* VIEW 2: Category Summary */}
              {valViewMode === 'category' && (
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
              )}

              {/* VIEW 3: Location Summary */}
              {valViewMode === 'location' && (
                <div className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-3">
                  <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                    <MapPin className="size-4 text-primary" />
                    Inventory Physical Stock Breakdown by Location
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="border-b border-border bg-muted/40 text-xs uppercase text-muted-foreground">
                        <tr>
                          <th className="px-4 py-2.5">Location / Storage Rack</th>
                          <th className="px-4 py-2.5 text-right">Physical Copies Count</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {valuationQuery.data.by_location.map((loc) => (
                          <tr key={loc.location_name} className="hover:bg-muted/20">
                            <td className="px-4 py-2.5 font-medium text-foreground">{loc.location_name}</td>
                            <td className="px-4 py-2.5 text-right font-semibold">{loc.copy_count} units</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
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
                        <p className="text-xs text-muted-foreground">
                          Copy #{b.copy_number} • {b.category_name}
                          {b.sku && ` • SKU: ${b.sku}`}
                        </p>
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
                        <p className="text-xs text-muted-foreground">
                          Copy #{o.copy_number} • {o.category_name}
                          {o.sku && ` • SKU: ${o.sku}`}
                        </p>
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
                        <p className="text-xs text-muted-foreground">
                          Copy #{l.copy_number}
                          {l.sku && ` • SKU: ${l.sku}`}
                        </p>
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
