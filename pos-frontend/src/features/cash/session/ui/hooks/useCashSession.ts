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
import { useAuth } from '../../../../auth'
import { normalizeApiError, type NormalizedApiError } from '../../../../../shared/api/apiError'
import { cashSessionDependencies } from '../../dependencies'
import type { CashSession, OpenCashSessionData } from '../../domain/entities/CashSession'

type CashSessionContextValue = {
  currentSession: CashSession | null
  error: NormalizedApiError | null
  loading: boolean
  clearCurrentSession: () => void
  openCashSession: (data: OpenCashSessionData) => Promise<CashSession | null>
  refreshCurrentSession: () => Promise<CashSession | null>
}

const CashSessionContext = createContext<CashSessionContextValue | null>(null)

export const CashSessionProvider = ({ children }: PropsWithChildren) => {
  const { isAuthenticated, loading: authLoading, user } = useAuth()
  const [currentSession, setCurrentSession] = useState<CashSession | null>(null)
  const [requestLoading, setRequestLoading] = useState(false)
  const [error, setError] = useState<NormalizedApiError | null>(null)
  const [checkedUserId, setCheckedUserId] = useState<number | null>(null)

  const refreshCurrentSession = useCallback(async () => {
    if (!isAuthenticated || authLoading || !user || user.mustChangePassword) {
      setCurrentSession(null)
      setError(null)
      setCheckedUserId(null)
      return null
    }

    setRequestLoading(true)
    setError(null)

    try {
      const session = await cashSessionDependencies.getCurrentCashSessionUseCase.execute()
      setCurrentSession(session)
      setCheckedUserId(user.id)
      return session
    } catch (unknownError) {
      const normalizedError = normalizeApiError(unknownError)
      setError(normalizedError)
      setCurrentSession(null)
      setCheckedUserId(user.id)
      return null
    } finally {
      setRequestLoading(false)
    }
  }, [authLoading, isAuthenticated, user])

  useEffect(() => {
    void refreshCurrentSession()
  }, [refreshCurrentSession])

  const openCashSession = useCallback(async (data: OpenCashSessionData) => {
    setRequestLoading(true)
    setError(null)

    try {
      const session = await cashSessionDependencies.openCashSessionUseCase.execute(data)
      setCurrentSession(session)
      setCheckedUserId(session.openedByUserId)
      return session
    } catch (unknownError) {
      setError(normalizeApiError(unknownError))
      return null
    } finally {
      setRequestLoading(false)
    }
  }, [])

  const clearCurrentSession = useCallback(() => {
    setCurrentSession(null)
    setError(null)
    setCheckedUserId(user?.id ?? null)
  }, [user?.id])

  const shouldCheckCurrentSession = Boolean(
    isAuthenticated && !authLoading && user && !user.mustChangePassword,
  )
  const loading = requestLoading || (shouldCheckCurrentSession && checkedUserId !== user?.id)

  const value = useMemo<CashSessionContextValue>(
    () => ({
      currentSession,
      error,
      loading,
      clearCurrentSession,
      openCashSession,
      refreshCurrentSession,
    }),
    [clearCurrentSession, currentSession, error, loading, openCashSession, refreshCurrentSession],
  )

  return createElement(CashSessionContext.Provider, { value }, children)
}

export const useCashSession = (): CashSessionContextValue => {
  const context = useContext(CashSessionContext)

  if (!context) {
    throw new Error('useCashSession debe usarse dentro de CashSessionProvider')
  }

  return context
}
