import { useCallback, useEffect, useState } from 'react'
import { normalizeApiError, type NormalizedApiError } from '../../../../shared/api/apiError'
import { dashboardDependencies } from '../../dependencies'
import type { DashboardSummary } from '../../domain/entities/DashboardSummary'

export const useDashboardSummary = () => {
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<NormalizedApiError | null>(null)

  const fetchSummary = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const nextSummary = await dashboardDependencies.getDashboardSummaryUseCase.execute()
      setSummary(nextSummary)
      return nextSummary
    } catch (unknownError) {
      setError(normalizeApiError(unknownError))
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchSummary()
  }, [fetchSummary])

  return {
    error,
    loading,
    refetch: fetchSummary,
    summary,
  }
}
