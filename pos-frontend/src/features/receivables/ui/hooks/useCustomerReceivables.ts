import { useCallback, useEffect, useMemo, useState } from 'react'
import { normalizeApiError, type NormalizedApiError } from '../../../../shared/api/apiError'
import { receivableDependencies } from '../../dependencies'
import type {
  CustomerReceivableFilters,
  Receivable,
  ReceivableStatus,
} from '../../domain/entities/Receivable'

const INITIAL_FILTERS: CustomerReceivableFilters = {
  page: 0,
  size: 10,
  sort: 'createdAt,DESC',
}

export const useCustomerReceivables = (customerId: number | null) => {
  const [receivables, setReceivables] = useState<Receivable[]>([])
  const [filters, setFilters] = useState<CustomerReceivableFilters>(INITIAL_FILTERS)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<NormalizedApiError | null>(null)
  const [totalElements, setTotalElements] = useState(0)

  const requestFilters = useMemo<CustomerReceivableFilters>(
    () => ({
      ...filters,
      status: filters.status || undefined,
    }),
    [filters],
  )

  const fetchReceivables = useCallback(async (
    nextFilters: CustomerReceivableFilters = requestFilters,
  ) => {
    if (!customerId) {
      setReceivables([])
      setTotalElements(0)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const page = await receivableDependencies.getCustomerReceivablesUseCase.execute(
        customerId,
        nextFilters,
      )
      setReceivables(page.content)
      setTotalElements(page.totalElements)
    } catch (unknownError) {
      setError(normalizeApiError(unknownError))
    } finally {
      setLoading(false)
    }
  }, [customerId, requestFilters])

  useEffect(() => {
    void fetchReceivables(requestFilters)
  }, [fetchReceivables, requestFilters])

  const setStatus = useCallback((status: ReceivableStatus | '') => {
    setFilters((currentFilters) => ({
      ...currentFilters,
      page: 0,
      status: status || undefined,
    }))
  }, [])

  const setPage = useCallback((page: number) => {
    setFilters((currentFilters) => ({
      ...currentFilters,
      page,
    }))
  }, [])

  const setSize = useCallback((size: number) => {
    setFilters((currentFilters) => ({
      ...currentFilters,
      page: 0,
      size,
    }))
  }, [])

  return {
    error,
    filters,
    loading,
    page: filters.page,
    receivables,
    refetch: fetchReceivables,
    setPage,
    setSize,
    setStatus,
    size: filters.size,
    totalElements,
  }
}
