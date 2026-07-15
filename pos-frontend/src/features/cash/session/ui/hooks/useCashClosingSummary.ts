import { useCallback, useRef, useState } from 'react'
import { normalizeApiError, type NormalizedApiError } from '../../../../../shared/api/apiError'
import { cashSessionDependencies } from '../../dependencies'
import type { CashSessionClosingSummary } from '../../domain/entities/CashSession'

export const useCashClosingSummary = () => {
  const [summary, setSummary] = useState<CashSessionClosingSummary | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<NormalizedApiError | null>(null)
  const lastErrorRef = useRef<NormalizedApiError | null>(null)

  const openSummary = useCallback(async (sessionId: number): Promise<CashSessionClosingSummary | null> => {
    setLoading(true)
    setError(null)
    lastErrorRef.current = null

    try {
      const nextSummary = await cashSessionDependencies.getCashSessionClosingSummaryUseCase.execute(sessionId)
      setSummary(nextSummary)
      return nextSummary
    } catch (unknownError) {
      const normalizedError = normalizeApiError(unknownError)
      setError(normalizedError)
      lastErrorRef.current = normalizedError
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const closeSummary = useCallback(() => {
    setSummary(null)
    setError(null)
    lastErrorRef.current = null
  }, [])

  return {
    closeSummary,
    error,
    getLastError: () => lastErrorRef.current,
    loading,
    open: Boolean(summary) || loading,
    openSummary,
    summary,
  }
}
