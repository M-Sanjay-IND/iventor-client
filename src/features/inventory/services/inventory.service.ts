import { supabase } from '@/services/supabase'
import { DEFAULT_PAGE_SIZE } from '@/constants'
import type {
  Category,
  Location,
  InventoryItem,
  InventoryItemWithCategory,
  InventoryCopy,
} from '../types'
import type { PaginationParams, SortParams } from '@/types'

// ============================================================================
// Items
// ============================================================================

interface GetItemsParams {
  pagination?: PaginationParams
  sort?: SortParams
  search?: string
  categoryId?: string
}

interface GetItemsResult {
  data: InventoryItemWithCategory[]
  total: number
}

export async function getItems(params: GetItemsParams = {}): Promise<GetItemsResult> {
  const {
    pagination = { page: 1, pageSize: DEFAULT_PAGE_SIZE },
    sort = { column: 'created_at', direction: 'desc' },
    search,
    categoryId,
  } = params

  const from = (pagination.page - 1) * pagination.pageSize
  const to = from + pagination.pageSize - 1

  let query = supabase
    .from('inventory_items')
    .select('*, category:categories(*)', { count: 'exact' })
    .is('deleted_at', null)
    .range(from, to)
    .order(sort.column, { ascending: sort.direction === 'asc' })

  if (search) {
    query = query.ilike('name', `%${search}%`)
  }

  if (categoryId) {
    query = query.eq('category_id', categoryId)
  }

  const { data, count, error } = await query

  if (error) throw new InventoryServiceError(error.message, 'ITEMS_FETCH_FAILED')

  return {
    data: (data ?? []) as unknown as InventoryItemWithCategory[],
    total: count ?? 0,
  }
}

export async function getItemById(id: string): Promise<InventoryItemWithCategory | null> {
  const { data, error } = await supabase
    .from('inventory_items')
    .select('*, category:categories(*)')
    .eq('id', id)
    .is('deleted_at', null)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw new InventoryServiceError(error.message, 'ITEM_FETCH_FAILED')
  }

  return data as unknown as InventoryItemWithCategory
}

export type ItemFormData = Omit<InventoryItem, 'id' | 'created_at' | 'updated_at' | 'deleted_at' | 'created_by' | 'updated_by'>

export async function createItem(formData: ItemFormData): Promise<InventoryItem> {
  const { data, error } = await supabase
    .from('inventory_items')
    .insert(formData)
    .select()
    .single()

  if (error) throw new InventoryServiceError(error.message, 'ITEM_CREATE_FAILED')
  return data as InventoryItem
}

export async function updateItem(id: string, formData: Partial<ItemFormData>): Promise<InventoryItem> {
  const { data, error } = await supabase
    .from('inventory_items')
    .update(formData)
    .eq('id', id)
    .select()
    .single()

  if (error) throw new InventoryServiceError(error.message, 'ITEM_UPDATE_FAILED')
  return data as InventoryItem
}

export async function softDeleteItem(id: string): Promise<void> {
  const { error } = await supabase
    .from('inventory_items')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)

  if (error) throw new InventoryServiceError(error.message, 'ITEM_DELETE_FAILED')
}

// ============================================================================
// Categories
// ============================================================================

export async function getCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .is('deleted_at', null)
    .order('name')

  if (error) throw new InventoryServiceError(error.message, 'CATEGORIES_FETCH_FAILED')
  return (data ?? []) as Category[]
}

export type CategoryFormData = Pick<Category, 'name' | 'description' | 'parent_id'>

export async function createCategory(formData: CategoryFormData): Promise<Category> {
  const { data, error } = await supabase
    .from('categories')
    .insert(formData)
    .select()
    .single()

  if (error) throw new InventoryServiceError(error.message, 'CATEGORY_CREATE_FAILED')
  return data as Category
}

export async function updateCategory(id: string, formData: Partial<CategoryFormData>): Promise<Category> {
  const { data, error } = await supabase
    .from('categories')
    .update(formData)
    .eq('id', id)
    .select()
    .single()

  if (error) throw new InventoryServiceError(error.message, 'CATEGORY_UPDATE_FAILED')
  return data as Category
}

export async function softDeleteCategory(id: string): Promise<void> {
  const { error } = await supabase
    .from('categories')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)

  if (error) throw new InventoryServiceError(error.message, 'CATEGORY_DELETE_FAILED')
}

// ============================================================================
// Locations
// ============================================================================

export async function getLocations(): Promise<Location[]> {
  const { data, error } = await supabase
    .from('locations')
    .select('*')
    .is('deleted_at', null)
    .order('name')

  if (error) throw new InventoryServiceError(error.message, 'LOCATIONS_FETCH_FAILED')
  return (data ?? []) as Location[]
}

export type LocationFormData = Pick<Location, 'name' | 'description' | 'parent_id'>

export async function createLocation(formData: LocationFormData): Promise<Location> {
  const { data, error } = await supabase
    .from('locations')
    .insert(formData)
    .select()

  if (error) throw new InventoryServiceError(error.message, 'LOCATION_CREATE_FAILED')
  return (data as Location[])[0] as Location
}

export async function updateLocation(id: string, formData: Partial<LocationFormData>): Promise<Location> {
  const { data, error } = await supabase
    .from('locations')
    .update(formData)
    .eq('id', id)
    .select()
    .single()

  if (error) throw new InventoryServiceError(error.message, 'LOCATION_UPDATE_FAILED')
  return data as Location
}

export async function softDeleteLocation(id: string): Promise<void> {
  const { error } = await supabase
    .from('locations')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)

  if (error) throw new InventoryServiceError(error.message, 'LOCATION_DELETE_FAILED')
}

// ============================================================================
// Copies
// ============================================================================

export async function getCopies(itemId: string): Promise<InventoryCopy[]> {
  const { data, error } = await supabase
    .from('inventory_copies')
    .select('*')
    .eq('item_id', itemId)
    .is('deleted_at', null)
    .order('copy_number')

  if (error) throw new InventoryServiceError(error.message, 'COPIES_FETCH_FAILED')
  return (data ?? []) as InventoryCopy[]
}

export async function getNextCopyNumber(itemId: string): Promise<number> {
  const { data, error } = await supabase
    .from('inventory_copies')
    .select('copy_number')
    .eq('item_id', itemId)
    .order('copy_number', { ascending: false })
    .limit(1)

  if (error) throw new InventoryServiceError(error.message, 'COPY_NUMBER_FETCH_FAILED')

  if (!data || data.length === 0) return 1
  return (data[0] as { copy_number: number }).copy_number + 1
}

export type CopyFormData = Omit<InventoryCopy, 'id' | 'created_at' | 'updated_at' | 'deleted_at' | 'created_by' | 'updated_by'>

export async function createCopy(formData: CopyFormData): Promise<InventoryCopy> {
  const { data, error } = await supabase
    .from('inventory_copies')
    .insert(formData)
    .select()
    .single()

  if (error) throw new InventoryServiceError(error.message, 'COPY_CREATE_FAILED')
  return data as InventoryCopy
}

export async function updateCopy(id: string, formData: Partial<CopyFormData>): Promise<InventoryCopy> {
  const { data, error } = await supabase
    .from('inventory_copies')
    .update(formData)
    .eq('id', id)
    .select()
    .single()

  if (error) throw new InventoryServiceError(error.message, 'COPY_UPDATE_FAILED')
  return data as InventoryCopy
}

export async function softDeleteCopy(id: string): Promise<void> {
  const { error } = await supabase
    .from('inventory_copies')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)

  if (error) throw new InventoryServiceError(error.message, 'COPY_DELETE_FAILED')
}

// ============================================================================
// Error Class
// ============================================================================

export class InventoryServiceError extends Error {
  readonly code: string

  constructor(message: string, code: string) {
    super(message)
    this.name = 'InventoryServiceError'
    this.code = code
  }
}
