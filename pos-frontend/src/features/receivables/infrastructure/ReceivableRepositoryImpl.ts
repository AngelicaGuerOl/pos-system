import type { AxiosInstance } from 'axios'
import type { PageResponse } from '../../../shared/types/PageResponse'
import type {
  CustomerReceivableFilters,
  Receivable,
  ReceivableFilters,
} from '../domain/entities/Receivable'
import type { ReceivableRepository } from '../domain/repositories/ReceivableRepository'
import {
  ReceivableMapper,
  type BackendReceivableResponse,
} from './mappers/ReceivableMapper'

export class ReceivableRepositoryImpl implements ReceivableRepository {
  private readonly client: AxiosInstance

  constructor(client: AxiosInstance) {
    this.client = client
  }

  async getAll(filters: ReceivableFilters): Promise<PageResponse<Receivable>> {
    const { data } = await this.client.get<PageResponse<BackendReceivableResponse>>(
      '/receivables',
      {
        params: ReceivableMapper.toParams(filters),
      },
    )

    return ReceivableMapper.toPage(data)
  }

  async getByCustomer(
    customerId: number,
    filters: CustomerReceivableFilters,
  ): Promise<PageResponse<Receivable>> {
    const { data } = await this.client.get<PageResponse<BackendReceivableResponse>>(
      `/customers/${customerId}/receivables`,
      {
        params: ReceivableMapper.toParams(filters),
      },
    )

    return ReceivableMapper.toPage(data)
  }
}
