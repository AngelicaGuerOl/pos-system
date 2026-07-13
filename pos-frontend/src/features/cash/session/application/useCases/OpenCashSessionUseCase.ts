import type { CashSession, OpenCashSessionData } from '../../domain/entities/CashSession'
import type { CashSessionRepository } from '../../domain/repositories/CashSessionRepository'

export class OpenCashSessionUseCase {
  private readonly cashSessionRepository: CashSessionRepository

  constructor(cashSessionRepository: CashSessionRepository) {
    this.cashSessionRepository = cashSessionRepository
  }

  execute(data: OpenCashSessionData): Promise<CashSession> {
    return this.cashSessionRepository.open(data)
  }
}
