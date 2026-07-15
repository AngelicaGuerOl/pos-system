import { useCallback, useRef, useState } from 'react'
import { normalizeApiError, type NormalizedApiError } from '../../../../shared/api/apiError'
import { saleDependencies } from '../../dependencies'
import type { SaleCancellation } from '../../domain/entities/Sale'

export const useCancelSale = () => {
  const [cancellation, setCancellation] = useState<SaleCancellation | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<NormalizedApiError | null>(null)
  const lastErrorRef = useRef<NormalizedApiError | null>(null)

  const cancelSale = useCallback(async (
    saleId: number,
    reason: string,
  ): Promise<SaleCancellation | null> => {
    setLoading(true)
    setError(null)
    lastErrorRef.current = null

    try {
      const result = await saleDependencies.cancelSaleUseCase.execute(saleId, { reason })
      setCancellation(result)
      return result
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
    setCancellation(null)
    setError(null)
    lastErrorRef.current = null
  }, [])

  return {
    cancelSale,
    cancellation,
    error,
    getLastError: () => lastErrorRef.current,
    loading,
    reset,
  }
}
