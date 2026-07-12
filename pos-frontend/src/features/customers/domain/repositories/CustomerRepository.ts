import type { PageResponse } from '../../../../shared/types/PageResponse'
import type { Customer, CustomerFilters, CustomerMutation } from '../entities/Customer'

export type CustomerRepository = {
  getAll(filters?: CustomerFilters): Promise<PageResponse<Customer>>
  getById(id: number): Promise<Customer>
  create(data: CustomerMutation): Promise<Customer>
  update(id: number, data: CustomerMutation): Promise<Customer>
  deactivate(id: number): Promise<void>
}
