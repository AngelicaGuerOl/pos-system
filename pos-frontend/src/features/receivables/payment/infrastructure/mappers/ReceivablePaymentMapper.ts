import type { PageResponse } from '../../../../../shared/types/PageResponse'
import type { ReceivableStatus } from '../../../domain/entities/Receivable'
import type {
  CreateReceivablePaymentRequest,
  ReceivablePayment,
  ReceivablePaymentFilters,
} from '../../domain/entities/ReceivablePayment'

export type BackendReceivablePaymentResponse = {
  id: number
  receivableId: number
  saleId: number
  customerId: number
  customerFullName: string
  cashSessionId: number
  receivedById: number
  receivedByUsername: string
  amount: number
  createdAt: string
  paidAmount: number
  outstandingBalance: number
  receivableStatus: ReceivableStatus
}

export type BackendCreateReceivablePaymentRequest = {
  amount: number
}

export const ReceivablePaymentMapper = {
  toEntity(response: BackendReceivablePaymentResponse): ReceivablePayment {
    return {
      id: response.id,
      receivableId: response.receivableId,
      saleId: response.saleId,
      customerId: response.customerId,
      customerFullName: response.customerFullName,
      cashSessionId: response.cashSessionId,
      receivedById: response.receivedById,
      receivedByUsername: response.receivedByUsername,
      amount: Number(response.amount),
      createdAt: response.createdAt,
      paidAmount: Number(response.paidAmount),
      outstandingBalance: Number(response.outstandingBalance),
      receivableStatus: response.receivableStatus,
    }
  },

  toPage(response: PageResponse<BackendReceivablePaymentResponse>): PageResponse<ReceivablePayment> {
    return {
      ...response,
      content: response.content.map((payment) => ReceivablePaymentMapper.toEntity(payment)),
    }
  },

  toRequest(request: CreateReceivablePaymentRequest): BackendCreateReceivablePaymentRequest {
    return {
      amount: request.amount,
    }
  },

  toParams(filters: ReceivablePaymentFilters): Record<string, string | number | undefined> {
    return {
      page: filters.page,
      size: filters.size,
      sort: filters.sort ?? 'createdAt,DESC',
    }
  },
}
