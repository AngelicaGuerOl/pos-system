import type { CashSession } from '../../domain/entities/CashSession'
import type { CashSessionRepository } from '../../domain/repositories/CashSessionRepository'

export class GetCurrentCashSessionUseCase {
  private readonly cashSessionRepository: CashSessionRepository

  constructor(cashSessionRepository: CashSessionRepository) {
    this.cashSessionRepository = cashSessionRepository
  }

  execute(): Promise<CashSession | null> {
    return this.cashSessionRepository.getCurrent()
  }
}
