import type { Customer, CustomerMutation } from '../../domain/entities/Customer'
import type { CustomerRepository } from '../../domain/repositories/CustomerRepository'

export class CreateCustomerUseCase {
  private readonly customerRepository: CustomerRepository

  constructor(customerRepository: CustomerRepository) {
    this.customerRepository = customerRepository
  }

  execute(data: CustomerMutation): Promise<Customer> {
    return this.customerRepository.create(data)
  }
}
