import type { CashMovement, ManualCashMovementData } from '../../domain/entities/CashMovement'
import type { CashMovementRepository } from '../../domain/repositories/CashMovementRepository'

export class RegisterCashEntryUseCase {
  private readonly cashMovementRepository: CashMovementRepository

  constructor(cashMovementRepository: CashMovementRepository) {
    this.cashMovementRepository = cashMovementRepository
  }

  execute(data: ManualCashMovementData): Promise<CashMovement> {
    return this.cashMovementRepository.registerEntry(data)
  }
}
