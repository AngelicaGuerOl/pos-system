import type { CashSessionClosingSummary } from '../../domain/entities/CashSession'
import type { CashSessionRepository } from '../../domain/repositories/CashSessionRepository'

export class GetCashSessionClosingPreviewUseCase {
  private readonly cashSessionRepository: CashSessionRepository

  constructor(cashSessionRepository: CashSessionRepository) {
    this.cashSessionRepository = cashSessionRepository
  }

  execute(): Promise<CashSessionClosingSummary> {
    return this.cashSessionRepository.getCurrentClosingPreview()
  }
}
