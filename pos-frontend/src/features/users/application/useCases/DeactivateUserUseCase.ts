import type { UserRepository } from '../../domain/repositories/UserRepository'

export class DeactivateUserUseCase {
  private readonly userRepository: UserRepository

  constructor(userRepository: UserRepository) {
    this.userRepository = userRepository
  }

  execute(id: number): Promise<void> {
    return this.userRepository.deactivate(id)
  }
}
