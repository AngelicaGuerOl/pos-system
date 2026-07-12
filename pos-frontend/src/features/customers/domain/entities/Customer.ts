export type Customer = {
  id: number
  firstName: string
  lastName: string
  fullName: string
  phone: string | null
  active: boolean
  createdAt: string
  updatedAt: string | null
}

export type CustomerMutation = {
  firstName: string
  lastName: string
  phone?: string | null
}

export type CustomerFilters = {
  search?: string
  page?: number
  size?: number
  sort?: string
}
