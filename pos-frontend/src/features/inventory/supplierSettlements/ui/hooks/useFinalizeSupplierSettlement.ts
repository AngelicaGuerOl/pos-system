import { useState } from 'react'
import { normalizeApiError, type NormalizedApiError } from '../../../../../shared/api/apiError'
import { supplierSettlementDependencies } from '../../dependencies'
import type { SupplierSettlement } from '../../domain/entities/SupplierSettlement'

export const useFinalizeSupplierSettlement = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<NormalizedApiError | null>(null)

  const finalizeSettlement = async (id: number): Promise<SupplierSettlement | null> => {
    setLoading(true)
    setError(null)
    try {
      return await supplierSettlementDependencies.finalizeSupplierSettlementUseCase.execute(id)
    } catch (unknownError) {
      setError(normalizeApiError(unknownError))
      return null
    } finally {
      setLoading(false)
    }
  }

  return { error, finalizeSettlement, loading }
}
