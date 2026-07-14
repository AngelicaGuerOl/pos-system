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
  items: SaleItem[]
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
