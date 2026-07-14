import { httpClient } from '../../shared/api/httpClient'
import { GetCustomerReceivablesUseCase } from './application/useCases/GetCustomerReceivablesUseCase'
import { GetReceivableByIdUseCase } from './application/useCases/GetReceivableByIdUseCase'
import { GetReceivablesUseCase } from './application/useCases/GetReceivablesUseCase'
import { ReceivableRepositoryImpl } from './infrastructure/ReceivableRepositoryImpl'
import { CreateReceivablePaymentUseCase } from './payment/application/useCases/CreateReceivablePaymentUseCase'
import { GetReceivablePaymentByIdUseCase } from './payment/application/useCases/GetReceivablePaymentByIdUseCase'
import { GetReceivablePaymentsUseCase } from './payment/application/useCases/GetReceivablePaymentsUseCase'
import { ReceivablePaymentRepositoryImpl } from './payment/infrastructure/ReceivablePaymentRepositoryImpl'

const receivableRepository = new ReceivableRepositoryImpl(httpClient)
const receivablePaymentRepository = new ReceivablePaymentRepositoryImpl(httpClient)

export const receivableDependencies = {
  createReceivablePaymentUseCase: new CreateReceivablePaymentUseCase(receivablePaymentRepository),
  getCustomerReceivablesUseCase: new GetCustomerReceivablesUseCase(receivableRepository),
  getReceivablePaymentByIdUseCase: new GetReceivablePaymentByIdUseCase(receivablePaymentRepository),
  getReceivablePaymentsUseCase: new GetReceivablePaymentsUseCase(receivablePaymentRepository),
  getReceivableByIdUseCase: new GetReceivableByIdUseCase(receivableRepository),
  getReceivablesUseCase: new GetReceivablesUseCase(receivableRepository),
} as const
