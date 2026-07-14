import { useRef, useState } from 'react'
import { normalizeApiError, type NormalizedApiError } from '../../../../shared/api/apiError'
import { saleDependencies } from '../../dependencies'
import type { CreateCashSaleData, Sale } from '../../domain/entities/Sale'

export const useCreateCashSale = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<NormalizedApiError | null>(null)
  const lastErrorRef = useRef<NormalizedApiError | null>(null)

  const createCashSale = async (data: CreateCashSaleData): Promise<Sale | null> => {
    setLoading(true)
    setError(null)
    lastErrorRef.current = null

    try {
      return await saleDependencies.createCashSaleUseCase.execute(data)
    } catch (unknownError) {
      const normalizedError = normalizeApiError(unknownError)
      lastErrorRef.current = normalizedError
      setError(normalizedError)
      return null
    } finally {
      setLoading(false)
    }
  }

  return {
    createCashSale,
    error,
    getLastError: () => lastErrorRef.current,
    loading,
    setError,
  }
}
