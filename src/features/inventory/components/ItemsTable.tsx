import { useMemo } from 'react'
import { type ColumnDef } from '@tanstack/react-table'
import { DataTable } from '@/components/ui/DataTable'
import type { InventoryItemWithCategory } from '../types'

interface ItemsTableProps {
  data: InventoryItemWithCategory[]
  total: number
  page: number
  pageSize: number
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
  onRowClick: (item: InventoryItemWithCategory) => void
  loading?: boolean
}

export function ItemsTable({
  data,
  total,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  onRowClick,
  loading,
}: ItemsTableProps) {
  const columns = useMemo<ColumnDef<InventoryItemWithCategory>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Name',
        cell: ({ row }) => (
          <span className="font-medium text-foreground">{row.original.name}</span>
        ),
      },
      {
        id: 'category',
        header: 'Category',
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {row.original.category?.name ?? '—'}
          </span>
        ),
      },
      {
        accessorKey: 'sku',
        header: 'SKU',
        cell: ({ row }) => (
          <span className="font-mono text-xs text-muted-foreground">
            {row.original.sku ?? '—'}
          </span>
        ),
      },
      {
        accessorKey: 'manufacturer',
        header: 'Manufacturer',
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {row.original.manufacturer ?? '—'}
          </span>
        ),
      },
      {
        accessorKey: 'unit_value',
        header: 'Value',
        cell: ({ row }) =>
          row.original.unit_value != null ? (
            <span className="font-mono text-xs">
              ₹{row.original.unit_value.toLocaleString()}
            </span>
          ) : (
            <span className="text-muted-foreground">—</span>
          ),
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
      emptyMessage="No inventory items found."
    />
  )
}
