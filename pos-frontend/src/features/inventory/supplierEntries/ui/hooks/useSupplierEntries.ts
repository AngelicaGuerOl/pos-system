import { useCallback, useEffect, useState } from 'react'
import { normalizeApiError, type NormalizedApiError } from '../../../../../shared/api/apiError'
import type { PageResponse } from '../../../../../shared/types/PageResponse'
import { supplierEntryDependencies } from '../../dependencies'
import type { SupplierEntry, SupplierEntryFilters } from '../../domain/entities/SupplierEntry'

export const useSupplierEntries = (initialFilters: SupplierEntryFilters = {}) => {
  const [pageData, setPageData] = useState<PageResponse<SupplierEntry> | null>(null)
  const [filters, setFilters] = useState<SupplierEntryFilters>({ page: 0, size: 10, ...initialFilters })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<NormalizedApiError | null>(null)

  const fetchEntries = useCallback(async (nextFilters: SupplierEntryFilters = filters) => {
    setLoading(true)
    setError(null)
    try {
      setPageData(await supplierEntryDependencies.getSupplierEntriesUseCase.execute(nextFilters))
    } catch (unknownError) {
      setError(normalizeApiError(unknownError))
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    void fetchEntries(filters)
  }, [fetchEntries, filters])

  return {
    entries: pageData?.content ?? [],
    error,
    filters,
    loading,
    page: pageData?.page ?? filters.page ?? 0,
    refetch: fetchEntries,
    setFilters,
    setPage: (page: number) => setFilters((current) => ({ ...current, page })),
    setSize: (size: number) => setFilters((current) => ({ ...current, page: 0, size })),
    size: pageData?.size ?? filters.size ?? 10,
    totalElements: pageData?.totalElements ?? 0,
  }
}
