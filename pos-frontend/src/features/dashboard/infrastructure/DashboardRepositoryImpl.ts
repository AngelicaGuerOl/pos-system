import type { AxiosInstance } from 'axios'
import type { DashboardSummary } from '../domain/entities/DashboardSummary'
import type { DashboardRepository } from '../domain/repositories/DashboardRepository'
import { DashboardMapper, type BackendDashboardSummaryResponse } from './mappers/DashboardMapper'

export class DashboardRepositoryImpl implements DashboardRepository {
  private readonly client: AxiosInstance

  constructor(client: AxiosInstance) {
    this.client = client
  }

  async getSummary(): Promise<DashboardSummary> {
    const { data } = await this.client.get<BackendDashboardSummaryResponse>('/dashboard/summary')
    return DashboardMapper.toEntity(data)
  }
}
