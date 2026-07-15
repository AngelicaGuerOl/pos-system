import type { ProductUnit } from '../../../../catalog/products'
import type { SaleReceivable, SaleStatus, SaleType } from '../../../domain/entities/Sale'

export type CreateSaleReturnItemRequest = {
  saleItemId: number
  quantity: number
}

export type CreateSaleReturnRequest = {
  reason: string
  items: CreateSaleReturnItemRequest[]
}

export type SaleReturnItem = {
  saleItemId: number
  productId: number
  productName: string
  productBarcode: string
  unit: ProductUnit
  quantity: number
  unitPrice: number
  subtotal: number
}

export type SaleReturnSummary = {
  id: number
  saleId: number
  saleNumber: number
  saleType: SaleType
  totalAmount: number
  cashRefundAmount: number
  reason: string
  cashSessionId: number | null
  processedByUserId: number
  processedByUsername: string
  createdAt: string
}

export type SaleReturnDetails = SaleReturnSummary & {
  customerId: number | null
  customerFullName: string | null
  saleStatus: SaleStatus
  receivable: SaleReceivable | null
  items: SaleReturnItem[]
}

export type SaleReturnFilters = {
  page: number
  size: number
  sort?: string
}
