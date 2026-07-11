import type { User } from '../../domain/entities/User'
import type { AuthRepository } from '../../domain/repositories/AuthRepository'

export class LoginUseCase {
  private readonly authRepository: AuthRepository

  constructor(authRepository: AuthRepository) {
    this.authRepository = authRepository
  }

  execute(username: string, password: string): Promise<User> {
    return this.authRepository.login(username, password)
  }
}
