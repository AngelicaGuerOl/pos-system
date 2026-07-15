import type { PageResponse } from '../../../../../shared/types/PageResponse'
import type {
  CashSession,
  CashSessionCashSummary,
  CashSessionClosingSummary,
  CashSessionFilters,
  CashSessionOperationsSummary,
  CashSessionSalesSummary,
  CashSessionStatus,
  CloseCashSessionData,
  OpenCashSessionData,
} from '../../domain/entities/CashSession'

export type BackendCashSessionResponse = {
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

export type BackendOpenCashSessionRequest = {
  openingAmount: number
}

export type BackendCloseCashSessionRequest = {
  countedAmount: number
  notes: string | null
}

export type BackendCashSessionSalesSummary = {
  cashSalesAmount: number
  creditSalesAmount: number
  totalSalesAmount: number
}

export type BackendCashSessionOperationsSummary = {
  returnsProcessedAmount: number
  returnCashRefundAmount: number
  cancellationsProcessedAmount: number
  cancellationCashRefundAmount: number
}

export type BackendCashSessionCashSummary = {
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

export type BackendCashSessionClosingSummaryResponse = {
  sessionId: number
  status: CashSessionStatus
  openedAt: string
  closedAt: string | null
  openedByUsername: string
  closedByUsername: string | null
  openingAmount: number
  salesSummary: BackendCashSessionSalesSummary
  operationsSummary: BackendCashSessionOperationsSummary
  cashSummary: BackendCashSessionCashSummary
  countedAmount: number | null
  differenceAmount: number | null
  notes: string | null
}

export const CashSessionMapper = {
  toEntity(response: BackendCashSessionResponse): CashSession {
    return {
      id: response.id,
      openedByUserId: response.openedByUserId,
      openedByUsername: response.openedByUsername,
      openingAmount: response.openingAmount,
      openedAt: response.openedAt,
      status: response.status,
      closedByUserId: response.closedByUserId,
      closedByUsername: response.closedByUsername,
      closedAt: response.closedAt,
      expectedCash: response.expectedCash,
      countedCash: response.countedCash,
      cashDifference: response.cashDifference,
    }
  },

  toRequest(data: OpenCashSessionData): BackendOpenCashSessionRequest {
    return {
      openingAmount: data.openingAmount,
    }
  },

  toCloseRequest(data: CloseCashSessionData): BackendCloseCashSessionRequest {
    return {
      countedAmount: data.countedAmount,
      notes: data.notes,
    }
  },

  toClosingSummary(response: BackendCashSessionClosingSummaryResponse): CashSessionClosingSummary {
    return {
      sessionId: response.sessionId,
      status: response.status,
      openedAt: response.openedAt,
      closedAt: response.closedAt,
      openedByUsername: response.openedByUsername,
      closedByUsername: response.closedByUsername,
      openingAmount: Number(response.openingAmount),
      salesSummary: CashSessionMapper.toSalesSummary(response.salesSummary),
      operationsSummary: CashSessionMapper.toOperationsSummary(response.operationsSummary),
      cashSummary: CashSessionMapper.toCashSummary(response.cashSummary),
      countedAmount: response.countedAmount === null ? null : Number(response.countedAmount),
      differenceAmount: response.differenceAmount === null ? null : Number(response.differenceAmount),
      notes: response.notes,
    }
  },

  toSalesSummary(response: BackendCashSessionSalesSummary): CashSessionSalesSummary {
    return {
      cashSalesAmount: Number(response.cashSalesAmount),
      creditSalesAmount: Number(response.creditSalesAmount),
      totalSalesAmount: Number(response.totalSalesAmount),
    }
  },

  toOperationsSummary(response: BackendCashSessionOperationsSummary): CashSessionOperationsSummary {
    return {
      returnsProcessedAmount: Number(response.returnsProcessedAmount),
      returnCashRefundAmount: Number(response.returnCashRefundAmount),
      cancellationsProcessedAmount: Number(response.cancellationsProcessedAmount),
      cancellationCashRefundAmount: Number(response.cancellationCashRefundAmount),
    }
  },

  toCashSummary(response: BackendCashSessionCashSummary): CashSessionCashSummary {
    return {
      cashSalesAmount: Number(response.cashSalesAmount),
      receivablePaymentsAmount: Number(response.receivablePaymentsAmount),
      manualInflowsAmount: Number(response.manualInflowsAmount),
      totalInflows: Number(response.totalInflows),
      manualOutflowsAmount: Number(response.manualOutflowsAmount),
      saleRefundsAmount: Number(response.saleRefundsAmount),
      saleCancellationRefundsAmount: Number(response.saleCancellationRefundsAmount),
      totalOutflows: Number(response.totalOutflows),
      expectedAmount: Number(response.expectedAmount),
    }
  },

  toPage(response: PageResponse<BackendCashSessionResponse>): PageResponse<CashSession> {
    return {
      ...response,
      content: response.content.map(CashSessionMapper.toEntity),
    }
  },

  toFiltersParams(filters: CashSessionFilters): Record<string, string | number | undefined> {
    return {
      page: filters.page ?? 0,
      size: filters.size ?? 10,
      sort: filters.sort ?? 'openedAt,DESC',
    }
  },
}
