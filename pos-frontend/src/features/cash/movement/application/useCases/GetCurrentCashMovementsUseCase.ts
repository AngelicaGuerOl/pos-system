import type { PageResponse } from '../../../../../shared/types/PageResponse'
import type { CashMovement, CashMovementFilters } from '../../domain/entities/CashMovement'
import type { CashMovementRepository } from '../../domain/repositories/CashMovementRepository'

export class GetCurrentCashMovementsUseCase {
  private readonly cashMovementRepository: CashMovementRepository

  constructor(cashMovementRepository: CashMovementRepository) {
    this.cashMovementRepository = cashMovementRepository
  }

  execute(filters?: CashMovementFilters): Promise<PageResponse<CashMovement>> {
    return this.cashMovementRepository.getCurrent(filters)
  }
}
