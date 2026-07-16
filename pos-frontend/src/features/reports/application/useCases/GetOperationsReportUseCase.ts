import type {
  OperationsReport,
  OperationsReportFilters,
} from '../../domain/entities/OperationsReport'
import type { ReportRepository } from '../../domain/repositories/ReportRepository'

export class GetOperationsReportUseCase {
  private readonly reportRepository: ReportRepository

  constructor(reportRepository: ReportRepository) {
    this.reportRepository = reportRepository
  }

  execute(filters: OperationsReportFilters): Promise<OperationsReport> {
    return this.reportRepository.getOperationsSummary(filters)
  }
}
