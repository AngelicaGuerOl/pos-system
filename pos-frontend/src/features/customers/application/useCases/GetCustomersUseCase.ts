import type { PageResponse } from '../../../../shared/types/PageResponse'
import type { Customer, CustomerFilters } from '../../domain/entities/Customer'
import type { CustomerRepository } from '../../domain/repositories/CustomerRepository'

export class GetCustomersUseCase {
  private readonly customerRepository: CustomerRepository

  constructor(customerRepository: CustomerRepository) {
    this.customerRepository = customerRepository
  }

  execute(filters?: CustomerFilters): Promise<PageResponse<Customer>> {
    return this.customerRepository.getAll(filters)
  }
}
