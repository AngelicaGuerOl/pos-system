import type { Category } from '../../domain/entities/Category'
import type { CategoryRepository } from '../../domain/repositories/CategoryRepository'

export class GetCategoriesUseCase {
  private readonly categoryRepository: CategoryRepository

  constructor(categoryRepository: CategoryRepository) {
    this.categoryRepository = categoryRepository
  }

  execute(search?: string): Promise<Category[]> {
    return this.categoryRepository.getAll(search)
  }
}

