import type { PageResponse } from '../../../../../shared/types/PageResponse'
import type { ProductUnit } from '../../../../catalog/products/domain/entities/Product'

export type SupplierSettlementStatus = 'DRAFT' | 'FINALIZED'

export type SupplierSettlementItem = {
  id: number
  productId: number
  productNameSnapshot: string
  barcodeSnapshot: string | null
  unitSnapshot: ProductUnit
  openingQuantity: number
  openingSalePrice: number
  openingValue: number
  receivedQuantity: number
  receivedSaleValue: number
  availableQuantity: number
  closingQuantity: number | null
  closingSalePrice: number
  closingValue: number
  quantityToJustify: number
  expectedAmount: number
  hasDiscrepancy: boolean
}

export type SupplierSettlement = {
  id: number
  supplierId: number
  supplierName: string
  periodStart: string
  periodEnd: string
  status: SupplierSettlementStatus
  openingInventoryValue: number
  entriesSaleValue: number
  availableInventoryValue: number
  closingInventoryValue: number
  expectedAmount: number
  deliveredAmount: number | null
  differenceAmount: number | null
  notes: string | null
  hasDiscrepancies: boolean
  createdByUserId: number
  createdByUsername: string
  finalizedByUserId: number | null
  finalizedByUsername: string | null
  createdAt: string
  finalizedAt: string | null
  historicalImport: boolean
  sourceFile: string | null
  sourceSheet: string | null
  items: SupplierSettlementItem[]
}

export type SupplierSettlementCreateMutation = {
  supplierId: number
  periodEnd: string
}

export type SupplierSettlementItemUpdateMutation = {
  productId: number
  closingQuantity: number
  closingSalePrice: number
}

export type SupplierSettlementUpdateMutation = {
  items: SupplierSettlementItemUpdateMutation[]
  deliveredAmount?: number | null
  notes?: string | null
}

export type SupplierSettlementFilters = {
  supplierId?: number | null
  status?: SupplierSettlementStatus | null
  from?: string
  to?: string
  page?: number
  size?: number
  sort?: string
}

export type SupplierSettlementPageResponse = PageResponse<SupplierSettlement>
