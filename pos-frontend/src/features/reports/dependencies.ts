import { httpClient } from '../../shared/api/httpClient'
import { GetOperationsReportUseCase } from './application/useCases/GetOperationsReportUseCase'
import { ReportRepositoryImpl } from './infrastructure/ReportRepositoryImpl'

const reportRepository = new ReportRepositoryImpl(httpClient)

export const reportDependencies = {
  getOperationsReportUseCase: new GetOperationsReportUseCase(reportRepository),
} as const
