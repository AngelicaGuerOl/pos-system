import type { PageResponse } from '../../../../../shared/types/PageResponse'
import type { Product, ProductFilters, ProductMutation } from '../entities/Product'

export type ProductRepository = {
  getAll(filters?: ProductFilters): Promise<PageResponse<Product>>
  getById(id: number): Promise<Product>
  getByBarcode(barcode: string): Promise<Product>
  create(data: ProductMutation): Promise<Product>
  update(id: number, data: ProductMutation): Promise<Product>
  deactivate(id: number): Promise<void>
}

