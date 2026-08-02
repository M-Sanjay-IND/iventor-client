import { useMemo } from 'react'
import { type ColumnDef } from '@tanstack/react-table'
import { DataTable } from '@/components/ui/DataTable'
// Badge color maps for condition and status indicators
import type { InventoryCopy } from '../types'

const CONDITION_COLORS: Record<string, string> = {
  new: 'bg-emerald-500/10 text-emerald-600',
  good: 'bg-blue-500/10 text-blue-600',
  fair: 'bg-amber-500/10 text-amber-600',
  poor: 'bg-orange-500/10 text-orange-600',
  damaged: 'bg-red-500/10 text-red-600',
  lost: 'bg-gray-500/10 text-gray-500',
}

const STATUS_COLORS: Record<string, string> = {
  available: 'bg-emerald-500/10 text-emerald-600',
  borrowed: 'bg-violet-500/10 text-violet-600',
  reserved: 'bg-amber-500/10 text-amber-600',
  maintenance: 'bg-orange-500/10 text-orange-600',
  retired: 'bg-gray-500/10 text-gray-500',
}

interface CopiesTableProps {
  data: InventoryCopy[]
  loading?: boolean
  onEdit?: (copy: InventoryCopy) => void
}

export function CopiesTable({ data, loading, onEdit }: CopiesTableProps) {
  const columns = useMemo<ColumnDef<InventoryCopy>[]>(
    () => [
      {
        accessorKey: 'copy_number',
        header: 'Copy #',
        cell: ({ row }) => (
          <span className="font-mono text-xs">#{row.original.copy_number}</span>
        ),
        size: 80,
      },
      {
        accessorKey: 'asset_tag',
        header: 'Asset Tag',
        cell: ({ row }) => (
          <span className="font-mono text-xs text-muted-foreground">
            {row.original.asset_tag ?? '—'}
          </span>
        ),
      },
      {
        accessorKey: 'condition',
        header: 'Condition',
        cell: ({ row }) => (
          <span
            className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium capitalize ${CONDITION_COLORS[row.original.condition] ?? ''}`}
          >
            {row.original.condition}
          </span>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => (
          <span
            className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium capitalize ${STATUS_COLORS[row.original.status] ?? ''}`}
          >
            {row.original.status}
          </span>
        ),
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onEdit?.(row.original)
            }}
            className="text-xs text-primary hover:underline"
          >
            Edit
          </button>
        ),
        size: 60,
      },
    ],
    [onEdit],
  )

  return (
    <DataTable
      columns={columns}
      data={data}
      total={data.length}
      loading={loading}
      emptyMessage="No copies yet. Add one to track physical instances."
    />
  )
}
