import type { Product, ProductMutation } from '../../domain/entities/Product'
import type { ProductRepository } from '../../domain/repositories/ProductRepository'

export class UpdateProductUseCase {
  private readonly productRepository: ProductRepository

  constructor(productRepository: ProductRepository) {
    this.productRepository = productRepository
  }

  execute(id: number, data: ProductMutation): Promise<Product> {
    return this.productRepository.update(id, data)
  }
}

