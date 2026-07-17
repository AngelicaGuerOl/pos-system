import type { AxiosInstance } from 'axios'
import type { PageResponse } from '../../../../shared/types/PageResponse'
import type { SupplierRepository } from '../domain/repositories/SupplierRepository'
import type {
  Supplier,
  SupplierFilters,
  SupplierInventoryBaseline,
  SupplierInventoryBaselineMutation,
  SupplierMutation,
  SupplierProductsPage,
} from '../domain/entities/Supplier'
import {
  SupplierMapper,
  type BackendSupplierInventoryBaselineResponse,
  type BackendSupplierResponse,
} from './mappers/SupplierMapper'
import type { BackendProductResponse } from '../../products/infrastructure/mappers/ProductMapper'

export class SupplierRepositoryImpl implements SupplierRepository {
  private readonly client: AxiosInstance

  constructor(client: AxiosInstance) {
    this.client = client
  }

  async getAll(filters: SupplierFilters = {}): Promise<PageResponse<Supplier>> {
    const { data } = await this.client.get<PageResponse<BackendSupplierResponse>>('/suppliers', {
      params: {
        search: filters.search || undefined,
        active: filters.active ?? undefined,
        page: filters.page ?? 0,
        size: filters.size ?? 10,
        sort: filters.sort ?? 'name,asc',
      },
    })

    return SupplierMapper.toPage(data)
  }

  async getById(id: number): Promise<Supplier> {
    const { data } = await this.client.get<BackendSupplierResponse>(`/suppliers/${id}`)
    return SupplierMapper.toEntity(data)
  }

  async create(data: SupplierMutation): Promise<Supplier> {
    const response = await this.client.post<BackendSupplierResponse>(
      '/suppliers',
      SupplierMapper.toRequest(data),
    )
    return SupplierMapper.toEntity(response.data)
  }

  async update(id: number, data: SupplierMutation): Promise<Supplier> {
    const response = await this.client.put<BackendSupplierResponse>(
      `/suppliers/${id}`,
      SupplierMapper.toRequest(data),
    )
    return SupplierMapper.toEntity(response.data)
  }

  async deactivate(id: number): Promise<void> {
    await this.client.patch(`/suppliers/${id}/deactivate`)
  }

  async getProducts(
    supplierId: number,
    filters: { search?: string; page?: number; size?: number; sort?: string } = {},
  ): Promise<SupplierProductsPage> {
    const { data } = await this.client.get<PageResponse<BackendProductResponse>>(
      `/suppliers/${supplierId}/products`,
      {
        params: {
          search: filters.search || undefined,
          page: filters.page ?? 0,
          size: filters.size ?? 10,
          sort: filters.sort ?? 'name,asc',
        },
      },
    )
    return SupplierMapper.toProductsPage(data)
  }

  async getInventoryBaseline(supplierId: number): Promise<SupplierInventoryBaseline> {
    const { data } = await this.client.get<BackendSupplierInventoryBaselineResponse>(
      `/suppliers/${supplierId}/inventory-baseline`,
    )
    return SupplierMapper.toBaseline(data)
  }

  async createInventoryBaseline(
    supplierId: number,
    data: SupplierInventoryBaselineMutation,
  ): Promise<SupplierInventoryBaseline> {
    const response = await this.client.post<BackendSupplierInventoryBaselineResponse>(
      `/suppliers/${supplierId}/inventory-baseline`,
      SupplierMapper.toBaselineRequest(data),
    )
    return SupplierMapper.toBaseline(response.data)
  }
}
