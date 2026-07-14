import type { ProductUnit } from '../../../catalog/products'

export type SaleType = 'CASH' | 'CREDIT'

export type SaleStatus = 'COMPLETED' | 'CANCELLED'

export type SaleItem = {
  id: number
  productId: number
  productName: string
  productBarcode: string
  productUnit: ProductUnit
  quantity: number
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
  cashReceived: number
  changeAmount: number
  createdAt: string
  cancelledAt?: string | null
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

export type CreateCashSaleItemData = {
  productId: number
  quantity: number
}

export type CreateCashSaleData = {
  saleType: 'CASH'
  customerId: number | null
  cashReceived: number
  items: CreateCashSaleItemData[]
}

export const SALE_TYPE_LABELS: Record<SaleType, string> = {
  CASH: 'Efectivo',
  CREDIT: 'Fiado',
}

export const SALE_STATUS_LABELS: Record<SaleStatus, string> = {
  COMPLETED: 'Completada',
  CANCELLED: 'Cancelada',
}
