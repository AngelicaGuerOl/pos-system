import { useState } from 'react'
import { normalizeApiError, type NormalizedApiError } from '../../../../../shared/api/apiError'
import { supplierEntryDependencies } from '../../dependencies'
import type { SupplierEntry, SupplierEntryMutation } from '../../domain/entities/SupplierEntry'

export const useCreateSupplierEntry = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<NormalizedApiError | null>(null)

  const createEntry = async (data: SupplierEntryMutation): Promise<SupplierEntry | null> => {
    setLoading(true)
    setError(null)
    try {
      return await supplierEntryDependencies.createSupplierEntryUseCase.execute(data)
    } catch (unknownError) {
      setError(normalizeApiError(unknownError))
      return null
    } finally {
      setLoading(false)
    }
  }

  return { createEntry, error, loading }
}
