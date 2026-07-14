import type { PageResponse } from '../../../../../shared/types/PageResponse'
import type {
  CreateReceivablePaymentRequest,
  ReceivablePayment,
  ReceivablePaymentFilters,
} from '../entities/ReceivablePayment'

export type ReceivablePaymentRepository = {
  createPayment(
    receivableId: number,
    request: CreateReceivablePaymentRequest,
  ): Promise<ReceivablePayment>
  getPaymentsByReceivable(
    receivableId: number,
    filters: ReceivablePaymentFilters,
  ): Promise<PageResponse<ReceivablePayment>>
  getPaymentById(paymentId: number): Promise<ReceivablePayment>
}
