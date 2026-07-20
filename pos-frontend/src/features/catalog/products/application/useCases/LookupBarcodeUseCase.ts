import type { BarcodeLookup } from '../../domain/entities/Product'
import type { ProductRepository } from '../../domain/repositories/ProductRepository'

export class LookupBarcodeUseCase {
  private readonly productRepository: ProductRepository

  constructor(productRepository: ProductRepository) {
    this.productRepository = productRepository
  }

  execute(barcode: string): Promise<BarcodeLookup> {
    return this.productRepository.lookupBarcode(barcode)
  }
}
