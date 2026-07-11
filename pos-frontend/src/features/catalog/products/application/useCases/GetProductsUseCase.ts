import type { PageResponse } from '../../../../../shared/types/PageResponse'
import type { Product, ProductFilters } from '../../domain/entities/Product'
import type { ProductRepository } from '../../domain/repositories/ProductRepository'

export class GetProductsUseCase {
  private readonly productRepository: ProductRepository

  constructor(productRepository: ProductRepository) {
    this.productRepository = productRepository
  }

  execute(filters?: ProductFilters): Promise<PageResponse<Product>> {
    return this.productRepository.getAll(filters)
  }
}

