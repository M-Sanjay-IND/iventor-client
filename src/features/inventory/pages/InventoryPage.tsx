import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, FolderTree, MapPin, Search, UploadCloud } from 'lucide-react'
import { useItems, useCategories } from '../hooks/inventory.queries'
import { ItemsTable } from '../components/ItemsTable'
import { CategoryManager } from '../components/CategoryManager'
import { LocationManager } from '../components/LocationManager'
import { BulkImportModal } from '../components/BulkImportModal'
import { BulkItemImportModal } from '../components/BulkItemImportModal'
import { UnifiedBulkImportModal } from '../components/UnifiedBulkImportModal'
import { DEFAULT_PAGE_SIZE } from '@/constants'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { InventoryItemWithCategory } from '../types'

export function InventoryPage() {
  const navigate = useNavigate()

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState<number>(DEFAULT_PAGE_SIZE)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [categoryManagerOpen, setCategoryManagerOpen] = useState(false)
  const [locationManagerOpen, setLocationManagerOpen] = useState(false)
  const [unifiedImportOpen, setUnifiedImportOpen] = useState(false)
  const [bulkImportOpen, setBulkImportOpen] = useState(false)
  const [bulkItemImportOpen, setBulkItemImportOpen] = useState(false)

  const { data: categories = [] } = useCategories()
  const { data, isLoading } = useItems({
    page,
    pageSize,
    search,
    categoryId: categoryFilter || undefined,
  })

  function handleRowClick(item: InventoryItemWithCategory) {
    navigate(`/admin/inventory/${item.id}`)
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/80 pb-5">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
            Inventory Catalog
          </h1>
          <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
            Manage physical SKUs, individual serialized copies, and rack locations.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setUnifiedImportOpen(true)}
            className="gap-1.5 text-xs"
          >
            <UploadCloud className="size-3.5" />
            Bulk Import (XLSX)
          </Button>
          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={() => navigate('/admin/inventory/new')}
            className="gap-1.5 text-xs"
          >
            <Plus className="size-3.5" />
            Add Item
          </Button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
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
            placeholder="Search items by name, SKU..."
          />
        </div>

        {/* Category filter */}
        <select
          value={categoryFilter}
          onChange={(e) => {
            setCategoryFilter(e.target.value)
            setPage(1)
          }}
          className="skeuo-input h-9 rounded-lg bg-background px-3 text-xs text-foreground cursor-pointer"
        >
          <option value="">All categories</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>

        {/* Management buttons */}
        <div className="flex items-center gap-2 ml-auto">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setCategoryManagerOpen(true)}
            className="gap-1.5 text-xs"
          >
            <FolderTree className="size-3.5" />
            Categories
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setLocationManagerOpen(true)}
            className="gap-1.5 text-xs"
          >
            <MapPin className="size-3.5" />
            Locations
          </Button>
        </div>
      </div>

      {/* Table */}
      <ItemsTable
        data={data?.data ?? []}
        total={data?.total ?? 0}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={(size) => setPageSize(size)}
        onRowClick={handleRowClick}
        loading={isLoading}
      />

      {/* Modals */}
      <CategoryManager open={categoryManagerOpen} onClose={() => setCategoryManagerOpen(false)} />
      <LocationManager open={locationManagerOpen} onClose={() => setLocationManagerOpen(false)} />
      <UnifiedBulkImportModal open={unifiedImportOpen} onClose={() => setUnifiedImportOpen(false)} />
      <BulkImportModal open={bulkImportOpen} onClose={() => setBulkImportOpen(false)} />
      <BulkItemImportModal open={bulkItemImportOpen} onClose={() => setBulkItemImportOpen(false)} />
    </div>
  )
}
