import { useState } from 'react'
import { normalizeApiError, type NormalizedApiError } from '../../../../../shared/api/apiError'
import { supplierSettlementDependencies } from '../../dependencies'
import type { SupplierSettlement, SupplierSettlementCreateMutation } from '../../domain/entities/SupplierSettlement'

export const useCreateSupplierSettlement = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<NormalizedApiError | null>(null)

  const createSettlement = async (data: SupplierSettlementCreateMutation): Promise<SupplierSettlement | null> => {
    setLoading(true)
    setError(null)
    try {
      return await supplierSettlementDependencies.createSupplierSettlementUseCase.execute(data)
    } catch (unknownError) {
      setError(normalizeApiError(unknownError))
      return null
    } finally {
      setLoading(false)
    }
  }

  return { createSettlement, error, loading }
}
