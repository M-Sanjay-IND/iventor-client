import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, Printer, QrCode } from 'lucide-react'
import { useQrCodes } from '../hooks/qr.queries'
import { QrCodesTable } from '../components/QrCodesTable'
import { BulkGenerateModal } from '../components/BulkGenerateModal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <QrCode className="size-5 text-foreground" />
            <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
              QR Code Registry
            </h1>
          </div>
          <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
            Generate, serialize, and manage physical asset identity barcodes.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {selectedIds.length > 0 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handlePrintSelected}
              className="gap-1.5 text-xs"
            >
              <Printer className="size-3.5" />
              Print ({selectedIds.length})
            </Button>
          )}
          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={() => setBulkModalOpen(true)}
            className="gap-1.5 text-xs"
          >
            <Plus className="size-3.5" />
            Generate QR Set
          </Button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            className="pl-8 text-xs"
            placeholder="Search by QR UID (e.g. INV-000000001)..."
          />
        </div>

        <label className="skeuo-pill flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground cursor-pointer select-none">
          <input
            type="checkbox"
            checked={activeOnly}
            onChange={(e) => {
              setActiveOnly(e.target.checked)
              setPage(1)
            }}
            className="size-3.5 rounded accent-foreground cursor-pointer"
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
