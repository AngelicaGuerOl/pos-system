import { httpClient } from '../../shared/api/httpClient'
import { GetCustomerReceivablesUseCase } from './application/useCases/GetCustomerReceivablesUseCase'
import { GetReceivablesUseCase } from './application/useCases/GetReceivablesUseCase'
import { ReceivableRepositoryImpl } from './infrastructure/ReceivableRepositoryImpl'
import { CreateReceivablePaymentUseCase } from './payment/application/useCases/CreateReceivablePaymentUseCase'
import { GetReceivablePaymentsUseCase } from './payment/application/useCases/GetReceivablePaymentsUseCase'
import { ReceivablePaymentRepositoryImpl } from './payment/infrastructure/ReceivablePaymentRepositoryImpl'

const receivableRepository = new ReceivableRepositoryImpl(httpClient)
const receivablePaymentRepository = new ReceivablePaymentRepositoryImpl(httpClient)

export const receivableDependencies = {
  createReceivablePaymentUseCase: new CreateReceivablePaymentUseCase(receivablePaymentRepository),
  getCustomerReceivablesUseCase: new GetCustomerReceivablesUseCase(receivableRepository),
  getReceivablePaymentsUseCase: new GetReceivablePaymentsUseCase(receivablePaymentRepository),
  getReceivablesUseCase: new GetReceivablesUseCase(receivableRepository),
} as const
