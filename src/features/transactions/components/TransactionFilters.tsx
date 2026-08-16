import { Search, Calendar } from 'lucide-react'
import type { TransactionType } from '../types'

interface TransactionFiltersProps {
  type: TransactionType | 'all' | 'active_borrow' | 'overdue'
  onTypeChange: (type: TransactionType | 'all' | 'active_borrow' | 'overdue') => void
  search: string
  onSearchChange: (val: string) => void
  startDate: string
  onStartDateChange: (val: string) => void
  endDate: string
  onEndDateChange: (val: string) => void
}

const TABS: { id: TransactionType | 'all' | 'active_borrow' | 'overdue'; label: string }[] = [
  { id: 'all', label: 'All Transactions' },
  { id: 'borrow', label: 'Borrows' },
  { id: 'return', label: 'Returns' },
  { id: 'overdue', label: 'Overdue' },
  { id: 'lost', label: 'Lost' },
  { id: 'damaged', label: 'Damaged' },
]

export function TransactionFilters({
  type,
  onTypeChange,
  search,
  onSearchChange,
  startDate,
  onStartDateChange,
  endDate,
  onEndDateChange,
}: TransactionFiltersProps) {
  return (
    <div className="space-y-3">
      {/* Category / Type Tabs */}
      <div className="flex flex-wrap gap-1.5 border-b border-border pb-3">
        {TABS.map((tab) => {
          const isActive = type === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => onTypeChange(tab.id)}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Filter Row: Search & Date Pickers */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by borrower email..."
            className="w-full rounded-md border border-border bg-transparent py-1.5 pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Date range */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Calendar className="size-4" />
          <input
            type="date"
            value={startDate}
            onChange={(e) => onStartDateChange(e.target.value)}
            className="rounded-md border border-border bg-transparent px-2.5 py-1.5 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="From Date"
          />
          <span>to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => onEndDateChange(e.target.value)}
            className="rounded-md border border-border bg-transparent px-2.5 py-1.5 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="To Date"
          />
          {(startDate || endDate || search || type !== 'all') && (
            <button
              onClick={() => {
                onTypeChange('all')
                onSearchChange('')
                onStartDateChange('')
                onEndDateChange('')
              }}
              className="ml-2 text-xs text-primary hover:underline"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
