import type { PageResponse } from '../../../../../shared/types/PageResponse'
import type { BarcodeLookup, Product, ProductFilters, ProductMutation } from '../entities/Product'

export type ProductRepository = {
  getAll(filters?: ProductFilters): Promise<PageResponse<Product>>
  getById(id: number): Promise<Product>
  getByBarcode(barcode: string): Promise<Product>
  lookupBarcode(barcode: string): Promise<BarcodeLookup>
  create(data: ProductMutation): Promise<Product>
  update(id: number, data: ProductMutation): Promise<Product>
  deactivate(id: number): Promise<void>
  reactivate(id: number): Promise<void>
}
