import { httpClient } from '../../shared/api/httpClient'
import { GetDashboardSummaryUseCase } from './application/useCases/GetDashboardSummaryUseCase'
import { DashboardRepositoryImpl } from './infrastructure/DashboardRepositoryImpl'

const dashboardRepository = new DashboardRepositoryImpl(httpClient)

export const dashboardDependencies = {
  getDashboardSummaryUseCase: new GetDashboardSummaryUseCase(dashboardRepository),
} as const
