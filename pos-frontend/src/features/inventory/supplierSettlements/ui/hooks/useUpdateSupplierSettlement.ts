import { useState } from 'react'
import { normalizeApiError, type NormalizedApiError } from '../../../../../shared/api/apiError'
import { supplierSettlementDependencies } from '../../dependencies'
import type { SupplierSettlement, SupplierSettlementUpdateMutation } from '../../domain/entities/SupplierSettlement'

export const useUpdateSupplierSettlement = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<NormalizedApiError | null>(null)

  const updateSettlement = async (id: number, data: SupplierSettlementUpdateMutation): Promise<SupplierSettlement | null> => {
    setLoading(true)
    setError(null)
    try {
      return await supplierSettlementDependencies.updateSupplierSettlementUseCase.execute(id, data)
    } catch (unknownError) {
      setError(normalizeApiError(unknownError))
      return null
    } finally {
      setLoading(false)
    }
  }

  return { error, loading, updateSettlement }
}
