import type { DashboardSummary } from '../../domain/entities/DashboardSummary'

export type BackendDashboardSummaryResponse = DashboardSummary

export class DashboardMapper {
  static toEntity(response: BackendDashboardSummaryResponse): DashboardSummary {
    return response
  }
}
