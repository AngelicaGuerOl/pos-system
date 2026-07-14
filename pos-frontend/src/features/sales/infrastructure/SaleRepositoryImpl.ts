import type { AxiosInstance } from 'axios'
import type { CreateCashSaleData, Sale } from '../domain/entities/Sale'
import type { SaleRepository } from '../domain/repositories/SaleRepository'
import { SaleMapper, type BackendSaleResponse } from './mappers/SaleMapper'

export class SaleRepositoryImpl implements SaleRepository {
  private readonly client: AxiosInstance

  constructor(client: AxiosInstance) {
    this.client = client
  }

  async createCashSale(data: CreateCashSaleData): Promise<Sale> {
    const response = await this.client.post<BackendSaleResponse>(
      '/sales',
      SaleMapper.toRequest(data),
    )

    return SaleMapper.toEntity(response.data)
  }
}
