import { useCallback, useState } from 'react'
import { normalizeApiError, type NormalizedApiError } from '../../../../../shared/api/apiError'
import { inventoryMovementDependencies } from '../../dependencies'
import type { InventoryMovement } from '../../domain/entities/InventoryMovement'

export const useInventoryMovementDetails = () => {
  const [movement, setMovement] = useState<InventoryMovement | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<NormalizedApiError | null>(null)

  const loadMovement = useCallback(async (id: number): Promise<InventoryMovement | null> => {
    setLoading(true)
    setError(null)

    try {
      const data = await inventoryMovementDependencies.getInventoryMovementByIdUseCase.execute(id)
      setMovement(data)
      return data
    } catch (unknownError) {
      setError(normalizeApiError(unknownError))
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  return { error, loadMovement, loading, movement }
}
