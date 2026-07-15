import type { PageResponse } from '../../../../../shared/types/PageResponse'
import type {
  CreateSaleReturnRequest,
  SaleReturnDetails,
  SaleReturnFilters,
  SaleReturnItem,
  SaleReturnSummary,
} from '../../domain/entities/SaleReturn'
import { SaleMapper, type BackendSaleReceivableResponse } from '../../../infrastructure/mappers/SaleMapper'
import type { ProductUnit } from '../../../../catalog/products'
import type { SaleStatus, SaleType } from '../../../domain/entities/Sale'

type BackendSaleReturnItemResponse = {
  saleItemId: number
  productId: number
  productName: string
  productBarcode: string
  unit: ProductUnit
  quantity: number
  unitPrice: number
  subtotal: number
}

export type BackendSaleReturnSummaryResponse = {
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

export type BackendSaleReturnDetailResponse = BackendSaleReturnSummaryResponse & {
  customerId: number | null
  customerFullName: string | null
  saleStatus: SaleStatus
  receivable: BackendSaleReceivableResponse | null
  items: BackendSaleReturnItemResponse[]
}

type BackendCreateSaleReturnRequest = {
  reason: string
  items: Array<{
    saleItemId: number
    quantity: number
  }>
}

export const SaleReturnMapper = {
  toRequest(request: CreateSaleReturnRequest): BackendCreateSaleReturnRequest {
    return {
      reason: request.reason.trim(),
      items: request.items.map((item) => ({
        saleItemId: item.saleItemId,
        quantity: item.quantity,
      })),
    }
  },

  toSummaryEntity(response: BackendSaleReturnSummaryResponse): SaleReturnSummary {
    return {
      id: response.id,
      saleId: response.saleId,
      saleNumber: response.saleNumber,
      saleType: response.saleType,
      totalAmount: Number(response.totalAmount),
      cashRefundAmount: Number(response.cashRefundAmount),
      reason: response.reason,
      cashSessionId: response.cashSessionId,
      processedByUserId: response.processedByUserId,
      processedByUsername: response.processedByUsername,
      createdAt: response.createdAt,
    }
  },

  toDetailEntity(response: BackendSaleReturnDetailResponse): SaleReturnDetails {
    return {
      ...SaleReturnMapper.toSummaryEntity(response),
      customerId: response.customerId,
      customerFullName: response.customerFullName,
      saleStatus: response.saleStatus,
      receivable: response.receivable ? SaleMapper.toReceivableEntity(response.receivable) : null,
      items: response.items.map((item) => SaleReturnMapper.toItemEntity(item)),
    }
  },

  toItemEntity(response: BackendSaleReturnItemResponse): SaleReturnItem {
    return {
      saleItemId: response.saleItemId,
      productId: response.productId,
      productName: response.productName,
      productBarcode: response.productBarcode,
      unit: response.unit,
      quantity: Number(response.quantity),
      unitPrice: Number(response.unitPrice),
      subtotal: Number(response.subtotal),
    }
  },

  toPage(response: PageResponse<BackendSaleReturnSummaryResponse>): PageResponse<SaleReturnSummary> {
    return {
      ...response,
      content: response.content.map((saleReturn) => SaleReturnMapper.toSummaryEntity(saleReturn)),
    }
  },

  toParams(filters: SaleReturnFilters): Record<string, string | number> {
    return {
      page: filters.page,
      size: filters.size,
      sort: filters.sort ?? 'createdAt,DESC',
    }
  },
}
