import { useCallback, useEffect, useState } from 'react'
import { normalizeApiError, type NormalizedApiError } from '../../../../shared/api/apiError'
import { tokenStorage } from '../../../../shared/lib/storage/tokenStorage'
import { authDependencies } from '../../dependencies'
import type { User } from '../../domain/entities/User'

type UseCurrentUserResult = {
  user: User | null
  loading: boolean
  error: NormalizedApiError | null
  refreshCurrentUser: () => Promise<User | null>
}

export const useCurrentUser = (): UseCurrentUserResult => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState<boolean>(() => Boolean(tokenStorage.getToken()))
  const [error, setError] = useState<NormalizedApiError | null>(null)

  const refreshCurrentUser = useCallback(async () => {
    if (!tokenStorage.getToken()) {
      setUser(null)
      setLoading(false)
      return null
    }

    setLoading(true)
    setError(null)

    try {
      const currentUser = await authDependencies.getCurrentUserUseCase.execute()
      setUser(currentUser)
      return currentUser
    } catch (unknownError) {
      const normalizedError = normalizeApiError(unknownError)
      tokenStorage.removeToken()
      setUser(null)
      setError(normalizedError)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refreshCurrentUser()
  }, [refreshCurrentUser])

  return {
    user,
    loading,
    error,
    refreshCurrentUser,
  }
}

