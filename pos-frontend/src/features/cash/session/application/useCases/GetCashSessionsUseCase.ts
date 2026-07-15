import type { PageResponse } from '../../../../../shared/types/PageResponse'
import type { CashSession, CashSessionFilters } from '../../domain/entities/CashSession'
import type { CashSessionRepository } from '../../domain/repositories/CashSessionRepository'

export class GetCashSessionsUseCase {
  private readonly cashSessionRepository: CashSessionRepository

  constructor(cashSessionRepository: CashSessionRepository) {
    this.cashSessionRepository = cashSessionRepository
  }

  execute(filters: CashSessionFilters): Promise<PageResponse<CashSession>> {
    return this.cashSessionRepository.getAll(filters)
  }
}
