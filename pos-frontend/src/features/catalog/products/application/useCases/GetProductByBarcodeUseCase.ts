import type { Product } from '../../domain/entities/Product'
import type { ProductRepository } from '../../domain/repositories/ProductRepository'

export class GetProductByBarcodeUseCase {
  private readonly productRepository: ProductRepository

  constructor(productRepository: ProductRepository) {
    this.productRepository = productRepository
  }

  execute(barcode: string): Promise<Product> {
    return this.productRepository.getByBarcode(barcode)
  }
}

