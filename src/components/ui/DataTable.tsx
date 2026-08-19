import { useState } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
  type RowSelectionState,
  type OnChangeFn,
} from '@tanstack/react-table'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'
import { PAGE_SIZE_OPTIONS } from '@/constants'

interface DataTableProps<TData> {
  columns: ColumnDef<TData>[]
  data: TData[]
  total?: number
  page?: number
  pageSize?: number
  onPageChange?: (page: number) => void
  onPageSizeChange?: (size: number) => void
  onRowClick?: (row: TData) => void
  rowSelection?: RowSelectionState
  onRowSelectionChange?: OnChangeFn<RowSelectionState>
  enableSelection?: boolean
  loading?: boolean
  emptyMessage?: string
}

export function DataTable<TData>({
  columns,
  data,
  total = 0,
  page = 1,
  pageSize = 25,
  onPageChange,
  onPageSizeChange,
  onRowClick,
  rowSelection,
  onRowSelectionChange,
  enableSelection = false,
  loading = false,
  emptyMessage = 'No results found.',
}: DataTableProps<TData>) {
  const [internalSelection, setInternalSelection] = useState<RowSelectionState>({})
  const selection = rowSelection ?? internalSelection
  const setSelection = onRowSelectionChange ?? setInternalSelection

  const totalPages = Math.ceil(total / pageSize)

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: totalPages,
    state: {
      rowSelection: enableSelection ? selection : {},
      pagination: { pageIndex: page - 1, pageSize },
    },
    onRowSelectionChange: enableSelection ? setSelection : undefined,
    enableRowSelection: enableSelection,
    getRowId: (row) => String((row as Record<string, unknown>).id),
  })

  return (
    <div className="space-y-3">
      {/* Table Container */}
      <div className="overflow-x-auto rounded-xl border border-border bg-card skeuo-card">
        <table className="w-full text-sm">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="border-b border-border bg-muted/50">
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground select-none"
                    style={{ width: header.getSize() !== 150 ? header.getSize() : undefined }}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-border/60">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-border/40">
                  {columns.map((_, j) => (
                    <td key={j} className="px-4 py-3.5">
                      <div className="h-4 w-full animate-pulse rounded bg-muted/70" />
                    </td>
                  ))}
                </tr>
              ))
            ) : table.getRowModel().rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-14 text-center text-sm text-muted-foreground"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className={`transition-colors hover:bg-muted/40 ${
                    onRowClick ? 'cursor-pointer' : ''
                  } ${row.getIsSelected() ? 'bg-primary/5 font-medium' : ''}`}
                  onClick={() => onRowClick?.(row.original)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-3 text-foreground">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {total > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground px-1">
          <div className="flex items-center gap-2">
            <span>Rows per page</span>
            <select
              value={pageSize}
              onChange={(e) => {
                onPageSizeChange?.(Number(e.target.value))
                onPageChange?.(1)
              }}
              className="skeuo-input rounded-md bg-background px-2.5 py-1 text-xs text-foreground cursor-pointer"
            >
              {PAGE_SIZE_OPTIONS.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="mr-2 font-mono text-xs">
              {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total}
            </span>

            <button
              type="button"
              onClick={() => onPageChange?.(1)}
              disabled={page <= 1}
              className="skeuo-button-secondary rounded-lg p-1.5 transition-all disabled:opacity-30 disabled:pointer-events-none"
              aria-label="First page"
            >
              <ChevronsLeft className="size-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onPageChange?.(page - 1)}
              disabled={page <= 1}
              className="skeuo-button-secondary rounded-lg p-1.5 transition-all disabled:opacity-30 disabled:pointer-events-none"
              aria-label="Previous page"
            >
              <ChevronLeft className="size-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onPageChange?.(page + 1)}
              disabled={page >= totalPages}
              className="skeuo-button-secondary rounded-lg p-1.5 transition-all disabled:opacity-30 disabled:pointer-events-none"
              aria-label="Next page"
            >
              <ChevronRight className="size-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onPageChange?.(totalPages)}
              disabled={page >= totalPages}
              className="skeuo-button-secondary rounded-lg p-1.5 transition-all disabled:opacity-30 disabled:pointer-events-none"
              aria-label="Last page"
            >
              <ChevronsRight className="size-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
