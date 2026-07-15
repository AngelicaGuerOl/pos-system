export type CashSessionStatus = 'OPEN' | 'CLOSED'

export type CashSession = {
  id: number
  openedByUserId: number
  openedByUsername: string
  openingAmount: number
  openedAt: string
  status: CashSessionStatus
  closedByUserId: number | null
  closedByUsername: string | null
  closedAt: string | null
  expectedCash: number | null
  countedCash: number | null
  cashDifference: number | null
}

export type OpenCashSessionData = {
  openingAmount: number
}

export type CloseCashSessionData = {
  countedAmount: number
  notes: string | null
}

export type CashSessionFilters = {
  page?: number
  size?: number
  sort?: string
}

export type CashSessionSalesSummary = {
  cashSalesAmount: number
  creditSalesAmount: number
  totalSalesAmount: number
}

export type CashSessionOperationsSummary = {
  returnsProcessedAmount: number
  returnCashRefundAmount: number
  cancellationsProcessedAmount: number
  cancellationCashRefundAmount: number
}

export type CashSessionCashSummary = {
  cashSalesAmount: number
  receivablePaymentsAmount: number
  manualInflowsAmount: number
  totalInflows: number
  manualOutflowsAmount: number
  saleRefundsAmount: number
  saleCancellationRefundsAmount: number
  totalOutflows: number
  expectedAmount: number
}

export type CashSessionClosingSummary = {
  sessionId: number
  status: CashSessionStatus
  openedAt: string
  closedAt: string | null
  openedByUsername: string
  closedByUsername: string | null
  openingAmount: number
  salesSummary: CashSessionSalesSummary
  operationsSummary: CashSessionOperationsSummary
  cashSummary: CashSessionCashSummary
  countedAmount: number | null
  differenceAmount: number | null
  notes: string | null
}

export const CASH_SESSION_STATUS_LABELS: Record<CashSessionStatus, string> = {
  OPEN: 'Abierta',
  CLOSED: 'Cerrada',
}
