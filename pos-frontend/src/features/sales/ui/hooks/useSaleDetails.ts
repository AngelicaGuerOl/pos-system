import { useCallback, useState } from 'react'
import { normalizeApiError, type NormalizedApiError } from '../../../../shared/api/apiError'
import { saleDependencies } from '../../dependencies'
import type { Sale } from '../../domain/entities/Sale'

export const useSaleDetails = () => {
  const [sale, setSale] = useState<Sale | null>(null)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<NormalizedApiError | null>(null)

  const openDetails = useCallback(async (id: number) => {
    setOpen(true)
    setLoading(true)
    setError(null)

    try {
      const data = await saleDependencies.getSaleByIdUseCase.execute(id)
      setSale(data)
    } catch (unknownError) {
      setSale(null)
      setError(normalizeApiError(unknownError))
    } finally {
      setLoading(false)
    }
  }, [])

  const refreshDetails = useCallback(async () => {
    if (!sale) {
      return
    }

    setLoading(true)
    setError(null)

    try {
      const data = await saleDependencies.getSaleByIdUseCase.execute(sale.id)
      setSale(data)
    } catch (unknownError) {
      setError(normalizeApiError(unknownError))
    } finally {
      setLoading(false)
    }
  }, [sale])

  const closeDetails = useCallback(() => {
    setOpen(false)
    setSale(null)
    setError(null)
  }, [])

  return {
    closeDetails,
    error,
    loading,
    open,
    openDetails,
    refreshDetails,
    sale,
  }
}
