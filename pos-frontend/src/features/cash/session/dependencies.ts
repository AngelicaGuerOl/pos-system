import { httpClient } from '../../../shared/api/httpClient'
import { GetCurrentCashSessionUseCase } from './application/useCases/GetCurrentCashSessionUseCase'
import { OpenCashSessionUseCase } from './application/useCases/OpenCashSessionUseCase'
import { CashSessionRepositoryImpl } from './infrastructure/CashSessionRepositoryImpl'

const cashSessionRepository = new CashSessionRepositoryImpl(httpClient)

export const cashSessionDependencies = {
  getCurrentCashSessionUseCase: new GetCurrentCashSessionUseCase(cashSessionRepository),
  openCashSessionUseCase: new OpenCashSessionUseCase(cashSessionRepository),
} as const
