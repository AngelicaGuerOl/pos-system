import type { Product } from '../../domain/entities/Product'
import type { ProductRepository } from '../../domain/repositories/ProductRepository'

export class GetProductByIdUseCase {
  private readonly productRepository: ProductRepository

  constructor(productRepository: ProductRepository) {
    this.productRepository = productRepository
  }

  execute(id: number): Promise<Product> {
    return this.productRepository.getById(id)
  }
}

