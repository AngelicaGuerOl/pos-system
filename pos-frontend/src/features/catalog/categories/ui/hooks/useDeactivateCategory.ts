import { useState } from 'react'
import { normalizeApiError, type NormalizedApiError } from '../../../../../shared/api/apiError'
import { categoryDependencies } from '../../dependencies'

export const useDeactivateCategory = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<NormalizedApiError | null>(null)

  const deactivateCategory = async (id: number): Promise<boolean> => {
    setLoading(true)
    setError(null)

    try {
      await categoryDependencies.deactivateCategoryUseCase.execute(id)
      return true
    } catch (unknownError) {
      setError(normalizeApiError(unknownError))
      return false
    } finally {
      setLoading(false)
    }
  }

  return { deactivateCategory, error, loading }
}

