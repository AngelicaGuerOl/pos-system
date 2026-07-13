import { useCallback, useEffect, useState } from 'react'
import { normalizeApiError, type NormalizedApiError } from '../../../../../shared/api/apiError'
import { cashMovementDependencies } from '../../dependencies'
import type {
  CashMovement,
  CashMovementFilters,
  CurrentCashSummary,
} from '../../domain/entities/CashMovement'

const INITIAL_FILTERS: Required<Pick<CashMovementFilters, 'page' | 'size' | 'sort'>> = {
  page: 0,
  size: 10,
  sort: 'createdAt,desc',
}

export const useCashMovements = () => {
  const [movements, setMovements] = useState<CashMovement[]>([])
  const [summary, setSummary] = useState<CurrentCashSummary | null>(null)
  const [filters, setFilters] = useState<CashMovementFilters>(INITIAL_FILTERS)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<NormalizedApiError | null>(null)
  const [totalElements, setTotalElements] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [page, setPage] = useState(INITIAL_FILTERS.page)
  const [size, setSize] = useState(INITIAL_FILTERS.size)

  const fetchCashMovements = useCallback(async (nextFilters: CashMovementFilters = filters) => {
    setLoading(true)
    setError(null)

    try {
      const [movementsPage, currentSummary] = await Promise.all([
        cashMovementDependencies.getCurrentCashMovementsUseCase.execute(nextFilters),
        cashMovementDependencies.getCurrentCashSummaryUseCase.execute(),
      ])

      setMovements(movementsPage.content)
      setPage(movementsPage.page)
      setSize(movementsPage.size)
      setTotalElements(movementsPage.totalElements)
      setTotalPages(movementsPage.totalPages)
      setSummary(currentSummary)
    } catch (unknownError) {
      setError(normalizeApiError(unknownError))
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    void fetchCashMovements(filters)
  }, [fetchCashMovements, filters])

  const setPageFilter = useCallback((nextPage: number) => {
    setFilters((currentFilters) => ({
      ...currentFilters,
      page: nextPage,
    }))
  }, [])

  const setSizeFilter = useCallback((nextSize: number) => {
    setFilters((currentFilters) => ({
      ...currentFilters,
      page: 0,
      size: nextSize,
    }))
  }, [])

  return {
    error,
    filters,
    loading,
    movements,
    page,
    refetch: fetchCashMovements,
    setPage: setPageFilter,
    setSize: setSizeFilter,
    size,
    summary,
    totalElements,
    totalPages,
  }
}
