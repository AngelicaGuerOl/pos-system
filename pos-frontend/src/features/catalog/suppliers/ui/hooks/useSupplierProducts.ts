import { useCallback, useEffect, useState } from 'react'
import { normalizeApiError, type NormalizedApiError } from '../../../../../shared/api/apiError'
import type { PageResponse } from '../../../../../shared/types/PageResponse'
import type { Product } from '../../../products/domain/entities/Product'
import { supplierDependencies } from '../../dependencies'

export type SupplierProductFilters = {
  search?: string
  page?: number
  size?: number
  sort?: string
}

export const useSupplierProducts = (supplierId?: number, initialFilters: SupplierProductFilters = {}) => {
  const [pageData, setPageData] = useState<PageResponse<Product> | null>(null)
  const [filters, setFilters] = useState<SupplierProductFilters>({ page: 0, size: 10, ...initialFilters })
  const [loading, setLoading] = useState(Boolean(supplierId))
  const [error, setError] = useState<NormalizedApiError | null>(null)

  const fetchProducts = useCallback(async (nextFilters: SupplierProductFilters = filters) => {
    if (!supplierId) {
      setPageData(null)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const data = await supplierDependencies.getSupplierProductsUseCase.execute(supplierId, nextFilters)
      setPageData(data)
    } catch (unknownError) {
      setError(normalizeApiError(unknownError))
    } finally {
      setLoading(false)
    }
  }, [filters, supplierId])

  useEffect(() => {
    void fetchProducts(filters)
  }, [fetchProducts, filters])

  return {
    error,
    filters,
    loading,
    page: pageData?.page ?? filters.page ?? 0,
    products: pageData?.content ?? [],
    refetch: fetchProducts,
    setFilters,
    setPage: (page: number) => setFilters((current) => ({ ...current, page })),
    setSize: (size: number) => setFilters((current) => ({ ...current, page: 0, size })),
    size: pageData?.size ?? filters.size ?? 10,
    totalElements: pageData?.totalElements ?? 0,
  }
}
