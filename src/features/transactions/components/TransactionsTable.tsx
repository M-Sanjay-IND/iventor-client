import { useState } from 'react'
import {
  ArrowDownLeft,
  ArrowUpRight,
  AlertCircle,
  AlertTriangle,
  MoreVertical,
  Calendar,
  Clock,
  ShieldCheck,
} from 'lucide-react'
import type { TransactionWithDetails } from '../types'
import { PAGE_SIZE_OPTIONS } from '@/constants'

interface TransactionsTableProps {
  data: TransactionWithDetails[]
  total: number
  page: number
  pageSize: number
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
  onActionClick: (tx: TransactionWithDetails, action: 'lost' | 'damaged' | 'force_return') => void
  loading?: boolean
}

export function TransactionsTable({
  data,
  total,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  onActionClick,
  loading = false,
}: TransactionsTableProps) {
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null)
  const totalPages = Math.ceil(total / pageSize)

  if (loading) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-12 animate-pulse rounded-lg bg-muted/60" />
        ))}
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-12 text-center">
        <ShieldCheck className="mx-auto size-10 text-muted-foreground/40 mb-3" />
        <h3 className="text-base font-semibold text-foreground">No Transactions Found</h3>
        <p className="text-xs text-muted-foreground mt-1">
          Try adjusting your search query, type filter, or date range.
        </p>
      </div>
    )
  }

  const now = new Date()

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-muted/40 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Item & Copy</th>
                <th className="px-4 py-3">Borrower</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Due / Return Date</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.map((tx) => {
                const item = tx.copy?.item
                const copy = tx.copy
                const isOverdue =
                  tx.type === 'borrow' &&
                  tx.due_date &&
                  new Date(tx.due_date) < now &&
                  copy?.status === 'borrowed'

                return (
                  <tr key={tx.id} className="hover:bg-muted/30 transition-colors">
                    {/* Type Badge */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      {tx.type === 'borrow' ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2.5 py-1 text-xs font-semibold text-blue-600">
                          <ArrowUpRight className="size-3" /> Borrow
                        </span>
                      ) : tx.type === 'return' ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-600">
                          <ArrowDownLeft className="size-3" /> Return
                        </span>
                      ) : tx.type === 'lost' ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2.5 py-1 text-xs font-semibold text-red-600">
                          <AlertCircle className="size-3" /> Lost
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-600">
                          <AlertTriangle className="size-3" /> Damaged
                        </span>
                      )}
                    </td>

                    {/* Item & Copy */}
                    <td className="px-4 py-3.5">
                      <p className="font-semibold text-foreground">{item?.name ?? 'Unknown Item'}</p>
                      <p className="text-xs text-muted-foreground">
                        Copy #{copy?.copy_number ?? 1} • {item?.category?.name ?? 'No Category'} •{' '}
                        {copy?.location?.name ?? 'No Location'}
                      </p>
                    </td>

                    {/* Borrower */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className="font-mono text-xs font-medium text-foreground">
                        {tx.borrower_email}
                      </span>
                    </td>

                    {/* Date Created / Borrowed */}
                    <td className="px-4 py-3.5 whitespace-nowrap text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="size-3.5" />
                        {new Date(tx.created_at).toLocaleDateString()}
                      </div>
                    </td>

                    {/* Due Date or Returned Date */}
                    <td className="px-4 py-3.5 whitespace-nowrap text-xs">
                      {tx.returned_at ? (
                        <span className="text-muted-foreground">
                          Returned {new Date(tx.returned_at).toLocaleDateString()}
                        </span>
                      ) : tx.due_date ? (
                        <div
                          className={`flex items-center gap-1 font-medium ${
                            isOverdue ? 'text-red-600 font-semibold' : 'text-muted-foreground'
                          }`}
                        >
                          <Clock className="size-3.5" />
                          Due: {new Date(tx.due_date).toLocaleDateString()}
                        </div>
                      ) : (
                        <span className="text-muted-foreground/60">No due date</span>
                      )}
                    </td>

                    {/* Status badge */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      {isOverdue ? (
                        <span className="rounded-full bg-red-500/10 px-2.5 py-1 text-xs font-semibold text-red-600">
                          Overdue
                        </span>
                      ) : tx.type === 'borrow' && copy?.status === 'borrowed' ? (
                        <span className="rounded-full bg-blue-500/10 px-2.5 py-1 text-xs font-semibold text-blue-600">
                          Active Loan
                        </span>
                      ) : (
                        <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                          Completed
                        </span>
                      )}
                    </td>

                    {/* Admin Action Menu */}
                    <td className="px-4 py-3.5 text-right relative whitespace-nowrap">
                      <div className="inline-block text-left">
                        <button
                          onClick={() => setActiveMenuId(activeMenuId === tx.id ? null : tx.id)}
                          className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                          title="Actions"
                        >
                          <MoreVertical className="size-4" />
                        </button>

                        {activeMenuId === tx.id && (
                          <div className="absolute right-4 top-10 z-20 w-44 rounded-xl border border-border bg-card p-1.5 shadow-lg space-y-1">
                            {tx.type === 'borrow' && copy?.status === 'borrowed' && (
                              <button
                                onClick={() => {
                                  setActiveMenuId(null)
                                  onActionClick(tx, 'force_return')
                                }}
                                className="w-full text-left px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-primary/10 hover:text-primary rounded-lg transition-colors"
                              >
                                Force Return Item
                              </button>
                            )}
                            <button
                              onClick={() => {
                                setActiveMenuId(null)
                                onActionClick(tx, 'lost')
                              }}
                              className="w-full text-left px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-500/10 rounded-lg transition-colors"
                            >
                              Mark as Lost
                            </button>
                            <button
                              onClick={() => {
                                setActiveMenuId(null)
                                onActionClick(tx, 'damaged')
                              }}
                              className="w-full text-left px-2.5 py-1.5 text-xs font-medium text-amber-600 hover:bg-amber-500/10 rounded-lg transition-colors"
                            >
                              Mark as Damaged
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 text-xs text-muted-foreground px-1">
        <div className="flex items-center gap-2">
          <span>Rows per page:</span>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="rounded-md border border-border bg-card px-2 py-1 text-xs text-foreground focus:border-primary"
          >
            {PAGE_SIZE_OPTIONS.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
          <span>
            Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total} transactions
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            className="rounded-md border border-border px-3 py-1 text-xs text-foreground hover:bg-muted disabled:opacity-40"
          >
            Previous
          </button>
          <span className="px-2">
            Page {page} of {Math.max(1, totalPages)}
          </span>
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            className="rounded-md border border-border px-3 py-1 text-xs text-foreground hover:bg-muted disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  )
}
