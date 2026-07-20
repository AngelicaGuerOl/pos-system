import { useCallback, useEffect, useState } from 'react'
import { normalizeApiError, type NormalizedApiError } from '../../../../../shared/api/apiError'
import type { PageResponse } from '../../../../../shared/types/PageResponse'
import { productDependencies } from '../../dependencies'
import type { Product, ProductFilters } from '../../domain/entities/Product'

export const useProducts = () => {
  const [productsPage, setProductsPage] = useState<PageResponse<Product> | null>(null)
  const [filters, setFilters] = useState<ProductFilters>({ active: true, page: 0, size: 50 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<NormalizedApiError | null>(null)

  const fetchProducts = useCallback(async (nextFilters: ProductFilters = filters) => {
    setLoading(true)
    setError(null)

    try {
      const data = await productDependencies.getProductsUseCase.execute(nextFilters)
      setProductsPage(data)
    } catch (unknownError) {
      setError(normalizeApiError(unknownError))
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    void fetchProducts(filters)
  }, [fetchProducts, filters])

  const updateFilters = (nextFilters: ProductFilters) => {
    setFilters(nextFilters)
  }

  return {
    error,
    filters,
    loading,
    page: productsPage?.page ?? filters.page ?? 0,
    products: productsPage?.content ?? [],
    refetch: fetchProducts,
    setPage: (page: number) => setFilters((current) => ({ ...current, page })),
    setFilters: updateFilters,
    setSize: (size: number) => setFilters((current) => ({ ...current, page: 0, size })),
    size: productsPage?.size ?? filters.size ?? 50,
    totalElements: productsPage?.totalElements ?? 0,
  }
}
