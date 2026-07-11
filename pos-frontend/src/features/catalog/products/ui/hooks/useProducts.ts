import { useCallback, useEffect, useState } from 'react'
import { normalizeApiError, type NormalizedApiError } from '../../../../../shared/api/apiError'
import { productDependencies } from '../../dependencies'
import type { Product, ProductFilters } from '../../domain/entities/Product'

export const useProducts = () => {
  const [products, setProducts] = useState<Product[]>([])
  const [filters, setFilters] = useState<ProductFilters>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<NormalizedApiError | null>(null)

  const fetchProducts = useCallback(async (nextFilters: ProductFilters = filters) => {
    setLoading(true)
    setError(null)

    try {
      const data = await productDependencies.getProductsUseCase.execute(nextFilters)
      setProducts(data.content)
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
    products,
    refetch: fetchProducts,
    setFilters: updateFilters,
  }
}

