import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, FolderTree, MapPin, Search } from 'lucide-react'
import { useItems, useCategories } from '../hooks/inventory.queries'
import { ItemsTable } from '../components/ItemsTable'
import { CategoryManager } from '../components/CategoryManager'
import { LocationManager } from '../components/LocationManager'
import { DEFAULT_PAGE_SIZE } from '@/constants'
import type { InventoryItemWithCategory } from '../types'

export function InventoryPage() {
  const navigate = useNavigate()

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState<number>(DEFAULT_PAGE_SIZE)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [categoryManagerOpen, setCategoryManagerOpen] = useState(false)
  const [locationManagerOpen, setLocationManagerOpen] = useState(false)

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
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Inventory
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage items and physical copies.
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/admin/inventory/new')}
          className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <Plus className="size-4" />
          Add Item
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Search */}
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
            placeholder="Search items…"
          />
        </div>

        {/* Category filter */}
        <select
          value={categoryFilter}
          onChange={(e) => {
            setCategoryFilter(e.target.value)
            setPage(1)
          }}
          className="rounded-md border border-border bg-transparent px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="">All categories</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>

        {/* Management buttons */}
        <button
          type="button"
          onClick={() => setCategoryManagerOpen(true)}
          className="flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <FolderTree className="size-3.5" />
          Categories
        </button>
        <button
          type="button"
          onClick={() => setLocationManagerOpen(true)}
          className="flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <MapPin className="size-3.5" />
          Locations
        </button>
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
    </div>
  )
}
