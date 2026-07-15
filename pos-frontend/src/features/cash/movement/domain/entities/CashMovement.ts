export type CashMovementDirection = 'INFLOW' | 'OUTFLOW'

export type CashMovementType =
  | 'MANUAL_ENTRY'
  | 'MANUAL_EXIT'
  | 'CASH_SALE'
  | 'RECEIVABLE_PAYMENT'
  | 'CASH_REFUND'
  | 'SALE_REFUND'
  | 'SALE_CANCELLATION_REFUND'

export type CashMovement = {
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

export type ManualCashMovementData = {
  amount: number
  description: string
}

export type CurrentCashSummary = {
  sessionId: number
  openingAmount: number
  totalInflows: number
  totalOutflows: number
  expectedCash: number
}

export type CashMovementFilters = {
  page?: number
  size?: number
  sort?: string
}

export const CASH_MOVEMENT_DIRECTION_LABELS: Record<CashMovementDirection, string> = {
  INFLOW: 'Entrada',
  OUTFLOW: 'Salida',
}

export const CASH_MOVEMENT_TYPE_LABELS: Record<CashMovementType, string> = {
  MANUAL_ENTRY: 'Entrada manual',
  MANUAL_EXIT: 'Salida manual',
  CASH_SALE: 'Venta en efectivo',
  RECEIVABLE_PAYMENT: 'Abono en efectivo',
  CASH_REFUND: 'Devolucion en efectivo',
  SALE_REFUND: 'Reembolso por devolucion',
  SALE_CANCELLATION_REFUND: 'Reembolso por cancelacion',
}
