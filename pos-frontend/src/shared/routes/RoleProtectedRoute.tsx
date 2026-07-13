import { Navigate, Outlet } from 'react-router-dom'
import type { UserRole } from '../../features/auth'
import { useAuth } from '../../features/auth'
import { ROUTE_PATHS } from './routePaths'

type RoleProtectedRouteProps = {
  roles: UserRole[]
}

export const RoleProtectedRoute = ({ roles }: RoleProtectedRouteProps) => {
  const { user } = useAuth()

  if (!user || !roles.includes(user.role)) {
    return <Navigate replace to={ROUTE_PATHS.dashboard} />
  }

  return <Outlet />
}
