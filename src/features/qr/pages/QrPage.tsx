import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, Printer } from 'lucide-react'
import { useQrCodes } from '../hooks/qr.queries'
import { QrCodesTable } from '../components/QrCodesTable'
import { BulkGenerateModal } from '../components/BulkGenerateModal'
import type { QrCodeWithRelations } from '../types'

export function QrPage() {
  const navigate = useNavigate()

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState<number>(25)
  const [search, setSearch] = useState('')
  const [activeOnly, setActiveOnly] = useState(true)
  const [bulkModalOpen, setBulkModalOpen] = useState(false)
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({})

  const { data, isLoading } = useQrCodes({ page, pageSize, search, activeOnly })

  const selectedIds = Object.keys(rowSelection)

  function handleRowClick(qr: QrCodeWithRelations) {
    void navigate(`/admin/qr/${qr.qr_uid}`)
  }

  function handlePrintSelected() {
    if (selectedIds.length === 0) return
    void navigate('/admin/qr/print', { state: { qrIds: selectedIds } })
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            QR Codes
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Generate and manage permanent QR identities.
          </p>
        </div>
        <div className="flex gap-2">
          {selectedIds.length > 0 && (
            <button
              type="button"
              onClick={handlePrintSelected}
              className="flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-sm transition-colors hover:bg-muted"
            >
              <Printer className="size-4" />
              Print ({selectedIds.length})
            </button>
          )}
          <button
            type="button"
            onClick={() => setBulkModalOpen(true)}
            className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Plus className="size-4" />
            Generate
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            className="w-full rounded-md border border-border bg-transparent py-2 pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="Search by QR UID…"
          />
        </div>

        <label className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm">
          <input
            type="checkbox"
            checked={activeOnly}
            onChange={(e) => {
              setActiveOnly(e.target.checked)
              setPage(1)
            }}
            className="size-4 rounded accent-primary"
          />
          Active only
        </label>
      </div>

      {/* Table */}
      <QrCodesTable
        data={data?.data ?? []}
        total={data?.total ?? 0}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={(size) => setPageSize(size)}
        onRowClick={handleRowClick}
        loading={isLoading}
        rowSelection={rowSelection}
        onRowSelectionChange={setRowSelection}
      />

      {/* Modals */}
      <BulkGenerateModal
        open={bulkModalOpen}
        onClose={() => setBulkModalOpen(false)}
      />
    </div>
  )
}
