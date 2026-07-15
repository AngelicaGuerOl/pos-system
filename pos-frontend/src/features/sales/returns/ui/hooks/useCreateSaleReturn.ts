import { useCallback, useRef, useState } from 'react'
import { normalizeApiError, type NormalizedApiError } from '../../../../../shared/api/apiError'
import { saleDependencies } from '../../../dependencies'
import type { CreateSaleReturnRequest, SaleReturnDetails } from '../../domain/entities/SaleReturn'

export const useCreateSaleReturn = () => {
  const [saleReturn, setSaleReturn] = useState<SaleReturnDetails | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<NormalizedApiError | null>(null)
  const lastErrorRef = useRef<NormalizedApiError | null>(null)

  const createReturn = useCallback(async (
    saleId: number,
    request: CreateSaleReturnRequest,
  ): Promise<SaleReturnDetails | null> => {
    setLoading(true)
    setError(null)
    lastErrorRef.current = null

    try {
      const createdReturn = await saleDependencies.createSaleReturnUseCase.execute(saleId, request)
      setSaleReturn(createdReturn)
      return createdReturn
    } catch (unknownError) {
      const normalizedError = normalizeApiError(unknownError)
      lastErrorRef.current = normalizedError
      setError(normalizedError)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const reset = useCallback(() => {
    setSaleReturn(null)
    setError(null)
    lastErrorRef.current = null
  }, [])

  return {
    createReturn,
    error,
    getLastError: () => lastErrorRef.current,
    loading,
    reset,
    saleReturn,
  }
}
