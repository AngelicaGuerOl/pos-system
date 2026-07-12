import type { CustomerRepository } from '../../domain/repositories/CustomerRepository'

export class DeactivateCustomerUseCase {
  private readonly customerRepository: CustomerRepository

  constructor(customerRepository: CustomerRepository) {
    this.customerRepository = customerRepository
  }

  execute(id: number): Promise<void> {
    return this.customerRepository.deactivate(id)
  }
}
