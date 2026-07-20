import type { ProductRepository } from '../../domain/repositories/ProductRepository'

export class ReactivateProductUseCase {
  private readonly productRepository: ProductRepository

  constructor(productRepository: ProductRepository) {
    this.productRepository = productRepository
  }

  execute(id: number): Promise<void> {
    return this.productRepository.reactivate(id)
  }
}
