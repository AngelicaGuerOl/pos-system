import type { PageResponse } from '../../../../shared/types/PageResponse'
import type { User, UserFilters } from '../../domain/entities/User'
import type { UserRepository } from '../../domain/repositories/UserRepository'

export class GetUsersUseCase {
  private readonly userRepository: UserRepository

  constructor(userRepository: UserRepository) {
    this.userRepository = userRepository
  }

  execute(filters?: UserFilters): Promise<PageResponse<User>> {
    return this.userRepository.getAll(filters)
  }
}
