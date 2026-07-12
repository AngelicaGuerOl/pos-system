import { useState } from 'react'
import { normalizeApiError, type NormalizedApiError } from '../../../../shared/api/apiError'
import { userDependencies } from '../../dependencies'

export const useDeactivateUser = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<NormalizedApiError | null>(null)

  const deactivateUser = async (id: number): Promise<boolean> => {
    setLoading(true)
    setError(null)

    try {
      await userDependencies.deactivateUserUseCase.execute(id)
      return true
    } catch (unknownError) {
      setError(normalizeApiError(unknownError))
      return false
    } finally {
      setLoading(false)
    }
  }

  return { deactivateUser, error, loading }
}
