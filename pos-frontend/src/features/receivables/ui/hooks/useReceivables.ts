import { useCallback, useEffect, useMemo, useState } from 'react'
import { normalizeApiError, type NormalizedApiError } from '../../../../shared/api/apiError'
import { receivableDependencies } from '../../dependencies'
import type { Receivable, ReceivableFilters } from '../../domain/entities/Receivable'

const INITIAL_FILTERS: ReceivableFilters = {
  page: 0,
  size: 10,
  sort: 'createdAt,DESC',
}

const cleanFilters = (filters: ReceivableFilters): ReceivableFilters => ({
  ...filters,
  customerId: filters.customerId || undefined,
  saleId: filters.saleId || undefined,
  status: filters.status || undefined,
  from: filters.from || undefined,
  to: filters.to || undefined,
})

export const useReceivables = () => {
  const [receivables, setReceivables] = useState<Receivable[]>([])
  const [filters, setFilters] = useState<ReceivableFilters>(INITIAL_FILTERS)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<NormalizedApiError | null>(null)
  const [totalElements, setTotalElements] = useState(0)
  const [totalPages, setTotalPages] = useState(0)

  const requestFilters = useMemo(() => cleanFilters(filters), [filters])

  const fetchReceivables = useCallback(async (nextFilters: ReceivableFilters = requestFilters) => {
    if (nextFilters.from && nextFilters.to && nextFilters.from > nextFilters.to) {
      setError({ message: 'La fecha inicial no debe ser posterior a la fecha final' })
      return
    }

    setLoading(true)
    setError(null)

    try {
      const page = await receivableDependencies.getReceivablesUseCase.execute(nextFilters)
      setReceivables(page.content)
      setTotalElements(page.totalElements)
      setTotalPages(page.totalPages)
    } catch (unknownError) {
      setError(normalizeApiError(unknownError))
    } finally {
      setLoading(false)
    }
  }, [requestFilters])

  useEffect(() => {
    void fetchReceivables(requestFilters)
  }, [fetchReceivables, requestFilters])

  const updateFilters = useCallback((nextFilters: Partial<ReceivableFilters>) => {
    setFilters((currentFilters) => ({
      ...currentFilters,
      ...nextFilters,
      page: 0,
    }))
  }, [])

  const clearFilters = useCallback(() => {
    setFilters(INITIAL_FILTERS)
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
    page: filters.page,
    receivables,
    refetch: fetchReceivables,
    setFilters: updateFilters,
    setPage,
    setSize,
    size: filters.size,
    totalElements,
    totalPages,
  }
}
