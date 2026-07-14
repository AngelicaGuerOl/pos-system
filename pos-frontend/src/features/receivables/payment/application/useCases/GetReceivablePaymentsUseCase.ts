import type { PageResponse } from '../../../../../shared/types/PageResponse'
import type {
  ReceivablePayment,
  ReceivablePaymentFilters,
} from '../../domain/entities/ReceivablePayment'
import type { ReceivablePaymentRepository } from '../../domain/repositories/ReceivablePaymentRepository'

export class GetReceivablePaymentsUseCase {
  private readonly receivablePaymentRepository: ReceivablePaymentRepository

  constructor(receivablePaymentRepository: ReceivablePaymentRepository) {
    this.receivablePaymentRepository = receivablePaymentRepository
  }

  execute(
    receivableId: number,
    filters: ReceivablePaymentFilters,
  ): Promise<PageResponse<ReceivablePayment>> {
    return this.receivablePaymentRepository.getPaymentsByReceivable(receivableId, filters)
  }
}
