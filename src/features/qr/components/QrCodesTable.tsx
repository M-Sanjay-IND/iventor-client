/* eslint-disable */
import { useMemo } from 'react'
import { type ColumnDef, type RowSelectionState, type OnChangeFn } from '@tanstack/react-table'
import { format } from 'date-fns'
import { DataTable } from '@/components/ui/DataTable'
import type { QrCodeWithRelations } from '../types'

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-emerald-500/10 text-emerald-600',
  replaced: 'bg-amber-500/10 text-amber-600',
}

interface QrCodesTableProps {
  data: QrCodeWithRelations[]
  total: number
  page: number
  pageSize: number
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
  onRowClick?: (qr: QrCodeWithRelations) => void
  loading?: boolean
  rowSelection?: RowSelectionState
  onRowSelectionChange?: OnChangeFn<RowSelectionState>
}

export function QrCodesTable({
  data,
  total,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  onRowClick,
  loading,
  rowSelection,
  onRowSelectionChange,
}: QrCodesTableProps) {
  const columns = useMemo<ColumnDef<QrCodeWithRelations>[]>(
    () => [
      {
        id: 'selection',
        header: ({ table }) => (
          <input
            type="checkbox"
            className="size-4 rounded border-border accent-primary"
            checked={table.getIsAllRowsSelected()}
            ref={(input) => {
              if (input) input.indeterminate = table.getIsSomeRowsSelected()
            }}
            onChange={table.getToggleAllRowsSelectedHandler()}
          />
        ),
        cell: ({ row }) => (
          <input
            type="checkbox"
            className="size-4 rounded border-border accent-primary"
            checked={row.getIsSelected()}
            onChange={row.getToggleSelectedHandler()}
            onClick={(e) => e.stopPropagation()}
          />
        ),
        size: 40,
      },
      {
        accessorKey: 'qr_uid',
        header: 'QR UID',
        cell: ({ row }) => (
          <span className="font-mono text-xs font-medium text-primary">
            {row.original.qr_uid}
          </span>
        ),
        size: 140,
      },
      {
        id: 'item_name',
        header: 'Item',
        cell: ({ row }) => (
          <span className="text-sm text-foreground">
            {row.original.copy?.item?.name ?? '—'}
          </span>
        ),
      },
      {
        id: 'copy_number',
        header: 'Copy #',
        cell: ({ row }) => (
          <span className="font-mono text-xs text-muted-foreground">
            #{row.original.copy?.copy_number ?? '—'}
          </span>
        ),
        size: 80,
      },
      {
        accessorKey: 'is_active',
        header: 'Status',
        cell: ({ row }) => {
          const active = row.original.is_active
          return (
            <span
              className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                active ? STATUS_COLORS.active : STATUS_COLORS.replaced
              }`}
            >
              {active ? 'Active' : 'Replaced'}
            </span>
          )
        },
        size: 90,
      },
      {
        accessorKey: 'version',
        header: 'Ver.',
        cell: ({ row }) => (
          <span className="font-mono text-xs text-muted-foreground">
            v{row.original.version}
          </span>
        ),
        size: 60,
      },
      {
        accessorKey: 'print_count',
        header: 'Prints',
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {row.original.print_count}
          </span>
        ),
        size: 70,
      },
      {
        accessorKey: 'created_at',
        header: 'Generated',
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {format(new Date(row.original.created_at), 'dd MMM yyyy')}
          </span>
        ),
        size: 110,
      },
    ],
    [],
  )

  return (
    <DataTable
      columns={columns}
      data={data}
      total={total}
      page={page}
      pageSize={pageSize}
      onPageChange={onPageChange}
      onPageSizeChange={onPageSizeChange}
      onRowClick={onRowClick}
      loading={loading}
      enableSelection={true}
      rowSelection={rowSelection}
      onRowSelectionChange={onRowSelectionChange}
      emptyMessage="No QR codes generated yet."
    />
  )
}
