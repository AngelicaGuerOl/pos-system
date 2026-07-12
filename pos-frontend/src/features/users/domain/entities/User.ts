export type UserRole = 'ADMIN' | 'CASHIER'

export type User = {
  id: number
  username: string
  role: UserRole
  active: boolean
  mustChangePassword: boolean
  createdAt: string
  updatedAt: string | null
}

export type UserCreateMutation = {
  username: string
  password: string
  role: UserRole
}

export type UserUpdateMutation = {
  username: string
  role: UserRole
  active: boolean
}

export type UserFilters = {
  search?: string
  page?: number
  size?: number
  sort?: string
}

export const USER_ROLES: UserRole[] = ['ADMIN', 'CASHIER']

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: 'Administrador',
  CASHIER: 'Cajero',
}
