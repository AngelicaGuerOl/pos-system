import type { AxiosInstance } from 'axios'
import type { PageResponse } from '../../../../shared/types/PageResponse'
import type {
  CreateSaleReturnRequest,
  SaleReturnDetails,
  SaleReturnFilters,
  SaleReturnSummary,
} from '../domain/entities/SaleReturn'
import type { SaleReturnRepository } from '../domain/repositories/SaleReturnRepository'
import {
  SaleReturnMapper,
  type BackendSaleReturnDetailResponse,
  type BackendSaleReturnSummaryResponse,
} from './mappers/SaleReturnMapper'

export class SaleReturnRepositoryImpl implements SaleReturnRepository {
  private readonly client: AxiosInstance

  constructor(client: AxiosInstance) {
    this.client = client
  }

  async createReturn(
    saleId: number,
    request: CreateSaleReturnRequest,
  ): Promise<SaleReturnDetails> {
    const { data } = await this.client.post<BackendSaleReturnDetailResponse>(
      `/sales/${saleId}/returns`,
      SaleReturnMapper.toRequest(request),
    )

    return SaleReturnMapper.toDetailEntity(data)
  }

  async getReturnsBySale(
    saleId: number,
    filters: SaleReturnFilters,
  ): Promise<PageResponse<SaleReturnSummary>> {
    const { data } = await this.client.get<PageResponse<BackendSaleReturnSummaryResponse>>(
      `/sales/${saleId}/returns`,
      {
        params: SaleReturnMapper.toParams(filters),
      },
    )

    return SaleReturnMapper.toPage(data)
  }

  async getReturnById(returnId: number): Promise<SaleReturnDetails> {
    const { data } = await this.client.get<BackendSaleReturnDetailResponse>(
      `/sale-returns/${returnId}`,
    )

    return SaleReturnMapper.toDetailEntity(data)
  }
}
