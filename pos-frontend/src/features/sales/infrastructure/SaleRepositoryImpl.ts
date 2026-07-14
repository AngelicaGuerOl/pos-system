import type { AxiosInstance } from 'axios'
import type { PageResponse } from '../../../shared/types/PageResponse'
import type { CreateSaleData, Sale, SaleHistoryFilters, SaleSummary } from '../domain/entities/Sale'
import type { SaleRepository } from '../domain/repositories/SaleRepository'
import {
  SaleMapper,
  type BackendSaleResponse,
  type BackendSaleSummaryResponse,
} from './mappers/SaleMapper'

export class SaleRepositoryImpl implements SaleRepository {
  private readonly client: AxiosInstance

  constructor(client: AxiosInstance) {
    this.client = client
  }

  async createSale(data: CreateSaleData): Promise<Sale> {
    const response = await this.client.post<BackendSaleResponse>(
      '/sales',
      SaleMapper.toRequest(data),
    )

    return SaleMapper.toEntity(response.data)
  }

  async getCurrentSessionSales(filters: SaleHistoryFilters): Promise<PageResponse<SaleSummary>> {
    const { data } = await this.client.get<PageResponse<BackendSaleSummaryResponse>>(
      '/sales/current-session',
      {
        params: SaleMapper.toFiltersParams(filters),
      },
    )

    return {
      ...data,
      content: data.content.map((sale) => SaleMapper.toSummaryEntity(sale)),
    }
  }

  async getSalesHistory(filters: SaleHistoryFilters): Promise<PageResponse<SaleSummary>> {
    const { data } = await this.client.get<PageResponse<BackendSaleSummaryResponse>>('/sales', {
      params: SaleMapper.toFiltersParams(filters),
    })

    return {
      ...data,
      content: data.content.map((sale) => SaleMapper.toSummaryEntity(sale)),
    }
  }

  async getById(id: number): Promise<Sale> {
    const { data } = await this.client.get<BackendSaleResponse>(`/sales/${id}`)

    return SaleMapper.toEntity(data)
  }
}
