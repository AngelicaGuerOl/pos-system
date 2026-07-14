import type { PageResponse } from '../../../../shared/types/PageResponse'
import type {
  CustomerReceivableFilters,
  Receivable,
  ReceivableCustomer,
  ReceivableDetail,
  ReceivableFilters,
  ReceivableStatus,
} from '../../domain/entities/Receivable'

export type BackendReceivableCustomerResponse = {
  id: number
  firstName: string
  lastName: string
  fullName: string
  phone: string | null
}

export type BackendReceivableResponse = {
  id: number
  saleId: number
  customerId: number
  customerFullName: string
  originalAmount: number
  paidAmount: number
  outstandingBalance: number
  status: ReceivableStatus
  createdAt: string
  paidAt: string | null
}

export type BackendReceivableDetailResponse = BackendReceivableResponse & {
  folio: number
  registeredByUserId: number
  registeredByUsername: string
  saleCreatedAt: string
  customer: BackendReceivableCustomerResponse
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
      paidAmount: Number(response.paidAmount),
      outstandingBalance: Number(response.outstandingBalance),
      status: response.status,
      createdAt: response.createdAt,
      paidAt: response.paidAt ?? null,
    }
  },

  toDetailEntity(response: BackendReceivableDetailResponse): ReceivableDetail {
    return {
      ...ReceivableMapper.toEntity(response),
      folio: response.folio,
      registeredByUserId: response.registeredByUserId,
      registeredByUsername: response.registeredByUsername,
      saleCreatedAt: response.saleCreatedAt,
      customer: ReceivableMapper.toCustomerEntity(response.customer),
    }
  },

  toCustomerEntity(response: BackendReceivableCustomerResponse): ReceivableCustomer {
    return {
      id: response.id,
      firstName: response.firstName,
      lastName: response.lastName,
      fullName: response.fullName,
      phone: response.phone,
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
