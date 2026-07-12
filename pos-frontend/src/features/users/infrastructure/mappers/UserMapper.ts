import type { PageResponse } from '../../../../shared/types/PageResponse'
import type {
  User,
  UserCreateMutation,
  UserRole,
  UserUpdateMutation,
} from '../../domain/entities/User'

export type BackendUserResponse = {
  id: number
  username: string
  role: UserRole
  active: boolean
  mustChangePassword: boolean
  createdAt: string
  updatedAt: string | null
}

export type BackendUserCreateRequest = {
  username: string
  password: string
  role: UserRole
}

export type BackendUserUpdateRequest = {
  username: string
  role: UserRole
  active: boolean
}

export const UserMapper = {
  toEntity(response: BackendUserResponse): User {
    return {
      id: response.id,
      username: response.username,
      role: response.role,
      active: response.active,
      mustChangePassword: response.mustChangePassword,
      createdAt: response.createdAt,
      updatedAt: response.updatedAt,
    }
  },

  toPage(response: PageResponse<BackendUserResponse>): PageResponse<User> {
    return {
      ...response,
      content: response.content.map((user) => UserMapper.toEntity(user)),
    }
  },

  toCreateRequest(data: UserCreateMutation): BackendUserCreateRequest {
    return {
      username: data.username.trim(),
      password: data.password,
      role: data.role,
    }
  },

  toUpdateRequest(data: UserUpdateMutation): BackendUserUpdateRequest {
    return {
      username: data.username.trim(),
      role: data.role,
      active: data.active,
    }
  },
}
