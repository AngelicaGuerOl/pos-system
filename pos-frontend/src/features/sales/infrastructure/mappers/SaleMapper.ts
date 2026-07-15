import type {
  CreateSaleData,
  CreateSaleItemData,
  Sale,
  SaleHistoryFilters,
  SaleItem,
  SaleReceivable,
  SaleStatus,
  SaleSummary,
  SaleType,
} from '../../domain/entities/Sale'
import type { ProductUnit } from '../../../catalog/products'
import { toEndOfDayISOString, toStartOfDayISOString } from '../../../../shared/utils/dateFilters'

export type BackendSaleItemResponse = {
  id: number
  productId: number
  productName: string
  productBarcode: string
  productUnit: ProductUnit
  quantity: number
  soldQuantity?: number
  returnedQuantity?: number
  returnableQuantity?: number
  unitPrice: number
  lineTotal: number
}

export type BackendSaleResponse = {
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
  totalReturnedAmount?: number | null
  receivable: BackendSaleReceivableResponse | null
  items: BackendSaleItemResponse[]
}

export type BackendSaleSummaryResponse = {
  id: number
  createdAt: string
  createdById: number
  createdByUsername: string
  customerId: number | null
  customerFullName: string | null
  saleType: SaleType
  status: SaleStatus
  total: number
  totalItems: number
  receivable: BackendSaleReceivableResponse | null
}

export type BackendSaleReceivableResponse = {
  id: number
  originalAmount: number
  returnedAmount?: number
  adjustedAmount?: number
  paidAmount: number
  outstandingBalance: number
  status: SaleReceivable['status']
}

export type BackendCreateSaleItemRequest = CreateSaleItemData

export type BackendCreateSaleRequest = {
  saleType: SaleType
  customerId: number | null
  cashReceived: number | null
  items: BackendCreateSaleItemRequest[]
}

export const SaleMapper = {
  toEntity(response: BackendSaleResponse): Sale {
    return {
      id: response.id,
      cashSessionId: response.cashSessionId,
      createdById: response.createdById,
      createdByUsername: response.createdByUsername,
      customerId: response.customerId,
      customerFullName: response.customerFullName,
      saleType: response.saleType,
      status: response.status,
      total: Number(response.total),
      cashReceived: response.cashReceived === null ? null : Number(response.cashReceived),
      changeAmount: response.changeAmount === null ? null : Number(response.changeAmount),
      createdAt: response.createdAt,
      cancelledAt: response.cancelledAt ?? null,
      totalReturnedAmount: Number(response.totalReturnedAmount ?? 0),
      receivable: response.receivable ? SaleMapper.toReceivableEntity(response.receivable) : null,
      items: response.items.map((item) => SaleMapper.toItemEntity(item)),
    }
  },

  toSummaryEntity(response: BackendSaleSummaryResponse): SaleSummary {
    return {
      id: response.id,
      createdAt: response.createdAt,
      createdById: response.createdById,
      createdByUsername: response.createdByUsername,
      customerId: response.customerId,
      customerFullName: response.customerFullName || 'Público general',
      saleType: response.saleType,
      status: response.status,
      total: Number(response.total),
      totalItems: Number(response.totalItems),
      receivable: response.receivable ? SaleMapper.toReceivableEntity(response.receivable) : null,
    }
  },

  toReceivableEntity(response: BackendSaleReceivableResponse): SaleReceivable {
    return {
      id: response.id,
      originalAmount: Number(response.originalAmount),
      returnedAmount: Number(response.returnedAmount ?? 0),
      adjustedAmount: Number(response.adjustedAmount ?? response.originalAmount),
      paidAmount: Number(response.paidAmount),
      outstandingBalance: Number(response.outstandingBalance),
      status: response.status,
    }
  },

  toItemEntity(response: BackendSaleItemResponse): SaleItem {
    return {
      id: response.id,
      productId: response.productId,
      productName: response.productName,
      productBarcode: response.productBarcode,
      productUnit: response.productUnit,
      quantity: Number(response.quantity),
      soldQuantity: Number(response.soldQuantity ?? response.quantity),
      returnedQuantity: Number(response.returnedQuantity ?? 0),
      returnableQuantity: Number(response.returnableQuantity ?? response.quantity),
      unitPrice: Number(response.unitPrice),
      lineTotal: Number(response.lineTotal),
    }
  },

  toRequest(data: CreateSaleData): BackendCreateSaleRequest {
    return {
      saleType: data.saleType,
      customerId: data.customerId,
      cashReceived: data.cashReceived,
      items: data.items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
      })),
    }
  },

  toFiltersParams(filters: SaleHistoryFilters): Record<string, string | number | undefined> {
    return {
      id: filters.id,
      folio: filters.folio,
      customerId: filters.customerId,
      createdByUserId: filters.createdByUserId,
      status: filters.status,
      saleType: filters.saleType,
      from: toStartOfDayISOString(filters.from),
      to: toEndOfDayISOString(filters.to),
      page: filters.page,
      size: filters.size,
      sort: filters.sort ?? 'createdAt,DESC',
    }
  },
}
