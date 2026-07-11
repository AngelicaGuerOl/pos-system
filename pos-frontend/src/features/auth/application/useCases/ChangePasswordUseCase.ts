import type { ChangePasswordData, User } from '../../domain/entities/User'
import type { AuthRepository } from '../../domain/repositories/AuthRepository'

export class ChangePasswordUseCase {
  private readonly authRepository: AuthRepository

  constructor(authRepository: AuthRepository) {
    this.authRepository = authRepository
  }

  execute(data: ChangePasswordData): Promise<User> {
    return this.authRepository.changePassword(data)
  }
}
