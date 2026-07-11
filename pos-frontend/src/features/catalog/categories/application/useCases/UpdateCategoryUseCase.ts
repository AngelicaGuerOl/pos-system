import type { Category, CategoryMutation } from '../../domain/entities/Category'
import type { CategoryRepository } from '../../domain/repositories/CategoryRepository'

export class UpdateCategoryUseCase {
  private readonly categoryRepository: CategoryRepository

  constructor(categoryRepository: CategoryRepository) {
    this.categoryRepository = categoryRepository
  }

  execute(id: number, data: CategoryMutation): Promise<Category> {
    return this.categoryRepository.update(id, data)
  }
}

