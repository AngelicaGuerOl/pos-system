import type {
  OperationsReport,
  OperationsReportFilters,
} from '../entities/OperationsReport'

export type ReportRepository = {
  getOperationsSummary(filters: OperationsReportFilters): Promise<OperationsReport>
}
