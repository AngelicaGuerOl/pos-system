import { useState } from 'react'
import { normalizeApiError, type NormalizedApiError } from '../../../../shared/api/apiError'
import { userDependencies } from '../../dependencies'
import type { User, UserUpdateMutation } from '../../domain/entities/User'

export const useUpdateUser = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<NormalizedApiError | null>(null)

  const updateUser = async (id: number, data: UserUpdateMutation): Promise<User | null> => {
    setLoading(true)
    setError(null)

    try {
      return await userDependencies.updateUserUseCase.execute(id, data)
    } catch (unknownError) {
      setError(normalizeApiError(unknownError))
      return null
    } finally {
      setLoading(false)
    }
  }

  return { error, loading, updateUser }
}
