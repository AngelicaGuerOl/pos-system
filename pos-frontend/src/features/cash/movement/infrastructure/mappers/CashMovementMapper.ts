import type { PageResponse } from '../../../../../shared/types/PageResponse'
import type {
  CashMovement,
  CashMovementDirection,
  CashMovementType,
  CurrentCashSummary,
  ManualCashMovementData,
} from '../../domain/entities/CashMovement'

export type BackendCashMovementResponse = {
  id: number
  cashSessionId: number
  createdById: number
  createdByUsername: string
  direction: CashMovementDirection
  type: CashMovementType
  amount: number
  description: string
  sourceType: string | null
  sourceId: number | null
  createdAt: string
}

export type BackendCurrentCashSummaryResponse = {
  sessionId: number
  openingAmount: number
  totalInflows: number
  totalOutflows: number
  expectedCash: number
}

export type BackendManualCashMovementRequest = {
  amount: number
  description: string
}

export const CashMovementMapper = {
  toEntity(response: BackendCashMovementResponse): CashMovement {
    return {
      id: response.id,
      cashSessionId: response.cashSessionId,
      createdById: response.createdById,
      createdByUsername: response.createdByUsername,
      direction: response.direction,
      type: response.type,
      amount: response.amount,
      description: response.description,
      sourceType: response.sourceType,
      sourceId: response.sourceId,
      createdAt: response.createdAt,
    }
  },

  toSummary(response: BackendCurrentCashSummaryResponse): CurrentCashSummary {
    return {
      sessionId: response.sessionId,
      openingAmount: response.openingAmount,
      totalInflows: response.totalInflows,
      totalOutflows: response.totalOutflows,
      expectedCash: response.expectedCash,
    }
  },

  toPage(response: PageResponse<BackendCashMovementResponse>): PageResponse<CashMovement> {
    return {
      ...response,
      content: response.content.map(CashMovementMapper.toEntity),
    }
  },

  toRequest(data: ManualCashMovementData): BackendManualCashMovementRequest {
    return {
      amount: data.amount,
      description: data.description.trim(),
    }
  },
}
