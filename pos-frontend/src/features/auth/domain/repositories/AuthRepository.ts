import type { User } from '../entities/User'

export type AuthRepository = {
  login(username: string, password: string): Promise<User>
  getCurrentUser(): Promise<User>
  logout(): Promise<void>
}

