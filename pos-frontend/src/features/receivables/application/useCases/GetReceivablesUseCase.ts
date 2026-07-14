import type { PageResponse } from '../../../../shared/types/PageResponse'
import type { Receivable, ReceivableFilters } from '../../domain/entities/Receivable'
import type { ReceivableRepository } from '../../domain/repositories/ReceivableRepository'

export class GetReceivablesUseCase {
  private readonly receivableRepository: ReceivableRepository

  constructor(receivableRepository: ReceivableRepository) {
    this.receivableRepository = receivableRepository
  }

  execute(filters: ReceivableFilters): Promise<PageResponse<Receivable>> {
    return this.receivableRepository.getAll(filters)
  }
}
