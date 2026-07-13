import type { CurrentCashSummary } from '../../domain/entities/CashMovement'
import type { CashMovementRepository } from '../../domain/repositories/CashMovementRepository'

export class GetCurrentCashSummaryUseCase {
  private readonly cashMovementRepository: CashMovementRepository

  constructor(cashMovementRepository: CashMovementRepository) {
    this.cashMovementRepository = cashMovementRepository
  }

  execute(): Promise<CurrentCashSummary> {
    return this.cashMovementRepository.getCurrentSummary()
  }
}
