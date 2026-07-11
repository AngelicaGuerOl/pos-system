import type { PageResponse } from '../../../../../shared/types/PageResponse'
import type { Product, ProductMutation, ProductUnit } from '../../domain/entities/Product'

export type BackendProductResponse = {
  id: number
  categoryId: number
  categoryName: string
  barcode: string
  name: string
  description: string | null
  unit: ProductUnit
  costPrice: number
  salePrice: number
  currentStock: number
  minimumStock: number
  active: boolean
  createdAt: string
  updatedAt: string | null
}

export type BackendProductRequest = {
  categoryId: number
  barcode: string
  name: string
  description?: string | null
  unit: ProductUnit
  costPrice: number
  salePrice: number
  currentStock: number
  minimumStock: number
}

export const ProductMapper = {
  toEntity(response: BackendProductResponse): Product {
    return {
      id: response.id,
      categoryId: response.categoryId,
      categoryName: response.categoryName,
      barcode: response.barcode,
      name: response.name,
      description: response.description,
      unit: response.unit,
      costPrice: Number(response.costPrice),
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
      barcode: data.barcode.trim(),
      name: data.name.trim(),
      description: data.description?.trim() || null,
      unit: data.unit,
      costPrice: data.costPrice,
      salePrice: data.salePrice,
      currentStock: data.currentStock,
      minimumStock: data.minimumStock,
    }
  },
}

