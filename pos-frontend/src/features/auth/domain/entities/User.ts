export type UserRole = 'ADMIN' | 'CASHIER'

export type User = {
  id: number
  username: string
  role: UserRole
  mustChangePassword: boolean
}

export type ChangePasswordData = {
  currentPassword: string
  newPassword: string
}
