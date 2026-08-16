import { useState } from 'react'
import { ArrowLeftRight, RefreshCw, Download, FileSpreadsheet } from 'lucide-react'
import { useTransactions } from '../hooks/transactions.queries'
import { TransactionFilters } from '../components/TransactionFilters'
import { TransactionsTable } from '../components/TransactionsTable'
import { MarkLostDamagedModal } from '../components/MarkLostDamagedModal'
import { DEFAULT_PAGE_SIZE } from '@/constants'
import { exportToXlsx, exportToCsv } from '@/features/reports/utils/export.utils'
import type { TransactionType, TransactionWithDetails } from '../types'

export function TransactionsPage() {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState<number>(DEFAULT_PAGE_SIZE)
  const [type, setType] = useState<TransactionType | 'all' | 'active_borrow' | 'overdue'>('all')
  const [search, setSearch] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  // Action modal state
  const [selectedTx, setSelectedTx] = useState<TransactionWithDetails | null>(null)
  const [actionType, setActionType] = useState<'lost' | 'damaged' | 'force_return' | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  const { data, isLoading, refetch, isFetching } = useTransactions({
    pagination: { page, pageSize },
    type,
    search,
    startDate: startDate ? new Date(startDate).toISOString() : undefined,
    endDate: endDate ? new Date(endDate + 'T23:59:59.999Z').toISOString() : undefined,
  })

  function handleOpenAction(tx: TransactionWithDetails, action: 'lost' | 'damaged' | 'force_return') {
    setSelectedTx(tx)
    setActionType(action)
    setModalOpen(true)
  }

  function handleCloseModal() {
    setModalOpen(false)
    setSelectedTx(null)
    setActionType(null)
  }

  function formatUnifiedDate(tx: TransactionWithDetails): string {
    const borrowDate = tx.borrowed_at ? new Date(tx.borrowed_at).toLocaleDateString() : null
    const returnDate = tx.returned_at ? new Date(tx.returned_at).toLocaleDateString() : null
    const dueDate = tx.due_date ? new Date(tx.due_date).toLocaleDateString() : null

    if (tx.type === 'return') {
      if (borrowDate && returnDate) {
        return `${borrowDate} → ${returnDate} (Returned)`
      }
      return `Returned on ${returnDate || new Date(tx.created_at).toLocaleDateString()}`
    }

    if (tx.type === 'borrow') {
      if (returnDate) {
        return `${borrowDate || new Date(tx.created_at).toLocaleDateString()} → ${returnDate} (Returned)`
      }
      if (dueDate) {
        const isOverdue = new Date(tx.due_date!) < new Date()
        return `${borrowDate || new Date(tx.created_at).toLocaleDateString()} (Due: ${dueDate})${
          isOverdue ? ' [OVERDUE]' : ' [ACTIVE LOAN]'
        }`
      }
      return `${borrowDate || new Date(tx.created_at).toLocaleDateString()} (No due date)`
    }

    return `Logged on ${new Date(tx.created_at).toLocaleDateString()}`
  }

  // Export with single unified date column for Borrow and Return
  function handleExportUnifiedXlsx() {
    const records = data?.data ?? []
    if (records.length === 0) return

    const rows = records.map((tx) => {
      const item = tx.copy?.item
      const copy = tx.copy
      const isOverdue =
        tx.type === 'borrow' &&
        tx.due_date &&
        new Date(tx.due_date) < new Date() &&
        copy?.status === 'borrowed'

      return {
        'Transaction ID': tx.id,
        'Type': tx.type.toUpperCase(),
        'Item Name': item?.name ?? 'Unknown Item',
        'Category': item?.category?.name ?? 'Uncategorized',
        'Copy Number': copy?.copy_number ?? 1,
        'SKU': item?.sku ?? '',
        'Borrower Email': tx.borrower_email,
        'Borrow & Return Date': formatUnifiedDate(tx),
        'Status': isOverdue
          ? 'OVERDUE'
          : tx.type === 'borrow' && copy?.status === 'borrowed'
          ? 'ACTIVE LOAN'
          : 'COMPLETED',
        'Location': copy?.location?.name ?? 'Unassigned',
        'Condition Notes': tx.notes ?? '',
      }
    })

    const suffix = startDate && endDate ? `_${startDate}_to_${endDate}` : '_all'
    exportToXlsx(`transactions_ledger_unified_date${suffix}.xlsx`, [
      { name: 'Transactions (Unified Date)', data: rows },
    ])
  }

  // Standard multi-column export
  function handleExportStandardCsv() {
    const records = data?.data ?? []
    if (records.length === 0) return

    const rows = records.map((tx) => {
      const item = tx.copy?.item
      const copy = tx.copy

      return {
        'Transaction ID': tx.id,
        'Type': tx.type,
        'Item Name': item?.name ?? 'Unknown Item',
        'Category': item?.category?.name ?? 'Uncategorized',
        'Copy Number': copy?.copy_number ?? 1,
        'SKU': item?.sku ?? '',
        'Borrower Email': tx.borrower_email,
        'Borrowed Date': tx.borrowed_at ? new Date(tx.borrowed_at).toLocaleDateString() : '',
        'Due Date': tx.due_date ? new Date(tx.due_date).toLocaleDateString() : '',
        'Returned Date': tx.returned_at ? new Date(tx.returned_at).toLocaleDateString() : '',
        'Status': copy?.status ?? '',
        'Notes': tx.notes ?? '',
      }
    })

    const suffix = startDate && endDate ? `_${startDate}_to_${endDate}` : '_all'
    exportToCsv(`transactions_ledger${suffix}.csv`, rows)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground flex items-center gap-2">
            <ArrowLeftRight className="size-6 text-primary" />
            Transactions
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Complete lifecycle ledger tracking checkouts, check-ins, overdue loans, and write-offs.
          </p>
        </div>

        {/* Action & Export buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportUnifiedXlsx}
            disabled={!data || data.data.length === 0}
            className="flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-600 hover:bg-emerald-500/20 transition-colors shadow-sm disabled:opacity-50"
            title="Download XLSX with Borrow & Return dates in a single column"
          >
            <FileSpreadsheet className="size-3.5" />
            Export XLSX (Single Date Col)
          </button>

          <button
            onClick={handleExportStandardCsv}
            disabled={!data || data.data.length === 0}
            className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted transition-colors shadow-sm disabled:opacity-50"
          >
            <Download className="size-3.5" />
            Export CSV
          </button>

          <button
            onClick={() => void refetch()}
            disabled={isFetching}
            className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted transition-colors disabled:opacity-50 shadow-sm"
          >
            <RefreshCw className={`size-3.5 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
        <TransactionFilters
          type={type}
          onTypeChange={(newType) => {
            setType(newType)
            setPage(1)
          }}
          search={search}
          onSearchChange={(newSearch) => {
            setSearch(newSearch)
            setPage(1)
          }}
          startDate={startDate}
          onStartDateChange={(newDate) => {
            setStartDate(newDate)
            setPage(1)
          }}
          endDate={endDate}
          onEndDateChange={(newDate) => {
            setEndDate(newDate)
            setPage(1)
          }}
        />
      </div>

      {/* Transactions Table */}
      <TransactionsTable
        data={data?.data ?? []}
        total={data?.total ?? 0}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={(newSize) => {
          setPageSize(newSize)
          setPage(1)
        }}
        onActionClick={handleOpenAction}
        loading={isLoading}
      />

      {/* Override / Mark Modal */}
      <MarkLostDamagedModal
        open={modalOpen}
        onClose={handleCloseModal}
        transaction={selectedTx}
        actionType={actionType}
      />
    </div>
  )
}
