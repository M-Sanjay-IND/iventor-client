import { useState, useRef } from 'react'
import Papa from 'papaparse'
import * as XLSX from 'xlsx'
import { Upload, X, FileCheck2, Play, Download } from 'lucide-react'
import { toast } from 'sonner'
import { Modal } from '@/components/ui/Modal'
import { useCategories, useCreateCategory, useBulkCreateItems } from '../hooks/inventory.queries'
import type { ItemFormData } from '../services/inventory.service'

interface BulkItemImportModalProps {
  open: boolean
  onClose: () => void
}

interface ParsedItemRow {
  'Name': string
  'Description'?: string
  'Category Name'?: string
  'Manufacturer'?: string
  'Brand'?: string
  'Model'?: string
  'SKU'?: string
  'Unit Value'?: string
}

export function BulkItemImportModal({ open, onClose }: BulkItemImportModalProps) {
  const [file, setFile] = useState<File | null>(null)
  const [parsedRows, setParsedRows] = useState<ParsedItemRow[]>([])
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { data: categories = [] } = useCategories()
  const createCategoryMutation = useCreateCategory()
  const bulkCreateMutation = useBulkCreateItems()

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
        const rows = XLSX.utils.sheet_to_json<ParsedItemRow>(worksheet, { defval: '' })
        setParsedRows(rows)
      } else {
        Papa.parse<ParsedItemRow>(selected, {
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
    const headers = ['Name', 'Description', 'Category Name', 'Manufacturer', 'Brand', 'Model', 'SKU', 'Unit Value']
    const csvContent = headers.join(',') + '\n'
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', 'inventory_items_template.csv')
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  async function handleImport() {
    if (parsedRows.length === 0) return

    setLoading(true)
    setProgress('Mapping rows to database...')

    try {
      const itemsToInsert: ItemFormData[] = []
      
      const categoryMap = new Map<string, string>()
      categories.forEach((c) => categoryMap.set(c.name.toLowerCase(), c.id))

      for (const row of parsedRows) {
        if (!row['Name']) {
          throw new Error('All rows must have a Name.')
        }

        let categoryId: string | null = null
        if (row['Category Name']?.trim()) {
          const rawName = String(row['Category Name']).trim()
          const csvCatName = rawName.toLowerCase()
          
          if (categoryMap.has(csvCatName)) {
            categoryId = categoryMap.get(csvCatName)!
          } else {
            setProgress(`Creating new category: ${rawName}...`)
            const newCat = await createCategoryMutation.mutateAsync({ 
              name: rawName, 
              description: 'Auto-created during bulk import',
              parent_id: null,
            })
            categoryId = newCat.id
            categoryMap.set(csvCatName, newCat.id)
          }
        }

        itemsToInsert.push({
          name: String(row['Name']).trim(),
          description: row['Description'] ? String(row['Description']) : '',
          category_id: categoryId,
          manufacturer: row['Manufacturer'] ? String(row['Manufacturer']) : '',
          brand: row['Brand'] ? String(row['Brand']) : '',
          model: row['Model'] ? String(row['Model']) : '',
          sku: row['SKU'] ? String(row['SKU']) : '',
          unit_value: row['Unit Value'] ? parseFloat(String(row['Unit Value'])) : 0,
          metadata: {},
        })
      }

      setProgress('Inserting items into database...')
      const insertedItems = await bulkCreateMutation.mutateAsync(itemsToInsert)

      toast.success(`Successfully imported ${insertedItems.length} items.`)
      
      // Reset state
      setFile(null)
      setParsedRows([])
      onClose()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Import failed')
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
    <Modal open={open} onClose={handleClose} title="Bulk Import Items">
      <div className="p-4 space-y-4">
        {!file ? (
          <>
            <div className="flex justify-between items-center text-sm mb-2">
              <span className="text-muted-foreground">Upload a CSV or XLSX file to quickly add catalog items.</span>
              <button 
                onClick={downloadTemplate}
                className="flex items-center gap-1 text-primary hover:underline font-medium"
              >
                <Download className="size-4" /> Template
              </button>
            </div>
            <div 
              className="border-2 border-dashed border-border rounded-lg p-10 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="size-10 text-muted-foreground mb-4" />
              <p className="font-medium">Click or drag CSV or XLSX file here</p>
              <p className="text-sm text-muted-foreground mt-1">Supports .csv, .xlsx, .xls</p>
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
                <p className="text-xs text-muted-foreground">{parsedRows.length} valid rows found</p>
              </div>
              <button 
                onClick={() => setFile(null)}
                disabled={loading}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 flex gap-3 text-sm text-blue-600">
              <FileCheck2 className="size-5 shrink-0" />
              <p>
                Any new categories found in the spreadsheet will be automatically created for you.
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
          {loading ? 'Importing...' : 'Start Import'}
        </button>
      </div>
    </Modal>
  )
}
