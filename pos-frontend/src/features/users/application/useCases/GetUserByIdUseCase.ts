import type { User } from '../../domain/entities/User'
import type { UserRepository } from '../../domain/repositories/UserRepository'

export class GetUserByIdUseCase {
  private readonly userRepository: UserRepository

  constructor(userRepository: UserRepository) {
    this.userRepository = userRepository
  }

  execute(id: number): Promise<User> {
    return this.userRepository.getById(id)
  }
}
