export type ReceivableStatus = 'PENDING' | 'PARTIALLY_PAID' | 'PAID' | 'CANCELLED'

export type ReceivableCustomer = {
  id: number
  firstName: string
  lastName: string
  fullName: string
  phone: string | null
}

export type Receivable = {
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

export type ReceivableDetail = Receivable & {
  folio: number
  registeredByUserId: number
  registeredByUsername: string
  saleCreatedAt: string
  customer: ReceivableCustomer
}

export type ReceivableFilters = {
  customerId?: number
  saleId?: number
  status?: ReceivableStatus
  from?: string
  to?: string
  page: number
  size: number
  sort?: string
}

export type CustomerReceivableFilters = {
  status?: ReceivableStatus
  page: number
  size: number
  sort?: string
}

export const RECEIVABLE_STATUS_LABELS: Record<ReceivableStatus, string> = {
  PENDING: 'Pendiente',
  PARTIALLY_PAID: 'Parcialmente pagada',
  PAID: 'Pagada',
  CANCELLED: 'Cancelada',
}
