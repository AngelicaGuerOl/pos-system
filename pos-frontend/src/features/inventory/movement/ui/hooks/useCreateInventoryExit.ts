import { useCallback, useState } from 'react'
import { normalizeApiError, type NormalizedApiError } from '../../../../../shared/api/apiError'
import { inventoryMovementDependencies } from '../../dependencies'
import type { InventoryMovement, ManualInventoryMovementData } from '../../domain/entities/InventoryMovement'

export const useCreateInventoryExit = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<NormalizedApiError | null>(null)

  const createExit = useCallback(
    async (data: ManualInventoryMovementData): Promise<InventoryMovement | null> => {
      if (loading) {
        return null
      }

      setLoading(true)
      setError(null)

      try {
        return await inventoryMovementDependencies.createInventoryExitUseCase.execute(data)
      } catch (unknownError) {
        setError(normalizeApiError(unknownError))
        return null
      } finally {
        setLoading(false)
      }
    },
    [loading],
  )

  return { createExit, error, loading }
}
