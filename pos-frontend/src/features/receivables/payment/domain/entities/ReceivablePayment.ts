import type { ReceivableStatus } from '../../../domain/entities/Receivable'

export type ReceivablePayment = {
  id: number
  receivableId: number
  saleId: number
  customerId: number
  customerFullName: string
  cashSessionId: number
  receivedById: number
  receivedByUsername: string
  amount: number
  notes: string | null
  createdAt: string
  paidAmount: number
  outstandingBalance: number
  receivableStatus: ReceivableStatus
}

export type CreateReceivablePaymentRequest = {
  amount: number
  notes?: string | null
}

export type ReceivablePaymentFilters = {
  page: number
  size: number
  sort?: string
}
