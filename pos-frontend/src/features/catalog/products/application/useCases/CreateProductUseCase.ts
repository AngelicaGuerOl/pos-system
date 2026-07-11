import type { Product, ProductMutation } from '../../domain/entities/Product'
import type { ProductRepository } from '../../domain/repositories/ProductRepository'

export class CreateProductUseCase {
  private readonly productRepository: ProductRepository

  constructor(productRepository: ProductRepository) {
    this.productRepository = productRepository
  }

  execute(data: ProductMutation): Promise<Product> {
    return this.productRepository.create(data)
  }
}

