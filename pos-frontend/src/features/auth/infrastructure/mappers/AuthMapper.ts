import type { User, UserRole } from '../../domain/entities/User'

type BackendUserResponse = {
  id: number
  username: string
  role: UserRole
  mustChangePassword?: boolean
}

export type BackendCurrentUserResponse = BackendUserResponse & {
  mustChangePassword?: boolean
}

export type BackendLoginResponse = {
  token: string
  tokenType: 'Bearer' | string
  expiresIn: number
  user: BackendCurrentUserResponse
}

export const AuthMapper = {
  toUser(response: BackendUserResponse): User {
    return {
      id: response.id,
      username: response.username,
      role: response.role,
      mustChangePassword: Boolean(response.mustChangePassword),
    }
  },
}
