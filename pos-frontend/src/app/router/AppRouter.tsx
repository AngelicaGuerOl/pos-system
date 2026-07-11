import { useRoutes } from 'react-router-dom'
import { appRoutes } from './routes'

export const AppRouter = () => {
  return useRoutes(appRoutes)
}

