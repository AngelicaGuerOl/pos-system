import type { AxiosInstance } from 'axios'
import type { PageResponse } from '../../../../shared/types/PageResponse'
import type {
  SupplierEntry,
  SupplierEntryFilters,
  SupplierEntryMutation,
  SupplierEntryPageResponse,
} from '../domain/entities/SupplierEntry'
import type { SupplierEntryRepository } from '../domain/repositories/SupplierEntryRepository'
import { SupplierEntryMapper, type BackendSupplierEntryResponse } from './mappers/SupplierEntryMapper'

export class SupplierEntryRepositoryImpl implements SupplierEntryRepository {
  private readonly client: AxiosInstance

  constructor(client: AxiosInstance) {
    this.client = client
  }

  async create(data: SupplierEntryMutation): Promise<SupplierEntry> {
    const response = await this.client.post<BackendSupplierEntryResponse>(
      '/supplier-entries',
      SupplierEntryMapper.toRequest(data),
    )
    return SupplierEntryMapper.toEntity(response.data)
  }

  async getAll(filters: SupplierEntryFilters = {}): Promise<SupplierEntryPageResponse> {
    const { data } = await this.client.get<PageResponse<BackendSupplierEntryResponse>>('/supplier-entries', {
      params: {
        supplierId: filters.supplierId || undefined,
        from: filters.from || undefined,
        to: filters.to || undefined,
        productId: filters.productId || undefined,
        page: filters.page ?? 0,
        size: filters.size ?? 10,
        sort: filters.sort ?? 'entryDate,desc',
      },
    })
    return SupplierEntryMapper.toPage(data)
  }

  async getById(id: number): Promise<SupplierEntry> {
    const { data } = await this.client.get<BackendSupplierEntryResponse>(`/supplier-entries/${id}`)
    return SupplierEntryMapper.toEntity(data)
  }
}
