import type { AxiosInstance } from 'axios'
import { tokenStorage } from '../../../shared/lib/storage/tokenStorage'
import type { ChangePasswordData, User } from '../domain/entities/User'
import type { AuthRepository } from '../domain/repositories/AuthRepository'
import {
  AuthMapper,
  type BackendCurrentUserResponse,
  type BackendLoginResponse,
} from './mappers/AuthMapper'

type LoginRequest = {
  username: string
  password: string
}

type ChangePasswordRequest = {
  currentPassword: string
  newPassword: string
}

export class AuthRepositoryImpl implements AuthRepository {
  private readonly client: AxiosInstance

  constructor(client: AxiosInstance) {
    this.client = client
  }

  async login(username: string, password: string): Promise<User> {
    const { data } = await this.client.post<BackendLoginResponse>('/auth/login', {
      username,
      password,
    } satisfies LoginRequest)

    tokenStorage.setToken(data.token)

    return AuthMapper.toUser(data.user)
  }

  async getCurrentUser(): Promise<User> {
    const { data } = await this.client.get<BackendCurrentUserResponse>('/auth/me')

    return AuthMapper.toUser(data)
  }

  async changePassword(data: ChangePasswordData): Promise<User> {
    const response = await this.client.post<BackendCurrentUserResponse>(
      '/auth/change-password',
      {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      } satisfies ChangePasswordRequest,
    )

    return AuthMapper.toUser(response.data)
  }

  async logout(): Promise<void> {
    tokenStorage.removeToken()
  }
}
