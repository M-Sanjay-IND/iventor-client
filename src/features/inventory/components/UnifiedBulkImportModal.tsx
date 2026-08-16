import { useState, useRef } from 'react'
import Papa from 'papaparse'
import * as XLSX from 'xlsx'
import { Upload, X, FileCheck2, Play, Download, Layers } from 'lucide-react'
import { toast } from 'sonner'
import { Modal } from '@/components/ui/Modal'
import {
  useItems,
  useCategories,
  useLocations,
  useCreateItem,
  useCreateCategory,
  useCreateLocation,
  useBulkCreateCopies,
} from '../hooks/inventory.queries'
import { useBulkGenerateQr } from '@/features/qr/hooks/qr.queries'
import type { CopyFormData, ItemFormData } from '../services/inventory.service'
import { supabase } from '@/services/supabase'

interface UnifiedBulkImportModalProps {
  open: boolean
  onClose: () => void
}

interface ParsedUnifiedRow {
  'Item Name'?: string
  Name?: string
  'Category Name'?: string
  Description?: string
  'Location Name'?: string
  Quantity?: string | number
  Condition?: string
  Status?: string
  Notes?: string
  Manufacturer?: string
  Brand?: string
  Model?: string
  SKU?: string
  'Unit Value'?: string | number
}

export function UnifiedBulkImportModal({ open, onClose }: UnifiedBulkImportModalProps) {
  const [file, setFile] = useState<File | null>(null)
  const [parsedRows, setParsedRows] = useState<ParsedUnifiedRow[]>([])
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { data: itemsData } = useItems({ pageSize: 1000 })
  const { data: categories = [] } = useCategories()
  const { data: locationsList = [] } = useLocations()

  const createCategoryMutation = useCreateCategory()
  const createLocationMutation = useCreateLocation()
  const createItemMutation = useCreateItem()
  const bulkCreateCopiesMutation = useBulkCreateCopies()
  const bulkQrMutation = useBulkGenerateQr()

  const existingItems = itemsData?.data || []

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0]
    if (!selected) return

    const fileName = selected.name.toLowerCase()
    if (!fileName.endsWith('.csv') && !fileName.endsWith('.xlsx') && !fileName.endsWith('.xls')) {
      toast.error('Please upload a .csv or .xlsx file')
      return
    }

    setFile(selected)

    try {
      if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
        const buffer = await selected.arrayBuffer()
        const workbook = XLSX.read(buffer, { type: 'array' })
        const sheetName = workbook.SheetNames[0]
        if (!sheetName) throw new Error('No sheets found in Excel file')
        const worksheet = workbook.Sheets[sheetName]
        if (!worksheet) throw new Error('Worksheet is empty')
        const rows = XLSX.utils.sheet_to_json<ParsedUnifiedRow>(worksheet, { defval: '' })
        setParsedRows(rows)
      } else {
        Papa.parse<ParsedUnifiedRow>(selected, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            setParsedRows(results.data)
          },
          error: (error) => {
            toast.error(`Error parsing CSV: ${error.message}`)
          },
        })
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error reading spreadsheet file')
    }
  }

  function downloadTemplate() {
    const headers = [
      'Item Name',
      'Category Name',
      'Description',
      'Location Name',
      'Quantity',
      'Condition',
      'Status',
      'Notes',
      'Manufacturer',
      'Brand',
      'Model',
      'SKU',
      'Unit Value',
    ]

    const csvContent = headers.join(',') + '\n'
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', 'unified_inventory_import_template.csv')
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  async function handleImport() {
    if (parsedRows.length === 0) return

    setLoading(true)
    setProgress('Initializing import maps...')

    try {
      const categoryMap = new Map<string, string>()
      categories.forEach((c) => categoryMap.set(c.name.toLowerCase(), c.id))

      const locationMap = new Map<string, string>()
      locationsList.forEach((l) => locationMap.set(l.name.toLowerCase(), l.id))

      const itemMap = new Map<string, string>()
      existingItems.forEach((i) => itemMap.set(i.name.toLowerCase(), i.id))

      const maxCopyNumMap = new Map<string, number>()
      const copiesToInsert: CopyFormData[] = []
      let itemsCreatedCount = 0

      // Process each row in single spreadsheet
      for (let idx = 0; idx < parsedRows.length; idx++) {
        const row = parsedRows[idx]!
        const rawItemName = (row['Item Name'] || row.Name || '').toString().trim()
        if (!rawItemName) {
          throw new Error(`Row ${idx + 1}: Item Name is required.`)
        }

        const lowerItemName = rawItemName.toLowerCase()

        // 1. Resolve Category
        let categoryId: string | null = null
        const rawCategory = row['Category Name']?.toString().trim()
        if (rawCategory) {
          const lowerCat = rawCategory.toLowerCase()
          if (categoryMap.has(lowerCat)) {
            categoryId = categoryMap.get(lowerCat)!
          } else {
            setProgress(`Creating category: ${rawCategory}...`)
            const newCat = await createCategoryMutation.mutateAsync({
              name: rawCategory,
              description: 'Auto-created during bulk import',
              parent_id: null,
            })
            categoryId = newCat.id
            categoryMap.set(lowerCat, newCat.id)
          }
        }

        // 2. Resolve or Create Catalog Item
        let itemId: string
        if (itemMap.has(lowerItemName)) {
          itemId = itemMap.get(lowerItemName)!
        } else {
          setProgress(`Creating catalog item: ${rawItemName}...`)
          const rawSku = row.SKU ? String(row.SKU).trim() : ''
          const rawMfr = row.Manufacturer ? String(row.Manufacturer).trim() : ''
          const rawBrand = row.Brand ? String(row.Brand).trim() : ''
          const rawModel = row.Model ? String(row.Model).trim() : ''

          const itemData: ItemFormData = {
            name: rawItemName,
            description: row.Description ? String(row.Description).trim() : '',
            category_id: categoryId,
            manufacturer: rawMfr || null,
            brand: rawBrand || null,
            model: rawModel || null,
            sku: rawSku !== '' ? rawSku : null,
            unit_value: row['Unit Value'] ? parseFloat(String(row['Unit Value'])) : null,
            metadata: {},
          }

          const newItem = await createItemMutation.mutateAsync(itemData)
          itemId = newItem.id
          itemMap.set(lowerItemName, itemId)
          itemsCreatedCount++
        }

        // 3. Resolve Location & Physical Copies
        const rawLocation = row['Location Name']?.toString().trim()
        if (rawLocation) {
          const lowerLoc = rawLocation.toLowerCase()
          let locationId: string
          if (locationMap.has(lowerLoc)) {
            locationId = locationMap.get(lowerLoc)!
          } else {
            setProgress(`Creating location: ${rawLocation}...`)
            const newLoc = await createLocationMutation.mutateAsync({
              name: rawLocation,
              description: 'Auto-created during bulk import',
              parent_id: null,
            })
            locationId = newLoc.id
            locationMap.set(lowerLoc, newLoc.id)
          }

          // Determine quantity of physical copies to create
          const qtyParsed = parseInt(String(row.Quantity || '1'), 10)
          const qty = isNaN(qtyParsed) || qtyParsed < 1 ? 1 : qtyParsed

          // Determine starting copy_number for this item
          if (!maxCopyNumMap.has(itemId)) {
            const { data } = await supabase
              .from('inventory_copies')
              .select('copy_number')
              .eq('item_id', itemId)
              .order('copy_number', { ascending: false })
              .limit(1)

            const maxNum = data && data.length > 0 ? data[0]?.copy_number ?? 0 : 0
            maxCopyNumMap.set(itemId, maxNum)
          }

          const currentMax = maxCopyNumMap.get(itemId) || 0
          const conditionStr = (row.Condition || '').toString().trim().toLowerCase() || 'good'
          const statusStr = (row.Status || '').toString().trim().toLowerCase() || 'available'

          for (let q = 1; q <= qty; q++) {
            const copyNum = currentMax + q
            copiesToInsert.push({
              item_id: itemId,
              location_id: locationId,
              copy_number: copyNum,
              condition: conditionStr as any,
              status: statusStr as any,
              notes: row.Notes ? String(row.Notes).trim() : '',
              asset_tag: null,
              acquisition_date: null,
            })
          }

          maxCopyNumMap.set(itemId, currentMax + qty)
        }
      }

      // 4. Bulk insert physical copies
      if (copiesToInsert.length > 0) {
        setProgress(`Inserting ${copiesToInsert.length} physical copies...`)
        const insertedCopies = await bulkCreateCopiesMutation.mutateAsync(copiesToInsert)

        setProgress('Generating QR Codes...')
        const copyIds = insertedCopies.map((c) => c.id)
        await bulkQrMutation.mutateAsync(copyIds)
      }

      // 5. Ensure shared Item-Level QR codes exist for all created items
      setProgress('Verifying Item-Level QR Codes...')
      for (const [_, createdItemId] of itemMap.entries()) {
        const { data: existingQr } = await supabase
          .from('qr_codes')
          .select('id')
          .eq('item_id', createdItemId)
          .is('deleted_at', null)
          .maybeSingle()

        if (!existingQr) {
          const itemQrUid = `INV-ITEM-${createdItemId.slice(0, 8).toUpperCase()}`
          await supabase.from('qr_codes').insert({
            qr_uid: itemQrUid,
            item_id: createdItemId,
            copy_id: null,
            png_storage_path: `qrcodes/item_${createdItemId}.png`,
            svg_storage_path: `qrcodes/item_${createdItemId}.svg`,
            checksum: 'item-qr',
            is_active: true,
          })
        }
      }

      toast.success(
        `Successfully imported! (${itemsCreatedCount} items created, ${copiesToInsert.length} copies added with QR codes)`,
      )

      setFile(null)
      setParsedRows([])
      onClose()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Unified import failed')
    } finally {
      setLoading(false)
      setProgress('')
    }
  }

  function handleClose() {
    if (loading) return
    setFile(null)
    setParsedRows([])
    onClose()
  }

  return (
    <Modal open={open} onClose={handleClose} title="Single-Sheet Unified Bulk Import">
      <div className="p-4 space-y-4">
        {!file ? (
          <>
            <div className="flex justify-between items-center text-sm mb-2">
              <span className="text-muted-foreground">
                Upload a single XLSX/CSV spreadsheet to import items & physical copies together.
              </span>
              <button
                onClick={downloadTemplate}
                className="flex items-center gap-1 text-primary hover:underline font-medium"
              >
                <Download className="size-4" /> Single Template
              </button>
            </div>
            <div
              className="border-2 border-dashed border-border rounded-xl p-10 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="size-10 text-muted-foreground mb-4" />
              <p className="font-medium text-foreground">Click or drag unified XLSX or CSV file here</p>
              <p className="text-sm text-muted-foreground mt-1">
                Imports Catalog Items, Categories, Locations, and Physical Copies in 1 sheet
              </p>
              <input
                type="file"
                ref={fileInputRef}
                accept=".csv, .xlsx, .xls"
                onChange={(e) => void handleFileChange(e)}
                className="hidden"
              />
            </div>
          </>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 border border-border rounded-lg bg-muted/30">
              <FileCheck2 className="size-6 text-primary" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{file.name}</p>
                <p className="text-xs text-muted-foreground">{parsedRows.length} rows found in spreadsheet</p>
              </div>
              <button
                onClick={() => setFile(null)}
                disabled={loading}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="bg-primary/10 border border-primary/30 rounded-xl p-4 flex gap-3 text-sm text-primary">
              <Layers className="size-5 shrink-0 mt-0.5" />
              <p>
                <strong>Smart Single-Sheet Import:</strong> Any new <strong>Items</strong>,{' '}
                <strong>Categories</strong>, or <strong>Locations</strong> in your XLSX file will be auto-created.
                Physical copy quantities and QR codes will be generated automatically!
              </p>
            </div>
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground py-4">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-r-transparent" />
            {progress}
          </div>
        )}
      </div>

      <div className="border-t border-border p-4 flex justify-end gap-2">
        <button
          onClick={handleClose}
          disabled={loading}
          className="rounded-md px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          onClick={() => void handleImport()}
          disabled={!file || parsedRows.length === 0 || loading}
          className="flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
        >
          <Play className="size-4" />
          {loading ? 'Importing...' : 'Start Unified Import'}
        </button>
      </div>
    </Modal>
  )
}
