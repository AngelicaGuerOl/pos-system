import { useCallback, useState } from 'react'
import { normalizeApiError, type NormalizedApiError } from '../../../../../shared/api/apiError'
import { saleDependencies } from '../../../dependencies'
import type { SaleReturnDetails } from '../../domain/entities/SaleReturn'

export const useSaleReturnDetails = () => {
  const [saleReturn, setSaleReturn] = useState<SaleReturnDetails | null>(null)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<NormalizedApiError | null>(null)

  const openDetails = useCallback(async (returnId: number) => {
    setOpen(true)
    setLoading(true)
    setError(null)

    try {
      const data = await saleDependencies.getSaleReturnByIdUseCase.execute(returnId)
      setSaleReturn(data)
    } catch (unknownError) {
      setSaleReturn(null)
      setError(normalizeApiError(unknownError))
    } finally {
      setLoading(false)
    }
  }, [])

  const closeDetails = useCallback(() => {
    setOpen(false)
    setSaleReturn(null)
    setError(null)
  }, [])

  return {
    closeDetails,
    error,
    loading,
    open,
    openDetails,
    saleReturn,
  }
}
