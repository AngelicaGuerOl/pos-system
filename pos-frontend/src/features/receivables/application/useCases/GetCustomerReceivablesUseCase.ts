import type { PageResponse } from '../../../../shared/types/PageResponse'
import type {
  CustomerReceivableFilters,
  Receivable,
} from '../../domain/entities/Receivable'
import type { ReceivableRepository } from '../../domain/repositories/ReceivableRepository'

export class GetCustomerReceivablesUseCase {
  private readonly receivableRepository: ReceivableRepository

  constructor(receivableRepository: ReceivableRepository) {
    this.receivableRepository = receivableRepository
  }

  execute(
    customerId: number,
    filters: CustomerReceivableFilters,
  ): Promise<PageResponse<Receivable>> {
    return this.receivableRepository.getByCustomer(customerId, filters)
  }
}
