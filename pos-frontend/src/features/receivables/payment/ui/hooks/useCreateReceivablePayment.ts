import { useCallback, useRef, useState } from 'react'
import { normalizeApiError, type NormalizedApiError } from '../../../../../shared/api/apiError'
import { receivableDependencies } from '../../../dependencies'
import type {
  CreateReceivablePaymentRequest,
  ReceivablePayment,
} from '../../domain/entities/ReceivablePayment'

export const useCreateReceivablePayment = () => {
  const [payment, setPayment] = useState<ReceivablePayment | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<NormalizedApiError | null>(null)
  const lastErrorRef = useRef<NormalizedApiError | null>(null)

  const createPayment = useCallback(async (
    receivableId: number,
    request: CreateReceivablePaymentRequest,
  ): Promise<ReceivablePayment | null> => {
    setLoading(true)
    setError(null)
    lastErrorRef.current = null

    try {
      const createdPayment = await receivableDependencies.createReceivablePaymentUseCase.execute(
        receivableId,
        request,
      )
      setPayment(createdPayment)
      return createdPayment
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
    setPayment(null)
    setError(null)
    lastErrorRef.current = null
  }, [])

  return {
    createPayment,
    error,
    getLastError: () => lastErrorRef.current,
    loading,
    payment,
    reset,
  }
}
