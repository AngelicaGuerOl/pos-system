import { httpClient } from '../../../shared/api/httpClient'
import { CreateCategoryUseCase } from './application/useCases/CreateCategoryUseCase'
import { DeactivateCategoryUseCase } from './application/useCases/DeactivateCategoryUseCase'
import { GetCategoriesUseCase } from './application/useCases/GetCategoriesUseCase'
import { GetCategoryByIdUseCase } from './application/useCases/GetCategoryByIdUseCase'
import { UpdateCategoryUseCase } from './application/useCases/UpdateCategoryUseCase'
import { CategoryRepositoryImpl } from './infrastructure/CategoryRepositoryImpl'

const categoryRepository = new CategoryRepositoryImpl(httpClient)

export const categoryDependencies = {
  getCategoriesUseCase: new GetCategoriesUseCase(categoryRepository),
  getCategoryByIdUseCase: new GetCategoryByIdUseCase(categoryRepository),
  createCategoryUseCase: new CreateCategoryUseCase(categoryRepository),
  updateCategoryUseCase: new UpdateCategoryUseCase(categoryRepository),
  deactivateCategoryUseCase: new DeactivateCategoryUseCase(categoryRepository),
} as const

