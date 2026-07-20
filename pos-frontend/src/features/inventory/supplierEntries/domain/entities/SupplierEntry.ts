import type { PageResponse } from '../../../../../shared/types/PageResponse'
import type { ProductUnit } from '../../../../catalog/products/domain/entities/Product'

export type SupplierEntryType = 'SUPPLIER_PURCHASE' | 'INITIAL_INVENTORY'

export type SupplierEntryItem = {
  id: number
  productId: number
  productName: string
  quantity: number
  unitCost: number
  costKnown: boolean
  salePrice: number
  costSubtotal: number
  saleValueSubtotal: number
}

export type SupplierEntry = {
  id: number | null
  entryType: SupplierEntryType
  supplierId: number | null
  supplierName: string | null
  entryDate: string
  registeredByUserId: number
  registeredByUsername: string
  totalCost: number
  totalSaleValue: number
  notes: string | null
  createdAt: string
  historicalImport: boolean
  sourceFile: string | null
  sourceSheet: string | null
  items: SupplierEntryItem[]
}

export type SupplierEntryItemMutation = {
  productId: number | null
  newProduct?: {
    barcode: string
    name: string
    categoryId: number
    unit: ProductUnit
    minimumStock?: number
  } | null
  quantity: number
  unitCost: number
  salePrice: number
}

export type SupplierEntryMutation = {
  entryType: SupplierEntryType
  supplierId: number | null
  entryDate: string
  notes?: string | null
  items: SupplierEntryItemMutation[]
}

export type SupplierEntryFilters = {
  supplierId?: number | null
  from?: string
  to?: string
  productId?: number | null
  page?: number
  size?: number
  sort?: string
}

export type SupplierEntryPageResponse = PageResponse<SupplierEntry>
