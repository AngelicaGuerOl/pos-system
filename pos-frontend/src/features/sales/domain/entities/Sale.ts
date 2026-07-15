import type { ProductUnit } from '../../../catalog/products'

export type SaleType = 'CASH' | 'CREDIT'

export type SaleStatus = 'COMPLETED' | 'PARTIALLY_RETURNED' | 'RETURNED' | 'CANCELLED'

export type SaleReceivable = {
  id: number
  originalAmount: number
  returnedAmount: number
  adjustedAmount: number
  paidAmount: number
  outstandingBalance: number
  status: 'PENDING' | 'PARTIALLY_PAID' | 'PAID' | 'CANCELLED'
}

export type SaleItem = {
  id: number
  productId: number
  productName: string
  productBarcode: string
  productUnit: ProductUnit
  quantity: number
  soldQuantity: number
  returnedQuantity: number
  returnableQuantity: number
  unitPrice: number
  lineTotal: number
}

export type Sale = {
  id: number
  cashSessionId: number
  createdById: number
  createdByUsername: string
  customerId: number | null
  customerFullName: string | null
  saleType: SaleType
  status: SaleStatus
  total: number
  cashReceived: number | null
  changeAmount: number | null
  createdAt: string
  cancelledAt?: string | null
  totalReturnedAmount: number
  receivable: SaleReceivable | null
  items: SaleItem[]
}

export type SaleSummary = {
  id: number
  createdAt: string
  createdById: number
  createdByUsername: string
  customerId: number | null
  customerFullName: string
  saleType: SaleType
  status: SaleStatus
  total: number
  totalItems: number
  receivable: SaleReceivable | null
}

export type SaleHistoryFilters = {
  id?: number
  folio?: number
  customerId?: number
  createdByUserId?: number
  status?: SaleStatus
  saleType?: SaleType
  from?: string
  to?: string
  page: number
  size: number
  sort?: string
}

export type CreateSaleItemData = {
  productId: number
  quantity: number
}

export type CreateSaleData = {
  saleType: SaleType
  customerId: number | null
  cashReceived: number | null
  items: CreateSaleItemData[]
}

export const SALE_TYPE_LABELS: Record<SaleType, string> = {
  CASH: 'Contado',
  CREDIT: 'Fiado',
}

export const SALE_STATUS_LABELS: Record<SaleStatus, string> = {
  COMPLETED: 'Completada',
  PARTIALLY_RETURNED: 'Devuelta parcialmente',
  RETURNED: 'Devuelta',
  CANCELLED: 'Cancelada',
}
