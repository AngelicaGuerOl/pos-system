import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../features/auth'
import { ROUTE_PATHS } from './routePaths'
import { LoadingScreen } from '../ui/components/LoadingScreen'

export const ProtectedRoute = () => {
  const location = useLocation()
  const { isAuthenticated, loading, user } = useAuth()

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

  return <Outlet />
}
