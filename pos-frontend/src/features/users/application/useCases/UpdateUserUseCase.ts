import type { User, UserUpdateMutation } from '../../domain/entities/User'
import type { UserRepository } from '../../domain/repositories/UserRepository'

export class UpdateUserUseCase {
  private readonly userRepository: UserRepository

  constructor(userRepository: UserRepository) {
    this.userRepository = userRepository
  }

  execute(id: number, data: UserUpdateMutation): Promise<User> {
    return this.userRepository.update(id, data)
  }
}
