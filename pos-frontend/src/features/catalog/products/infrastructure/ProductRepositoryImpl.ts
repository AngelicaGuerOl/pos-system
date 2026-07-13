import type { AxiosInstance } from 'axios'
import type { PageResponse } from '../../../../shared/types/PageResponse'
import type { Product, ProductFilters, ProductMutation } from '../domain/entities/Product'
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
        lowStock: filters.lowStock || undefined,
        page: 0,
        size: 50,
        sort: 'name,asc',
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
}
