import type { Category, CategoryMutation } from '../../domain/entities/Category'
import type { CategoryRepository } from '../../domain/repositories/CategoryRepository'

export class CreateCategoryUseCase {
  private readonly categoryRepository: CategoryRepository

  constructor(categoryRepository: CategoryRepository) {
    this.categoryRepository = categoryRepository
  }

  execute(data: CategoryMutation): Promise<Category> {
    return this.categoryRepository.create(data)
  }
}

