import type { DashboardSummary } from '../../domain/entities/DashboardSummary'
import type { DashboardRepository } from '../../domain/repositories/DashboardRepository'

export class GetDashboardSummaryUseCase {
  private readonly repository: DashboardRepository

  constructor(repository: DashboardRepository) {
    this.repository = repository
  }

  execute(): Promise<DashboardSummary> {
    return this.repository.getSummary()
  }
}
