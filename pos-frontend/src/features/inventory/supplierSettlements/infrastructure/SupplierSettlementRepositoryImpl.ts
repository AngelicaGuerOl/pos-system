import type { AxiosInstance } from 'axios'
import type { PageResponse } from '../../../../shared/types/PageResponse'
import type {
  ExportedSupplierSettlement,
  SupplierSettlementRepository,
} from '../domain/repositories/SupplierSettlementRepository'
import type {
  SupplierSettlement,
  SupplierSettlementCreateMutation,
  SupplierSettlementFilters,
  SupplierSettlementUpdateMutation,
  SupplierSettlementPageResponse,
} from '../domain/entities/SupplierSettlement'
import { SupplierSettlementMapper, type BackendSupplierSettlementResponse } from './mappers/SupplierSettlementMapper'

const getFilename = (contentDisposition?: string): string => {
  const match = contentDisposition?.match(/filename="?([^"]+)"?/)
  return match?.[1] ?? `corte-proveedor-${new Date().toISOString().slice(0, 10)}.xlsx`
}

export class SupplierSettlementRepositoryImpl implements SupplierSettlementRepository {
  private readonly client: AxiosInstance

  constructor(client: AxiosInstance) {
    this.client = client
  }

  async create(data: SupplierSettlementCreateMutation): Promise<SupplierSettlement> {
    const response = await this.client.post<BackendSupplierSettlementResponse>(
      '/supplier-settlements',
      SupplierSettlementMapper.toCreateRequest(data),
    )
    return SupplierSettlementMapper.toEntity(response.data)
  }

  async update(id: number, data: SupplierSettlementUpdateMutation): Promise<SupplierSettlement> {
    const response = await this.client.put<BackendSupplierSettlementResponse>(
      `/supplier-settlements/${id}`,
      SupplierSettlementMapper.toUpdateRequest(data),
    )
    return SupplierSettlementMapper.toEntity(response.data)
  }

  async finalize(id: number): Promise<SupplierSettlement> {
    const response = await this.client.post<BackendSupplierSettlementResponse>(`/supplier-settlements/${id}/finalize`)
    return SupplierSettlementMapper.toEntity(response.data)
  }

  async getAll(filters: SupplierSettlementFilters = {}): Promise<SupplierSettlementPageResponse> {
    const { data } = await this.client.get<PageResponse<BackendSupplierSettlementResponse>>('/supplier-settlements', {
      params: {
        supplierId: filters.supplierId || undefined,
        status: filters.status || undefined,
        from: filters.from || undefined,
        to: filters.to || undefined,
        page: filters.page ?? 0,
        size: filters.size ?? 10,
        sort: filters.sort ?? 'periodEnd,desc',
      },
    })
    return SupplierSettlementMapper.toPage(data)
  }

  async getById(id: number): Promise<SupplierSettlement> {
    const { data } = await this.client.get<BackendSupplierSettlementResponse>(`/supplier-settlements/${id}`)
    return SupplierSettlementMapper.toEntity(data)
  }

  async exportSettlement(id: number): Promise<ExportedSupplierSettlement> {
    const response = await this.client.get<Blob>(`/supplier-settlements/${id}/export`, {
      responseType: 'blob',
    })
    return {
      blob: response.data,
      filename: getFilename(response.headers['content-disposition']),
    }
  }
}
