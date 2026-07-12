import type { PageResponse } from '../../../../shared/types/PageResponse'
import type { Customer, CustomerMutation } from '../../domain/entities/Customer'

export type BackendCustomerResponse = {
  id: number
  firstName: string
  lastName: string
  fullName: string
  phone: string | null
  active: boolean
  createdAt: string
  updatedAt: string | null
}

export type BackendCustomerRequest = {
  firstName: string
  lastName: string
  phone: string | null
}

export const CustomerMapper = {
  toEntity(response: BackendCustomerResponse): Customer {
    return {
      id: response.id,
      firstName: response.firstName,
      lastName: response.lastName,
      fullName: response.fullName,
      phone: response.phone,
      active: response.active,
      createdAt: response.createdAt,
      updatedAt: response.updatedAt,
    }
  },

  toPage(response: PageResponse<BackendCustomerResponse>): PageResponse<Customer> {
    return {
      ...response,
      content: response.content.map((customer) => CustomerMapper.toEntity(customer)),
    }
  },

  toRequest(data: CustomerMutation): BackendCustomerRequest {
    return {
      firstName: data.firstName.trim(),
      lastName: data.lastName.trim(),
      phone: data.phone?.trim() || null,
    }
  },
}
