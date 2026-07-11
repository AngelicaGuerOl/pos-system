import { Navigate, type RouteObject } from 'react-router-dom'
import { LoginPage } from '../../features/auth'
import { ProtectedRoute } from '../../shared/routes/ProtectedRoute'
import { PublicRoute } from '../../shared/routes/PublicRoute'
import { ROUTE_PATHS } from '../../shared/routes/routePaths'
import { DashboardPage } from '../../shared/ui/pages/DashboardPage'

export const appRoutes: RouteObject[] = [
  {
    element: <PublicRoute />,
    children: [
      {
        path: ROUTE_PATHS.login,
        element: <LoginPage />,
      },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: ROUTE_PATHS.dashboard,
        element: <DashboardPage />,
      },
    ],
  },
  {
    path: '*',
    element: <Navigate replace to={ROUTE_PATHS.dashboard} />,
  },
]
