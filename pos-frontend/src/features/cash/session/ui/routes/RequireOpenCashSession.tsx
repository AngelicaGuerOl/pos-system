import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { ROUTE_PATHS } from '../../../../../shared/routes/routePaths'
import { LoadingScreen } from '../../../../../shared/ui/components/LoadingScreen'
import { useCashSession } from '../hooks/useCashSession'

export const RequireOpenCashSession = () => {
  const location = useLocation()
  const { currentSession, loading } = useCashSession()

  if (loading) {
    return <LoadingScreen />
  }

  if (!currentSession) {
    return <Navigate replace state={{ from: location }} to={ROUTE_PATHS.cashSessionOpen} />
  }

  return <Outlet />
}
