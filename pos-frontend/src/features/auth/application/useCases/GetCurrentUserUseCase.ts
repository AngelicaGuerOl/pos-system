import type { User } from '../../domain/entities/User'
import type { AuthRepository } from '../../domain/repositories/AuthRepository'

export class GetCurrentUserUseCase {
  private readonly authRepository: AuthRepository

  constructor(authRepository: AuthRepository) {
    this.authRepository = authRepository
  }

  execute(): Promise<User> {
    return this.authRepository.getCurrentUser()
  }
}
