import type { UserRole } from '../../../auth'
import type { CashSessionStatus } from '../../../cash/session'
import type { ProductUnit } from '../../../catalog/products'
import type { SaleStatus, SaleType } from '../../../sales'

export type DashboardSalesSummary = {
  salesCount: number
  cashSalesAmount: number
  creditSalesAmount: number
  totalSalesAmount: number
}

export type DashboardReceivablesSummary = {
  pendingAmount: number
  pendingAccountsCount: number
}

export type DashboardLowStockProduct = {
  id: number
  name: string
  currentStock: number
  minimumStock: number
  unit: ProductUnit
}

export type DashboardInventorySummary = {
  lowStockCount: number
  lowStockProducts: DashboardLowStockProduct[]
}

export type DashboardOpenCashSession = {
  sessionId: number
  username: string
  openedAt: string
  openingAmount: number
  expectedCash: number
}

export type DashboardCashSummary = {
  openSessionsCount: number
  openSessions: DashboardOpenCashSession[]
}

export type DashboardCurrentCashSession = {
  open: boolean
  sessionId: number | null
  status: CashSessionStatus | null
  openedAt: string | null
  openingAmount: number
  totalInflows: number
  totalOutflows: number
  expectedCash: number
}

export type DashboardRecentSale = {
  id: number
  createdAt: string
  cashierUsername: string
  customerName: string
  saleType: SaleType
  total: number
  status: SaleStatus
}

export type DashboardAdminSummary = {
  todaySales: DashboardSalesSummary
  receivables: DashboardReceivablesSummary
  inventory: DashboardInventorySummary
  cash: DashboardCashSummary
  recentSales: DashboardRecentSale[]
}

export type DashboardCashierSummary = {
  currentCashSession: DashboardCurrentCashSession
  currentSessionSales: DashboardSalesSummary
  recentSales: DashboardRecentSale[]
}

export type DashboardSummary = {
  role: UserRole
  generatedAt: string
  adminSummary: DashboardAdminSummary | null
  cashierSummary: DashboardCashierSummary | null
}
