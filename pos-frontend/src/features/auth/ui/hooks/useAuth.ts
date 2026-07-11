import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react'
import { normalizeApiError } from '../../../../shared/api/apiError'
import { tokenStorage } from '../../../../shared/lib/storage/tokenStorage'
import { authDependencies } from '../../dependencies'
import type { User } from '../../domain/entities/User'

type AuthContextValue = {
  user: User | null
  isAuthenticated: boolean
  loading: boolean
  login: (username: string, password: string) => Promise<User>
  logout: () => Promise<void>
  refreshCurrentUser: () => Promise<User | null>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export const AuthProvider = ({ children }: PropsWithChildren) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState<boolean>(() => Boolean(tokenStorage.getToken()))

  const refreshCurrentUser = useCallback(async () => {
    if (!tokenStorage.getToken()) {
      setUser(null)
      setLoading(false)
      return null
    }

    setLoading(true)

    try {
      const currentUser = await authDependencies.getCurrentUserUseCase.execute()
      setUser(currentUser)
      return currentUser
    } catch (error) {
      normalizeApiError(error)
      tokenStorage.removeToken()
      setUser(null)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refreshCurrentUser()
  }, [refreshCurrentUser])

  const login = useCallback(async (username: string, password: string) => {
    const authenticatedUser = await authDependencies.loginUseCase.execute(username, password)
    setUser(authenticatedUser)
    return authenticatedUser
  }, [])

  const logout = useCallback(async () => {
    await authDependencies.logoutUseCase.execute()
    setUser(null)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: Boolean(user) || Boolean(tokenStorage.getToken()),
      loading,
      login,
      logout,
      refreshCurrentUser,
    }),
    [loading, login, logout, refreshCurrentUser, user],
  )

  return createElement(AuthContext.Provider, { value }, children)
}

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider')
  }

  return context
}

