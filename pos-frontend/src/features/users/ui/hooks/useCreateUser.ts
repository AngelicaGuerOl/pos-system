import { useState } from 'react'
import { normalizeApiError, type NormalizedApiError } from '../../../../shared/api/apiError'
import { userDependencies } from '../../dependencies'
import type { User, UserCreateMutation } from '../../domain/entities/User'

export const useCreateUser = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<NormalizedApiError | null>(null)

  const createUser = async (data: UserCreateMutation): Promise<User | null> => {
    setLoading(true)
    setError(null)

    try {
      return await userDependencies.createUserUseCase.execute(data)
    } catch (unknownError) {
      setError(normalizeApiError(unknownError))
      return null
    } finally {
      setLoading(false)
    }
  }

  return { createUser, error, loading }
}
