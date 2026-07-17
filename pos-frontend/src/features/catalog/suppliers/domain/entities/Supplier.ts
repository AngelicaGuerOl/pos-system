import type { PageResponse } from '../../../../../shared/types/PageResponse'
import type { Product } from '../../../products/domain/entities/Product'

export type Supplier = {
  id: number
  name: string
  contactName: string | null
  phone: string | null
  email: string | null
  notes: string | null
  active: boolean
  createdAt: string
  updatedAt: string | null
}

export type SupplierMutation = {
  name: string
  contactName?: string | null
  phone?: string | null
  email?: string | null
  notes?: string | null
}

export type SupplierFilters = {
  search?: string
  active?: boolean | null
  page?: number
  size?: number
  sort?: string
}

export type SupplierInventoryBaselineItem = {
  id: number
  productId: number
  productName: string
  quantity: number
  salePriceSnapshot: number
  inventoryValue: number
}

export type SupplierInventoryBaseline = {
  id: number
  supplierId: number
  supplierName: string
  baselineDate: string
  totalSaleValue: number
  createdByUserId: number
  createdByUsername: string
  createdAt: string
  items: SupplierInventoryBaselineItem[]
}

export type SupplierInventoryBaselineItemMutation = {
  productId: number
  quantity: number
  salePrice: number
}

export type SupplierInventoryBaselineMutation = {
  baselineDate: string
  items: SupplierInventoryBaselineItemMutation[]
}

export type SupplierProductsPage = PageResponse<Product>
