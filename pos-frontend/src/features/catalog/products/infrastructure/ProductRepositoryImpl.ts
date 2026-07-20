import type { AxiosInstance } from 'axios'
import type { PageResponse } from '../../../../shared/types/PageResponse'
import type { BarcodeLookup, Product, ProductFilters, ProductMutation } from '../domain/entities/Product'
import type { ProductRepository } from '../domain/repositories/ProductRepository'
import { ProductMapper, type BackendProductResponse } from './mappers/ProductMapper'

export class ProductRepositoryImpl implements ProductRepository {
  private readonly client: AxiosInstance

  constructor(client: AxiosInstance) {
    this.client = client
  }

  async getAll(filters: ProductFilters = {}): Promise<PageResponse<Product>> {
    const { data } = await this.client.get<PageResponse<BackendProductResponse>>('/products', {
      params: {
        search: filters.search || undefined,
        categoryId: filters.categoryId || undefined,
        supplierId: filters.supplierId || undefined,
        active: filters.active === null ? undefined : filters.active ?? true,
        lowStock: filters.lowStock || undefined,
        page: filters.page ?? 0,
        size: filters.size ?? 50,
        sort: filters.sort ?? 'name,asc',
      },
    })

    return ProductMapper.toPage(data)
  }

  async getById(id: number): Promise<Product> {
    const { data } = await this.client.get<BackendProductResponse>(`/products/${id}`)

    return ProductMapper.toEntity(data)
  }

  async getByBarcode(barcode: string): Promise<Product> {
    const { data } = await this.client.get<BackendProductResponse>(`/products/barcode/${barcode}`)

    return ProductMapper.toEntity(data)
  }

  async lookupBarcode(barcode: string): Promise<BarcodeLookup> {
    const { data } = await this.client.get<BarcodeLookup>(`/products/barcode-lookup/${barcode}`)

    return {
      ...data,
      existingProduct: data.existingProduct ? ProductMapper.toEntity(data.existingProduct) : null,
      existingProductActive: data.existingProductActive ?? null,
      existingProductId: data.existingProductId ?? null,
      suggestedName: data.suggestedName ?? null,
      brand: data.brand ?? null,
      presentation: data.presentation ?? null,
      source: data.source ?? null,
    }
  }

  async create(data: ProductMutation): Promise<Product> {
    const response = await this.client.post<BackendProductResponse>(
      '/products',
      ProductMapper.toRequest(data),
    )

    return ProductMapper.toEntity(response.data)
  }

  async update(id: number, data: ProductMutation): Promise<Product> {
    const response = await this.client.put<BackendProductResponse>(
      `/products/${id}`,
      ProductMapper.toUpdateRequest(data),
    )

    return ProductMapper.toEntity(response.data)
  }

  async deactivate(id: number): Promise<void> {
    await this.client.patch(`/products/${id}/deactivate`)
  }

  async reactivate(id: number): Promise<void> {
    await this.client.patch(`/products/${id}/reactivate`)
  }
}
