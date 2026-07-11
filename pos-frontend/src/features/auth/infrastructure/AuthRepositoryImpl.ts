import type { AxiosInstance } from 'axios'
import { tokenStorage } from '../../../shared/lib/storage/tokenStorage'
import type { User } from '../domain/entities/User'
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

  async logout(): Promise<void> {
    tokenStorage.removeToken()
  }
}
