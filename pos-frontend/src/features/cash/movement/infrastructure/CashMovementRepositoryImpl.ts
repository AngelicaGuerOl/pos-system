import type { AxiosInstance } from 'axios'
import type { PageResponse } from '../../../../shared/types/PageResponse'
import type {
  CashMovement,
  CashMovementFilters,
  CurrentCashSummary,
  ManualCashMovementData,
} from '../domain/entities/CashMovement'
import type { CashMovementRepository } from '../domain/repositories/CashMovementRepository'
import {
  CashMovementMapper,
  type BackendCashMovementResponse,
  type BackendCurrentCashSummaryResponse,
} from './mappers/CashMovementMapper'

export class CashMovementRepositoryImpl implements CashMovementRepository {
  private readonly client: AxiosInstance

  constructor(client: AxiosInstance) {
    this.client = client
  }

  async getCurrent(filters: CashMovementFilters = {}): Promise<PageResponse<CashMovement>> {
    const { data } = await this.client.get<PageResponse<BackendCashMovementResponse>>(
      '/cash-movements/current',
      {
        params: {
          page: filters.page ?? 0,
          size: filters.size ?? 10,
          sort: filters.sort ?? 'createdAt,desc',
        },
      },
    )

    return CashMovementMapper.toPage(data)
  }

  async getCurrentSummary(): Promise<CurrentCashSummary> {
    const { data } = await this.client.get<BackendCurrentCashSummaryResponse>(
      '/cash-movements/current/summary',
    )

    return CashMovementMapper.toSummary(data)
  }

  async registerEntry(data: ManualCashMovementData): Promise<CashMovement> {
    const response = await this.client.post<BackendCashMovementResponse>(
      '/cash-movements/entries',
      CashMovementMapper.toRequest(data),
    )

    return CashMovementMapper.toEntity(response.data)
  }

  async registerExit(data: ManualCashMovementData): Promise<CashMovement> {
    const response = await this.client.post<BackendCashMovementResponse>(
      '/cash-movements/exits',
      CashMovementMapper.toRequest(data),
    )

    return CashMovementMapper.toEntity(response.data)
  }
}
