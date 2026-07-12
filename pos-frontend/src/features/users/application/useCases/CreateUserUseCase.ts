import type { User, UserCreateMutation } from '../../domain/entities/User'
import type { UserRepository } from '../../domain/repositories/UserRepository'

export class CreateUserUseCase {
  private readonly userRepository: UserRepository

  constructor(userRepository: UserRepository) {
    this.userRepository = userRepository
  }

  execute(data: UserCreateMutation): Promise<User> {
    return this.userRepository.create(data)
  }
}
