import { useState } from 'react'
import { normalizeApiError, type NormalizedApiError } from '../../../../../shared/api/apiError'
import { supplierDependencies } from '../../dependencies'
import type { Supplier, SupplierMutation } from '../../domain/entities/Supplier'

export const useSupplierForm = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<NormalizedApiError | null>(null)

  const createSupplier = async (data: SupplierMutation): Promise<Supplier | null> => {
    setLoading(true)
    setError(null)
    try {
      return await supplierDependencies.createSupplierUseCase.execute(data)
    } catch (unknownError) {
      setError(normalizeApiError(unknownError))
      return null
    } finally {
      setLoading(false)
    }
  }

  const updateSupplier = async (id: number, data: SupplierMutation): Promise<Supplier | null> => {
    setLoading(true)
    setError(null)
    try {
      return await supplierDependencies.updateSupplierUseCase.execute(id, data)
    } catch (unknownError) {
      setError(normalizeApiError(unknownError))
      return null
    } finally {
      setLoading(false)
    }
  }

  const deactivateSupplier = async (id: number): Promise<boolean> => {
    setLoading(true)
    setError(null)
    try {
      await supplierDependencies.deactivateSupplierUseCase.execute(id)
      return true
    } catch (unknownError) {
      setError(normalizeApiError(unknownError))
      return false
    } finally {
      setLoading(false)
    }
  }

  return { createSupplier, deactivateSupplier, error, loading, updateSupplier }
}
