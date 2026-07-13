import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../features/auth'
import { useCashSession } from '../../features/cash/session'
import { ROUTE_PATHS } from './routePaths'
import { LoadingScreen } from '../ui/components/LoadingScreen'

export const ProtectedRoute = () => {
  const location = useLocation()
  const { isAuthenticated, loading, user } = useAuth()
  const { currentSession, loading: cashSessionLoading } = useCashSession()

  if (loading) {
    return <LoadingScreen />
  }

  if (!isAuthenticated) {
    return <Navigate replace state={{ from: location }} to={ROUTE_PATHS.login} />
  }

  if (
    user?.mustChangePassword &&
    location.pathname !== ROUTE_PATHS.changePassword
  ) {
    return <Navigate replace to={ROUTE_PATHS.changePassword} />
  }

  if (
    user &&
    !user.mustChangePassword &&
    location.pathname === ROUTE_PATHS.changePassword
  ) {
    return <Navigate replace to={ROUTE_PATHS.dashboard} />
  }

  if (user?.role === 'CASHIER' && !user.mustChangePassword) {
    if (cashSessionLoading) {
      return <LoadingScreen />
    }

    if (!currentSession && location.pathname !== ROUTE_PATHS.cashSessionOpen) {
      return <Navigate replace state={{ from: location }} to={ROUTE_PATHS.cashSessionOpen} />
    }
  }

  return <Outlet />
}
