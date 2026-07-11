import { useState } from 'react'
import { normalizeApiError, type NormalizedApiError } from '../../../../../shared/api/apiError'
import { productDependencies } from '../../dependencies'
import type { Product, ProductMutation } from '../../domain/entities/Product'

export const useUpdateProduct = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<NormalizedApiError | null>(null)

  const updateProduct = async (id: number, data: ProductMutation): Promise<Product | null> => {
    setLoading(true)
    setError(null)

    try {
      return await productDependencies.updateProductUseCase.execute(id, data)
    } catch (unknownError) {
      setError(normalizeApiError(unknownError))
      return null
    } finally {
      setLoading(false)
    }
  }

  return { error, loading, updateProduct }
}

