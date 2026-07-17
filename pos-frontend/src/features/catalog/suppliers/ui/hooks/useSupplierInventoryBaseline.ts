import { useCallback, useEffect, useState } from 'react'
import { normalizeApiError, type NormalizedApiError } from '../../../../../shared/api/apiError'
import { supplierDependencies } from '../../dependencies'
import type {
  SupplierInventoryBaseline,
  SupplierInventoryBaselineMutation,
} from '../../domain/entities/Supplier'

export const useSupplierInventoryBaseline = (supplierId?: number) => {
  const [baseline, setBaseline] = useState<SupplierInventoryBaseline | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [loading, setLoading] = useState(Boolean(supplierId))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<NormalizedApiError | null>(null)

  const fetchBaseline = useCallback(async () => {
    if (!supplierId) {
      return
    }
    setLoading(true)
    setError(null)
    setNotFound(false)
    try {
      const data = await supplierDependencies.getSupplierInventoryBaselineUseCase.execute(supplierId)
      setBaseline(data)
    } catch (unknownError) {
      const normalized = normalizeApiError(unknownError)
      if (normalized.status === 404) {
        setBaseline(null)
        setNotFound(true)
      } else {
        setError(normalized)
      }
    } finally {
      setLoading(false)
    }
  }, [supplierId])

  useEffect(() => {
    void fetchBaseline()
  }, [fetchBaseline])

  const createBaseline = async (
    data: SupplierInventoryBaselineMutation,
  ): Promise<SupplierInventoryBaseline | null> => {
    if (!supplierId) {
      return null
    }
    setSaving(true)
    setError(null)
    try {
      const created = await supplierDependencies.createSupplierInventoryBaselineUseCase.execute(supplierId, data)
      setBaseline(created)
      setNotFound(false)
      return created
    } catch (unknownError) {
      setError(normalizeApiError(unknownError))
      return null
    } finally {
      setSaving(false)
    }
  }

  return { baseline, createBaseline, error, loading, notFound, refetch: fetchBaseline, saving }
}
