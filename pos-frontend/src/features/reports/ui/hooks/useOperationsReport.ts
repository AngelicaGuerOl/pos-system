import { useCallback, useState } from 'react'
import { normalizeApiError, type NormalizedApiError } from '../../../../shared/api/apiError'
import { reportDependencies } from '../../dependencies'
import type {
  OperationsReport,
  OperationsReportFilters,
} from '../../domain/entities/OperationsReport'

export const useOperationsReport = () => {
  const [report, setReport] = useState<OperationsReport | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<NormalizedApiError | null>(null)

  const fetchReport = useCallback(async (filters: OperationsReportFilters) => {
    setLoading(true)
    setError(null)

    try {
      const nextReport = await reportDependencies.getOperationsReportUseCase.execute(filters)
      setReport(nextReport)
      return nextReport
    } catch (unknownError) {
      setError(normalizeApiError(unknownError))
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const reset = useCallback(() => {
    setReport(null)
    setError(null)
  }, [])

  return {
    error,
    fetchReport,
    loading,
    report,
    reset,
  }
}
