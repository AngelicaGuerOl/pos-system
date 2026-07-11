import { useState } from 'react'
import { normalizeApiError, type NormalizedApiError } from '../../../../../shared/api/apiError'
import { productDependencies } from '../../dependencies'

export const useDeactivateProduct = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<NormalizedApiError | null>(null)

  const deactivateProduct = async (id: number): Promise<boolean> => {
    setLoading(true)
    setError(null)

    try {
      await productDependencies.deactivateProductUseCase.execute(id)
      return true
    } catch (unknownError) {
      setError(normalizeApiError(unknownError))
      return false
    } finally {
      setLoading(false)
    }
  }

  return { deactivateProduct, error, loading }
}

