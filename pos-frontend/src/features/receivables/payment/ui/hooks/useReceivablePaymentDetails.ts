import { useCallback, useState } from 'react'
import { normalizeApiError, type NormalizedApiError } from '../../../../../shared/api/apiError'
import { receivableDependencies } from '../../../dependencies'
import type { ReceivablePayment } from '../../domain/entities/ReceivablePayment'

export const useReceivablePaymentDetails = () => {
  const [payment, setPayment] = useState<ReceivablePayment | null>(null)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<NormalizedApiError | null>(null)

  const openDetails = useCallback(async (paymentId: number) => {
    setOpen(true)
    setLoading(true)
    setError(null)

    try {
      setPayment(await receivableDependencies.getReceivablePaymentByIdUseCase.execute(paymentId))
    } catch (unknownError) {
      setPayment(null)
      setError(normalizeApiError(unknownError))
    } finally {
      setLoading(false)
    }
  }, [])

  const closeDetails = useCallback(() => {
    setOpen(false)
    setPayment(null)
    setError(null)
  }, [])

  return {
    closeDetails,
    error,
    loading,
    open,
    openDetails,
    payment,
  }
}
