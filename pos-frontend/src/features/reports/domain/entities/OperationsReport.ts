export type OperationsReportFilters = {
  from: string
  to: string
  cashierId?: number
}

export type OperationsReportPeriod = {
  from: string
  to: string
  cashierId: number | null
  cashierUsername: string | null
}

export type OperationsReportSales = {
  cashSalesAmount: number
  creditSalesAmount: number
  grossSalesAmount: number
  cancelledSalesAmount: number
  returnedAmount: number
  netSalesAmount: number
  salesCount: number
  returnsCount: number
  cancellationsCount: number
}

export type OperationsReportReceivables = {
  creditGeneratedAmount: number
  receivablePaymentsAmount: number
  outstandingGeneratedAmount: number
}

export type OperationsReportCash = {
  cashSalesAmount: number
  receivablePaymentsAmount: number
  manualInflowsAmount: number
  manualOutflowsAmount: number
  returnRefundsAmount: number
  cancellationRefundsAmount: number
  totalInflows: number
  totalOutflows: number
  netCashFlow: number
}

export type OperationsReport = {
  period: OperationsReportPeriod
  sales: OperationsReportSales
  receivables: OperationsReportReceivables
  cash: OperationsReportCash
}
