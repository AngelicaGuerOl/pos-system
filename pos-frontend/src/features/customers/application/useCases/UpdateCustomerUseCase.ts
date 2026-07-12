import type { Customer, CustomerMutation } from '../../domain/entities/Customer'
import type { CustomerRepository } from '../../domain/repositories/CustomerRepository'

export class UpdateCustomerUseCase {
  private readonly customerRepository: CustomerRepository

  constructor(customerRepository: CustomerRepository) {
    this.customerRepository = customerRepository
  }

  execute(id: number, data: CustomerMutation): Promise<Customer> {
    return this.customerRepository.update(id, data)
  }
}
