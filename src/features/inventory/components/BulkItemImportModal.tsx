import { useState, useRef } from 'react'
import Papa from 'papaparse'
import { Upload, X, FileCheck2, AlertTriangle, Play, Download } from 'lucide-react'
import { toast } from 'sonner'
import { Modal } from '@/components/ui/Modal'
import { useCategories, useBulkCreateItems } from '../hooks/inventory.queries'
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
  const bulkCreateMutation = useBulkCreateItems()

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0]
    if (!selected) return
    if (!selected.name.endsWith('.csv')) {
      toast.error('Please upload a .csv file')
      return
    }
    setFile(selected)
    
    Papa.parse<ParsedItemRow>(selected, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setParsedRows(results.data)
      },
      error: (error) => {
        toast.error(`Error parsing CSV: ${error.message}`)
      }
    })
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
      
      for (const row of parsedRows) {
        if (!row['Name']) {
          throw new Error('All rows must have a Name.')
        }

        let categoryId: string | null = null
        if (row['Category Name']) {
          const cat = categories.find(c => c.name.toLowerCase() === row['Category Name']?.toLowerCase())
          if (!cat) {
            throw new Error(`Category not found: "${row['Category Name']}". Please create it first.`)
          }
          categoryId = cat.id
        }

        itemsToInsert.push({
          name: row['Name'],
          description: row['Description'] || '',
          category_id: categoryId,
          manufacturer: row['Manufacturer'] || '',
          brand: row['Brand'] || '',
          model: row['Model'] || '',
          sku: row['SKU'] || '',
          unit_value: row['Unit Value'] ? parseFloat(row['Unit Value']) : 0,
          metadata: {}
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
              <span className="text-muted-foreground">Upload a CSV to quickly add catalog items.</span>
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
              <p className="font-medium">Click or drag CSV file here</p>
              <p className="text-sm text-muted-foreground mt-1">Headers must match exactly</p>
              <input 
                type="file" 
                ref={fileInputRef}
                accept=".csv"
                onChange={handleFileChange}
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

            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 flex gap-3 text-sm text-amber-600">
              <AlertTriangle className="size-5 shrink-0" />
              <p>
                Please ensure all Categories mentioned in your CSV already exist in the system. 
                Missing categories will cause the import to fail.
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
