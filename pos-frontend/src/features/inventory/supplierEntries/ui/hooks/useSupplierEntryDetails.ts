import { useCallback, useEffect, useState } from 'react'
import { normalizeApiError, type NormalizedApiError } from '../../../../../shared/api/apiError'
import { supplierEntryDependencies } from '../../dependencies'
import type { SupplierEntry } from '../../domain/entities/SupplierEntry'

export const useSupplierEntryDetails = (entryId?: number) => {
  const [entry, setEntry] = useState<SupplierEntry | null>(null)
  const [loading, setLoading] = useState(Boolean(entryId))
  const [error, setError] = useState<NormalizedApiError | null>(null)

  const fetchEntry = useCallback(async () => {
    if (!entryId) return
    setLoading(true)
    setError(null)
    try {
      setEntry(await supplierEntryDependencies.getSupplierEntryByIdUseCase.execute(entryId))
    } catch (unknownError) {
      setError(normalizeApiError(unknownError))
    } finally {
      setLoading(false)
    }
  }, [entryId])

  useEffect(() => {
    void fetchEntry()
  }, [fetchEntry])

  return { entry, error, loading, refetch: fetchEntry }
}
