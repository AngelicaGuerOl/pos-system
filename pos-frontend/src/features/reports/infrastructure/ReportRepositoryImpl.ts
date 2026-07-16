import type { AxiosInstance } from 'axios'
import type {
  OperationsReport,
  OperationsReportFilters,
} from '../domain/entities/OperationsReport'
import type { ReportRepository } from '../domain/repositories/ReportRepository'
import {
  ReportMapper,
  type BackendOperationsReportResponse,
} from './mappers/ReportMapper'

export class ReportRepositoryImpl implements ReportRepository {
  private readonly client: AxiosInstance

  constructor(client: AxiosInstance) {
    this.client = client
  }

  async getOperationsSummary(filters: OperationsReportFilters): Promise<OperationsReport> {
    const { data } = await this.client.get<BackendOperationsReportResponse>(
      '/reports/operations-summary',
      {
        params: ReportMapper.toParams(filters),
      },
    )

    return ReportMapper.toEntity(data)
  }
}
