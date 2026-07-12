import { httpClient } from '../../shared/api/httpClient'
import { CreateUserUseCase } from './application/useCases/CreateUserUseCase'
import { DeactivateUserUseCase } from './application/useCases/DeactivateUserUseCase'
import { GetUserByIdUseCase } from './application/useCases/GetUserByIdUseCase'
import { GetUsersUseCase } from './application/useCases/GetUsersUseCase'
import { UpdateUserUseCase } from './application/useCases/UpdateUserUseCase'
import { UserRepositoryImpl } from './infrastructure/UserRepositoryImpl'

const userRepository = new UserRepositoryImpl(httpClient)

export const userDependencies = {
  getUsersUseCase: new GetUsersUseCase(userRepository),
  getUserByIdUseCase: new GetUserByIdUseCase(userRepository),
  createUserUseCase: new CreateUserUseCase(userRepository),
  updateUserUseCase: new UpdateUserUseCase(userRepository),
  deactivateUserUseCase: new DeactivateUserUseCase(userRepository),
} as const
