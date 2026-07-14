import { useCallback, useState } from 'react'
import { normalizeApiError, type NormalizedApiError } from '../../../../shared/api/apiError'
import { productDependencies, type Product, type ProductFilters } from '../../../catalog/products'
import type { PageResponse } from '../../../../shared/types/PageResponse'

export const useProductLookup = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<NormalizedApiError | null>(null)

  const findByBarcode = useCallback(async (barcode: string): Promise<Product | null> => {
    setLoading(true)
    setError(null)

    try {
      return await productDependencies.getProductByBarcodeUseCase.execute(barcode)
    } catch (unknownError) {
      const normalizedError = normalizeApiError(unknownError)
      setError(
        normalizedError.status === 404
          ? { ...normalizedError, message: 'Producto no encontrado' }
          : normalizedError,
      )
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const searchProducts = useCallback(async (
    filters: ProductFilters,
  ): Promise<PageResponse<Product> | null> => {
    setLoading(true)
    setError(null)

    try {
      return await productDependencies.getProductsUseCase.execute(filters)
    } catch (unknownError) {
      setError(normalizeApiError(unknownError))
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  return { error, findByBarcode, loading, searchProducts, setError }
}
