import type { PageResponse } from '../../../../../shared/types/PageResponse'

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
  id: number
  supplierId: number
  supplierName: string
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
  productId: number
  quantity: number
  unitCost: number
  salePrice: number
}

export type SupplierEntryMutation = {
  supplierId: number
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
