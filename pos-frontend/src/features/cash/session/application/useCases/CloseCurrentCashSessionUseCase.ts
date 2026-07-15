import type { CashSessionClosingSummary, CloseCashSessionData } from '../../domain/entities/CashSession'
import type { CashSessionRepository } from '../../domain/repositories/CashSessionRepository'

export class CloseCurrentCashSessionUseCase {
  private readonly cashSessionRepository: CashSessionRepository

  constructor(cashSessionRepository: CashSessionRepository) {
    this.cashSessionRepository = cashSessionRepository
  }

  execute(data: CloseCashSessionData): Promise<CashSessionClosingSummary> {
    return this.cashSessionRepository.closeCurrent(data)
  }
}
