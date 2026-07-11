import type { ChangePasswordData, User } from '../entities/User'

export type AuthRepository = {
  login(username: string, password: string): Promise<User>
  getCurrentUser(): Promise<User>
  changePassword(data: ChangePasswordData): Promise<User>
  logout(): Promise<void>
}
