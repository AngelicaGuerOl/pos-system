import { useState } from 'react'
import { normalizeApiError, type NormalizedApiError } from '../../../../shared/api/apiError'
import { customerDependencies } from '../../dependencies'
import type { Customer, CustomerMutation } from '../../domain/entities/Customer'

export const useUpdateCustomer = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<NormalizedApiError | null>(null)

  const updateCustomer = async (
    id: number,
    data: CustomerMutation,
  ): Promise<Customer | null> => {
    setLoading(true)
    setError(null)

    try {
      return await customerDependencies.updateCustomerUseCase.execute(id, data)
    } catch (unknownError) {
      setError(normalizeApiError(unknownError))
      return null
    } finally {
      setLoading(false)
    }
  }

  return { error, loading, updateCustomer }
}
