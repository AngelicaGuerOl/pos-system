import type { DashboardSummary } from '../entities/DashboardSummary'

export interface DashboardRepository {
  getSummary(): Promise<DashboardSummary>
}
