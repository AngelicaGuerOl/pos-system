import type {
  CreateReceivablePaymentRequest,
  ReceivablePayment,
} from '../../domain/entities/ReceivablePayment'
import type { ReceivablePaymentRepository } from '../../domain/repositories/ReceivablePaymentRepository'

export class CreateReceivablePaymentUseCase {
  private readonly receivablePaymentRepository: ReceivablePaymentRepository

  constructor(receivablePaymentRepository: ReceivablePaymentRepository) {
    this.receivablePaymentRepository = receivablePaymentRepository
  }

  execute(
    receivableId: number,
    request: CreateReceivablePaymentRequest,
  ): Promise<ReceivablePayment> {
    return this.receivablePaymentRepository.createPayment(receivableId, request)
  }
}
