import { useCallback, useEffect, useState } from 'react'
import { normalizeApiError, type NormalizedApiError } from '../../../../../shared/api/apiError'
import type { PageResponse } from '../../../../../shared/types/PageResponse'
import { supplierSettlementDependencies } from '../../dependencies'
import type { SupplierSettlement, SupplierSettlementFilters } from '../../domain/entities/SupplierSettlement'

export const useSupplierSettlements = (initialFilters: SupplierSettlementFilters = {}) => {
  const [pageData, setPageData] = useState<PageResponse<SupplierSettlement> | null>(null)
  const [filters, setFilters] = useState<SupplierSettlementFilters>({ page: 0, size: 10, ...initialFilters })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<NormalizedApiError | null>(null)

  const refetch = useCallback(async (nextFilters: SupplierSettlementFilters = filters) => {
    setLoading(true)
    setError(null)
    try {
      setPageData(await supplierSettlementDependencies.getSupplierSettlementsUseCase.execute(nextFilters))
    } catch (unknownError) {
      setError(normalizeApiError(unknownError))
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => { void refetch(filters) }, [filters, refetch])

  return {
    error,
    filters,
    loading,
    page: pageData?.page ?? filters.page ?? 0,
    refetch,
    setFilters,
    setPage: (page: number) => setFilters((current) => ({ ...current, page })),
    setSize: (size: number) => setFilters((current) => ({ ...current, page: 0, size })),
    settlements: pageData?.content ?? [],
    size: pageData?.size ?? filters.size ?? 10,
    totalElements: pageData?.totalElements ?? 0,
  }
}
