import type { AxiosInstance } from 'axios'
import type { PageResponse } from '../../../shared/types/PageResponse'
import type { Customer, CustomerFilters, CustomerMutation } from '../domain/entities/Customer'
import type { CustomerRepository } from '../domain/repositories/CustomerRepository'
import { CustomerMapper, type BackendCustomerResponse } from './mappers/CustomerMapper'

export class CustomerRepositoryImpl implements CustomerRepository {
  private readonly client: AxiosInstance

  constructor(client: AxiosInstance) {
    this.client = client
  }

  async getAll(filters: CustomerFilters = {}): Promise<PageResponse<Customer>> {
    const { data } = await this.client.get<PageResponse<BackendCustomerResponse>>('/customers', {
      params: {
        search: filters.search || undefined,
        page: filters.page ?? 0,
        size: filters.size ?? 10,
        sort: filters.sort ?? 'firstName,asc',
      },
    })

    return CustomerMapper.toPage(data)
  }

  async getById(id: number): Promise<Customer> {
    const { data } = await this.client.get<BackendCustomerResponse>(`/customers/${id}`)

    return CustomerMapper.toEntity(data)
  }

  async create(data: CustomerMutation): Promise<Customer> {
    const response = await this.client.post<BackendCustomerResponse>(
      '/customers',
      CustomerMapper.toRequest(data),
    )

    return CustomerMapper.toEntity(response.data)
  }

  async update(id: number, data: CustomerMutation): Promise<Customer> {
    const response = await this.client.put<BackendCustomerResponse>(
      `/customers/${id}`,
      CustomerMapper.toRequest(data),
    )

    return CustomerMapper.toEntity(response.data)
  }

  async deactivate(id: number): Promise<void> {
    await this.client.patch(`/customers/${id}/deactivate`)
  }
}
