import { useCallback, useState } from 'react'
import { normalizeApiError, type NormalizedApiError } from '../../../../shared/api/apiError'
import { receivableDependencies } from '../../dependencies'
import type { ReceivableDetail } from '../../domain/entities/Receivable'

export const useReceivableDetails = () => {
  const [receivable, setReceivable] = useState<ReceivableDetail | null>(null)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<NormalizedApiError | null>(null)

  const openDetails = useCallback(async (id: number) => {
    setOpen(true)
    setLoading(true)
    setError(null)

    try {
      setReceivable(await receivableDependencies.getReceivableByIdUseCase.execute(id))
    } catch (unknownError) {
      setReceivable(null)
      setError(normalizeApiError(unknownError))
    } finally {
      setLoading(false)
    }
  }, [])

  const refreshDetails = useCallback(async () => {
    if (!receivable) {
      return null
    }

    setLoading(true)
    setError(null)

    try {
      const refreshedReceivable = await receivableDependencies.getReceivableByIdUseCase.execute(
        receivable.id,
      )
      setReceivable(refreshedReceivable)
      return refreshedReceivable
    } catch (unknownError) {
      setError(normalizeApiError(unknownError))
      return null
    } finally {
      setLoading(false)
    }
  }, [receivable])

  const closeDetails = useCallback(() => {
    setOpen(false)
    setReceivable(null)
    setError(null)
  }, [])

  return {
    closeDetails,
    error,
    loading,
    open,
    openDetails,
    receivable,
    refreshDetails,
  }
}
