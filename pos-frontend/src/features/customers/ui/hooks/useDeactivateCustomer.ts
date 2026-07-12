import { useState } from 'react'
import { normalizeApiError, type NormalizedApiError } from '../../../../shared/api/apiError'
import { customerDependencies } from '../../dependencies'

export const useDeactivateCustomer = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<NormalizedApiError | null>(null)

  const deactivateCustomer = async (id: number): Promise<boolean> => {
    setLoading(true)
    setError(null)

    try {
      await customerDependencies.deactivateCustomerUseCase.execute(id)
      return true
    } catch (unknownError) {
      setError(normalizeApiError(unknownError))
      return false
    } finally {
      setLoading(false)
    }
  }

  return { deactivateCustomer, error, loading }
}
