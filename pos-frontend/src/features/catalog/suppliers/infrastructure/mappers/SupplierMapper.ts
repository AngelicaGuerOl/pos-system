import type { PageResponse } from '../../../../../shared/types/PageResponse'
import { ProductMapper, type BackendProductResponse } from '../../../products/infrastructure/mappers/ProductMapper'
import type {
  Supplier,
  SupplierInventoryBaseline,
  SupplierInventoryBaselineMutation,
  SupplierMutation,
} from '../../domain/entities/Supplier'

export type BackendSupplierResponse = {
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

export type BackendSupplierInventoryBaselineResponse = {
  id: number
  supplierId: number
  supplierName: string
  baselineDate: string
  totalSaleValue: number
  createdByUserId: number
  createdByUsername: string
  createdAt: string
  items: Array<{
    id: number
    productId: number
    productName: string
    quantity: number
    salePriceSnapshot: number
    inventoryValue: number
  }>
}

const cleanOptional = (value?: string | null): string | null => {
  const trimmed = value?.trim() ?? ''
  return trimmed.length > 0 ? trimmed : null
}

export const SupplierMapper = {
  toEntity(response: BackendSupplierResponse): Supplier {
    return {
      ...response,
      contactName: response.contactName,
      phone: response.phone,
      email: response.email,
      notes: response.notes,
    }
  },

  toPage(response: PageResponse<BackendSupplierResponse>): PageResponse<Supplier> {
    return {
      ...response,
      content: response.content.map((supplier) => SupplierMapper.toEntity(supplier)),
    }
  },

  toRequest(data: SupplierMutation): SupplierMutation {
    return {
      name: data.name.trim(),
      contactName: cleanOptional(data.contactName),
      phone: cleanOptional(data.phone),
      email: cleanOptional(data.email),
      notes: cleanOptional(data.notes),
    }
  },

  toBaseline(response: BackendSupplierInventoryBaselineResponse): SupplierInventoryBaseline {
    return {
      ...response,
      totalSaleValue: Number(response.totalSaleValue),
      items: response.items.map((item) => ({
        ...item,
        quantity: Number(item.quantity),
        salePriceSnapshot: Number(item.salePriceSnapshot),
        inventoryValue: Number(item.inventoryValue),
      })),
    }
  },

  toBaselineRequest(data: SupplierInventoryBaselineMutation): SupplierInventoryBaselineMutation {
    return {
      baselineDate: data.baselineDate,
      items: data.items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        salePrice: item.salePrice,
      })),
    }
  },

  toProductsPage(response: PageResponse<BackendProductResponse>) {
    return ProductMapper.toPage(response)
  },
}
