import { useCallback, useState } from 'react'
import { normalizeApiError, type NormalizedApiError } from '../../../../../shared/api/apiError'
import { inventoryMovementDependencies } from '../../dependencies'
import type { InventoryMovement, ManualInventoryMovementData } from '../../domain/entities/InventoryMovement'

export const useCreateInventoryEntry = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<NormalizedApiError | null>(null)

  const createEntry = useCallback(
    async (data: ManualInventoryMovementData): Promise<InventoryMovement | null> => {
      if (loading) {
        return null
      }

      setLoading(true)
      setError(null)

      try {
        return await inventoryMovementDependencies.createInventoryEntryUseCase.execute(data)
      } catch (unknownError) {
        setError(normalizeApiError(unknownError))
        return null
      } finally {
        setLoading(false)
      }
    },
    [loading],
  )

  return { createEntry, error, loading }
}
