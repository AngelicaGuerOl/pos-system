import { httpClient } from '../../shared/api/httpClient'
import { CreateCustomerUseCase } from './application/useCases/CreateCustomerUseCase'
import { DeactivateCustomerUseCase } from './application/useCases/DeactivateCustomerUseCase'
import { GetCustomerByIdUseCase } from './application/useCases/GetCustomerByIdUseCase'
import { GetCustomersUseCase } from './application/useCases/GetCustomersUseCase'
import { UpdateCustomerUseCase } from './application/useCases/UpdateCustomerUseCase'
import { CustomerRepositoryImpl } from './infrastructure/CustomerRepositoryImpl'

const customerRepository = new CustomerRepositoryImpl(httpClient)

export const customerDependencies = {
  getCustomersUseCase: new GetCustomersUseCase(customerRepository),
  getCustomerByIdUseCase: new GetCustomerByIdUseCase(customerRepository),
  createCustomerUseCase: new CreateCustomerUseCase(customerRepository),
  updateCustomerUseCase: new UpdateCustomerUseCase(customerRepository),
  deactivateCustomerUseCase: new DeactivateCustomerUseCase(customerRepository),
} as const
