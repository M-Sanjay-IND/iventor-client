import { describe, it, expect } from 'vitest'
import { itemFormSchema, copyFormSchema } from './schemas'

describe('Inventory Validation Schemas', () => {
  it('validates a valid inventory item form', () => {
    const validItem = {
      name: 'Sony WH-1000XM5',
      description: 'Noise Cancelling Headphones',
      category_id: '123e4567-e89b-12d3-a456-426614174000',
      manufacturer: 'Sony',
      brand: 'Sony',
      model: 'WH-1000XM5',
      sku: 'SONY-WH1000XM5',
      unit_value: 349.99,
    }

    const result = itemFormSchema.safeParse(validItem)
    expect(result.success).toBe(true)
  })

  it('rejects an empty item name', () => {
    const invalidItem = {
      name: '',
      description: 'Test',
    }

    const result = itemFormSchema.safeParse(invalidItem)
    expect(result.success).toBe(false)
  })

  it('validates a physical copy with default condition and status', () => {
    const validCopy = {
      item_id: 'item-uuid-1234',
      copy_number: 1,
      condition: 'new',
      status: 'available',
    }

    const result = copyFormSchema.safeParse(validCopy)
    expect(result.success).toBe(true)
  })
})
