import { useState } from 'react'
import { ArrowLeftRight, RefreshCw } from 'lucide-react'
import { useTransactions } from '../hooks/transactions.queries'
import { TransactionFilters } from '../components/TransactionFilters'
import { TransactionsTable } from '../components/TransactionsTable'
import { MarkLostDamagedModal } from '../components/MarkLostDamagedModal'
import { DEFAULT_PAGE_SIZE } from '@/constants'
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

        <button
          onClick={() => void refetch()}
          disabled={isFetching}
          className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`size-3.5 ${isFetching ? 'animate-spin' : ''}`} />
          Refresh Ledger
        </button>
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
