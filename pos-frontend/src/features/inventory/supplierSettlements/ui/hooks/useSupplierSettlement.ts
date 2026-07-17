import { useCallback, useEffect, useState } from 'react'
import { normalizeApiError, type NormalizedApiError } from '../../../../../shared/api/apiError'
import { supplierSettlementDependencies } from '../../dependencies'
import type { SupplierSettlement } from '../../domain/entities/SupplierSettlement'

export const useSupplierSettlement = (id?: number) => {
  const [settlement, setSettlement] = useState<SupplierSettlement | null>(null)
  const [loading, setLoading] = useState(Boolean(id))
  const [error, setError] = useState<NormalizedApiError | null>(null)

  const refetch = useCallback(async () => {
    if (!id) return
    setLoading(true)
    setError(null)
    try {
      setSettlement(await supplierSettlementDependencies.getSupplierSettlementByIdUseCase.execute(id))
    } catch (unknownError) {
      setError(normalizeApiError(unknownError))
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { void refetch() }, [refetch])

  return { error, loading, refetch, settlement, setSettlement }
}
