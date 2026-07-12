import type { PageResponse } from '../../../../shared/types/PageResponse'
import type {
  User,
  UserCreateMutation,
  UserFilters,
  UserUpdateMutation,
} from '../entities/User'

export type UserRepository = {
  getAll(filters?: UserFilters): Promise<PageResponse<User>>
  getById(id: number): Promise<User>
  create(data: UserCreateMutation): Promise<User>
  update(id: number, data: UserUpdateMutation): Promise<User>
  deactivate(id: number): Promise<void>
}
