import { useState, useRef } from 'react'
import Papa from 'papaparse'
import { Upload, X, FileCheck2, AlertTriangle, Play, Download } from 'lucide-react'
import { toast } from 'sonner'
import { Modal } from '@/components/ui/Modal'
import { useItems, useLocations, useBulkCreateCopies } from '../hooks/inventory.queries'
import { useBulkGenerateQr } from '@/features/qr/hooks/qr.queries'
import type { CopyFormData } from '../services/inventory.service'

interface BulkImportModalProps {
  open: boolean
  onClose: () => void
}

interface ParsedRow {
  'Item Name': string
  'Location Name': string
  'Condition'?: string
  'Notes'?: string
}

export function BulkImportModal({ open, onClose }: BulkImportModalProps) {
  const [file, setFile] = useState<File | null>(null)
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([])
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Fetch all items and locations for mapping
  // Using pageSize: 1000 to ensure we grab enough for matching without full pagination logic for this tool
  const { data: itemsData } = useItems({ pageSize: 1000 })
  const { data: locations } = useLocations()
  
  const bulkCreateMutation = useBulkCreateCopies()
  const bulkQrMutation = useBulkGenerateQr()

  const items = itemsData?.data || []
  const locationsList = locations || []

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0]
    if (!selected) return
    if (!selected.name.endsWith('.csv')) {
      toast.error('Please upload a .csv file')
      return
    }
    setFile(selected)
    
    Papa.parse<ParsedRow>(selected, {
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
    const headers = ['Item Name', 'Location Name', 'Condition', 'Notes']
    const csvContent = headers.join(',') + '\n'
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', 'inventory_copies_template.csv')
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
      const copiesToInsert: CopyFormData[] = []

      // To handle copy numbers, we need to track max copy number per item.
      // We will initialize this by finding the highest copy_number in the currently fetched items?
      // Wait, we don't have copies locally fetched for ALL items. 
      // Actually, we can fetch all copies or just trust the database if we had a single SQL function.
      // Since we don't have a bulk insert with auto-incrementing copy_number in SQL, 
      // we'll just fetch the max copy number for each matched item on the fly.
      
      const maxCopyNumMap = new Map<string, number>()
      
      for (const row of parsedRows) {
        if (!row['Item Name'] || !row['Location Name']) {
          throw new Error('All rows must have an Item Name and Location Name.')
        }

        const item = items.find(i => i.name.toLowerCase() === row['Item Name'].toLowerCase())
        if (!item) {
          throw new Error(`Item not found: "${row['Item Name']}". Please create it first.`)
        }

        const location = locationsList.find(l => l.name.toLowerCase() === row['Location Name'].toLowerCase())
        if (!location) {
          throw new Error(`Location not found: "${row['Location Name']}". Please create it first.`)
        }

        // Fetch max copy number if not already tracked
        if (!maxCopyNumMap.has(item.id)) {
          const { supabase } = await import('@/services/supabase')
          const { data } = await supabase
            .from('inventory_copies')
            .select('copy_number')
            .eq('item_id', item.id)
            .order('copy_number', { ascending: false })
            .limit(1)
          
          const maxNum = (data && data.length > 0) ? data[0]?.copy_number ?? 0 : 0
          maxCopyNumMap.set(item.id, maxNum)
        }

        const currentMax = maxCopyNumMap.get(item.id) || 0
        const newCopyNum = currentMax + 1
        maxCopyNumMap.set(item.id, newCopyNum)

        copiesToInsert.push({
          item_id: item.id,
          location_id: location.id,
          copy_number: newCopyNum,
          condition: (row['Condition']?.toLowerCase() || 'good') as any,
          notes: row['Notes'] || '',
          status: 'available' as any,
          asset_tag: null,
          acquisition_date: null
        })
      }

      setProgress('Inserting copies into database...')
      const insertedCopies = await bulkCreateMutation.mutateAsync(copiesToInsert)

      setProgress('Generating QR Codes...')
      const copyIds = insertedCopies.map(c => c.id)
      await bulkQrMutation.mutateAsync(copyIds)

      toast.success(`Successfully imported ${insertedCopies.length} copies and generated their QR codes.`)
      
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
    <Modal open={open} onClose={handleClose} title="Bulk Import Copies">
      <div className="p-4 space-y-4">
        {!file ? (
          <>
            <div className="flex justify-between items-center text-sm mb-2">
              <span className="text-muted-foreground">Upload a CSV to quickly add physical copies.</span>
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
                Please ensure all Items and Locations mentioned in your CSV already exist in the system. 
                Missing entries will cause the import to fail.
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
