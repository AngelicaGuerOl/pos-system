import type { Category } from '../../domain/entities/Category'
import type { CategoryRepository } from '../../domain/repositories/CategoryRepository'

export class GetCategoryByIdUseCase {
  private readonly categoryRepository: CategoryRepository

  constructor(categoryRepository: CategoryRepository) {
    this.categoryRepository = categoryRepository
  }

  execute(id: number): Promise<Category> {
    return this.categoryRepository.getById(id)
  }
}

