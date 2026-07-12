import type { AxiosInstance } from 'axios'
import type { PageResponse } from '../../../shared/types/PageResponse'
import type {
  User,
  UserCreateMutation,
  UserFilters,
  UserUpdateMutation,
} from '../domain/entities/User'
import type { UserRepository } from '../domain/repositories/UserRepository'
import { UserMapper, type BackendUserResponse } from './mappers/UserMapper'

export class UserRepositoryImpl implements UserRepository {
  private readonly client: AxiosInstance

  constructor(client: AxiosInstance) {
    this.client = client
  }

  async getAll(filters: UserFilters = {}): Promise<PageResponse<User>> {
    const { data } = await this.client.get<PageResponse<BackendUserResponse>>('/users', {
      params: {
        search: filters.search || undefined,
        page: filters.page ?? 0,
        size: filters.size ?? 10,
        sort: filters.sort ?? 'username,asc',
      },
    })

    return UserMapper.toPage(data)
  }

  async getById(id: number): Promise<User> {
    const { data } = await this.client.get<BackendUserResponse>(`/users/${id}`)

    return UserMapper.toEntity(data)
  }

  async create(data: UserCreateMutation): Promise<User> {
    const response = await this.client.post<BackendUserResponse>(
      '/users',
      UserMapper.toCreateRequest(data),
    )

    return UserMapper.toEntity(response.data)
  }

  async update(id: number, data: UserUpdateMutation): Promise<User> {
    const response = await this.client.put<BackendUserResponse>(
      `/users/${id}`,
      UserMapper.toUpdateRequest(data),
    )

    return UserMapper.toEntity(response.data)
  }

  async deactivate(id: number): Promise<void> {
    await this.client.patch(`/users/${id}/deactivate`)
  }
}
