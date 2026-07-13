import { useState } from 'react'
import { normalizeApiError, type NormalizedApiError } from '../../../../../shared/api/apiError'
import { cashMovementDependencies } from '../../dependencies'
import type { CashMovement, ManualCashMovementData } from '../../domain/entities/CashMovement'

export type ManualCashMovementMode = 'entry' | 'exit'

export const useRegisterCashMovement = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<NormalizedApiError | null>(null)

  const registerCashMovement = async (
    mode: ManualCashMovementMode,
    data: ManualCashMovementData,
  ): Promise<CashMovement | null> => {
    setLoading(true)
    setError(null)

    try {
      return mode === 'entry'
        ? await cashMovementDependencies.registerCashEntryUseCase.execute(data)
        : await cashMovementDependencies.registerCashExitUseCase.execute(data)
    } catch (unknownError) {
      setError(normalizeApiError(unknownError))
      return null
    } finally {
      setLoading(false)
    }
  }

  return { error, loading, registerCashMovement }
}
