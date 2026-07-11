import type { CategoryRepository } from '../../domain/repositories/CategoryRepository'

export class DeactivateCategoryUseCase {
  private readonly categoryRepository: CategoryRepository

  constructor(categoryRepository: CategoryRepository) {
    this.categoryRepository = categoryRepository
  }

  execute(id: number): Promise<void> {
    return this.categoryRepository.deactivate(id)
  }
}

