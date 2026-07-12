import type { Customer } from '../../domain/entities/Customer'
import type { CustomerRepository } from '../../domain/repositories/CustomerRepository'

export class GetCustomerByIdUseCase {
  private readonly customerRepository: CustomerRepository

  constructor(customerRepository: CustomerRepository) {
    this.customerRepository = customerRepository
  }

  execute(id: number): Promise<Customer> {
    return this.customerRepository.getById(id)
  }
}
