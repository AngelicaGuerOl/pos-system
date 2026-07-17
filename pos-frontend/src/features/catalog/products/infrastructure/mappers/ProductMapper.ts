import type { PageResponse } from '../../../../../shared/types/PageResponse'
import type { Product, ProductMutation, ProductUnit } from '../../domain/entities/Product'

export type BackendProductResponse = {
  id: number
  categoryId: number
  categoryName: string
  supplierId: number | null
  supplierName: string | null
  barcode: string
  name: string
  description: string | null
  unit: ProductUnit
  costPrice: number
  costPriceKnown?: boolean
  salePrice: number
  currentStock: number
  minimumStock: number
  active: boolean
  createdAt: string
  updatedAt: string | null
}

export type BackendProductRequest = {
  categoryId: number
  supplierId?: number | null
  barcode: string
  name: string
  description?: string | null
  unit: ProductUnit
  costPrice: number
  salePrice: number
  currentStock: number
  minimumStock: number
}

export type BackendProductUpdateRequest = Omit<BackendProductRequest, 'currentStock'>

export const ProductMapper = {
  toEntity(response: BackendProductResponse): Product {
    return {
      id: response.id,
      categoryId: response.categoryId,
      categoryName: response.categoryName,
      supplierId: response.supplierId,
      supplierName: response.supplierName,
      barcode: response.barcode,
      name: response.name,
      description: response.description,
      unit: response.unit,
      costPrice: Number(response.costPrice),
      costPriceKnown: response.costPriceKnown ?? true,
      salePrice: Number(response.salePrice),
      currentStock: Number(response.currentStock),
      minimumStock: Number(response.minimumStock),
      active: response.active,
      createdAt: response.createdAt,
      updatedAt: response.updatedAt,
    }
  },

  toPage(response: PageResponse<BackendProductResponse>): PageResponse<Product> {
    return {
      ...response,
      content: response.content.map((product) => ProductMapper.toEntity(product)),
    }
  },

  toRequest(data: ProductMutation): BackendProductRequest {
    return {
      categoryId: data.categoryId,
      supplierId: data.supplierId ?? null,
      barcode: data.barcode.trim(),
      name: data.name.trim(),
      description: data.description?.trim() || null,
      unit: data.unit,
      costPrice: data.costPrice,
      salePrice: data.salePrice,
      currentStock: data.currentStock ?? 0,
      minimumStock: data.minimumStock,
    }
  },

  toUpdateRequest(data: ProductMutation): BackendProductUpdateRequest {
    return {
      categoryId: data.categoryId,
      supplierId: data.supplierId ?? null,
      barcode: data.barcode.trim(),
      name: data.name.trim(),
      description: data.description?.trim() || null,
      unit: data.unit,
      costPrice: data.costPrice,
      salePrice: data.salePrice,
      minimumStock: data.minimumStock,
    }
  },
}
