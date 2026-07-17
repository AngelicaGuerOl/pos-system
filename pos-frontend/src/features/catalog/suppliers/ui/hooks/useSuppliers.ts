import { useCallback, useEffect, useState } from 'react'
import { normalizeApiError, type NormalizedApiError } from '../../../../../shared/api/apiError'
import type { PageResponse } from '../../../../../shared/types/PageResponse'
import { supplierDependencies } from '../../dependencies'
import type { Supplier, SupplierFilters } from '../../domain/entities/Supplier'

export const useSuppliers = (initialFilters: SupplierFilters = {}) => {
  const [suppliersPage, setSuppliersPage] = useState<PageResponse<Supplier> | null>(null)
  const [filters, setFilters] = useState<SupplierFilters>({ page: 0, size: 10, ...initialFilters })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<NormalizedApiError | null>(null)

  const fetchSuppliers = useCallback(async (nextFilters: SupplierFilters = filters) => {
    setLoading(true)
    setError(null)
    try {
      const data = await supplierDependencies.getSuppliersUseCase.execute(nextFilters)
      setSuppliersPage(data)
    } catch (unknownError) {
      setError(normalizeApiError(unknownError))
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    void fetchSuppliers(filters)
  }, [fetchSuppliers, filters])

  return {
    error,
    filters,
    loading,
    page: suppliersPage?.page ?? filters.page ?? 0,
    refetch: fetchSuppliers,
    setFilters,
    setPage: (page: number) => setFilters((current) => ({ ...current, page })),
    setSize: (size: number) => setFilters((current) => ({ ...current, page: 0, size })),
    suppliers: suppliersPage?.content ?? [],
    size: suppliersPage?.size ?? filters.size ?? 10,
    totalElements: suppliersPage?.totalElements ?? 0,
  }
}
