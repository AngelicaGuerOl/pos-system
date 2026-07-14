import { Navigate, type RouteObject } from 'react-router-dom'
import { ChangePasswordPage, LoginPage } from '../../features/auth'
import { CashMovementsPage } from '../../features/cash/movement'
import { OpenCashSessionPage, RequireOpenCashSession } from '../../features/cash/session'
import { CategoriesPage } from '../../features/catalog/categories'
import { ProductsPage } from '../../features/catalog/products'
import { CustomersPage } from '../../features/customers'
import { DashboardPage } from '../../features/dashboard'
import { InventoryMovementsPage } from '../../features/inventory/movement'
import { SalesHistoryPage, SalesPage } from '../../features/sales'
import { UsersPage } from '../../features/users'
import { ProtectedRoute } from '../../shared/routes/ProtectedRoute'
import { PublicRoute } from '../../shared/routes/PublicRoute'
import { RoleProtectedRoute } from '../../shared/routes/RoleProtectedRoute'
import { ROUTE_PATHS } from '../../shared/routes/routePaths'
import { DashboardLayout } from '../../shared/ui/layout/DashboardLayout'

export const appRoutes: RouteObject[] = [
  {
    path: '/',
    element: <Navigate replace to={ROUTE_PATHS.dashboard} />,
  },
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
        path: ROUTE_PATHS.changePassword,
        element: <ChangePasswordPage />,
      },
      {
        element: <DashboardLayout />,
        children: [
          {
            path: ROUTE_PATHS.dashboard,
            element: <DashboardPage />,
          },
          {
            path: ROUTE_PATHS.categories,
            element: <CategoriesPage />,
          },
          {
            path: ROUTE_PATHS.products,
            element: <ProductsPage />,
          },
          {
            path: ROUTE_PATHS.customers,
            element: <CustomersPage />,
          },
          {
            path: ROUTE_PATHS.cashSessionOpen,
            element: <OpenCashSessionPage />,
          },
          {
            element: <RoleProtectedRoute roles={['ADMIN']} />,
            children: [
              {
                path: ROUTE_PATHS.inventoryMovements,
                element: <InventoryMovementsPage />,
              },
            ],
          },
          {
            element: <RequireOpenCashSession />,
            children: [
              {
                path: ROUTE_PATHS.cashMovements,
                element: <CashMovementsPage />,
              },
              {
                path: ROUTE_PATHS.sales,
                element: <SalesPage />,
              },
            ],
          },
          {
            element: <RoleProtectedRoute roles={['ADMIN', 'CASHIER']} />,
            children: [
              {
                path: ROUTE_PATHS.salesHistory,
                element: <SalesHistoryPage />,
              },
            ],
          },
          {
            path: ROUTE_PATHS.users,
            element: <UsersPage />,
          },
        ],
      },
    ],
  },
  {
    path: '*',
    element: <Navigate replace to={ROUTE_PATHS.dashboard} />,
  },
]
