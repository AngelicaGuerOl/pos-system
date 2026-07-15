import { useCallback, useRef, useState } from 'react'
import { normalizeApiError, type NormalizedApiError } from '../../../../../shared/api/apiError'
import { cashSessionDependencies } from '../../dependencies'
import type { CashSessionClosingSummary, CloseCashSessionData } from '../../domain/entities/CashSession'

export const useCloseCashSession = () => {
  const [preview, setPreview] = useState<CashSessionClosingSummary | null>(null)
  const [closingSummary, setClosingSummary] = useState<CashSessionClosingSummary | null>(null)
  const [loadingPreview, setLoadingPreview] = useState(false)
  const [closing, setClosing] = useState(false)
  const [error, setError] = useState<NormalizedApiError | null>(null)
  const lastErrorRef = useRef<NormalizedApiError | null>(null)

  const loadPreview = useCallback(async (): Promise<CashSessionClosingSummary | null> => {
    setLoadingPreview(true)
    setError(null)
    lastErrorRef.current = null

    try {
      const nextPreview = await cashSessionDependencies.getCashSessionClosingPreviewUseCase.execute()
      setPreview(nextPreview)
      return nextPreview
    } catch (unknownError) {
      const normalizedError = normalizeApiError(unknownError)
      setError(normalizedError)
      lastErrorRef.current = normalizedError
      return null
    } finally {
      setLoadingPreview(false)
    }
  }, [])

  const closeCurrent = useCallback(async (
    data: CloseCashSessionData,
  ): Promise<CashSessionClosingSummary | null> => {
    if (closing) {
      return null
    }

    setClosing(true)
    setError(null)
    lastErrorRef.current = null

    try {
      const summary = await cashSessionDependencies.closeCurrentCashSessionUseCase.execute(data)
      setClosingSummary(summary)
      return summary
    } catch (unknownError) {
      const normalizedError = normalizeApiError(unknownError)
      setError(normalizedError)
      lastErrorRef.current = normalizedError
      return null
    } finally {
      setClosing(false)
    }
  }, [closing])

  const reset = useCallback(() => {
    setPreview(null)
    setClosingSummary(null)
    setError(null)
    lastErrorRef.current = null
  }, [])

  return {
    closeCurrent,
    closing,
    closingSummary,
    error,
    getLastError: () => lastErrorRef.current,
    loadPreview,
    loadingPreview,
    preview,
    reset,
  }
}
