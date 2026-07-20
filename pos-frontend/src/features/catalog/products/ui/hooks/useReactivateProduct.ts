import { useState } from 'react'
import { normalizeApiError, type NormalizedApiError } from '../../../../../shared/api/apiError'
import { productDependencies } from '../../dependencies'

export const useReactivateProduct = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<NormalizedApiError | null>(null)

  const reactivateProduct = async (id: number): Promise<boolean> => {
    setLoading(true)
    setError(null)

    try {
      await productDependencies.reactivateProductUseCase.execute(id)
      return true
    } catch (unknownError) {
      setError(normalizeApiError(unknownError))
      return false
    } finally {
      setLoading(false)
    }
  }

  return { error, loading, reactivateProduct }
}
