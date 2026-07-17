import { useState } from 'react'
import { normalizeApiError, type NormalizedApiError } from '../../../../../shared/api/apiError'
import { supplierSettlementDependencies } from '../../dependencies'

export const useExportSupplierSettlement = () => {
  const [loadingId, setLoadingId] = useState<number | null>(null)
  const [error, setError] = useState<NormalizedApiError | null>(null)

  const exportSettlement = async (id: number): Promise<boolean> => {
    setLoadingId(id)
    setError(null)
    try {
      const exported = await supplierSettlementDependencies.exportSupplierSettlementUseCase.execute(id)
      const url = URL.createObjectURL(exported.blob)
      const link = document.createElement('a')
      link.href = url
      link.download = exported.filename
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.setTimeout(() => URL.revokeObjectURL(url), 1000)
      return true
    } catch (unknownError) {
      setError(normalizeApiError(unknownError))
      return false
    } finally {
      setLoadingId(null)
    }
  }

  return { error, exportSettlement, loadingId }
}
