import { httpClient } from '../../../shared/api/httpClient'
import { GetCurrentCashMovementsUseCase } from './application/useCases/GetCurrentCashMovementsUseCase'
import { GetCurrentCashSummaryUseCase } from './application/useCases/GetCurrentCashSummaryUseCase'
import { RegisterCashEntryUseCase } from './application/useCases/RegisterCashEntryUseCase'
import { RegisterCashExitUseCase } from './application/useCases/RegisterCashExitUseCase'
import { CashMovementRepositoryImpl } from './infrastructure/CashMovementRepositoryImpl'

const cashMovementRepository = new CashMovementRepositoryImpl(httpClient)

export const cashMovementDependencies = {
  getCurrentCashMovementsUseCase: new GetCurrentCashMovementsUseCase(cashMovementRepository),
  getCurrentCashSummaryUseCase: new GetCurrentCashSummaryUseCase(cashMovementRepository),
  registerCashEntryUseCase: new RegisterCashEntryUseCase(cashMovementRepository),
  registerCashExitUseCase: new RegisterCashExitUseCase(cashMovementRepository),
} as const
