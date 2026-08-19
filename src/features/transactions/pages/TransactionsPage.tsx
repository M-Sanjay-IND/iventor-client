import { useState } from 'react'
import { ArrowLeftRight, RefreshCw, Download, FileSpreadsheet } from 'lucide-react'
import { useTransactions } from '../hooks/transactions.queries'
import { TransactionFilters } from '../components/TransactionFilters'
import { TransactionsTable } from '../components/TransactionsTable'
import { MarkLostDamagedModal } from '../components/MarkLostDamagedModal'
import { DEFAULT_PAGE_SIZE } from '@/constants'
import { exportToXlsx, exportToCsv } from '@/features/reports/utils/export.utils'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import type { TransactionType, TransactionWithDetails } from '../types'

export function TransactionsPage() {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState<number>(DEFAULT_PAGE_SIZE)
  const [type, setType] = useState<TransactionType | 'all' | 'active_borrow' | 'overdue'>('all')
  const [search, setSearch] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

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
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <ArrowLeftRight className="size-5 text-foreground" />
            <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
              Transactions Ledger
            </h1>
          </div>
          <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
            Complete lifecycle ledger tracking checkouts, check-ins, overdue loans, and write-offs.
          </p>
        </div>

        {/* Action & Export buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportUnifiedXlsx}
            disabled={!data || data.data.length === 0}
            className="gap-1.5 text-xs"
            title="Download XLSX with Borrow & Return dates in a single column"
          >
            <FileSpreadsheet className="size-3.5" />
            Export XLSX
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportStandardCsv}
            disabled={!data || data.data.length === 0}
            className="gap-1.5 text-xs"
          >
            <Download className="size-3.5" />
            Export CSV
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => void refetch()}
            disabled={isFetching}
            className="gap-1.5 text-xs"
          >
            <RefreshCw className={`size-3.5 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters Bar */}
      <Card className="p-4">
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
      </Card>

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
