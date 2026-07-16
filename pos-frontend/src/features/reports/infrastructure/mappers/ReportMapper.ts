import type {
  OperationsReport,
  OperationsReportFilters,
} from '../../domain/entities/OperationsReport'

export type BackendOperationsReportResponse = {
  period: {
    from: string
    to: string
    cashierId: number | null
    cashierUsername: string | null
  }
  sales: {
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
  receivables: {
    creditGeneratedAmount: number
    receivablePaymentsAmount: number
    outstandingGeneratedAmount: number
  }
  cash: {
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
}

export type BackendOperationsReportParams = {
  from: string
  to: string
  cashierId?: number
}

export const ReportMapper = {
  toEntity(response: BackendOperationsReportResponse): OperationsReport {
    return {
      period: {
        from: response.period.from,
        to: response.period.to,
        cashierId: response.period.cashierId,
        cashierUsername: response.period.cashierUsername,
      },
      sales: {
        cashSalesAmount: response.sales.cashSalesAmount,
        creditSalesAmount: response.sales.creditSalesAmount,
        grossSalesAmount: response.sales.grossSalesAmount,
        cancelledSalesAmount: response.sales.cancelledSalesAmount,
        returnedAmount: response.sales.returnedAmount,
        netSalesAmount: response.sales.netSalesAmount,
        salesCount: response.sales.salesCount,
        returnsCount: response.sales.returnsCount,
        cancellationsCount: response.sales.cancellationsCount,
      },
      receivables: {
        creditGeneratedAmount: response.receivables.creditGeneratedAmount,
        receivablePaymentsAmount: response.receivables.receivablePaymentsAmount,
        outstandingGeneratedAmount: response.receivables.outstandingGeneratedAmount,
      },
      cash: {
        cashSalesAmount: response.cash.cashSalesAmount,
        receivablePaymentsAmount: response.cash.receivablePaymentsAmount,
        manualInflowsAmount: response.cash.manualInflowsAmount,
        manualOutflowsAmount: response.cash.manualOutflowsAmount,
        returnRefundsAmount: response.cash.returnRefundsAmount,
        cancellationRefundsAmount: response.cash.cancellationRefundsAmount,
        totalInflows: response.cash.totalInflows,
        totalOutflows: response.cash.totalOutflows,
        netCashFlow: response.cash.netCashFlow,
      },
    }
  },

  toParams(filters: OperationsReportFilters): BackendOperationsReportParams {
    return {
      from: filters.from,
      to: filters.to,
      cashierId: filters.cashierId,
    }
  },
}
