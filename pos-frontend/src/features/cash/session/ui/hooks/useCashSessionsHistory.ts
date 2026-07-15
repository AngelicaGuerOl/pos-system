import { useCallback, useEffect, useState } from 'react'
import { normalizeApiError, type NormalizedApiError } from '../../../../../shared/api/apiError'
import { cashSessionDependencies } from '../../dependencies'
import type { CashSession, CashSessionFilters } from '../../domain/entities/CashSession'

const INITIAL_FILTERS: Required<Pick<CashSessionFilters, 'page' | 'size' | 'sort'>> = {
  page: 0,
  size: 10,
  sort: 'openedAt,DESC',
}

export const useCashSessionsHistory = () => {
  const [sessions, setSessions] = useState<CashSession[]>([])
  const [filters, setFilters] = useState<CashSessionFilters>(INITIAL_FILTERS)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<NormalizedApiError | null>(null)
  const [totalElements, setTotalElements] = useState(0)

  const fetchSessions = useCallback(async (nextFilters: CashSessionFilters = filters) => {
    setLoading(true)
    setError(null)

    try {
      const page = await cashSessionDependencies.getCashSessionsUseCase.execute(nextFilters)
      setSessions(page.content)
      setTotalElements(page.totalElements)
    } catch (unknownError) {
      setError(normalizeApiError(unknownError))
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    void fetchSessions(filters)
  }, [fetchSessions, filters])

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
    error,
    loading,
    page: filters.page ?? 0,
    refetch: fetchSessions,
    sessions,
    setPage,
    setSize,
    size: filters.size ?? INITIAL_FILTERS.size,
    totalElements,
  }
}
