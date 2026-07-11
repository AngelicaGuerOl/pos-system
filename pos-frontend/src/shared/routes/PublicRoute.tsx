import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../features/auth'
import { ROUTE_PATHS } from './routePaths'
import { LoadingScreen } from '../ui/components/LoadingScreen'

export const PublicRoute = () => {
  const { isAuthenticated, loading, user } = useAuth()

  if (loading) {
    return <LoadingScreen />
  }

  if (isAuthenticated) {
    return (
      <Navigate
        replace
        to={user?.mustChangePassword ? ROUTE_PATHS.changePassword : ROUTE_PATHS.dashboard}
      />
    )
  }

  return <Outlet />
}
