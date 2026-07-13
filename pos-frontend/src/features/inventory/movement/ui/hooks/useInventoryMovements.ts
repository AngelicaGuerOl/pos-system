import { useCallback, useEffect, useMemo, useState } from 'react'
import { normalizeApiError, type NormalizedApiError } from '../../../../../shared/api/apiError'
import { inventoryMovementDependencies } from '../../dependencies'
import type {
  InventoryMovement,
  InventoryMovementFilters,
} from '../../domain/entities/InventoryMovement'

const INITIAL_FILTERS: InventoryMovementFilters = {
  page: 0,
  size: 10,
  sort: 'createdAt,DESC',
}

const SEARCH_DEBOUNCE_MS = 300

export const useInventoryMovements = () => {
  const [movements, setMovements] = useState<InventoryMovement[]>([])
  const [filters, setFilters] = useState<InventoryMovementFilters>(INITIAL_FILTERS)
  const [debouncedSearch, setDebouncedSearch] = useState<string | undefined>(undefined)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<NormalizedApiError | null>(null)
  const [totalElements, setTotalElements] = useState(0)
  const [totalPages, setTotalPages] = useState(0)

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedSearch(filters.search?.trim() || undefined)
    }, SEARCH_DEBOUNCE_MS)

    return () => window.clearTimeout(timeout)
  }, [filters.search])

  const requestFilters = useMemo<InventoryMovementFilters>(
    () => ({
      ...filters,
      search: debouncedSearch,
    }),
    [debouncedSearch, filters],
  )

  const fetchInventoryMovements = useCallback(
    async (nextFilters: InventoryMovementFilters = requestFilters) => {
      if (nextFilters.from && nextFilters.to && nextFilters.from > nextFilters.to) {
        setError({ message: 'La fecha inicial no debe ser posterior a la fecha final' })
        return
      }

      setLoading(true)
      setError(null)

      try {
        const data = await inventoryMovementDependencies.getInventoryMovementsUseCase.execute(nextFilters)
        setMovements(data.content)
        setTotalElements(data.totalElements)
        setTotalPages(data.totalPages)
      } catch (unknownError) {
        setError(normalizeApiError(unknownError))
      } finally {
        setLoading(false)
      }
    },
    [requestFilters],
  )

  useEffect(() => {
    void fetchInventoryMovements(requestFilters)
  }, [fetchInventoryMovements, requestFilters])

  const updateFilters = useCallback((nextFilters: Partial<InventoryMovementFilters>) => {
    setFilters((currentFilters) => ({
      ...currentFilters,
      ...nextFilters,
      page: 0,
    }))
  }, [])

  const clearFilters = useCallback(() => {
    setFilters(INITIAL_FILTERS)
    setDebouncedSearch(undefined)
  }, [])

  const setPage = useCallback((nextPage: number) => {
    setFilters((currentFilters) => ({
      ...currentFilters,
      page: nextPage,
    }))
  }, [])

  const setSize = useCallback((nextSize: number) => {
    setFilters((currentFilters) => ({
      ...currentFilters,
      page: 0,
      size: nextSize,
    }))
  }, [])

  return {
    clearFilters,
    error,
    filters,
    loading,
    movements,
    page: filters.page,
    refetch: fetchInventoryMovements,
    setFilters: updateFilters,
    setPage,
    setSize,
    size: filters.size,
    totalElements,
    totalPages,
  }
}
