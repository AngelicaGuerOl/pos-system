import type {
  CreateCashSaleData,
  CreateCashSaleItemData,
  Sale,
  SaleHistoryFilters,
  SaleItem,
  SaleStatus,
  SaleSummary,
  SaleType,
} from '../../domain/entities/Sale'
import type { ProductUnit } from '../../../catalog/products'

export type BackendSaleItemResponse = {
  id: number
  productId: number
  productName: string
  productBarcode: string
  productUnit: ProductUnit
  quantity: number
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
  cashReceived: number
  changeAmount: number
  createdAt: string
  cancelledAt?: string | null
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
}

export type BackendCreateCashSaleItemRequest = CreateCashSaleItemData

export type BackendCreateCashSaleRequest = {
  saleType: 'CASH'
  customerId: number | null
  cashReceived: number
  items: BackendCreateCashSaleItemRequest[]
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
      cashReceived: Number(response.cashReceived),
      changeAmount: Number(response.changeAmount),
      createdAt: response.createdAt,
      cancelledAt: response.cancelledAt ?? null,
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
      unitPrice: Number(response.unitPrice),
      lineTotal: Number(response.lineTotal),
    }
  },

  toRequest(data: CreateCashSaleData): BackendCreateCashSaleRequest {
    return {
      saleType: 'CASH',
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
      from: filters.from,
      to: filters.to,
      page: filters.page,
      size: filters.size,
      sort: filters.sort ?? 'createdAt,DESC',
    }
  },
}
