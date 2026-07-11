import { httpClient } from '../../shared/api/httpClient'
import { GetCurrentUserUseCase } from './application/useCases/GetCurrentUserUseCase'
import { LoginUseCase } from './application/useCases/LoginUseCase'
import { LogoutUseCase } from './application/useCases/LogoutUseCase'
import { AuthRepositoryImpl } from './infrastructure/AuthRepositoryImpl'

const authRepository = new AuthRepositoryImpl(httpClient)

export const authDependencies = {
  loginUseCase: new LoginUseCase(authRepository),
  logoutUseCase: new LogoutUseCase(authRepository),
  getCurrentUserUseCase: new GetCurrentUserUseCase(authRepository),
} as const

