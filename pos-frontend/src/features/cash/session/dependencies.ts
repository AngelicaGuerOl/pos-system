import { httpClient } from '../../../shared/api/httpClient'
import { CloseCurrentCashSessionUseCase } from './application/useCases/CloseCurrentCashSessionUseCase'
import { GetCashSessionClosingPreviewUseCase } from './application/useCases/GetCashSessionClosingPreviewUseCase'
import { GetCashSessionClosingSummaryUseCase } from './application/useCases/GetCashSessionClosingSummaryUseCase'
import { GetCashSessionsUseCase } from './application/useCases/GetCashSessionsUseCase'
import { GetCurrentCashSessionUseCase } from './application/useCases/GetCurrentCashSessionUseCase'
import { OpenCashSessionUseCase } from './application/useCases/OpenCashSessionUseCase'
import { CashSessionRepositoryImpl } from './infrastructure/CashSessionRepositoryImpl'

const cashSessionRepository = new CashSessionRepositoryImpl(httpClient)

export const cashSessionDependencies = {
  closeCurrentCashSessionUseCase: new CloseCurrentCashSessionUseCase(cashSessionRepository),
  getCashSessionClosingPreviewUseCase: new GetCashSessionClosingPreviewUseCase(cashSessionRepository),
  getCashSessionClosingSummaryUseCase: new GetCashSessionClosingSummaryUseCase(cashSessionRepository),
  getCashSessionsUseCase: new GetCashSessionsUseCase(cashSessionRepository),
  getCurrentCashSessionUseCase: new GetCurrentCashSessionUseCase(cashSessionRepository),
  openCashSessionUseCase: new OpenCashSessionUseCase(cashSessionRepository),
} as const
