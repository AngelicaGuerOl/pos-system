import type { PageResponse } from '../../../../shared/types/PageResponse'
import type {
  CustomerReceivableFilters,
  Receivable,
  ReceivableFilters,
  ReceivableStatus,
} from '../../domain/entities/Receivable'

export type BackendReceivableResponse = {
  id: number
  saleId: number
  customerId: number
  customerFullName: string
  originalAmount: number
  returnedAmount?: number
  adjustedAmount?: number
  paidAmount: number
  outstandingBalance: number
  status: ReceivableStatus
  createdAt: string
  paidAt: string | null
}

const toParams = (
  filters: ReceivableFilters | CustomerReceivableFilters,
): Record<string, string | number | undefined> => ({
  customerId: 'customerId' in filters ? filters.customerId : undefined,
  saleId: 'saleId' in filters ? filters.saleId : undefined,
  status: filters.status,
  from: 'from' in filters ? filters.from : undefined,
  to: 'to' in filters ? filters.to : undefined,
  page: filters.page,
  size: filters.size,
  sort: filters.sort ?? 'createdAt,DESC',
})

export const ReceivableMapper = {
  toEntity(response: BackendReceivableResponse): Receivable {
    return {
      id: response.id,
      saleId: response.saleId,
      customerId: response.customerId,
      customerFullName: response.customerFullName,
      originalAmount: Number(response.originalAmount),
      returnedAmount: Number(response.returnedAmount ?? 0),
      adjustedAmount: Number(response.adjustedAmount ?? response.originalAmount),
      paidAmount: Number(response.paidAmount),
      outstandingBalance: Number(response.outstandingBalance),
      status: response.status,
      createdAt: response.createdAt,
      paidAt: response.paidAt ?? null,
    }
  },

  toPage(response: PageResponse<BackendReceivableResponse>): PageResponse<Receivable> {
    return {
      ...response,
      content: response.content.map((receivable) => ReceivableMapper.toEntity(receivable)),
    }
  },

  toParams,
}
