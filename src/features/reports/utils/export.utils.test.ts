/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { exportToCsv, exportToXlsx } from './export.utils'

describe('Reports Export Utilities', () => {
  beforeEach(() => {
    if (typeof window !== 'undefined') {
      window.URL.createObjectURL = vi.fn().mockReturnValue('blob:mock-url')
      window.URL.revokeObjectURL = vi.fn()
    }
  })

  it('should export rows to CSV without throwing in browser/jsdom', () => {
    const mockAppendChild = vi.spyOn(document.body, 'appendChild').mockImplementation(() => null as any)
    const mockRemoveChild = vi.spyOn(document.body, 'removeChild').mockImplementation(() => null as any)

    const rows = [
      { 'Item Name': 'MacBook Pro', 'Category': 'Laptops', 'Quantity': 5 },
      { 'Item Name': 'Dell Monitor', 'Category': 'Monitors', 'Quantity': 10 },
    ]

    expect(() => exportToCsv('test_report', rows)).not.toThrow()

    mockAppendChild.mockRestore()
    mockRemoveChild.mockRestore()
  })

  it('should export sheets to XLSX without throwing', () => {
    const sheets = [
      {
        name: 'Inventory Valuation',
        data: [{ 'Item': 'Camera', 'Value': 500 }],
      },
    ]

    expect(() => exportToXlsx('test_excel', sheets)).not.toThrow()
  })

  it('should handle empty rows gracefully', () => {
    expect(() => exportToCsv('empty_report', [])).not.toThrow()
  })
})
