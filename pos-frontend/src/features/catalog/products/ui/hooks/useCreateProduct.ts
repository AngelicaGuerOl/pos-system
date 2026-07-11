import { useState } from 'react'
import { normalizeApiError, type NormalizedApiError } from '../../../../../shared/api/apiError'
import { productDependencies } from '../../dependencies'
import type { Product, ProductMutation } from '../../domain/entities/Product'

export const useCreateProduct = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<NormalizedApiError | null>(null)

  const createProduct = async (data: ProductMutation): Promise<Product | null> => {
    setLoading(true)
    setError(null)

    try {
      return await productDependencies.createProductUseCase.execute(data)
    } catch (unknownError) {
      setError(normalizeApiError(unknownError))
      return null
    } finally {
      setLoading(false)
    }
  }

  return { createProduct, error, loading }
}

