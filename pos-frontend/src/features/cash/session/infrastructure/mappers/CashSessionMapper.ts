import type { CashSession, CashSessionStatus, OpenCashSessionData } from '../../domain/entities/CashSession'

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
}
