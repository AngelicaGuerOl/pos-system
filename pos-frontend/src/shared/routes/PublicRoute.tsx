import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../features/auth'
import { ROUTE_PATHS } from './routePaths'
import { LoadingScreen } from '../ui/components/LoadingScreen'

export const PublicRoute = () => {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return <LoadingScreen />
  }

  if (isAuthenticated) {
    return <Navigate replace to={ROUTE_PATHS.dashboard} />
  }

  return <Outlet />
}

