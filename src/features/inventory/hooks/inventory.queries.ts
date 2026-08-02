import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getItems,
  getItemById,
  createItem,
  updateItem,
  softDeleteItem,
  getCategories,
  createCategory,
  updateCategory,
  softDeleteCategory,
  getLocations,
  createLocation,
  updateLocation,
  softDeleteLocation,
  getCopies,
  getNextCopyNumber,
  createCopy,
  bulkCreateCopies,
  updateCopy,
  softDeleteCopy,
} from '../services/inventory.service'
import type { ItemFormData, CategoryFormData, LocationFormData, CopyFormData } from '../services/inventory.service'
import type { SortParams } from '@/types'

// ============================================================================
// Query Keys
// ============================================================================

export const inventoryKeys = {
  all: ['inventory'] as const,
  items: () => [...inventoryKeys.all, 'items'] as const,
  itemList: (params: Record<string, unknown>) => [...inventoryKeys.items(), 'list', params] as const,
  itemDetail: (id: string) => [...inventoryKeys.items(), 'detail', id] as const,
  categories: () => [...inventoryKeys.all, 'categories'] as const,
  locations: () => [...inventoryKeys.all, 'locations'] as const,
  copies: (itemId: string) => [...inventoryKeys.all, 'copies', itemId] as const,
  nextCopyNumber: (itemId: string) => [...inventoryKeys.all, 'nextCopyNumber', itemId] as const,
} as const

// ============================================================================
// Items
// ============================================================================

interface UseItemsParams {
  page?: number
  pageSize?: number
  sort?: SortParams
  search?: string
  categoryId?: string
}

export function useItems(params: UseItemsParams = {}) {
  const { page = 1, pageSize = 25, sort, search, categoryId } = params

  return useQuery({
    queryKey: inventoryKeys.itemList({ page, pageSize, sort, search, categoryId }),
    queryFn: () =>
      getItems({
        pagination: { page, pageSize },
        sort,
        search: search || undefined,
        categoryId: categoryId || undefined,
      }),
    placeholderData: (prev) => prev,
  })
}

export function useItem(id: string) {
  return useQuery({
    queryKey: inventoryKeys.itemDetail(id),
    queryFn: () => getItemById(id),
    enabled: Boolean(id),
  })
}

export function useCreateItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: ItemFormData) => createItem(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: inventoryKeys.items() })
    },
  })
}

export function useUpdateItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ItemFormData> }) =>
      updateItem(id, data),
    onSuccess: (_result, variables) => {
      void queryClient.invalidateQueries({ queryKey: inventoryKeys.items() })
      void queryClient.invalidateQueries({ queryKey: inventoryKeys.itemDetail(variables.id) })
    },
  })
}

export function useDeleteItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => softDeleteItem(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: inventoryKeys.items() })
    },
  })
}

// ============================================================================
// Categories
// ============================================================================

export function useCategories() {
  return useQuery({
    queryKey: inventoryKeys.categories(),
    queryFn: getCategories,
    staleTime: 5 * 60 * 1000,
  })
}

export function useCreateCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CategoryFormData) => createCategory(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: inventoryKeys.categories() })
    },
  })
}

export function useUpdateCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CategoryFormData> }) =>
      updateCategory(id, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: inventoryKeys.categories() })
    },
  })
}

export function useDeleteCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => softDeleteCategory(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: inventoryKeys.categories() })
    },
  })
}

// ============================================================================
// Locations
// ============================================================================

export function useLocations() {
  return useQuery({
    queryKey: inventoryKeys.locations(),
    queryFn: getLocations,
    staleTime: 5 * 60 * 1000,
  })
}

export function useCreateLocation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: LocationFormData) => createLocation(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: inventoryKeys.locations() })
    },
  })
}

export function useUpdateLocation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<LocationFormData> }) =>
      updateLocation(id, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: inventoryKeys.locations() })
    },
  })
}

export function useDeleteLocation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => softDeleteLocation(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: inventoryKeys.locations() })
    },
  })
}

// ============================================================================
// Copies
// ============================================================================

export function useCopies(itemId: string) {
  return useQuery({
    queryKey: inventoryKeys.copies(itemId),
    queryFn: () => getCopies(itemId),
    enabled: Boolean(itemId),
  })
}

export function useNextCopyNumber(itemId: string) {
  return useQuery({
    queryKey: inventoryKeys.nextCopyNumber(itemId),
    queryFn: () => getNextCopyNumber(itemId),
    enabled: Boolean(itemId),
  })
}

export function useCreateCopy() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CopyFormData) => createCopy(data),
    onSuccess: (_result, variables) => {
      void queryClient.invalidateQueries({ queryKey: inventoryKeys.copies(variables.item_id) })
      void queryClient.invalidateQueries({ queryKey: inventoryKeys.nextCopyNumber(variables.item_id) })
      void queryClient.invalidateQueries({ queryKey: inventoryKeys.items() })
    },
  })
}

export function useUpdateCopy(itemId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CopyFormData> }) =>
      updateCopy(id, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: inventoryKeys.copies(itemId) })
    },
  })
}

export function useDeleteCopy(itemId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => softDeleteCopy(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: inventoryKeys.copies(itemId) })
      void queryClient.invalidateQueries({ queryKey: inventoryKeys.items() })
    },
  })
}

export function useBulkCreateCopies() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (copies: CopyFormData[]) => bulkCreateCopies(copies),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: inventoryKeys.all })
    },
  })
}
