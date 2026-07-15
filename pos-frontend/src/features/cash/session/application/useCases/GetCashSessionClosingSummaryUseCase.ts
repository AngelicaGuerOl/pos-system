import type { CashSessionClosingSummary } from '../../domain/entities/CashSession'
import type { CashSessionRepository } from '../../domain/repositories/CashSessionRepository'

export class GetCashSessionClosingSummaryUseCase {
  private readonly cashSessionRepository: CashSessionRepository

  constructor(cashSessionRepository: CashSessionRepository) {
    this.cashSessionRepository = cashSessionRepository
  }

  execute(sessionId: number): Promise<CashSessionClosingSummary> {
    return this.cashSessionRepository.getClosingSummary(sessionId)
  }
}
