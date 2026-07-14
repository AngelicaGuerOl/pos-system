import type { ReceivablePayment } from '../../domain/entities/ReceivablePayment'
import type { ReceivablePaymentRepository } from '../../domain/repositories/ReceivablePaymentRepository'

export class GetReceivablePaymentByIdUseCase {
  private readonly receivablePaymentRepository: ReceivablePaymentRepository

  constructor(receivablePaymentRepository: ReceivablePaymentRepository) {
    this.receivablePaymentRepository = receivablePaymentRepository
  }

  execute(paymentId: number): Promise<ReceivablePayment> {
    return this.receivablePaymentRepository.getPaymentById(paymentId)
  }
}
